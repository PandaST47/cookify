import { memo, useState, useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { FilterGroup } from '../types'
import '../styles/FilterSidebar.css'

interface FilterSidebarProps {
  groups: FilterGroup[]
  onFilterChange: (groupId: string, optionId: string) => void
  onApply: () => void
  onReset: () => void
  isOpen: boolean
  onClose: () => void
}

const FilterSidebar = memo(function FilterSidebar({
  groups,
  onFilterChange,
  onApply,
  onReset,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsed(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }, [])

  return (
    <>
      {isOpen && (
        <div
          className="filter-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`filter-sidebar ${isOpen ? 'filter-sidebar--open' : ''}`}
        role="complementary"
        aria-label="Фильтры рецептов"
      >
        <div className="filter-sidebar__content">
          <div className="filter-sidebar__mobile-header">
            <h2 className="filter-sidebar__title">Фильтры</h2>
            <button
              onClick={onClose}
              className="filter-sidebar__close"
              aria-label="Закрыть фильтры"
            >
              &times;
            </button>
          </div>

          <h2 className="filter-sidebar__desktop-title">Фильтры</h2>

          <div className="filter-groups">
            {groups.map((group) => {
              const isCollapsed = collapsed[group.id] ?? false
              const hasShowMore = group.id === 'occasions'

              return (
                <div key={group.id} role="group" aria-labelledby={`filter-group-${group.id}`}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="filter-group__toggle"
                    aria-expanded={!isCollapsed}
                    id={`filter-group-${group.id}`}
                  >
                    <span className="filter-group__toggle-label">
                      {group.title}
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="filter-group__toggle-icon" aria-hidden="true" />
                    ) : (
                      <ChevronUp className="filter-group__toggle-icon" aria-hidden="true" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="filter-options">
                      {group.options.map((option) => (
                        <label
                          key={option.id}
                          className="filter-option"
                          onClick={() => onFilterChange(group.id, option.id)}
                          role="checkbox"
                          aria-checked={option.checked}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault()
                              onFilterChange(group.id, option.id)
                            }
                          }}
                        >
                          <div
                            className={`filter-option__checkbox ${
                              option.checked ? 'filter-option__checkbox--checked' : ''
                            }`}
                          >
                            {option.checked && (
                              <svg className="filter-option__checkbox-icon" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className="filter-option__label">
                            {option.label}
                          </span>
                        </label>
                      ))}
                      {hasShowMore && (
                        <button className="filter-group__show-more">
                          Показать ещё
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="filter-sidebar__actions">
            <button onClick={onApply} className="filter-sidebar__btn filter-sidebar__btn--primary">
              Применить
            </button>
            <button onClick={onReset} className="filter-sidebar__btn filter-sidebar__btn--secondary">
              Сбросить
            </button>
          </div>
        </div>
      </aside>
    </>
  )
})

export default FilterSidebar
