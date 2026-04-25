import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    type ReactNode,
} from 'react'
import { mockAuth } from '@/services/mockAuth'
import type { User } from '@/types'

interface AuthContextValue {
    user: User | null
    isAuthenticated: boolean
    /**
     * false пока не восстановили сессию из localStorage.
     * ProtectedRoute ждёт isReady перед принятием решения о редиректе,
     * иначе при обновлении страницы будет мигание «логин → профиль».
     */
    isReady: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    register: (email: string, password: string) => Promise<{ code: string }>
    resendCode: (email: string) => Promise<{ code: string }>
    verifyCode: (email: string, code: string) => Promise<void>
    updateProfile: (
        updates: Partial<Pick<User, 'username' | 'email' | 'avatar'>>,
    ) => Promise<void>
    changePassword: (
        currentPassword: string,
        newPassword: string,
    ) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    /**
     * Восстанавливаем сессию синхронно в инициализаторе useState —
     * без useEffect+setState, который ESLint справедливо ругает за
     * лишний ре-рендер. localStorage доступен синхронно в браузере.
     */
    const [user, setUser] = useState<User | null>(() =>
        mockAuth.getCurrentUser(),
    )
    const isReady = true

    useEffect(() => {
        // Cross-tab sync: если в другой вкладке залогинились/вышли,
        // эта тоже реагирует.
        const onStorage = (e: StorageEvent) => {
            if (
                e.key === 'cookify:session' ||
                e.key === 'cookify:users' ||
                e.key === null
            ) {
                setUser(mockAuth.getCurrentUser())
            }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const login = useCallback(async (email: string, password: string) => {
        const u = await mockAuth.login(email, password)
        setUser(u)
    }, [])

    const logout = useCallback(async () => {
        await mockAuth.logout()
        setUser(null)
    }, [])

    const register = useCallback(
        (email: string, password: string) => mockAuth.register(email, password),
        [],
    )

    const resendCode = useCallback(
        (email: string) => mockAuth.resendCode(email),
        [],
    )

    const verifyCode = useCallback(async (email: string, code: string) => {
        const u = await mockAuth.verifyCode(email, code)
        setUser(u)
    }, [])

    const updateProfile = useCallback(
        async (
            updates: Partial<Pick<User, 'username' | 'email' | 'avatar'>>,
        ) => {
            const u = await mockAuth.updateProfile(updates)
            setUser(u)
        },
        [],
    )

    const changePassword = useCallback(
        (cur: string, next: string) => mockAuth.changePassword(cur, next),
        [],
    )

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: !!user,
            isReady,
            login,
            logout,
            register,
            resendCode,
            verifyCode,
            updateProfile,
            changePassword,
        }),
        [
            user,
            isReady,
            login,
            logout,
            register,
            resendCode,
            verifyCode,
            updateProfile,
            changePassword,
        ],
    )

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}