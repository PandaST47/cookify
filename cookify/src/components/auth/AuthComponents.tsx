import {
    memo,
    useState,
    useRef,
    useCallback,
    useEffect,
    type ReactNode,
    type InputHTMLAttributes,
    type KeyboardEvent,
    type ClipboardEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   AuthCard — общий layout для /login и /register.
   Логотип, заголовок, подзаголовок, слот контента, слот футера.
   ═══════════════════════════════════════════════════════════ */

interface AuthCardProps {
    title: string
    subtitle?: ReactNode
    sectionTitle?: string
    children: ReactNode
    footer?: ReactNode
}

export const AuthCard = memo(function AuthCard({
    title,
    subtitle,
    sectionTitle,
    children,
    footer,
}: AuthCardProps) {
    return (
        <div className="auth-page">
            <main className="auth-card" role="main">
                <Link
                    to="/"
                    className="auth-card__logo"
                    aria-label="На главную Cookify"
                >
                    <UtensilsCrossed
                        size={36}
                        strokeWidth={2.25}
                        aria-hidden="true"
                    />
                </Link>

                <h1 className="auth-card__title">{title}</h1>
                {subtitle && (
                    <p className="auth-card__subtitle">{subtitle}</p>
                )}
                {sectionTitle && (
                    <h2 className="auth-card__section">{sectionTitle}</h2>
                )}

                {children}

                {footer && <div className="auth-card__footer">{footer}</div>}
            </main>
        </div>
    )
})

/* ═══════════════════════════════════════════════════════════
   PasswordField — input с toggle show/hide.
   tabIndex={-1} на кнопке чтобы Tab пропускал её (UX-договорённость).
   ═══════════════════════════════════════════════════════════ */

type PasswordFieldProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type'
> & {
    error?: string | null
    label?: string
}

export const PasswordField = memo(function PasswordField({
    error,
    label = 'Пароль',
    className = '',
    ...rest
}: PasswordFieldProps) {
    const [visible, setVisible] = useState(false)
    return (
        <div className="auth-field">
            <div
                className={`auth-field__wrap ${
                    error ? 'auth-field__wrap--error' : ''
                }`}
            >
                <input
                    {...rest}
                    type={visible ? 'text' : 'password'}
                    className={`auth-input auth-input--with-action ${className}`}
                    aria-invalid={!!error}
                    aria-label={label}
                    autoComplete={rest.autoComplete ?? 'current-password'}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="auth-input__action"
                    aria-label={
                        visible ? 'Скрыть пароль' : 'Показать пароль'
                    }
                    tabIndex={-1}
                >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && (
                <p className="auth-field__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    )
})

/* ═══════════════════════════════════════════════════════════
   CodeInput — 6 отдельных клеток для кода подтверждения.
   Фишки:
   - auto-advance при вводе цифры
   - backspace: чистит текущую → уходит в предыдущую
   - ArrowLeft/Right — перемещение без затирания
   - paste: вставка всех 6 цифр сразу из буфера (типичный UX)
   - autoComplete=one-time-code → iOS/Android подхватят SMS
   ═══════════════════════════════════════════════════════════ */

interface CodeInputProps {
    length?: number
    value: string
    onChange: (value: string) => void
    onComplete?: (value: string) => void
    disabled?: boolean
    error?: boolean
    autoFocus?: boolean
}

const ONLY_DIGITS = /\D/g

export const CodeInput = memo(function CodeInput({
    length = 6,
    value,
    onChange,
    onComplete,
    disabled = false,
    error = false,
    autoFocus = true,
}: CodeInputProps) {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (autoFocus) inputsRef.current[0]?.focus()
    }, [autoFocus])

    const setDigit = useCallback(
        (idx: number, digit: string) => {
            const arr = value.padEnd(length, ' ').split('')
            arr[idx] = digit
            const next = arr.join('').replace(/ /g, '').slice(0, length)
            onChange(next)
            if (next.length === length) onComplete?.(next)
        },
        [value, length, onChange, onComplete],
    )

    const handleInput = useCallback(
        (idx: number, raw: string) => {
            const digit = raw.replace(ONLY_DIGITS, '').slice(-1)
            if (!digit) return
            setDigit(idx, digit)
            if (idx < length - 1) inputsRef.current[idx + 1]?.focus()
        },
        [setDigit, length],
    )

    const handleKeyDown = useCallback(
        (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace') {
                e.preventDefault()
                const arr = value.padEnd(length, ' ').split('')
                if (arr[idx] && arr[idx] !== ' ') {
                    arr[idx] = ' '
                    onChange(arr.join('').trimEnd())
                } else if (idx > 0) {
                    arr[idx - 1] = ' '
                    onChange(arr.join('').trimEnd())
                    inputsRef.current[idx - 1]?.focus()
                }
            } else if (e.key === 'ArrowLeft' && idx > 0) {
                e.preventDefault()
                inputsRef.current[idx - 1]?.focus()
            } else if (e.key === 'ArrowRight' && idx < length - 1) {
                e.preventDefault()
                inputsRef.current[idx + 1]?.focus()
            }
        },
        [value, length, onChange],
    )

    const handlePaste = useCallback(
        (e: ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault()
            const pasted = e.clipboardData
                .getData('text')
                .replace(ONLY_DIGITS, '')
                .slice(0, length)
            if (!pasted) return
            onChange(pasted)
            if (pasted.length === length) {
                onComplete?.(pasted)
                inputsRef.current[length - 1]?.focus()
            } else {
                inputsRef.current[pasted.length]?.focus()
            }
        },
        [length, onChange, onComplete],
    )

    return (
        <div
            className={`code-input ${error ? 'code-input--error' : ''}`}
            role="group"
            aria-label="Код подтверждения"
        >
            {Array.from({ length }).map((_, idx) => (
                <input
                    key={idx}
                    ref={(el) => {
                        inputsRef.current[idx] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={value[idx] || ''}
                    onChange={(e) => handleInput(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="code-input__cell"
                    aria-label={`Цифра ${idx + 1}`}
                />
            ))}
        </div>
    )
})