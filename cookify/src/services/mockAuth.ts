import type { User, AuthSession, AuthErrorField } from '@/types'

/* ═══════════════════════════════════════════════════════════
   MockAuth — имитация бэкенда на localStorage.
   В проде всё это уйдёт за HTTP-слой (fetch/axios).
   Намеренно добавлены задержки, TTL кода, хеш пароля —
   чтобы UX-состояния (loading/error/resend) можно было
   отлаживать в условиях, приближённых к реальным.
   ═══════════════════════════════════════════════════════════ */

const USERS_KEY = 'cookify:users'
const SESSION_KEY = 'cookify:session'
const PENDING_KEY = 'cookify:pending'

const NETWORK_DELAY_MS = 600
const CODE_TTL_MS = 5 * 60 * 1000 // 5 минут

interface StoredUser {
    id: string
    email: string
    passwordHash: string
    username: string
    avatar?: string
    createdAt: string
}

interface PendingRegistration {
    email: string
    passwordHash: string
    code: string
    expiresAt: number
}

export class AuthError extends Error {
    field: AuthErrorField
    constructor(message: string, field: AuthErrorField = 'general') {
        super(message)
        this.field = field
        this.name = 'AuthError'
    }
}

/* ─── helpers ─── */
const delay = (ms = NETWORK_DELAY_MS) =>
    new Promise<void>((r) => setTimeout(r, ms))

/**
 * Псевдо-хеш. НЕ ИСПОЛЬЗОВАТЬ В ПРОДЕ.
 * Нужен только чтобы пароль не лежал чистым в localStorage во время разработки.
 * В реальном проде — bcrypt/argon2 на бэке.
 */
const hashPassword = (raw: string): string => {
    let h = 5381
    for (let i = 0; i < raw.length; i++) {
        h = ((h << 5) + h) ^ raw.charCodeAt(i)
    }
    return btoa(`${h}::${raw.length}::cookify-v1`)
}

const generateCode = (): string =>
    String(Math.floor(100000 + Math.random() * 900000))

const safeParse = <T>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback
    try {
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

const readUsers = (): StoredUser[] =>
    safeParse(localStorage.getItem(USERS_KEY), [])

const writeUsers = (users: StoredUser[]) =>
    localStorage.setItem(USERS_KEY, JSON.stringify(users))

const readPending = (): Record<string, PendingRegistration> =>
    safeParse(sessionStorage.getItem(PENDING_KEY), {})

const writePending = (p: Record<string, PendingRegistration>) =>
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(p))

const toUser = (s: StoredUser): User => ({
    id: s.id,
    email: s.email,
    username: s.username,
    avatar: s.avatar,
    createdAt: s.createdAt,
})

const readSession = (): AuthSession | null =>
    safeParse<AuthSession | null>(localStorage.getItem(SESSION_KEY), null)

/* ═══════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════ */

export const mockAuth = {
    /** Шаг 1 регистрации: проверка уникальности email + генерация кода. */
    async register(email: string, password: string): Promise<{ code: string }> {
        await delay()
        const normalized = email.trim().toLowerCase()
        const users = readUsers()
        if (users.some((u) => u.email.toLowerCase() === normalized)) {
            throw new AuthError('Этот email уже зарегистрирован', 'email')
        }
        const code = generateCode()
        const pending = readPending()
        pending[normalized] = {
            email: email.trim(),
            passwordHash: hashPassword(password),
            code,
            expiresAt: Date.now() + CODE_TTL_MS,
        }
        writePending(pending)
        // BACKEND: в проде здесь SMTP → письмо юзеру с кодом подтверждения.
        // Мок печатает код в консоль, чтобы можно было пройти флоу при разработке.
        console.info(`[Cookify mock] Код подтверждения для ${email}: ${code}`)
        return { code }
    },

    async resendCode(email: string): Promise<{ code: string }> {
        await delay()
        const normalized = email.trim().toLowerCase()
        const pending = readPending()
        const entry = pending[normalized]
        if (!entry) {
            throw new AuthError('Запрос регистрации не найден. Начните заново.')
        }
        const code = generateCode()
        entry.code = code
        entry.expiresAt = Date.now() + CODE_TTL_MS
        writePending(pending)
        // BACKEND: повторная отправка письма с новым кодом (rate-limit на бэке!).
        console.info(`[Cookify mock] Новый код для ${email}: ${code}`)
        return { code }
    },

    /** Шаг 2: подтверждение кода → создание юзера + старт сессии. */
    async verifyCode(email: string, code: string): Promise<User> {
        await delay()
        const normalized = email.trim().toLowerCase()
        const pending = readPending()
        const entry = pending[normalized]
        if (!entry) throw new AuthError('Запрос регистрации не найден')
        if (Date.now() > entry.expiresAt) {
            throw new AuthError('Код истёк. Запросите новый.', 'code')
        }
        if (entry.code !== code.trim()) {
            throw new AuthError('Неверный код подтверждения', 'code')
        }
        const newUser: StoredUser = {
            id: crypto.randomUUID(),
            email: entry.email,
            passwordHash: entry.passwordHash,
            username: entry.email.split('@')[0],
            createdAt: new Date().toISOString(),
        }
        const users = readUsers()
        users.push(newUser)
        writeUsers(users)
        delete pending[normalized]
        writePending(pending)

        const session: AuthSession = {
            userId: newUser.id,
            issuedAt: Date.now(),
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        return toUser(newUser)
    },

    async login(email: string, password: string): Promise<User> {
        await delay()
        const normalized = email.trim().toLowerCase()
        const users = readUsers()
        const user = users.find((u) => u.email.toLowerCase() === normalized)
        // В проде для защиты от перечисления аккаунтов лучше единое сообщение
        // "неверный email или пароль". Но для дев-UX разделяем — понятнее, что идёт не так.
        if (!user) {
            throw new AuthError('Пользователь с таким email не найден', 'email')
        }
        if (user.passwordHash !== hashPassword(password)) {
            throw new AuthError('Неверный пароль', 'password')
        }
        const session: AuthSession = { userId: user.id, issuedAt: Date.now() }
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        return toUser(user)
    },

    async logout(): Promise<void> {
        await delay(150)
        localStorage.removeItem(SESSION_KEY)
    },

    getCurrentUser(): User | null {
        const session = readSession()
        if (!session) return null
        const user = readUsers().find((u) => u.id === session.userId)
        return user ? toUser(user) : null
    },

    async updateProfile(
        updates: Partial<Pick<User, 'username' | 'email' | 'avatar'>>,
    ): Promise<User> {
        await delay(300)
        const session = readSession()
        if (!session) throw new AuthError('Сессия истекла')
        const users = readUsers()
        const idx = users.findIndex((u) => u.id === session.userId)
        if (idx === -1) throw new AuthError('Пользователь не найден')

        if (
            updates.email &&
            updates.email.trim().toLowerCase() !==
                users[idx].email.toLowerCase()
        ) {
            const taken = users.some(
                (u, i) =>
                    i !== idx &&
                    u.email.toLowerCase() ===
                        updates.email!.trim().toLowerCase(),
            )
            if (taken) throw new AuthError('Этот email уже занят', 'email')
        }
        if (updates.username !== undefined)
            users[idx].username = updates.username.trim()
        if (updates.email !== undefined) users[idx].email = updates.email.trim()
        if (updates.avatar !== undefined) users[idx].avatar = updates.avatar
        writeUsers(users)
        return toUser(users[idx])
    },

    async changePassword(
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        await delay()
        const session = readSession()
        if (!session) throw new AuthError('Сессия истекла')
        const users = readUsers()
        const idx = users.findIndex((u) => u.id === session.userId)
        if (idx === -1) throw new AuthError('Пользователь не найден')
        if (users[idx].passwordHash !== hashPassword(currentPassword)) {
            throw new AuthError('Текущий пароль введён неверно', 'password')
        }
        users[idx].passwordHash = hashPassword(newPassword)
        writeUsers(users)
    },
}

/* ═══════════════════════════════════════════════════════════
   VALIDATORS — используются UI-компонентами
   ═══════════════════════════════════════════════════════════ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const validators = {
    email(value: string): string | null {
        const v = value.trim()
        if (!v) return 'Введите email'
        if (!EMAIL_RE.test(v)) return 'Некорректный формат email'
        return null
    },
    password(value: string): string | null {
        if (!value) return 'Введите пароль'
        if (value.length < 8) return 'Минимум 8 символов'
        if (!/[a-zA-Zа-яА-Я]/.test(value)) return 'Должен содержать буквы'
        if (!/\d/.test(value)) return 'Должен содержать цифры'
        return null
    },
    confirmPassword(value: string, original: string): string | null {
        if (!value) return 'Повторите пароль'
        if (value !== original) return 'Пароли не совпадают'
        return null
    },
    username(value: string): string | null {
        const v = value.trim()
        if (!v) return 'Введите имя пользователя'
        if (v.length < 2) return 'Минимум 2 символа'
        if (v.length > 32) return 'Максимум 32 символа'
        return null
    },
}