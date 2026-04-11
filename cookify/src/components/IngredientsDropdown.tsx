import { memo, useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Ingredient } from '../types'
import '../styles/IngredientsDropdown.css'

interface IngredientsDropdownProps {
  ingredients: Ingredient[]
}

const IngredientsDropdown = memo(function IngredientsDropdown({ ingredients }: IngredientsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="ingredients-dd" ref={dropdownRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
        className={`ingredients-dd__trigger ${isOpen ? 'ingredients-dd__trigger--open' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Ингредиенты: ${ingredients.length} шт.`}
      >
        Ингредиенты
        <ChevronDown
          className={`ingredients-dd__chevron ${isOpen ? 'ingredients-dd__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="ingredients-dd__panel" role="tooltip">
          <div>
            {ingredients.map((ing, i) => (
              <span key={ing.name}>
                {ing.name}
                {i < ingredients.length - 1 && ', '}
              </span>
            ))}
          </div>
          <div className="ingredients-dd__arrow" />
        </div>
      )}
    </div>
  )
})

export default IngredientsDropdown
