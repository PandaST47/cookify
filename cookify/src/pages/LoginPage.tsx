import {
    useState,
    useCallback,
    useEffect,
    type FormEvent,
} from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthCard, PasswordField } from '@/components/auth/AuthComponents'
import { useAuth } from '@/components/contexts/AuthContext'
import { validators, AuthError } from '@/services/mockAuth'
import '@/styles/auth.css'

export default function LoginPage() {
    const { login, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const next = searchParams.get('next') || '/'

    // SEO / UX: при уже залогиненном юзере сразу уводим с /login.
    // Редирект в useEffect — чтобы не ругаться "setState during render".
    useEffect(() => {
        if (isAuthenticated) navigate(next, { replace: true })
    }, [isAuthenticated, navigate, next])

    // Установка title страницы — простой inline-SEO без react-helmet.
    useEffect(() => {
        const prev = document.title
        document.title = 'Вход — Cookify'
        return () => {
            document.title = prev
        }
    }, [])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [emailErr, setEmailErr] = useState<string | null>(null)
    const [passwordErr, setPasswordErr] = useState<string | null>(null)
    const [generalErr, setGeneralErr] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault()
            setEmailErr(null)
            setPasswordErr(null)
            setGeneralErr(null)

            const eErr = validators.email(email)
            const pErr = password ? null : 'Введите пароль'
            if (eErr) setEmailErr(eErr)
            if (pErr) setPasswordErr(pErr)
            if (eErr || pErr) return

            setSubmitting(true)
            try {
                await login(email, password)
                navigate(next, { replace: true })
            } catch (err) {
                if (err instanceof AuthError) {
                    if (err.field === 'email') setEmailErr(err.message)
                    else if (err.field === 'password')
                        setPasswordErr(err.message)
                    else setGeneralErr(err.message)
                } else {
                    setGeneralErr('Что-то пошло не так. Попробуйте ещё раз.')
                }
            } finally {
                setSubmitting(false)
            }
        },
        [email, password, login, navigate, next],
    )

    return (
        <AuthCard
            title="Добро пожаловать!"
            subtitle={
                <>
                    Чтобы воспользоваться функциями сайта,
                    <br />
                    войдите в свой аккаунт
                </>
            }
            sectionTitle="Вход"
            footer={
                <p className="auth-footer-text">
                    Ещё не зарегистрированы?{' '}
                    <Link
                        to={`/register${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
                        className="auth-link auth-link--bold"
                    >
                        Зарегистрироваться
                    </Link>
                </p>
            }
        >
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                    <input
                        type="email"
                        autoComplete="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            setEmailErr(null)
                        }}
                        className={`auth-input ${emailErr ? 'auth-input--error' : ''}`}
                        aria-invalid={!!emailErr}
                        aria-label="Email"
                        autoFocus
                    />
                    {emailErr && (
                        <p className="auth-field__error" role="alert">
                            {emailErr}
                        </p>
                    )}
                </div>

                <PasswordField
                    placeholder="Пароль"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value)
                        setPasswordErr(null)
                    }}
                    error={passwordErr}
                />

                <div className="auth-row-end">
                    <button
                        type="button"
                        className="auth-link auth-link--muted"
                        onClick={() =>
                            alert(
                                'Восстановление пароля будет добавлено в следующей итерации',
                            )
                        }
                    >
                        Забыли пароль?
                    </button>
                </div>

                {generalErr && (
                    <p className="auth-general-error" role="alert">
                        {generalErr}
                    </p>
                )}

                <button
                    type="submit"
                    className="auth-btn-primary"
                    disabled={submitting}
                >
                    {submitting ? 'Входим…' : 'Войти'}
                </button>
            </form>
        </AuthCard>
    )
}