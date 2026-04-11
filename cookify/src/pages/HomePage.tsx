import { useState, useCallback, useMemo, useEffect } from 'react'
import { ArrowUpDown, SlidersHorizontal, ArrowRight, Filter, ChevronUp } from 'lucide-react'
import Header from '../components/Header'
import TabNav from '../components/TabNav'
import FilterSidebar from '../components/FilterSidebar'
import SearchBar from '../components/SearchBar'
import RecipeGrid from '../components/RecipeGrid'
import { tabs, filterGroups as initialFilters, recipes } from '../data/recipes'
import type { TabId, FilterGroup } from '../types'
import '../styles/HomePage.css'

type SortMode = 'rating' | 'calories' | 'time'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('recommendations')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterGroup[]>(initialFilters)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('rating')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleFilterChange = useCallback((groupId: string, optionId: string) => {
    setFilters(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
            ...group,
            options: group.options.map(opt =>
              opt.id === optionId ? { ...opt, checked: !opt.checked } : opt
            ),
          }
          : group
      )
    )
  }, [])

  const handleReset = useCallback(() => {
    setFilters(prev =>
      prev.map(group => ({
        ...group,
        options: group.options.map(opt => ({ ...opt, checked: false })),
      }))
    )
  }, [])

  const activeFilters = useMemo(() => {
    return filters.flatMap(g => g.options.filter(o => o.checked))
  }, [filters])

  const filteredRecipes = useMemo(() => {
    let result = [...recipes]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        r =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.ingredients.some(i => i.name.toLowerCase().includes(q))
      )
    }

    if (activeFilters.length > 0) {
      const filterLabels = activeFilters.map(f => f.label.toUpperCase())
      result = result.filter(r =>
        filterLabels.some(fl =>
          r.tags.some(t => t.includes(fl) || fl.includes(t))
        )
      )
    }

    switch (sortMode) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'calories':
        result.sort((a, b) => a.calories - b.calories)
        break
      case 'time':
        result.sort((a, b) => a.cookTime - b.cookTime)
        break
    }

    return result
  }, [searchQuery, activeFilters, sortMode])

  const sortLabels: Record<SortMode, string> = {
    rating: 'По рейтингу',
    calories: 'По калориям',
    time: 'По времени',
  }

  return (
    <div className="page">
      <Header />
      <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="page__main">
        {/* Search + Upload */}
        <div className="page__toolbar">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <button className="page__upload-btn">
            Загрузить рецепт
            <ArrowRight className="pill-btn__icon" aria-hidden="true" />
          </button>
        </div>

        {/* Sidebar + Recipes */}
        <div className="page__content">
          {/* Desktop sidebar */}
          <div className="page__sidebar-desktop">
            <FilterSidebar
              groups={filters}
              onFilterChange={handleFilterChange}
              onApply={() => { }}
              onReset={handleReset}
              isOpen={true}
              onClose={() => { }}
            />
          </div>

          {/* Mobile sidebar 
          <FilterSidebar
            groups={filters}
            onFilterChange={handleFilterChange}
            onApply={() => setMobileFiltersOpen(false)}
            onReset={handleReset}
            isOpen={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
          />

          */}

          {/* Recipe area */}
          <div className="page__recipes">
            {/* Title + controls */}
            <div className="page__title-row">
              <h1 className="page__heading">Что приготовим сегодня?</h1>

              <div className="page__controls">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="pill-btn pill-btn--mobile-filter"
                  aria-label="Открыть фильтры"
                >
                  <Filter className="pill-btn__icon" aria-hidden="true" />
                  Фильтры
                  {activeFilters.length > 0 && (
                    <span className="pill-btn__badge" aria-label={`${activeFilters.length} активных`}>
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <div className="sort-dropdown">
                  <button
                    onClick={() => setSortMenuOpen(!sortMenuOpen)}
                    className="pill-btn"
                    aria-expanded={sortMenuOpen}
                    aria-haspopup="listbox"
                  >
                    Сортировка
                    <ArrowUpDown className="pill-btn__icon" aria-hidden="true" />
                  </button>
                  {sortMenuOpen && (
                    <>
                      <div className="sort-dropdown__backdrop" onClick={() => setSortMenuOpen(false)} />
                      <div className="sort-dropdown__menu" role="listbox" aria-label="Варианты сортировки">
                        {(Object.entries(sortLabels) as [SortMode, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => { setSortMode(key); setSortMenuOpen(false) }}
                            className={`sort-dropdown__option ${sortMode === key ? 'sort-dropdown__option--active' : ''
                              }`}
                            role="option"
                            aria-selected={sortMode === key}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Ingredients (desktop) */}
                <button className="pill-btn pill-btn--desktop">
                  Ингредиенты
                  <SlidersHorizontal className="pill-btn__icon" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="page__active-filters" role="status" aria-label="Активные фильтры">
                {activeFilters.map(f => (
                  <span key={f.id} className="filter-chip">
                    {f.label}
                    <button
                      onClick={() => {
                        const group = filters.find(g => g.options.some(o => o.id === f.id))
                        if (group) handleFilterChange(group.id, f.id)
                      }}
                      className="filter-chip__remove"
                      aria-label={`Убрать фильтр ${f.label}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={handleReset}
                  className="page__clear-filters"
                >
                  Сбросить все
                </button>
              </div>
            )}

            <RecipeGrid recipes={filteredRecipes} />
          </div>
        </div>
      </main>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="scroll-top-btn"
          aria-label="Наверх"
        >
          <ChevronUp className="scroll-top-btn__icon" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
