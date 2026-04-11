import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react'
import {
  Search, Heart, Star, ChevronDown, ChevronUp, ArrowUp,
  SlidersHorizontal, ArrowUpDown, ArrowRight, Check
} from 'lucide-react'
import Header from './Header'
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

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const TABS = [
  { id: 'recommendations', label: 'Рекомендации' },
  { id: 'favorites', label: 'Избранное' },
  { id: 'cooked', label: 'Приготовлено' },
  { id: 'myProducts', label: 'Мои продукты' },
]

const FILTER_GROUPS: FilterGroupData[] = [
  {
    id: 'mealType',
    title: 'Тип приема пищи',
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
    title: 'Рецепты для особых поводов',
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
    title: 'Здоровое питание',
    options: [
      { id: 'highProtein', label: 'Много белка' },
      { id: 'healthy', label: 'ЗОЖ' },
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
    title: 'Паста Карбонара',
    description: 'Классическая итальянская паста с беконом, яйцом и пармезаном. Нежный сливочный соус без сливок — только яйца и сыр.',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&h=400&fit=crop',
    calories: 420, protein: 18, fat: 22, carbs: 38,
    rating: 4.85,
    tags: ['ИТАЛЬЯНСКАЯ', 'УЖИН', 'ПАСТА', 'КЛАССИКА'],
    ingredients: [
      { name: 'Спагетти' }, { name: 'Бекон' }, { name: 'Пармезан' },
      { name: 'Яйца' }, { name: 'Чеснок' }, { name: 'Перец чёрный' },
    ],
  },
  {
    id: '3',
    title: 'Греческий салат',
    description: 'Свежий и лёгкий салат с оливками, фетой и хрустящими овощами. Идеально для лёгкого обеда или в качестве закуски.',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop',
    calories: 150, protein: 6, fat: 11, carbs: 8,
    rating: 4.72,
    tags: ['ЗОЖ', 'ОБЕД', 'БЫСТРО', 'НИЗКИЕ КАЛОРИИ'],
    ingredients: [
      { name: 'Помидоры' }, { name: 'Огурцы' }, { name: 'Фета' },
      { name: 'Оливки' }, { name: 'Оливковое масло' },
    ],
  },
  {
    id: '4',
    title: 'Хачапури по-аджарски',
    description: 'Сочная лодочка из хрустящего теста с расплавленным сыром, маслом и яйцом. Настоящий вкус Грузии на вашем столе.',
    image: 'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=600&h=400&fit=crop',
    calories: 380, protein: 14, fat: 20, carbs: 35,
    rating: 4.91,
    tags: ['ГРУЗИНСКАЯ', 'ОБЕД', 'УЖИН', 'ПРАЗДНИК'],
    ingredients: [
      { name: 'Мука' }, { name: 'Сулугуни' }, { name: 'Яйца' },
      { name: 'Масло сливочное' }, { name: 'Молоко' },
    ],
  },
  {
    id: '5',
    title: 'Овсянка с ягодами',
    description: 'Полезный завтрак с овсяными хлопьями, свежими ягодами и мёдом. Заряд энергии и витаминов на весь день.',
    image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&h=400&fit=crop',
    calories: 210, protein: 8, fat: 4, carbs: 38,
    rating: 4.55,
    tags: ['ЗАВТРАК', 'ЗОЖ', 'ПП', 'БЫСТРО'],
    ingredients: [
      { name: 'Овсяные хлопья' }, { name: 'Молоко' },
      { name: 'Ягоды' }, { name: 'Мёд' },
    ],
  },
  {
    id: '6',
    title: 'Борщ классический',
    description: 'Насыщенный свекольный суп с говядиной, картофелем и капустой. Подавать со сметаной и свежим чёрным хлебом.',
    image: 'https://images.unsplash.com/photo-1603105037880-880cd4f8395f?w=600&h=400&fit=crop',
    calories: 280, protein: 15, fat: 12, carbs: 28,
    rating: 4.88,
    tags: ['РУССКАЯ', 'ОБЕД', 'ПЕРВЫЕ БЛЮДА', 'МНОГО БЕЛКА'],
    ingredients: [
      { name: 'Говядина' }, { name: 'Свёкла' }, { name: 'Картофель' },
      { name: 'Капуста' }, { name: 'Морковь' }, { name: 'Лук' },
      { name: 'Томатная паста' },
    ],
  },
]

const SORT_OPTIONS = [
  { id: 'popular', label: 'По популярности' },
  { id: 'rating', label: 'По рейтингу' },
  { id: 'calories_asc', label: 'Калории ↑' },
  { id: 'calories_desc', label: 'Калории ↓' },
]

/* ═══════════════════════════════════════════
   IngredientsDropdown
   ═══════════════════════════════════════════ */
const IngredientsDropdown = memo(function IngredientsDropdown({ ingredients }: { ingredients: Ingredient[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="ck-ing" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={`ck-ing__trigger ${open ? 'ck-ing__trigger--open' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Ингредиенты: ${ingredients.length} шт.`}
      >
        Ингредиенты
        <ChevronDown
          size={14}
          className={`ck-ing__chev ${open ? 'ck-ing__chev--open' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="ck-ing__panel" role="tooltip">
          <div>
            {ingredients.map((ing, i) => (
              <span key={ing.name}>
                {ing.name}{i < ingredients.length - 1 && ', '}
              </span>
            ))}
          </div>
          <div className="ck-ing__arrow" />
        </div>
      )}
    </div>
  )
})

/* ═══════════════════════════════════════════
   RecipeCard — gradient overlay body
   ═══════════════════════════════════════════ */
const RecipeCard = memo(function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [fav, setFav] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  return (
    <article className="ck-card" aria-label={recipe.title}>
      <div className="ck-card__img-wrap">
        {!imgErr ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="ck-card__img"
          />
        ) : (
          <div className="ck-card__fallback">
            <span role="img" aria-label="Нет фото">🍽️</span>
          </div>
        )}

        {/* Top overlay: Ingredients LEFT, КБЖУ + heart RIGHT */}
        <div className="ck-card__top">
          <IngredientsDropdown ingredients={recipe.ingredients} />
          <div className="ck-card__top-right">
            <span className="ck-card__kbzhu">
              КБЖУ {recipe.calories}/{recipe.protein}/{recipe.fat}/{recipe.carbs}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setFav(!fav) }}
              className="ck-card__fav"
              aria-label={fav ? 'Убрать из избранного' : 'Добавить в избранное'}
              aria-pressed={fav}
            >
              <Heart
                size={16}
                className={`ck-card__fav-icon ${fav ? 'ck-card__fav-icon--on' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Tags row */}
        <div className="ck-card__tags-bar">
          <div className="ck-card__tags">
            {recipe.tags.slice(0, 6).map((tag) => (
              <span key={tag} className="ck-card__tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* Gradient overlay with title + desc + rating */}
        <div className="ck-card__overlay">
          <h3 className="ck-card__title">{recipe.title}</h3>
          <p className="ck-card__desc">{recipe.description}</p>
          <div className="ck-card__footer">
            <div className="ck-card__rating">
              <Star size={14} className="ck-card__star" aria-hidden="true" />
              <span className="ck-card__rating-val">{recipe.rating.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
})

/* ═══════════════════════════════════════════
   FilterSidebar
   ═══════════════════════════════════════════ */
const FilterSidebar = memo(function FilterSidebar({
  groups, selected, onToggle, onApply, onReset, isOpen, onClose,
}: {
  groups: FilterGroupData[]
  selected: Record<string, string[]>
  onToggle: (gId: string, oId: string) => void
  onApply: () => void
  onReset: () => void
  isOpen: boolean
  onClose: () => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggleGroup = useCallback((id: string) => {
    setCollapsed((p) => ({ ...p, [id]: !p[id] }))
  }, [])

  return (
    <>
      {isOpen && <div className="ck-overlay" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`ck-sidebar ${isOpen ? 'ck-sidebar--open' : ''}`}
        role="complementary"
        aria-label="Фильтры рецептов"
      >
        <div className="ck-sidebar__content">
          {/* Mobile header */}
          <div className="ck-sidebar__mobile-hdr">
            <h2 className="ck-sidebar__title">Фильтры</h2>
            <button onClick={onClose} className="ck-sidebar__close" aria-label="Закрыть фильтры">
              &times;
            </button>
          </div>

          <h2 className="ck-sidebar__desk-title">Фильтры</h2>

          <div className="ck-fgroups">
            {groups.map((g) => {
              const isCol = collapsed[g.id] ?? false
              return (
                <div key={g.id} role="group" aria-labelledby={`fg-${g.id}`}>
                  <button
                    onClick={() => toggleGroup(g.id)}
                    className="ck-fgroup-toggle"
                    aria-expanded={!isCol}
                    id={`fg-${g.id}`}
                  >
                    <span className="ck-fgroup-label">{g.title}</span>
                    {isCol
                      ? <ChevronDown size={16} className="ck-fgroup-icon" aria-hidden="true" />
                      : <ChevronUp size={16} className="ck-fgroup-icon" aria-hidden="true" />
                    }
                  </button>
                  {!isCol && (
                    <div className="ck-foptions">
                      {g.options.map((o) => {
                        const checked = selected[g.id]?.includes(o.id)
                        return (
                          <label
                            key={o.id}
                            className="ck-foption"
                            onClick={() => onToggle(g.id, o.id)}
                            role="checkbox"
                            aria-checked={!!checked}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault()
                                onToggle(g.id, o.id)
                              }
                            }}
                          >
                            <div className={`ck-foption__box ${checked ? 'ck-foption__box--on' : ''}`}>
                              {checked && <Check size={12} color="#fff" aria-hidden="true" />}
                            </div>
                            <span className="ck-foption__label">{o.label}</span>
                          </label>
                        )
                      })}
                      {g.showMore && (
                        <button className="ck-show-more">Показать ещё</button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="ck-sidebar__actions">
            <button onClick={onApply} className="ck-btn ck-btn--primary">Применить</button>
            <button onClick={onReset} className="ck-btn ck-btn--secondary">Сбросить</button>
          </div>
        </div>
      </aside>
    </>
  )
})

/* ═══════════════════════════════════════════
   CookifyApp — Main Page
   ═══════════════════════════════════════════ */
export default function CookifyApp() {
  const [activeTab, setActiveTab] = useState('recommendations')
  const [search, setSearch] = useState('')
  const [recipeSearch, setRecipeSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortBy, setSortBy] = useState('popular')
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
  const [showScrollTop, setShowScrollTop] = useState(false)

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
      return { ...prev, [groupId]: next }
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

  /* Combined search from both inputs */
  const query = search || recipeSearch

  const filteredRecipes = useMemo(() => {
    let result = [...RECIPES]

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      )
    }

    switch (sortBy) {
      case 'rating': result.sort((a, b) => b.rating - a.rating); break
      case 'calories_asc': result.sort((a, b) => a.calories - b.calories); break
      case 'calories_desc': result.sort((a, b) => b.calories - a.calories); break
      default: break
    }

    return result
  }, [query, sortBy])

  const clearFilters = useCallback(() => setSelectedFilters({}), [])

  return (
    <div className="ck-page">
      {/* ── HEADER ── */}
      <Header search={search} onSearchChange={setSearch} />

      {/* ── TABS — centered ── */}
      <nav className="ck-tabs" role="navigation" aria-label="Основная навигация">
        <div className="ck-tabs__inner">
          <div className="ck-tabs__list" role="tablist">
            {TABS.map((tab) => {
              const active = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`ck-tab ${active ? 'ck-tab--active' : ''}`}
                  role="tab"
                  aria-selected={active}
                >
                  {tab.label}
                  {active && <span className="ck-tab__bar" />}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="ck-main">
        {/* Toolbar: recipe search + upload button */}
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
          <button className="ck-upload-btn" aria-label="Загрузить рецепт">
            Загрузить рецепт
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="ck-content">
          {/* ── SIDEBAR (desktop) ── */}
          <div className="ck-sidebar-desktop">
            <FilterSidebar
              groups={FILTER_GROUPS}
              selected={selectedFilters}
              onToggle={toggleFilter}
              onApply={() => {}}
              onReset={clearFilters}
              isOpen={false}
              onClose={() => {}}
            />
          </div>

          {/* ── SIDEBAR (mobile) ── */}
          <FilterSidebar
            groups={FILTER_GROUPS}
            selected={selectedFilters}
            onToggle={toggleFilter}
            onApply={() => setSidebarOpen(false)}
            onReset={clearFilters}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* ── RECIPES ── */}
          <section className="ck-recipes" aria-label="Рецепты">
            <div className="ck-title-row">
              <h1 className="ck-heading">Что приготовим сегодня?</h1>
              <div className="ck-controls">
                {/* Mobile filter toggle */}
                <button
                  className="ck-pill ck-pill--mobile-filter"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Открыть фильтры"
                >
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  Фильтры
                  {activeFiltersList.length > 0 && (
                    <span className="ck-pill__badge">{activeFiltersList.length}</span>
                  )}
                </button>

                {/* Sort dropdown */}
                <div className="ck-sort">
                  <button
                    className="ck-pill"
                    onClick={() => setSortOpen(!sortOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                  >
                    <ArrowUpDown size={16} aria-hidden="true" />
                    Сортировка
                  </button>
                  {sortOpen && (
                    <>
                      <div className="ck-sort__backdrop" onClick={() => setSortOpen(false)} />
                      <div className="ck-sort__menu" role="listbox" aria-label="Сортировка рецептов">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
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

                {/* Ingredients filter pill (desktop) */}
                <button className="ck-pill ck-pill--desktop" aria-label="Фильтр по ингредиентам">
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  Ингредиенты
                </button>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFiltersList.length > 0 && (
              <div className="ck-chips" aria-live="polite">
                {activeFiltersList.map((f) => (
                  <span key={`${f.groupId}-${f.optionId}`} className="ck-chip">
                    {f.label}
                    <button
                      className="ck-chip__x"
                      onClick={() => toggleFilter(f.groupId, f.optionId)}
                      aria-label={`Убрать фильтр ${f.label}`}
                    >×</button>
                  </span>
                ))}
                <button className="ck-clear-filters" onClick={clearFilters}>
                  Сбросить все
                </button>
              </div>
            )}

            {/* Grid */}
            <div className="ck-grid" role="list" aria-label="Список рецептов">
              {filteredRecipes.length === 0 ? (
                <div className="ck-grid__empty" role="status">
                  <span className="ck-grid__empty-icon" aria-hidden="true">🔍</span>
                  <h3 className="ck-grid__empty-title">Ничего не найдено</h3>
                  <p className="ck-grid__empty-text">
                    Попробуйте изменить фильтры или поисковый запрос
                  </p>
                </div>
              ) : (
                filteredRecipes.map((recipe) => (
                  <div key={recipe.id} role="listitem">
                    <RecipeCard recipe={recipe} />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          className="ck-scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Наверх"
        >
          <ArrowUp size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}