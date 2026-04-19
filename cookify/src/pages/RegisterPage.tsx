import {
    useState,
    useCallback,
    useEffect,
    type FormEvent,
} from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
    AuthCard,
    PasswordField,
    CodeInput,
} from '@/components/auth/AuthComponents'
import { useAuth } from '@/components/contexts/AuthContext'
import { validators, AuthError } from '@/services/mockAuth'
import '@/styles/auth.css'

const RESEND_TIMEOUT = 48 // секунд (как в Figma)

type Step = 'form' | 'verify'

export default function RegisterPage() {
    const { register, resendCode, verifyCode, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const next = searchParams.get('next') || '/'

    // Редирект из useEffect — иначе React ругается на setState во время рендера.
    useEffect(() => {
        if (isAuthenticated) navigate(next, { replace: true })
    }, [isAuthenticated, navigate, next])

    useEffect(() => {
        const prev = document.title
        document.title = 'Регистрация — Cookify'
        return () => {
            document.title = prev
        }
    }, [])

    const [step, setStep] = useState<Step>('form')

    /* ── Step 1 state ── */
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [errors, setErrors] = useState<{
        email?: string
        password?: string
        confirm?: string
        general?: string
    }>({})
    const [submitting, setSubmitting] = useState(false)

    /* ── Step 2 state ── */
    const [code, setCode] = useState('')
    const [codeError, setCodeError] = useState<string | null>(null)
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [resendIn, setResendIn] = useState(RESEND_TIMEOUT)
    const [devCode, setDevCode] = useState<string | null>(null)

    /* Countdown тикает только на step='verify' */
    useEffect(() => {
        if (step !== 'verify' || resendIn <= 0) return
        const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
        return () => clearTimeout(t)
    }, [step, resendIn])

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const r = s % 60
        return `${m}:${String(r).padStart(2, '0')}`
    }

    /* ── Step 1 submit ── */
    const handleFormSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault()
            const eErr = validators.email(email)
            const pErr = validators.password(password)
            const cErr = validators.confirmPassword(confirm, password)
            const newErrors: typeof errors = {}
            if (eErr) newErrors.email = eErr
            if (pErr) newErrors.password = pErr
            if (cErr) newErrors.confirm = cErr
            setErrors(newErrors)
            if (Object.keys(newErrors).length > 0) return

            setSubmitting(true)
            try {
                const { code: c } = await register(email, password)
                setDevCode(c)
                setStep('verify')
                setResendIn(RESEND_TIMEOUT)
            } catch (err) {
                if (err instanceof AuthError) {
                    if (err.field === 'email')
                        setErrors({ email: err.message })
                    else setErrors({ general: err.message })
                } else {
                    setErrors({
                        general: 'Не удалось отправить код. Попробуйте ещё раз.',
                    })
                }
            } finally {
                setSubmitting(false)
            }
        },
        [email, password, confirm, register],
    )

    /* ── Step 2 verify ── */
    const handleVerify = useCallback(
        async (codeOverride?: string) => {
            const finalCode = codeOverride ?? code
            if (finalCode.length !== 6) {
                setCodeError('Введите 6 цифр кода')
                return
            }
            setVerifying(true)
            setCodeError(null)
            try {
                await verifyCode(email, finalCode)
                navigate(next, { replace: true })
            } catch (err) {
                if (err instanceof AuthError) setCodeError(err.message)
                else setCodeError('Не удалось подтвердить код')
            } finally {
                setVerifying(false)
            }
        },
        [code, email, verifyCode, navigate, next],
    )

    const handleResend = useCallback(async () => {
        if (resendIn > 0) return
        setResending(true)
        try {
            const { code: c } = await resendCode(email)
            setDevCode(c)
            setResendIn(RESEND_TIMEOUT)
            setCode('')
            setCodeError(null)
        } catch {
            setCodeError('Не удалось отправить код повторно')
        } finally {
            setResending(false)
        }
    }, [resendIn, email, resendCode])

    /* ═══════════════ STEP 1: форма ═══════════════ */
    if (step === 'form') {
        return (
            <AuthCard
                title="Добро пожаловать!"
                sectionTitle="Регистрация"
                footer={
                    <p className="auth-footer-text">
                        Уже есть аккаунт?{' '}
                        <Link
                            to={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
                            className="auth-link auth-link--bold"
                        >
                            Войти
                        </Link>
                    </p>
                }
            >
                <form
                    className="auth-form"
                    onSubmit={handleFormSubmit}
                    noValidate
                >
                    <div className="auth-field">
                        <input
                            type="email"
                            autoComplete="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                setErrors((p) => ({ ...p, email: undefined }))
                            }}
                            className={`auth-input ${errors.email ? 'auth-input--error' : ''}`}
                            aria-invalid={!!errors.email}
                            aria-label="Email"
                            autoFocus
                        />
                        {errors.email && (
                            <p className="auth-field__error" role="alert">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <PasswordField
                        placeholder="Пароль"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setErrors((p) => ({ ...p, password: undefined }))
                        }}
                        error={errors.password}
                    />

                    <PasswordField
                        placeholder="Повторите пароль"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => {
                            setConfirm(e.target.value)
                            setErrors((p) => ({ ...p, confirm: undefined }))
                        }}
                        error={errors.confirm}
                    />

                    {errors.general && (
                        <p className="auth-general-error" role="alert">
                            {errors.general}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? 'Отправляем…' : 'Отправить код'}
                    </button>
                </form>
            </AuthCard>
        )
    }

    /* ═══════════════ STEP 2: код ═══════════════ */
    return (
        <AuthCard
            title="Регистрация"
            subtitle={
                <>
                    Письмо с кодом подтверждения было отправлено
                    <br />
                    на электронную почту
                </>
            }
            footer={
                <div className="auth-resend-block">
                    {resendIn > 0 ? (
                        <p className="auth-resend-text">
                            Отправить повторно через {formatTime(resendIn)}
                        </p>
                    ) : (
                        <button
                            type="button"
                            className="auth-link auth-link--bold"
                            onClick={handleResend}
                            disabled={resending}
                        >
                            {resending
                                ? 'Отправляем…'
                                : 'Отправить код повторно'}
                        </button>
                    )}
                    <button
                        type="button"
                        className="auth-link auth-link--muted auth-back-btn"
                        onClick={() => {
                            setStep('form')
                            setCode('')
                            setCodeError(null)
                        }}
                    >
                        ← Изменить email
                    </button>
                </div>
            }
        >
            <p
                className="auth-email-display"
                aria-label={`Email для подтверждения: ${email}`}
            >
                {email}
            </p>

            <div className="auth-form auth-form--centered">
                <CodeInput
                    value={code}
                    onChange={(v) => {
                        setCode(v)
                        setCodeError(null)
                    }}
                    onComplete={(v) => handleVerify(v)}
                    error={!!codeError}
                    disabled={verifying}
                />

                {codeError && (
                    <p
                        className="auth-field__error auth-field__error--center"
                        role="alert"
                    >
                        {codeError}
                    </p>
                )}

                <button
                    type="button"
                    className="auth-btn-primary"
                    onClick={() => handleVerify()}
                    disabled={verifying || code.length !== 6}
                >
                    {verifying ? 'Проверяем…' : 'Войти'}
                </button>

                {devCode && (
                    <div className="auth-dev-hint" role="note">
                        <span>💡 Тестовый код:</span>
                        <code>{devCode}</code>
                        <button
                            type="button"
                            onClick={() => {
                                setCode(devCode)
                                handleVerify(devCode)
                            }}
                            className="auth-dev-hint__btn"
                        >
                            Подставить
                        </button>
                    </div>
                )}
            </div>
        </AuthCard>
    )
}