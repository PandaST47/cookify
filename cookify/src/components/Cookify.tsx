import {
    useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect, memo,
} from 'react'
import { createPortal } from 'react-dom'
import {
    Search, Heart, Star, ChevronDown, ChevronUp, ArrowUp,
    SlidersHorizontal, ArrowUpDown, ArrowRight, Check,
} from 'lucide-react'
import Header from './layout/Header'
import '@/styles/cookify.css'

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
interface Ingredient {
    name: string
    amount?: string
    unit?: string
}

interface Recipe {
    id: string
    title: string
    description: string
    image: string
    calories: number
    protein: number
    fat: number
    carbs: number
    rating: number
    tags: string[]
    ingredients: Ingredient[]
}

interface FilterOption {
    id: string
    label: string
}

interface FilterGroupData {
    id: string
    title: string
    showMore?: boolean
    options: FilterOption[]
}

type SortId = 'popular' | 'rating' | 'calories_asc' | 'calories_desc'
type TabId = 'recommendations' | 'favorites' | 'cooked'

/* ═══════════════════════════════════════════
   DATA — matches Figma reference
   ═══════════════════════════════════════════ */
const TABS: { id: TabId; label: string }[] = [
    { id: 'recommendations', label: 'Рекомендации' },
    { id: 'favorites', label: 'Избранное' },
    { id: 'cooked', label: 'Приготовлено' },
]

const FILTER_GROUPS: FilterGroupData[] = [
    {
        id: 'mealType',
        title: 'Время приёма',
        options: [
            { id: 'breakfast', label: 'Завтрак' },
            { id: 'lunch', label: 'Обед' },
            { id: 'dinner', label: 'Ужин' },
            { id: 'snack', label: 'Перекус' },
            { id: 'tea', label: 'Полдник' },
        ],
    },
    {
        id: 'occasions',
        title: 'Праздники',
        showMore: true,
        options: [
            { id: 'easter', label: 'Пасха' },
            { id: 'maslenitsa', label: 'Масленица' },
            { id: 'birthday', label: 'День рождения' },
            { id: 'newyear', label: 'Новый год' },
        ],
    },
    {
        id: 'health',
        title: 'Особое питание',
        showMore: true,
        options: [
            { id: 'weightLoss', label: 'Похудение' },
            { id: 'healthy', label: 'ЗОЖ' },
            { id: 'highProtein', label: 'Высокобелковое' },
            { id: 'lowCarb', label: 'Низкоуглеводное' },
            { id: 'vegetarian', label: 'Вегетарианство' },
            { id: 'vegan', label: 'Веганство' },
            { id: 'noSugar', label: 'Без сахара' },
            { id: 'noGluten', label: 'Безглютеновое' },
            { id: 'noLactose', label: 'Безлактозное' },
            { id: 'other', label: 'Другое' },
        ],
    },
    {
        id: 'cuisine',
        title: 'Национальные кухни',
        options: [
            { id: 'italian', label: 'Итальянская' },
            { id: 'georgian', label: 'Грузинская' },
            { id: 'russian', label: 'Русская' },
            { id: 'indian', label: 'Индийская' },
        ],
    },
    {
        id: 'taste',
        title: 'Вкус',
        options: [
            { id: 'sour', label: 'Кислое' },
            { id: 'sweet', label: 'Сладкое' },
            { id: 'spicy', label: 'Острое' },
            { id: 'salty', label: 'Солёное' },
            { id: 'bitter', label: 'Горькое' },
        ],
    },
]

const RECIPES: Recipe[] = [
    {
        id: '1',
        title: 'Сырный крем-суп',
        description: 'Обладает мягкой консистенцией и ярким вкусом. Можно подавать с хрустящими сухариками и зеленью. Возьмите ароматный сыр и нежные сливки для пикантного вкуса.',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop',
        calories: 173, protein: 5, fat: 13, carbs: 10,
        rating: 4.98,
        tags: ['ПП', 'БЕЗ ЛУКА', 'ГЛЮТЕН', 'УЖИН', 'ОБЕД', 'ПЕРВЫЕ БЛЮДА'],
        ingredients: [
            { name: 'Вода' }, { name: 'Картофель' }, { name: 'Куриное филе' },
            { name: 'Сливки 15% жирности' }, { name: 'Сливочный сыр' },
            { name: 'Смесь перцев' }, { name: 'Соль' }, { name: 'Чеснок' },
            { name: 'Травы' }, { name: 'Чесночные гренки' },
        ],
    },
    {
        id: '2',
        title: 'Салат Цезарь с креветками',
        description: 'Для «Цезаря» по классическому рецепту с креветками понадобятся, помимо морепродукта, яйца, сухарики из белого хлеба, листья салата романо, помидоры черри. Для тех, кто следит за фигурой.',
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop',
        calories: 250, protein: 18, fat: 14, carbs: 12,
        rating: 4.4,
        tags: ['ПП', 'АМЕРИКАНСКАЯ КУХНЯ', 'УЖИН', 'ОБЕД'],
        ingredients: [
            { name: 'Креветки' }, { name: 'Салат романо' }, { name: 'Сухарики' },
            { name: 'Помидоры черри' }, { name: 'Пармезан' }, { name: 'Соус Цезарь' },
        ],
    },
    {
        id: '3',
        title: 'Томатный суп с базиликом',
        description: 'Обладает мягкой консистенцией и ярким вкусом. Можно подавать с хрустящими сухариками и зеленью. Возьмите ароматный сыр и нежные сливки для пикантного вкуса.',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
        calories: 180, protein: 4, fat: 9, carbs: 18,
        rating: 4.98,
        tags: ['ПП', 'БЕЗ ЛУКА', 'ГЛЮТЕН', 'УЖИН', 'ОБЕД', 'ПЕРВЫЕ БЛЮДА'],
        ingredients: [
            { name: 'Помидоры' }, { name: 'Базилик' }, { name: 'Сливки' },
            { name: 'Чеснок' }, { name: 'Оливковое масло' }, { name: 'Соль' },
        ],
    },
    {
        id: '4',
        title: 'Шакшука',
        description: 'Обладает мягкой консистенцией и ярким вкусом. Можно подавать с хрустящими сухариками и зеленью. Возьмите ароматный сыр и нежные сливки для пикатного вкуса.',
        image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&h=400&fit=crop',
        calories: 320, protein: 16, fat: 22, carbs: 14,
        rating: 4.98,
        tags: ['ПП', 'БЕЗ ЛУКА', 'ГЛЮТЕН', 'УЖИН', 'ОБЕД', 'ПЕРВЫЕ БЛЮДА'],
        ingredients: [
            { name: 'Яйца' }, { name: 'Помидоры' }, { name: 'Перец болгарский' },
            { name: 'Лук' }, { name: 'Чеснок' }, { name: 'Зелень' },
        ],
    },
    {
        id: '5',
        title: 'Жаркое по-деревенски с горошком',
        description: 'Обладает мягкой консистенцией и ярким вкусом. Можно подавать с хрустящими сухариками и зеленью. Возьмите ароматный сыр и нежные сливки для пикатного вкуса.',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop&sat=-100',
        calories: 410, protein: 22, fat: 18, carbs: 32,
        rating: 4.98,
        tags: ['ПП', 'БЕЗ ЛУКА', 'ГЛЮТЕН', 'УЖИН', 'ОБЕД', 'ПЕРВЫЕ БЛЮДА'],
        ingredients: [
            { name: 'Говядина' }, { name: 'Картофель' }, { name: 'Морковь' },
            { name: 'Зелёный горошек' }, { name: 'Лук' }, { name: 'Специи' },
        ],
    },
    {
        id: '6',
        title: 'Панкейки с карамелизированным бананом',
        description: 'Обладает мягкой консистенцией и ярким вкусом. Можно подавать с хрустящими сухариками и зеленью. Возьмите ароматный сыр и нежные сливки для пикатного вкуса.',
        image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&h=400&fit=crop',
        calories: 390, protein: 8, fat: 12, carbs: 62,
        rating: 4.98,
        tags: ['ПП', 'БЕЗ ЛУКА', 'ГЛЮТЕН', 'УЖИН', 'ОБЕД', 'ПЕРВЫЕ БЛЮДА'],
        ingredients: [
            { name: 'Мука' }, { name: 'Молоко' }, { name: 'Яйца' },
            { name: 'Бананы' }, { name: 'Сахар коричневый' }, { name: 'Масло сливочное' },
        ],
    },
]

const SORT_OPTIONS: { id: SortId; label: string }[] = [
    { id: 'popular', label: 'По популярности' },
    { id: 'rating', label: 'По рейтингу' },
    { id: 'calories_asc', label: 'Калории ↑' },
    { id: 'calories_desc', label: 'Калории ↓' },
]

/* ═══════════════════════════════════════════
   IngredientsDropdown
   Portal-based: панель рендерится в body, поэтому
   не клиппится `overflow: hidden` карточки и не
   зависит от z-index стеков предков.
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
        // не вылезаем за правый край
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
        // закрываем при скролле/ресайзе — позиция стала бы устаревшей
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
                            {ing.name}{i < ingredients.length - 1 && ', '}
                        </span>
                    ))}
                </div>,
                document.body,
            )}
        </>
    )
})

/* ═══════════════════════════════════════════
   RecipeCard — split layout (image top + white body)
   ═══════════════════════════════════════════ */
interface RecipeCardProps {
    recipe: Recipe
    isFavorite: boolean
    onToggleFavorite: (id: string) => void
}

const RecipeCard = memo(function RecipeCard({
    recipe, isFavorite, onToggleFavorite,
}: RecipeCardProps) {
    const [imgErr, setImgErr] = useState(false)

    return (
        <article className="ck-card" aria-labelledby={`recipe-${recipe.id}-title`}>
            <div className="ck-card__media">
                {!imgErr ? (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImgErr(true)}
                        className="ck-card__img"
                    />
                ) : (
                    <div className="ck-card__fallback" aria-hidden="true">🍽️</div>
                )}

                <div className="ck-card__media-top">
                    <IngredientsDropdown ingredients={recipe.ingredients} />
                    <div className="ck-card__media-top-right">
                        <span className="ck-card__kbzhu" aria-label={`Калории ${recipe.calories}, белки ${recipe.protein}, жиры ${recipe.fat}, углеводы ${recipe.carbs}`}>
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
                        {recipe.tags.slice(0, 6).map((tag, i) => (
                            <span key={tag} className="ck-card__tag">
                                {tag}
                                {i < Math.min(recipe.tags.length, 6) - 1 && (
                                    <span className="ck-card__tag-sep" aria-hidden="true">•</span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="ck-card__body">
                <h3 id={`recipe-${recipe.id}-title`} className="ck-card__title">{recipe.title}</h3>
                <p className="ck-card__desc">{recipe.description}</p>
                <div className="ck-card__footer">
                    <div className="ck-card__rating" aria-label={`Рейтинг ${recipe.rating.toFixed(2)} из 5`}>
                        <Star size={14} className="ck-card__star" aria-hidden="true" />
                        <span className="ck-card__rating-val">{recipe.rating.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </article>
    )
})

/* ═══════════════════════════════════════════
   FilterSidebar — single instance, dual mode
   ═══════════════════════════════════════════ */
interface FilterSidebarProps {
    groups: FilterGroupData[]
    selected: Record<string, string[]>
    onToggle: (gId: string, oId: string) => void
    onApply: () => void
    onReset: () => void
    isOpen: boolean
    onClose: () => void
}

const FilterSidebar = memo(function FilterSidebar({
    groups, selected, onToggle, onApply, onReset, isOpen, onClose,
}: FilterSidebarProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

    const toggleGroup = useCallback((id: string) => {
        setCollapsed((p) => ({ ...p, [id]: !p[id] }))
    }, [])

    // блокируем скролл body на мобильном при открытом drawer'e
    useEffect(() => {
        if (!isOpen) return
        const original = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = original }
    }, [isOpen])

    // Esc закрывает мобильный drawer
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
                        {groups.map((g) => {
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
                                            {g.options.map((o) => {
                                                const checked = !!selected[g.id]?.includes(o.id)
                                                return (
                                                    <label
                                                        key={o.id}
                                                        className="ck-foption"
                                                    >
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
                                            {g.showMore && (
                                                <button type="button" className="ck-show-more">
                                                    Показать ещё
                                                </button>
                                            )}
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
   CookifyApp
   ═══════════════════════════════════════════ */
export default function CookifyApp() {
    const [activeTab, setActiveTab] = useState<TabId>('recommendations')
    const [search, setSearch] = useState('')
    const [recipeSearch, setRecipeSearch] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sortOpen, setSortOpen] = useState(false)
    const [sortBy, setSortBy] = useState<SortId>('popular')
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
    const [favorites, setFavorites] = useState<Set<string>>(new Set())
    const [cooked] = useState<Set<string>>(new Set())
    const [showScrollTop, setShowScrollTop] = useState(false)

    // scroll-to-top visibility (passive listener для производительности)
    useEffect(() => {
        const handler = () => setShowScrollTop(window.scrollY > 400)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    const toggleFilter = useCallback((groupId: string, optionId: string) => {
        setSelectedFilters((prev) => {
            const current = prev[groupId] || []
            const next = current.includes(optionId)
                ? current.filter((id) => id !== optionId)
                : [...current, optionId]
            if (next.length === 0) {
                const { [groupId]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [groupId]: next }
        })
    }, [])

    const toggleFavorite = useCallback((id: string) => {
        setFavorites((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const activeFiltersList = useMemo(() => {
        const list: { groupId: string; optionId: string; label: string }[] = []
        for (const [gId, opts] of Object.entries(selectedFilters)) {
            const group = FILTER_GROUPS.find((g) => g.id === gId)
            if (!group) continue
            for (const oId of opts) {
                const opt = group.options.find((o) => o.id === oId)
                if (opt) list.push({ groupId: gId, optionId: oId, label: opt.label })
            }
        }
        return list
    }, [selectedFilters])

    const visibleRecipes = useMemo(() => {
        // фильтруем по табу
        let base = RECIPES
        if (activeTab === 'favorites') base = base.filter((r) => favorites.has(r.id))
        else if (activeTab === 'cooked') base = base.filter((r) => cooked.has(r.id))

        // поиск
        const query = (search || recipeSearch).trim().toLowerCase()
        if (query) {
            base = base.filter((r) =>
                r.title.toLowerCase().includes(query) ||
                r.description.toLowerCase().includes(query) ||
                r.tags.some((t) => t.toLowerCase().includes(query)) ||
                r.ingredients.some((i) => i.name.toLowerCase().includes(query)),
            )
        }

        // сортировка (создаём копию, чтобы не мутировать)
        const result = [...base]
        switch (sortBy) {
            case 'rating': result.sort((a, b) => b.rating - a.rating); break
            case 'calories_asc': result.sort((a, b) => a.calories - b.calories); break
            case 'calories_desc': result.sort((a, b) => b.calories - a.calories); break
        }
        return result
    }, [activeTab, search, recipeSearch, sortBy, favorites, cooked])

    const clearFilters = useCallback(() => setSelectedFilters({}), [])
    const closeSidebar = useCallback(() => setSidebarOpen(false), [])
    const openSidebar = useCallback(() => setSidebarOpen(true), [])
    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    return (
        <div className="ck-page">
            <Header search={search} onSearchChange={setSearch} />

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
                        groups={FILTER_GROUPS}
                        selected={selectedFilters}
                        onToggle={toggleFilter}
                        onApply={closeSidebar}
                        onReset={clearFilters}
                        isOpen={sidebarOpen}
                        onClose={closeSidebar}
                    />

                    <section className="ck-recipes" aria-label="Рецепты">
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
                            >
                                Загрузить рецепт
                                <ArrowRight size={16} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="ck-title-row">
                            <h1 className="ck-heading">Что приготовим сегодня?</h1>
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
                                            <div className="ck-sort__menu" role="listbox">
                                                {SORT_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        className={`ck-sort__opt ${sortBy === opt.id ? 'ck-sort__opt--active' : ''}`}
                                                        role="option"
                                                        aria-selected={sortBy === opt.id}
                                                        onClick={() => { setSortBy(opt.id); setSortOpen(false) }}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="ck-pill ck-pill--desktop"
                                    aria-label="Фильтр по ингредиентам"
                                >
                                    Ингредиенты
                                    <SlidersHorizontal size={14} aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {activeFiltersList.length > 0 && (
                            <div className="ck-chips" aria-live="polite">
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
                                <button
                                    type="button"
                                    className="ck-clear-filters"
                                    onClick={clearFilters}
                                >
                                    Сбросить все
                                </button>
                            </div>
                        )}

                        <div className="ck-grid" role="list" aria-label="Список рецептов">
                            {visibleRecipes.length === 0 ? (
                                <div className="ck-grid__empty" role="status">
                                    <span className="ck-grid__empty-icon" aria-hidden="true">🔍</span>
                                    <h3 className="ck-grid__empty-title">Ничего не найдено</h3>
                                    <p className="ck-grid__empty-text">
                                        {activeTab === 'favorites'
                                            ? 'Добавляйте рецепты в избранное — они появятся здесь'
                                            : activeTab === 'cooked'
                                                ? 'Здесь появятся рецепты, которые вы приготовили'
                                                : 'Попробуйте изменить фильтры или поисковый запрос'}
                                    </p>
                                </div>
                            ) : visibleRecipes.map((recipe) => (
                                <div key={recipe.id} role="listitem">
                                    <RecipeCard
                                        recipe={recipe}
                                        isFavorite={favorites.has(recipe.id)}
                                        onToggleFavorite={toggleFavorite}
                                    />
                                </div>
                            ))}
                        </div>
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
        </div>
    )
}