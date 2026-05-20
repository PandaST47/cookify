import {
    useState,
    useEffect,
    useRef,
    type ChangeEvent,
    type FormEvent,
    type KeyboardEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Key, LogOut, X, ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import { PasswordField } from '@/components/auth/AuthComponents'
import { useAuth } from '@/components/contexts/AuthContext'
import { useExclusions } from '@/components/hooks/useExclusions'
import { ExclusionsSection } from '@/components/profile/ExclusionsSection'
import { validators, AuthError } from '@/services/mockAuth'
import '@/styles/profile.css'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB

type EditableField = 'username' | 'email'

/* ═══════════════════════════════════════════════════════════
   ProfilePage
   - поля username/email редактируются по клику на карандаш
   - Enter сохраняет, Esc отменяет
   - аватар: FileReader → data:URL в localStorage (хватает для моки)
   - смена пароля — в модалке с focus-lock и Esc-close
   ═══════════════════════════════════════════════════════════ */

export default function ProfilePage() {
    const { user, logout, updateProfile, changePassword } = useAuth()
    const { exclusions, add: addExclusion, remove: removeExclusion } =
        useExclusions(user?.id)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [editing, setEditing] = useState<EditableField | null>(null)
    const [draft, setDraft] = useState('')
    const [fieldError, setFieldError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [avatarError, setAvatarError] = useState<string | null>(null)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)

    useEffect(() => {
        const prev = document.title
        document.title = user
            ? `${user.username} — Cookify`
            : 'Мой профиль — Cookify'
        return () => {
            document.title = prev
        }
    }, [user])

    if (!user) return null // ProtectedRoute уже увёл на логин

    /* ── edit field ── */
    const startEdit = (field: EditableField) => {
        setEditing(field)
        setDraft(user[field])
        setFieldError(null)
    }

    const cancelEdit = () => {
        setEditing(null)
        setDraft('')
        setFieldError(null)
    }

    /**
     * Не useCallback — функция объявляется ниже early-return, поэтому
     * оборачивать в hook нельзя (нарушение rules-of-hooks).
     * EditableRow не мемоизирован — пересоздание ссылки на handler
     * не вызовет лишних ре-рендеров.
     */
    const commitEdit = async () => {
        if (!editing) return
        const validator =
            editing === 'email' ? validators.email : validators.username
        const err = validator(draft)
        if (err) {
            setFieldError(err)
            return
        }
        if (draft.trim() === user[editing]) {
            cancelEdit()
            return
        }
        setSaving(true)
        try {
            await updateProfile({ [editing]: draft.trim() })
            cancelEdit()
        } catch (e) {
            if (e instanceof AuthError) setFieldError(e.message)
            else setFieldError('Не удалось сохранить')
        } finally {
            setSaving(false)
        }
    }

    const handleFieldKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            commitEdit()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            cancelEdit()
        }
    }

    /* ── avatar ── */
    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAvatarError(null)
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setAvatarError('Можно загружать только изображения')
            return
        }
        if (file.size > MAX_AVATAR_BYTES) {
            setAvatarError('Изображение слишком большое (макс. 2 МБ)')
            return
        }
        const reader = new FileReader()
        reader.onload = async () => {
            try {
                await updateProfile({ avatar: reader.result as string })
            } catch {
                setAvatarError('Не удалось загрузить аватар')
            }
        }
        reader.onerror = () => setAvatarError('Ошибка чтения файла')
        reader.readAsDataURL(file)
        // сбрасываем, чтобы повторный выбор того же файла тоже сработал
        e.target.value = ''
    }

    const handleRemoveAvatar = async () => {
        setAvatarError(null)
        try {
            await updateProfile({ avatar: undefined })
        } catch {
            setAvatarError('Не удалось удалить аватар')
        }
    }

    const initial = user.username
        ? user.username.trim().charAt(0).toUpperCase()
        : user.email.charAt(0).toUpperCase()

    return (
        <>
            <Header />

            <div className="profile-page">
                <main className="profile-container" role="main">
                    <Link
                        to="/"
                        className="profile-back"
                        aria-label="Вернуться на главную"
                    >
                        <ArrowLeft size={18} aria-hidden="true" />
                        <span>На главную</span>
                    </Link>

                    <div className="profile-grid">
                        {/* ── Левая колонка: данные пользователя ── */}
                        <div className="profile-left">
                            <h1 className="profile-title">Мой профиль</h1>

                            <section
                                className="profile-avatar-row"
                                aria-label="Аватар"
                            >
                                <div className="profile-avatar">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={`Аватар ${user.username}`}
                                            className="profile-avatar__img"
                                        />
                                    ) : (
                                        <span
                                            className="profile-avatar__initial"
                                            aria-hidden="true"
                                        >
                                            {initial}
                                        </span>
                                    )}
                                </div>

                                <div className="profile-avatar-actions">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={handleAvatarChange}
                                        aria-label="Загрузить аватар"
                                    />
                                    <button
                                        type="button"
                                        className="profile-avatar-upload"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Загрузить фото
                                    </button>
                                    {user.avatar && (
                                        <button
                                            type="button"
                                            className="profile-avatar-remove"
                                            onClick={handleRemoveAvatar}
                                        >
                                            Удалить фото
                                        </button>
                                    )}
                                    {avatarError && (
                                        <p
                                            className="profile-avatar-error"
                                            role="alert"
                                        >
                                            {avatarError}
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section className="profile-fields">
                                <EditableRow
                                    label="Имя пользователя"
                                    value={user.username}
                                    isEditing={editing === 'username'}
                                    draft={draft}
                                    onDraftChange={setDraft}
                                    onStart={() => startEdit('username')}
                                    onCommit={commitEdit}
                                    onCancel={cancelEdit}
                                    onKey={handleFieldKey}
                                    error={
                                        editing === 'username' ? fieldError : null
                                    }
                                    saving={saving && editing === 'username'}
                                />

                                <EditableRow
                                    label="Email"
                                    value={user.email}
                                    isEditing={editing === 'email'}
                                    draft={draft}
                                    onDraftChange={setDraft}
                                    onStart={() => startEdit('email')}
                                    onCommit={commitEdit}
                                    onCancel={cancelEdit}
                                    onKey={handleFieldKey}
                                    error={editing === 'email' ? fieldError : null}
                                    saving={saving && editing === 'email'}
                                    type="email"
                                />

                                <button
                                    type="button"
                                    className="profile-change-password"
                                    onClick={() => setPasswordModalOpen(true)}
                                >
                                    <Key size={16} aria-hidden="true" />
                                    <span>Изменить пароль</span>
                                </button>

                                <button
                                    type="button"
                                    className="profile-logout"
                                    onClick={() => logout()}
                                >
                                    <LogOut size={16} aria-hidden="true" />
                                    <span>Выйти из профиля</span>
                                </button>
                            </section>
                        </div>

                        {/* ── Правая колонка: Исключения ── */}
                        <div className="profile-right">
                            <ExclusionsSection
                                exclusions={exclusions}
                                onAdd={addExclusion}
                                onRemove={removeExclusion}
                            />
                        </div>
                    </div>
                </main>

                {passwordModalOpen && (
                    <PasswordModal
                        onClose={() => setPasswordModalOpen(false)}
                        onSubmit={changePassword}
                    />
                )}
            </div>
        </>
    )
}

/* ═══════════════════════════════════════════════════════════
   EditableRow — строка с инлайновым редактированием
   ═══════════════════════════════════════════════════════════ */

interface EditableRowProps {
    label: string
    value: string
    isEditing: boolean
    draft: string
    onDraftChange: (v: string) => void
    onStart: () => void
    onCommit: () => void
    onCancel: () => void
    onKey: (e: KeyboardEvent<HTMLInputElement>) => void
    error: string | null
    saving: boolean
    type?: 'text' | 'email'
}

function EditableRow({
    label,
    value,
    isEditing,
    draft,
    onDraftChange,
    onStart,
    onCommit,
    onCancel,
    onKey,
    error,
    saving,
    type = 'text',
}: EditableRowProps) {
    return (
        <div className="profile-row">
            <div
                className={`profile-row__wrap ${error ? 'profile-row__wrap--error' : ''}`}
            >
                {isEditing ? (
                    <input
                        type={type}
                        value={draft}
                        onChange={(e) => onDraftChange(e.target.value)}
                        onKeyDown={onKey}
                        onBlur={onCommit}
                        className="profile-row__input"
                        aria-label={label}
                        autoFocus
                        disabled={saving}
                    />
                ) : (
                    <span
                        className="profile-row__value"
                        aria-label={label}
                    >
                        {value}
                    </span>
                )}
                {!isEditing && (
                    <button
                        type="button"
                        onClick={onStart}
                        className="profile-row__edit"
                        aria-label={`Редактировать: ${label}`}
                    >
                        <Pencil size={16} aria-hidden="true" />
                    </button>
                )}
                {isEditing && (
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()} // чтобы не срабатывал onBlur
                        onClick={onCancel}
                        className="profile-row__edit"
                        aria-label="Отменить"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                )}
            </div>
            {error && (
                <p className="profile-row__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════
   PasswordModal — модалка смены пароля
   Esc-close, click-outside-close, focus-lock (через autoFocus)
   ═══════════════════════════════════════════════════════════ */

interface PasswordModalProps {
    onClose: () => void
    onSubmit: (current: string, next: string) => Promise<void>
}

function PasswordModal({ onClose, onSubmit }: PasswordModalProps) {
    const [current, setCurrent] = useState('')
    const [next, setNext] = useState('')
    const [confirm, setConfirm] = useState('')
    const [errors, setErrors] = useState<{
        current?: string
        next?: string
        confirm?: string
        general?: string
    }>({})
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        // блокируем скролл под модалкой
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prevOverflow
        }
    }, [onClose])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const newErrors: typeof errors = {}
        if (!current) newErrors.current = 'Введите текущий пароль'
        const nextErr = validators.password(next)
        if (nextErr) newErrors.next = nextErr
        const confirmErr = validators.confirmPassword(confirm, next)
        if (confirmErr) newErrors.confirm = confirmErr
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setSubmitting(true)
        try {
            await onSubmit(current, next)
            setSuccess(true)
            setTimeout(onClose, 1200)
        } catch (err) {
            if (err instanceof AuthError) {
                if (err.field === 'password')
                    setErrors({ current: err.message })
                else setErrors({ general: err.message })
            } else {
                setErrors({ general: 'Не удалось сменить пароль' })
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div
            className="profile-modal-backdrop"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-modal-title"
        >
            <div
                className="profile-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="profile-modal__close"
                    onClick={onClose}
                    aria-label="Закрыть"
                >
                    <X size={18} aria-hidden="true" />
                </button>

                <h2 id="password-modal-title" className="profile-modal__title">
                    Смена пароля
                </h2>

                {success ? (
                    <p
                        className="profile-modal__success"
                        role="status"
                    >
                        ✓ Пароль успешно изменён
                    </p>
                ) : (
                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <PasswordField
                            placeholder="Текущий пароль"
                            autoComplete="current-password"
                            value={current}
                            onChange={(e) => {
                                setCurrent(e.target.value)
                                setErrors((p) => ({
                                    ...p,
                                    current: undefined,
                                }))
                            }}
                            error={errors.current}
                            autoFocus
                        />
                        <PasswordField
                            placeholder="Новый пароль"
                            autoComplete="new-password"
                            value={next}
                            onChange={(e) => {
                                setNext(e.target.value)
                                setErrors((p) => ({ ...p, next: undefined }))
                            }}
                            error={errors.next}
                        />
                        <PasswordField
                            placeholder="Повторите новый пароль"
                            autoComplete="new-password"
                            value={confirm}
                            onChange={(e) => {
                                setConfirm(e.target.value)
                                setErrors((p) => ({
                                    ...p,
                                    confirm: undefined,
                                }))
                            }}
                            error={errors.confirm}
                        />

                        {errors.general && (
                            <p
                                className="auth-general-error"
                                role="alert"
                            >
                                {errors.general}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="auth-btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Сохраняем…' : 'Сохранить'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}   