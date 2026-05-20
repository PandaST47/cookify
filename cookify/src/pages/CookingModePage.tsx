import {
    useEffect, useMemo, useState, useRef, useCallback, memo,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Play, Pause, Check, ChevronUp, ChevronDown, Lightbulb,
    AlertTriangle,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/components/contexts/AuthContext'
import { useCooked } from '@/components/hooks/useCooked'
import { recipes } from '@/data/recipes'
import { getRecipeSteps } from '@/data/recipeSteps'
import type { RecipeStep } from '@/types'
import '@/styles/recipe.css'

const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/* ═══════════════════════════════════════════
   StepTimer — 4 состояния из Figma «Таймер»:
   idle (Начать) → running (pause + Сбросить) →
   paused (play + Сбросить) → done (check + +1 мин)
   ═══════════════════════════════════════════ */
type TimerStatus = 'idle' | 'running' | 'paused' | 'done'

const StepTimer = memo(function StepTimer({ duration }: { duration: number }) {
    const [remaining, setRemaining] = useState(duration)
    const [status, setStatus] = useState<TimerStatus>('idle')
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const clear = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    useEffect(() => clear, [clear])

    const tick = useCallback(() => {
        setRemaining((r) => {
            if (r <= 1) {
                clear()
                setStatus('done')
                return 0
            }
            return r - 1
        })
    }, [clear])

    const start = useCallback(() => {
        clear()
        setStatus('running')
        intervalRef.current = setInterval(tick, 1000)
    }, [clear, tick])

    const pause = useCallback(() => {
        clear()
        setStatus('paused')
    }, [clear])

    const reset = useCallback(() => {
        clear()
        setRemaining(duration)
        setStatus('idle')
    }, [clear, duration])

    const addMinute = useCallback(() => {
        setRemaining((r) => r + 60)
        setStatus('running')
        clear()
        intervalRef.current = setInterval(tick, 1000)
    }, [clear, tick])

    const ratio = duration > 0 ? remaining / duration : 0
    const R = 26
    const C = 2 * Math.PI * R
    const dash = status === 'done' ? 0 : C * ratio

    const circleIcon =
        status === 'running' ? <Pause size={22} aria-hidden="true" />
            : status === 'done' ? <Check size={22} aria-hidden="true" />
                : <Play size={22} aria-hidden="true" />

    const onCircle = () => {
        if (status === 'idle') start()
        else if (status === 'running') pause()
        else if (status === 'paused') start()
        // done → no-op (check)
    }

    return (
        <div className={`ck-timer ck-timer--${status}`}>
            <div className="ck-timer__left">
                <span className="ck-timer__time">{fmt(remaining)}</span>
                {status === 'idle' && (
                    <button type="button" className="ck-timer__pill ck-timer__pill--solid" onClick={start}>
                        Начать
                    </button>
                )}
                {(status === 'running' || status === 'paused') && (
                    <button type="button" className="ck-timer__pill ck-timer__pill--ghost" onClick={reset}>
                        Сбросить
                    </button>
                )}
                {status === 'done' && (
                    <button type="button" className="ck-timer__pill ck-timer__pill--solid" onClick={addMinute}>
                        +1 мин
                    </button>
                )}
            </div>
            <button
                type="button"
                className="ck-timer__circle"
                onClick={onCircle}
                aria-label={
                    status === 'running' ? 'Пауза'
                        : status === 'done' ? 'Таймер завершён'
                            : 'Запустить таймер'
                }
                disabled={status === 'done'}
            >
                <svg className="ck-timer__ring" viewBox="0 0 60 60" aria-hidden="true">
                    <circle cx="30" cy="30" r={R} className="ck-timer__ring-track" />
                    <circle
                        cx="30" cy="30" r={R}
                        className="ck-timer__ring-prog"
                        strokeDasharray={C}
                        strokeDashoffset={C - dash}
                        transform="rotate(-90 30 30)"
                    />
                </svg>
                <span className="ck-timer__icon">{circleIcon}</span>
            </button>
        </div>
    )
})

/* ═══════════════════════════════════════════
   Советы / Предупреждение — collapsible (Figma «Советы»)
   ═══════════════════════════════════════════ */
function Tips({ tip, warning }: { tip?: string; warning?: string }) {
    const [open, setOpen] = useState(true)
    if (!tip && !warning) return null
    return (
        <div className="ck-tips">
            <button
                type="button"
                className="ck-tips__head"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <Lightbulb size={18} aria-hidden="true" />
                <span>Советы</span>
                {open
                    ? <ChevronUp size={16} aria-hidden="true" />
                    : <ChevronDown size={16} aria-hidden="true" />}
            </button>
            {open && (
                <div className="ck-tips__body">
                    {tip && tip.split('\n').map((line, i) => (
                        <p key={`t${i}`} className="ck-tips__line">{line}</p>
                    ))}
                    {warning && (
                        <p className="ck-tips__warn">
                            <AlertTriangle size={15} aria-hidden="true" />
                            {warning}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════
   StepCard
   ═══════════════════════════════════════════ */
interface StepCardProps {
    step: RecipeStep
    index: number
    total: number
    active: boolean
    isLast: boolean
    onNext: () => void
}

const StepCard = memo(function StepCard({
    step, index, total, active, isLast, onNext,
}: StepCardProps) {
    const [imgErr, setImgErr] = useState(false)
    return (
        <article className={`ck-step ${active ? 'ck-step--active' : 'ck-step--faded'}`}>
            <div className="ck-step__media">
                {step.image && !imgErr ? (
                    <img
                        src={step.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={() => setImgErr(true)}
                        className="ck-step__img"
                    />
                ) : (
                    <div className="ck-step__img-fallback" aria-hidden="true">🍳</div>
                )}
            </div>
            <div className="ck-step__body">
                <div className="ck-step__top">
                    <h3 className="ck-step__num">Шаг {index + 1} из {total}</h3>
                    <p className="ck-step__text">{step.text}</p>
                </div>

                <div className="ck-step__controls">
                    {step.timerSeconds > 0 && active && (
                        <StepTimer duration={step.timerSeconds} />
                    )}
                    <button
                        type="button"
                        className={`ck-step__next ${isLast ? 'ck-step__next--done' : ''}`}
                        onClick={onNext}
                        disabled={!active}
                    >
                        {isLast ? 'Готово!' : 'Следующий шаг'}
                    </button>
                </div>

                {active && <Tips tip={step.tip} warning={step.warning} />}
            </div>
        </article>
    )
})

/* ═══════════════════════════════════════════
   CookingModePage
   ═══════════════════════════════════════════ */
export default function CookingModePage() {
    const { id = '' } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { add: addCooked } = useCooked(user?.id)

    const recipe = useMemo(() => recipes.find((r) => r.id === id), [id])
    const steps = useMemo(() => (recipe ? getRecipeSteps(recipe) : []), [recipe])
    const [activeIndex, setActiveIndex] = useState(0)
    const stepRefs = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        const prev = document.title
        document.title = recipe
            ? `Готовим: ${recipe.title} — Cookify`
            : 'Режим готовки — Cookify'
        window.scrollTo(0, 0)
        return () => { document.title = prev }
    }, [recipe])

    const handleNext = useCallback(() => {
        if (!recipe) return
        if (activeIndex >= steps.length - 1) {
            // последний шаг → «Приготовлено» + на таб Приготовлено
            addCooked(recipe.id)
            navigate('/?tab=cooked&cooked=1')
            return
        }
        const next = activeIndex + 1
        setActiveIndex(next)
        // плавно подводим к следующему шагу
        requestAnimationFrame(() => {
            stepRefs.current[next]?.scrollIntoView({
                behavior: 'smooth', block: 'center',
            })
        })
    }, [recipe, activeIndex, steps.length, addCooked, navigate])

    if (!recipe) {
        return (
            <>
                <Header />
                <main className="rp" role="main">
                    <div className="rp__container rp__notfound">
                        <h1>Рецепт не найден</h1>
                        <button className="rp__cta" onClick={() => navigate('/')}>
                            На главную
                        </button>
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Header />
            <main className="cm" role="main">
                <div className="cm__container">
                    <button
                        type="button"
                        className="cm__exit"
                        onClick={() => navigate(`/recipe/${recipe.id}`)}
                        aria-label="Выход из режима готовки"
                    >
                        <ArrowLeft size={18} aria-hidden="true" />
                        <span>Выход</span>
                    </button>

                    <h1 className="cm__title">{recipe.title}</h1>
                    <p className="cm__subtitle">Пошаговый рецепт</p>

                    <div className="cm__steps">
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                ref={(el) => { stepRefs.current[i] = el }}
                            >
                                <StepCard
                                    step={step}
                                    index={i}
                                    total={steps.length}
                                    active={i === activeIndex}
                                    isLast={i === steps.length - 1}
                                    onNext={handleNext}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </>
    )
}
