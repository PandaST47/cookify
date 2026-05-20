import {
    useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect, memo,
    type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
    Search, Heart, Star, ChevronDown, ChevronUp, ArrowUp,
    SlidersHorizontal, ArrowUpDown, ArrowRight, Check, X, Trash2, Plus,
} from 'lucide-react'
import Header from './layout/Header'
import { useFavorites } from './hooks/useFavorites'
import { useExclusions } from './hooks/useExclusions'
import { useCooked } from './hooks/useCooked'
import { useRatings } from './hooks/useRatings'
import { useFilteredRecipes } from './hooks/useFilteredRecipes'
import { useAuth } from './contexts/AuthContext'
import {
    recipes as ALL_RECIPES,
    filterGroups as FILTER_GROUPS,
    sortOptions as SORT_OPTIONS,
    allIngredientNames as ALL_INGREDIENTS,
    type SortId,
} from '@/data/recipes'
import type { FilterGroupId, Ingredient, Recipe, TabId } from '@/types'
import '@/styles/cookify.css'

const TABS: { id: TabId; label: string }[] = [
    { id: 'recommendations', label: 'Рекомендации' },
    { id: 'favorites', label: 'Избранное' },
    { id: 'cooked', label: 'Приготовлено' },
]

/* ═══════════════════════════════════════════
   IngredientsDropdown — на карточке (просмотр)
   Portal-based: панель рендерится в body, не клиппится оверфлоу.
   ═══════════════════════════════════════════ */
const IngredientsDropdown = memo(function IngredientsDropdown({
    ingredients,
}: { ingredients: Ingredient[] }) {
    const [open, setOpen] = useState(false)
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const updatePosition = useCallback(() => {
        const el = triggerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const PANEL_W = 240
        const PADDING = 12
        let left = rect.left
        if (left + PANEL_W > window.innerWidth - PADDING) {
            left = window.innerWidth - PANEL_W - PADDING
        }
        if (left < PADDING) left = PADDING
        setPos({ top: rect.bottom + 8, left })
    }, [])

    useLayoutEffect(() => {
        if (open) updatePosition()
    }, [open, updatePosition])

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            const t = e.target as Node
            if (
                panelRef.current && !panelRef.current.contains(t) &&
                triggerRef.current && !triggerRef.current.contains(t)
            ) setOpen(false)
        }
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        const close = () => setOpen(false)
        document.addEventListener('mousedown', handleClick)
        document.addEventListener('keydown', handleEsc)
        window.addEventListener('scroll', close, true)
        window.addEventListener('resize', close)
        return () => {
            document.removeEventListener('mousedown', handleClick)
            document.removeEventListener('keydown', handleEsc)
            window.removeEventListener('scroll', close, true)
            window.removeEventListener('resize', close)
        }
    }, [open])

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
                className={`ck-ing__trigger ${open ? 'ck-ing__trigger--open' : ''}`}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-label={`Ингредиенты: ${ingredients.length} шт.`}
            >
                Ингредиенты
                <ChevronDown
                    size={14}
                    className={`ck-ing__chev ${open ? 'ck-ing__chev--open' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {open && createPortal(
                <div
                    ref={panelRef}
                    className="ck-ing__panel"
                    role="tooltip"
                    style={{ top: pos.top, left: pos.left }}
                >
                    {ingredients.map((ing, i) => (
                        <span key={ing.name}>
                            {ing.name}{ing.amount ? ` — ${ing.amount}${ing.unit ? ' ' + ing.unit : ''}` : ''}
                            {i < ingredients.length - 1 && ', '}
                        </span>
                    ))}
                </div>,
                document.body,
            )}
        </>
    )
})

/* ═══════════════════════════════════════════
   RecipeCard — карточка в ленте (image top + body)
   ═══════════════════════════════════════════ */
interface RecipeCardProps {
    recipe: Recipe
    isFavorite: boolean
    isCooked: boolean
    rating: { average: number; count: number }
    onToggleFavorite: (id: string) => void
    onMarkCooked: (id: string) => void
    showCookButton?: boolean
}

const RecipeCard = memo(function RecipeCard({
    recipe, isFavorite, isCooked, rating, onToggleFavorite, onMarkCooked,
    showCookButton = true,
}: RecipeCardProps) {
    const [imgErr, setImgErr] = useState(false)
    const navigate = useNavigate()

    // Клик по карточке → Полная карточка рецепта (ТЗ). Внутренние
    // кнопки (избранное/ингредиенты/приготовлено) делают stopPropagation,
    // поэтому сюда не доходят. Доступно с клавиатуры (Enter/Space).
    const openRecipe = () => navigate(`/recipe/${recipe.id}`)
    const onCardKey = (e: ReactKeyboardEvent<HTMLElement>) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openRecipe()
        }
    }

    return (
        <article
            className="ck-card ck-card--clickable"
            aria-labelledby={`recipe-${recipe.id}-title`}
            role="link"
            tabIndex={0}
            onClick={openRecipe}
            onKeyDown={onCardKey}
        >
            <div className="ck-card__media">
                {!imgErr ? (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        loading="lazy"
                        decoding="async"
                        width={380}
                        height={154}
                        onError={() => setImgErr(true)}
                        className="ck-card__img"
                    />
                ) : (
                    <div className="ck-card__fallback" aria-hidden="true">🍽️</div>
                )}

                <div className="ck-card__media-top">
                    <IngredientsDropdown ingredients={recipe.ingredients} />
                    <div className="ck-card__media-top-right">
                        <span
                            className="ck-card__kbzhu"
                            aria-label={`Калории ${recipe.calories}, белки ${recipe.protein}, жиры ${recipe.fat}, углеводы ${recipe.carbs}`}
                        >
                            КБЖУ {recipe.calories}/{recipe.protein}/{recipe.fat}/{recipe.carbs}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id) }}
                            className="ck-card__fav"
                            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                            aria-pressed={isFavorite}
                        >
                            <Heart
                                size={16}
                                className={`ck-card__fav-icon ${isFavorite ? 'ck-card__fav-icon--on' : ''}`}
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                </div>

                <div className="ck-card__media-tags">
                    <div className="ck-card__tags">
                        {recipe.displayTags.slice(0, 6).map((tag, i) => (
                            <span key={tag} className="ck-card__tag">
                                {tag}
                                {i < Math.min(recipe.displayTags.length, 6) - 1 && (
                                    <span className="ck-card__tag-sep" aria-hidden="true">•</span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="ck-card__body">
                <h3 id={`recipe-${recipe.id}-title`} className="ck-card__title">
                    {recipe.title}
                </h3>
                <p className="ck-card__desc">{recipe.description}</p>
                <div className="ck-card__footer">
                    <div className="ck-card__time" aria-label={`Время готовки ${recipe.cookTime} минут`}>
                        ⏱ {recipe.cookTime} мин
                    </div>
                    <div className="ck-card__rating" aria-label={`Рейтинг ${rating.average.toFixed(2)} из 5, ${rating.count} оценок`}>
                        <Star size={14} className="ck-card__star" aria-hidden="true" />
                        <span className="ck-card__rating-val">{rating.average.toFixed(2)}</span>
                    </div>
                </div>

                {showCookButton && (
                    <button
                        type="button"
                        className={`ck-card__cook-btn ${isCooked ? 'ck-card__cook-btn--done' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onMarkCooked(recipe.id) }}
                        aria-pressed={isCooked}
                        aria-label={isCooked ? 'Уже в Приготовлено' : 'Отметить как приготовленное'}
                        disabled={isCooked}
                    >
                        {isCooked
                            ? (<><Check size={14} aria-hidden="true" /> В «Приготовлено»</>)
                            : (<><Plus size={14} aria-hidden="true" /> Приготовлено</>)}
                    </button>
                )}
            </div>
        </article>
    )
})

/* ═══════════════════════════════════════════
   StarRating — интерактивная шкала 1..5
   Поддерживает keyboard (← → ⇧ Tab + space/enter).
   ═══════════════════════════════════════════ */
interface StarRatingProps {
    value: number | null
    onChange: (value: number) => void
    /** Только показ, без интерактивности. */
    readOnly?: boolean
    size?: number
    /** Aria label для всей группы. */
    label?: string
}

const StarRating = memo(function StarRating({
    value, onChange, readOnly = false, size = 26, label,
}: StarRatingProps) {
    const [hover, setHover] = useState<number | null>(null)
    const display = hover ?? value ?? 0

    const handleKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (readOnly) return
        if (e.key === 'ArrowLeft') {
            e.preventDefault()
            onChange(Math.max(1, (value ?? 1) - 1))
        } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            onChange(Math.min(5, (value ?? 0) + 1))
        }
    }

    return (
        <div
            className={`ck-stars ${readOnly ? 'ck-stars--readonly' : ''}`}
            role={readOnly ? 'img' : 'radiogroup'}
            aria-label={label || (readOnly ? `Оценка ${value ?? 0} из 5` : 'Поставить оценку от 1 до 5')}
            onMouseLeave={() => setHover(null)}
            onKeyDown={handleKey}
            tabIndex={readOnly ? -1 : 0}
        >
            {[1, 2, 3, 4, 5].map((n) => {
                const active = n <= display
                return (
                    <button
                        key={n}
                        type="button"
                        className={`ck-stars__btn ${active ? 'ck-stars__btn--on' : ''}`}
                        onMouseEnter={() => !readOnly && setHover(n)}
                        onClick={() => !readOnly && onChange(n)}
                        disabled={readOnly}
                        role={readOnly ? undefined : 'radio'}
                        aria-checked={readOnly ? undefined : value === n}
                        aria-label={`${n} ${n === 1 ? 'звезда' : n < 5 ? 'звезды' : 'звёзд'}`}
                        tabIndex={-1}
                    >
                        <Star
                            size={size}
                            fill={active ? 'currentColor' : 'none'}
                            strokeWidth={1.5}
                            aria-hidden="true"
                        />
                    </button>
                )
            })}
        </div>
    )
})

/* ═══════════════════════════════════════════
   CookedRow — строка в табе «Приготовлено»
   ═══════════════════════════════════════════ */
interface CookedRowProps {
    recipe: Recipe
    isFavorite: boolean
    userRating: number | null
    aggregateRating: { average: number; count: number }
    onToggleFavorite: (id: string) => void
    onSubmitRating: (id: string, prev: number | null, next: number) => void
    onRequestRemove: (id: string) => void
}

const CookedRow = memo(function CookedRow({
    recipe, isFavorite, userRating, aggregateRating,
    onToggleFavorite, onSubmitRating, onRequestRemove,
}: CookedRowProps) {
    const [draftRating, setDraftRating] = useState<number | null>(userRating)
    /** Шкала интерактивна + показываем кнопку «Отправить оценку». */
    const [editing, setEditing] = useState(userRating === null)
    /**
     * Транзиентное состояние сразу после отправки: показываем «Спасибо!»
     * без кнопки (Figma «Оценить рецепт» state 2). Через ~1.8 c переходит
     * в персистентное «Ваша оценка» + «Изменить оценку» (state 3).
     */
    const [justSubmitted, setJustSubmitted] = useState(false)
    const thanksTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    /**
     * Синк с внешним стейтом (смена рецепта / удаление / cross-tab):
     * паттерн React «adjust state during render» вместо setState-в-effect
     * (последнее триггерит каскадные ре-рендеры — eslint react-hooks).
     * @see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
     */
    const [syncedRating, setSyncedRating] = useState(userRating)
    if (userRating !== syncedRating) {
        setSyncedRating(userRating)
        setDraftRating(userRating)
        setEditing(userRating === null)
        setJustSubmitted(false)
    }

    // Чистим таймер «Спасибо!» при размонтировании.
    useEffect(() => () => {
        if (thanksTimer.current) clearTimeout(thanksTimer.current)
    }, [])

    const canSubmit = editing && draftRating !== null

    const handleSubmit = () => {
        if (draftRating === null) return
        onSubmitRating(recipe.id, userRating, draftRating)
        setEditing(false)
        setJustSubmitted(true)
        // Предсинхронизируем: после onSubmitRating родитель пришлёт новый
        // userRating === draftRating. Если не обновить syncedRating здесь,
        // render-time guard ниже посчитает это «внешним» изменением и
        // сбросит justSubmitted → «Спасибо!» не успеет показаться.
        setSyncedRating(draftRating)
        if (thanksTimer.current) clearTimeout(thanksTimer.current)
        thanksTimer.current = setTimeout(() => setJustSubmitted(false), 1800)
    }

    const handleStarChange = (v: number) => {
        setDraftRating(v)
        setEditing(true)
        setJustSubmitted(false)
    }

    const handleEdit = () => {
        setEditing(true)
        setJustSubmitted(false)
    }

    // Заголовок: персистентная оценка → «Ваша оценка»; иначе «Оценить рецепт?».
    const ratePersisted = userRating !== null && !justSubmitted && !editing
    const rateTitle = ratePersisted ? 'Ваша оценка' : 'Оценить рецепт?'

    return (
        <article className="ck-cooked-row" aria-labelledby={`cooked-${recipe.id}-title`}>
            <div className="ck-cooked-row__card">
                <RecipeCard
                    recipe={recipe}
                    isFavorite={isFavorite}
                    isCooked
                    rating={aggregateRating}
                    onToggleFavorite={onToggleFavorite}
                    onMarkCooked={() => {/* уже в cooked */}}
                    showCookButton={false}
                />
            </div>

            <div className="ck-cooked-row__rate">
                <h4 className="ck-cooked-row__rate-title">{rateTitle}</h4>
                <div className="ck-cooked-row__rate-row">
                    <StarRating
                        value={draftRating}
                        onChange={handleStarChange}
                        readOnly={!editing}
                    />
                    {justSubmitted ? (
                        <p className="ck-cooked-row__thanks" role="status">
                            Спасибо!
                        </p>
                    ) : ratePersisted ? (
                        <button
                            type="button"
                            className="ck-cooked-row__btn"
                            onClick={handleEdit}
                        >
                            Изменить оценку
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="ck-cooked-row__btn"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                        >
                            Отправить оценку
                        </button>
                    )}
                </div>
            </div>

            <div className="ck-cooked-row__agg">
                <h4 className="ck-cooked-row__rate-title">Общий рейтинг</h4>
                <div className="ck-cooked-row__agg-val">
                    <Star size={18} fill="currentColor" aria-hidden="true" />
                    <span className="ck-cooked-row__agg-num">
                        {aggregateRating.average.toFixed(2)}
                    </span>
                    <span className="ck-cooked-row__agg-count">
                        {aggregateRating.count}{' '}
                        {aggregateRating.count === 1
                            ? 'оценка'
                            : aggregateRating.count >= 2 && aggregateRating.count <= 4
                                ? 'оценки'
                                : 'оценок'}
                    </span>
                </div>
                <button
                    type="button"
                    className="ck-cooked-row__delete"
                    onClick={() => onRequestRemove(recipe.id)}
                    aria-label={`Удалить ${recipe.title} из приготовленных`}
                >
                    Удалить
                    <Trash2 size={14} aria-hidden="true" />
                </button>
            </div>
        </article>
    )
})

/* ═══════════════════════════════════════════
   FilterSidebar — single instance, dual mode
   ═══════════════════════════════════════════ */
interface FilterSidebarProps {
    selected: Record<FilterGroupId, string[]>
    onToggle: (gId: FilterGroupId, oId: string) => void
    onApply: () => void
    onReset: () => void
    isOpen: boolean
    onClose: () => void
}

const FilterSidebar = memo(function FilterSidebar({
    selected, onToggle, onApply, onReset, isOpen, onClose,
}: FilterSidebarProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
    /** Группы, у которых пользователь нажал «Показать ещё» (раскрыт весь список). */
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    const toggleGroup = useCallback((id: string) => {
        setCollapsed((p) => ({ ...p, [id]: !p[id] }))
    }, [])

    const toggleExpanded = useCallback((id: string) => {
        setExpanded((p) => ({ ...p, [id]: !p[id] }))
    }, [])

    useEffect(() => {
        if (!isOpen) return
        const original = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = original }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen, onClose])

    return (
        <>
            {isOpen && <div className="ck-overlay" onClick={onClose} aria-hidden="true" />}
            <aside
                className={`ck-sidebar ${isOpen ? 'ck-sidebar--open' : ''}`}
                role="complementary"
                aria-label="Фильтры рецептов"
            >
                <div className="ck-sidebar__content">
                    <div className="ck-sidebar__mobile-hdr">
                        <h2 className="ck-sidebar__title">Фильтры</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="ck-sidebar__close"
                            aria-label="Закрыть фильтры"
                        >
                            &times;
                        </button>
                    </div>
                    <h2 className="ck-sidebar__desk-title">Фильтры</h2>

                    <div className="ck-fgroups">
                        {FILTER_GROUPS.map((g) => {
                            const isCol = collapsed[g.id] ?? false
                            const groupId = `fg-${g.id}`
                            const panelId = `fg-panel-${g.id}`
                            return (
                                <div key={g.id} className="ck-fgroup">
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(g.id)}
                                        className="ck-fgroup-toggle"
                                        aria-expanded={!isCol}
                                        aria-controls={panelId}
                                        id={groupId}
                                    >
                                        <span className="ck-fgroup-label">{g.title}</span>
                                        {isCol
                                            ? <ChevronDown size={16} className="ck-fgroup-icon" aria-hidden="true" />
                                            : <ChevronUp size={16} className="ck-fgroup-icon" aria-hidden="true" />}
                                    </button>
                                    {!isCol && (
                                        <div
                                            id={panelId}
                                            className="ck-foptions"
                                            role="group"
                                            aria-labelledby={groupId}
                                        >
                                            {(() => {
                                                const isExpanded = expanded[g.id] ?? false
                                                const limit =
                                                    g.showMoreAfter != null && !isExpanded
                                                        ? g.showMoreAfter
                                                        : g.options.length
                                                const visible = g.options.slice(0, limit)
                                                const hiddenCount =
                                                    g.options.length - visible.length
                                                return (
                                                    <>
                                                        {visible.map((o) => {
                                                            const checked = !!selected[g.id]?.includes(o.id)
                                                            return (
                                                                <label key={o.id} className="ck-foption">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="ck-foption__input"
                                                                        checked={checked}
                                                                        onChange={() => onToggle(g.id, o.id)}
                                                                    />
                                                                    <span
                                                                        className={`ck-foption__box ${checked ? 'ck-foption__box--on' : ''}`}
                                                                        aria-hidden="true"
                                                                    >
                                                                        {checked && <Check size={12} color="#fff" />}
                                                                    </span>
                                                                    <span className="ck-foption__label">{o.label}</span>
                                                                </label>
                                                            )
                                                        })}
                                                        {g.showMoreAfter != null &&
                                                            (hiddenCount > 0 || isExpanded) && (
                                                            <button
                                                                type="button"
                                                                className="ck-show-more"
                                                                onClick={() => toggleExpanded(g.id)}
                                                                aria-expanded={isExpanded}
                                                            >
                                                                {isExpanded
                                                                    ? 'Скрыть'
                                                                    : `Показать ещё (${hiddenCount})`}
                                                            </button>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="ck-sidebar__actions">
                        <button
                            type="button"
                            onClick={onApply}
                            className="ck-btn ck-btn--primary"
                        >
                            Применить
                        </button>
                        <button
                            type="button"
                            onClick={onReset}
                            className="ck-btn ck-btn--secondary"
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
})

/* ═══════════════════════════════════════════
   ConfirmModal — портал-диалог с фокус-локом и Esc-close.
   ═══════════════════════════════════════════ */
interface ConfirmModalProps {
    title: string
    description: string
    confirmLabel: string
    cancelLabel: string
    onConfirm: () => void
    onCancel: () => void
}

const ConfirmModal = memo(function ConfirmModal({
    title, description, confirmLabel, cancelLabel, onConfirm, onCancel,
}: ConfirmModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel()
        }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        dialogRef.current?.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus()
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [onCancel])

    return createPortal(
        <div className="ck-confirm-backdrop" role="presentation" onClick={onCancel}>
            <div
                ref={dialogRef}
                className="ck-confirm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="ck-confirm-title"
                aria-describedby="ck-confirm-desc"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="ck-confirm__close"
                    onClick={onCancel}
                    aria-label="Закрыть диалог"
                >
                    <X size={18} aria-hidden="true" />
                </button>

                <h2 id="ck-confirm-title" className="ck-confirm__title">{title}</h2>
                <p id="ck-confirm-desc" className="ck-confirm__desc">{description}</p>

                <div className="ck-confirm__actions">
                    <button
                        type="button"
                        className="ck-confirm__btn ck-confirm__btn--ghost"
                        onClick={onCancel}
                        data-autofocus
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="ck-confirm__btn ck-confirm__btn--danger"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
})

/* ═══════════════════════════════════════════
   IngredientsModal — «Кнопка Ингредиенты» из ТЗ.
   Поиск + чекбоксы, сохраняем как «выбранные ингредиенты»
   для фильтрации ленты по условию ИЛИ.
   ═══════════════════════════════════════════ */
interface IngredientsModalProps {
    available: string[]
    initial: string[]
    onClose: () => void
    onSave: (next: string[]) => void
}

const IngredientsModal = memo(function IngredientsModal({
    available, initial, onClose, onSave,
}: IngredientsModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null)

    /** Парсим строку «через запятую» → канонические имена (без учёта регистра). */
    const parseTokens = useCallback(
        (str: string): string[] => {
            const tokens = str.split(',').map((t) => t.trim()).filter(Boolean)
            return tokens.map((t) => {
                const match = available.find(
                    (a) => a.toLowerCase() === t.toLowerCase(),
                )
                return match ?? t
            })
        },
        [available],
    )

    const [text, setText] = useState(initial.join(','))
    const [draft, setDraft] = useState<Set<string>>(() => new Set(initial))

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        dialogRef.current?.querySelector<HTMLInputElement>('[data-autofocus]')?.focus()
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [onClose])

    /** Ввод текста → сразу пересобираем draft (без эффекта-синка). */
    const handleTextChange = (value: string) => {
        setText(value)
        setDraft(new Set(parseTokens(value)))
    }

    /** Чекбокс: только меняем выбор, текст не трогаем (raw input ≠ выбор). */
    const toggle = (item: string) => {
        setDraft((prev) => {
            const next = new Set(prev)
            if (next.has(item)) next.delete(item)
            else next.add(item)
            return next
        })
    }

    const handleSave = () => {
        onSave([...draft])
        onClose()
    }

    return createPortal(
        // Frame 69 «Добавить ингредиенты»: кремовая карточка, крупный
        // радиус, поле-pill, чекбоксы, «Сохранить» справа-снизу.
        <div className="ck-confirm-backdrop" role="presentation" onClick={onClose}>
            <div
                ref={dialogRef}
                className="ck-ingmodal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ck-ingmodal-title"
                aria-describedby="ck-ingmodal-desc"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Деталь a11y (отсутствует в Figma Frame 69, но нужна для
                    WCAG 2.2 — закрытие без мыши): крестик + Esc + клик по фону. */}
                <button
                    type="button"
                    className="ck-ingmodal__close"
                    onClick={onClose}
                    aria-label="Закрыть"
                >
                    <X size={18} aria-hidden="true" />
                </button>

                <h2 id="ck-ingmodal-title" className="ck-ingmodal__title">
                    Добавить ингредиенты
                </h2>
                <p id="ck-ingmodal-desc" className="ck-ingmodal__desc">
                    Введите продукты, которые хотите использовать в блюде.
                    Названия продуктов вводите через запятую без пробелов.
                </p>

                <p className="ck-ingmodal__hint">
                    Например, «Красная&nbsp;рыба,томат,базилик»
                </p>
                <input
                    type="search"
                    className="ck-ingmodal__input"
                    value={text}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Поиск рецептов"
                    aria-label="Список ингредиентов через запятую"
                    autoComplete="off"
                    data-autofocus
                />

                <h3 className="ck-ingmodal__subtitle">Используемые продукты</h3>
                {draft.size === 0 ? (
                    <p className="ck-ingmodal__empty">
                        Введите ингредиенты выше или раскройте подсказки ниже.
                    </p>
                ) : (
                    <ul className="ck-ingmodal__list" role="list">
                        {[...draft].map((item) => (
                            <li key={item}>
                                <label className="ck-ingmodal__opt">
                                    <input
                                        type="checkbox"
                                        checked
                                        onChange={() => toggle(item)}
                                        className="ck-ingmodal__opt-input"
                                    />
                                    <span
                                        className="ck-ingmodal__opt-box ck-ingmodal__opt-box--on"
                                        aria-hidden="true"
                                    >
                                        <Check size={13} color="#fff" strokeWidth={3} />
                                    </span>
                                    <span className="ck-ingmodal__opt-label">{item}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                )}

                <details className="ck-ingmodal__suggest">
                    <summary>Подсказки из базы рецептов</summary>
                    <ul className="ck-ingmodal__list" role="list">
                        {available.slice(0, 30).map((item) => {
                            const checked = draft.has(item)
                            return (
                                <li key={item}>
                                    <label className="ck-ingmodal__opt">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggle(item)}
                                            className="ck-ingmodal__opt-input"
                                        />
                                        <span
                                            className={`ck-ingmodal__opt-box ${checked ? 'ck-ingmodal__opt-box--on' : ''}`}
                                            aria-hidden="true"
                                        >
                                            {checked && <Check size={13} color="#fff" strokeWidth={3} />}
                                        </span>
                                        <span className="ck-ingmodal__opt-label">{item}</span>
                                    </label>
                                </li>
                            )
                        })}
                    </ul>
                </details>

                <p className="ck-ingmodal__footnote">
                    Проверьте правильность списка и нажмите кнопку «Сохранить»
                </p>

                <div className="ck-ingmodal__actions">
                    <button
                        type="button"
                        className="ck-ingmodal__save"
                        onClick={handleSave}
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
})

/* ═══════════════════════════════════════════
   CookifyApp — главный компонент
   ═══════════════════════════════════════════ */
export default function CookifyApp() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabId>('recommendations')
    /** Поиск рецептов — единственный (поиск по сайту в Header убран). */
    const [recipeSearch, setRecipeSearch] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sortOpen, setSortOpen] = useState(false)
    const [sortBy, setSortBy] = useState<SortId>('popular')
    const [selectedFilters, setSelectedFilters] = useState<
        Record<FilterGroupId, string[]>
    >({ mealType: [], occasions: [], health: [], cuisine: [], taste: [] })
    const [chosenIngredients, setChosenIngredients] = useState<string[]>([])
    const [ingredientsOpen, setIngredientsOpen] = useState(false)

    const { favorites, add: addFav, remove: removeFav } = useFavorites()
    const { exclusions } = useExclusions(user?.id)
    const {
        cooked, add: addCooked, remove: removeCooked,
        rate: rateCooked, has: isInCooked,
    } = useCooked(user?.id)
    const { getRating, submit: submitRating, replace: replaceRating, withdraw: withdrawRating } = useRatings()

    const cookedIds = useMemo(() => new Set(Object.keys(cooked)), [cooked])

    const [showScrollTop, setShowScrollTop] = useState(false)
    const [pendingUnfav, setPendingUnfav] = useState<string | null>(null)
    const [pendingUncook, setPendingUncook] = useState<string | null>(null)

    useEffect(() => {
        const handler = () => setShowScrollTop(window.scrollY > 400)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    const toggleFilter = useCallback((groupId: FilterGroupId, optionId: string) => {
        setSelectedFilters((prev) => {
            const current = prev[groupId] || []
            const next = current.includes(optionId)
                ? current.filter((id) => id !== optionId)
                : [...current, optionId]
            return { ...prev, [groupId]: next }
        })
    }, [])

    const handleToggleFavorite = useCallback((id: string) => {
        if (favorites.has(id)) setPendingUnfav(id)
        else addFav(id)
    }, [favorites, addFav])

    const confirmUnfavorite = useCallback(() => {
        if (pendingUnfav) removeFav(pendingUnfav)
        setPendingUnfav(null)
    }, [pendingUnfav, removeFav])

    const handleMarkCooked = useCallback((id: string) => {
        if (!isInCooked(id)) addCooked(id)
    }, [isInCooked, addCooked])

    const confirmUncook = useCallback(() => {
        if (!pendingUncook) return
        const id = pendingUncook
        const userRating = cooked[id]
        // если оценка была — снимем её из глобальной аггрегации
        if (typeof userRating === 'number') withdrawRating(id, userRating)
        removeCooked(id)
        setPendingUncook(null)
    }, [pendingUncook, cooked, removeCooked, withdrawRating])

    /** Применить пользовательскую оценку: либо первая, либо «изменение». */
    const handleSubmitRating = useCallback(
        (id: string, prev: number | null, next: number) => {
            if (prev === null) submitRating(id, next)
            else replaceRating(id, prev, next)
            rateCooked(id, next)
        },
        [submitRating, replaceRating, rateCooked],
    )

    const activeFiltersList = useMemo(() => {
        const list: { groupId: FilterGroupId; optionId: string; label: string }[] = []
        for (const [gIdRaw, opts] of Object.entries(selectedFilters)) {
            const gId = gIdRaw as FilterGroupId
            const group = FILTER_GROUPS.find((g) => g.id === gId)
            if (!group) continue
            for (const oId of opts) {
                const opt = group.options.find((o) => o.id === oId)
                if (opt) list.push({ groupId: gId, optionId: oId, label: opt.label })
            }
        }
        return list
    }, [selectedFilters])

    const visibleRecipes = useFilteredRecipes({
        recipes: ALL_RECIPES,
        activeTab,
        favorites,
        cookedIds,
        chosenIngredients,
        excludedIngredients: exclusions,
        sidebarFilters: selectedFilters,
        search: recipeSearch,
        sortBy,
        ratingFor: getRating,
    })

    const clearFilters = useCallback(() => {
        setSelectedFilters({ mealType: [], occasions: [], health: [], cuisine: [], taste: [] })
    }, [])
    const closeSidebar = useCallback(() => setSidebarOpen(false), [])
    const openSidebar = useCallback(() => setSidebarOpen(true), [])
    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    /** Toolbar-CTA «Загрузить рецепт» показываем только на «Рекомендациях». */
    const isRecommendations = activeTab === 'recommendations'
    const isCookedTab = activeTab === 'cooked'

    /* ─── Empty/auth states ─── */
    const showAuthGate = !user && activeTab !== 'recommendations'

    return (
        <div className="ck-page">
            <Header />

            <nav className="ck-tabs" aria-label="Основная навигация">
                <div className="ck-tabs__inner">
                    <div className="ck-tabs__list" role="tablist">
                        {TABS.map((tab) => {
                            const active = tab.id === activeTab
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`ck-tab ${active ? 'ck-tab--active' : ''}`}
                                    role="tab"
                                    aria-selected={active}
                                >
                                    {tab.label}
                                    {active && <span className="ck-tab__bar" aria-hidden="true" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </nav>

            <main className="ck-main">
                <div className="ck-content">
                    <FilterSidebar
                        selected={selectedFilters}
                        onToggle={toggleFilter}
                        onApply={closeSidebar}
                        onReset={clearFilters}
                        isOpen={sidebarOpen}
                        onClose={closeSidebar}
                    />

                    <section className="ck-recipes" aria-label="Рецепты">
                        {isRecommendations && (
                            <div className="ck-toolbar">
                                <div className="ck-toolbar__search">
                                    <Search size={18} className="ck-toolbar__search-icon" aria-hidden="true" />
                                    <input
                                        type="search"
                                        value={recipeSearch}
                                        onChange={(e) => setRecipeSearch(e.target.value)}
                                        placeholder="Поиск рецептов"
                                        className="ck-toolbar__search-input"
                                        aria-label="Поиск рецептов"
                                        autoComplete="off"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="ck-upload-btn"
                                    aria-label="Загрузить рецепт"
                                    onClick={() => navigate('/recipe/new')}
                                >
                                    Загрузить рецепт
                                    <ArrowRight size={16} aria-hidden="true" />
                                </button>
                            </div>
                        )}

                        <div className="ck-title-row">
                            <h1 className="ck-heading">
                                {activeTab === 'favorites' ? 'Избранное'
                                    : activeTab === 'cooked' ? 'Уже приготовили?'
                                        : 'Что приготовим сегодня?'}
                            </h1>
                            <div className="ck-controls">
                                <button
                                    type="button"
                                    className="ck-pill ck-pill--mobile-filter"
                                    onClick={openSidebar}
                                    aria-label="Открыть фильтры"
                                >
                                    <SlidersHorizontal size={16} aria-hidden="true" />
                                    Фильтры
                                    {activeFiltersList.length > 0 && (
                                        <span className="ck-pill__badge">{activeFiltersList.length}</span>
                                    )}
                                </button>
                                {!isRecommendations && (
                                    <div className="ck-toolbar__search ck-toolbar__search--inline">
                                        <Search size={16} className="ck-toolbar__search-icon" aria-hidden="true" />
                                        <input
                                            type="search"
                                            value={recipeSearch}
                                            onChange={(e) => setRecipeSearch(e.target.value)}
                                            placeholder="Поиск рецептов"
                                            className="ck-toolbar__search-input"
                                            aria-label="Поиск рецептов"
                                            autoComplete="off"
                                        />
                                    </div>
                                )}
                                <div className="ck-sort">
                                    <button
                                        type="button"
                                        className={`ck-pill ${sortBy !== 'popular' ? 'ck-pill--active' : ''}`}
                                        onClick={() => setSortOpen((v) => !v)}
                                        aria-haspopup="listbox"
                                        aria-expanded={sortOpen}
                                    >
                                        Сортировка
                                        <ArrowUpDown size={14} aria-hidden="true" />
                                    </button>
                                    {sortOpen && (
                                        <>
                                            <div
                                                className="ck-sort__backdrop"
                                                onClick={() => setSortOpen(false)}
                                                aria-hidden="true"
                                            />
                                            <div
                                                className="ck-sort__menu"
                                                role="radiogroup"
                                                aria-label="Показать сначала"
                                            >
                                                <p className="ck-sort__title">Показать сначала</p>
                                                {SORT_OPTIONS.map((opt) => {
                                                    const active = sortBy === opt.id
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            className={`ck-sort__opt ${active ? 'ck-sort__opt--active' : ''}`}
                                                            role="radio"
                                                            aria-checked={active}
                                                            onClick={() => { setSortBy(opt.id); setSortOpen(false) }}
                                                        >
                                                            <span
                                                                className={`ck-sort__radio ${active ? 'ck-sort__radio--on' : ''}`}
                                                                aria-hidden="true"
                                                            />
                                                            {opt.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {isRecommendations && (
                                    <button
                                        type="button"
                                        className={`ck-pill ck-pill--desktop ${chosenIngredients.length > 0 ? 'ck-pill--active' : ''}`}
                                        onClick={() => setIngredientsOpen(true)}
                                        aria-label="Фильтр по ингредиентам"
                                    >
                                        Ингредиенты
                                        <SlidersHorizontal size={14} aria-hidden="true" />
                                        {chosenIngredients.length > 0 && (
                                            <span className="ck-pill__badge">{chosenIngredients.length}</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {(activeFiltersList.length > 0 || chosenIngredients.length > 0 || exclusions.length > 0) && (
                            <div className="ck-chips" aria-live="polite">
                                {chosenIngredients.map((ing) => (
                                    <span key={`ing-${ing}`} className="ck-chip ck-chip--accent">
                                        + {ing}
                                        <button
                                            type="button"
                                            className="ck-chip__x"
                                            onClick={() => setChosenIngredients((p) => p.filter((x) => x !== ing))}
                                            aria-label={`Убрать ингредиент ${ing}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                {exclusions.map((ex) => (
                                    <span key={`ex-${ex}`} className="ck-chip ck-chip--muted" title="Исключение из профиля">
                                        − {ex}
                                    </span>
                                ))}
                                {activeFiltersList.map((f) => (
                                    <span key={`${f.groupId}-${f.optionId}`} className="ck-chip">
                                        {f.label}
                                        <button
                                            type="button"
                                            className="ck-chip__x"
                                            onClick={() => toggleFilter(f.groupId, f.optionId)}
                                            aria-label={`Убрать фильтр ${f.label}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                {(activeFiltersList.length > 0 || chosenIngredients.length > 0) && (
                                    <button
                                        type="button"
                                        className="ck-clear-filters"
                                        onClick={() => { clearFilters(); setChosenIngredients([]) }}
                                    >
                                        Сбросить фильтры
                                    </button>
                                )}
                            </div>
                        )}

                        {showAuthGate ? (
                            <div className="ck-grid__empty" role="status">
                                <span className="ck-grid__empty-icon" aria-hidden="true">🔒</span>
                                <h3 className="ck-grid__empty-title">Войдите, чтобы продолжить</h3>
                                <p className="ck-grid__empty-text">
                                    «Избранное» и «Приготовлено» работают для зарегистрированных
                                    пользователей. Войдите или зарегистрируйтесь, чтобы сохранять
                                    рецепты и оценки.
                                </p>
                            </div>
                        ) : isCookedTab ? (
                            <CookedList
                                recipes={visibleRecipes}
                                cooked={cooked}
                                favorites={favorites}
                                getRating={getRating}
                                onToggleFavorite={handleToggleFavorite}
                                onSubmitRating={handleSubmitRating}
                                onRequestRemove={setPendingUncook}
                            />
                        ) : (
                            <div className="ck-grid" role="list" aria-label="Список рецептов">
                                {visibleRecipes.length === 0 ? (
                                    <div className="ck-grid__empty" role="status">
                                        <span className="ck-grid__empty-icon" aria-hidden="true">🔍</span>
                                        <h3 className="ck-grid__empty-title">Ничего не найдено</h3>
                                        <p className="ck-grid__empty-text">
                                            {activeTab === 'favorites'
                                                ? 'Добавляйте рецепты в избранное — они появятся здесь.'
                                                : 'Рецептов с такими условиями нет или возможно была допущена ошибка при формировании списка фильтров.'}
                                        </p>
                                    </div>
                                ) : visibleRecipes.map((recipe) => (
                                    <div key={recipe.id} role="listitem">
                                        <RecipeCard
                                            recipe={recipe}
                                            isFavorite={favorites.has(recipe.id)}
                                            isCooked={isInCooked(recipe.id)}
                                            rating={getRating(recipe.id)}
                                            onToggleFavorite={handleToggleFavorite}
                                            onMarkCooked={handleMarkCooked}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {showScrollTop && (
                <button
                    type="button"
                    className="ck-scroll-top"
                    onClick={scrollToTop}
                    aria-label="Наверх"
                >
                    <ArrowUp size={20} aria-hidden="true" />
                </button>
            )}

            {pendingUnfav && (
                <ConfirmModal
                    title="Удалить из избранного"
                    description="Хотите удалить рецепт из избранного? Отменить это действие будет невозможно."
                    cancelLabel="Отмена"
                    confirmLabel="Удалить"
                    onCancel={() => setPendingUnfav(null)}
                    onConfirm={confirmUnfavorite}
                />
            )}

            {pendingUncook && (
                <ConfirmModal
                    title="Удалить рецепт"
                    description="Хотите удалить рецепт из списка приготовленных? Отменить это действие будет невозможно."
                    cancelLabel="Отмена"
                    confirmLabel="Удалить"
                    onCancel={() => setPendingUncook(null)}
                    onConfirm={confirmUncook}
                />
            )}

            {ingredientsOpen && (
                <IngredientsModal
                    available={ALL_INGREDIENTS}
                    initial={chosenIngredients}
                    onClose={() => setIngredientsOpen(false)}
                    onSave={(next) => setChosenIngredients(next)}
                />
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════
   CookedList — отдельный компонент: таблица из строк CookedRow
   ═══════════════════════════════════════════ */
interface CookedListProps {
    recipes: Recipe[]
    cooked: Record<string, number | null>
    favorites: Set<string>
    getRating: (id: string) => { average: number; count: number }
    onToggleFavorite: (id: string) => void
    onSubmitRating: (id: string, prev: number | null, next: number) => void
    onRequestRemove: (id: string) => void
}

function CookedList({
    recipes, cooked, favorites, getRating,
    onToggleFavorite, onSubmitRating, onRequestRemove,
}: CookedListProps) {
    if (recipes.length === 0) {
        return (
            <div className="ck-grid__empty" role="status">
                <span className="ck-grid__empty-icon" aria-hidden="true">🍳</span>
                <h3 className="ck-grid__empty-title">Здесь пока пусто</h3>
                <p className="ck-grid__empty-text">
                    На странице рецепта нажмите «Приготовлено» — блюдо появится в этом списке,
                    и вы сможете поставить ему оценку.
                </p>
            </div>
        )
    }

    return (
        <div className="ck-cooked-list" role="list" aria-label="Список приготовленных рецептов">
            {recipes.map((recipe) => (
                <div key={recipe.id} role="listitem">
                    <CookedRow
                        recipe={recipe}
                        isFavorite={favorites.has(recipe.id)}
                        userRating={cooked[recipe.id] ?? null}
                        aggregateRating={getRating(recipe.id)}
                        onToggleFavorite={onToggleFavorite}
                        onSubmitRating={onSubmitRating}
                        onRequestRemove={onRequestRemove}
                    />
                </div>
            ))}
        </div>
    )
}
