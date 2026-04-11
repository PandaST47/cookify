import { memo } from 'react'
import type { Recipe } from '../types'
import RecipeCard from './RecipeCard'
import '../styles/RecipeGrid.css'

interface RecipeGridProps {
  recipes: Recipe[]
}

const RecipeGrid = memo(function RecipeGrid({ recipes }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="recipe-grid__empty" role="status">
        <span className="recipe-grid__empty-icon" role="img" aria-hidden="true">🔍</span>
        <h3 className="recipe-grid__empty-title">Ничего не найдено</h3>
        <p className="recipe-grid__empty-text">
          Попробуйте изменить фильтры или поисковый запрос
        </p>
      </div>
    )
  }

  return (
    <div className="recipe-grid" role="list" aria-label="Список рецептов">
      {recipes.map((recipe) => (
        <div key={recipe.id} role="listitem">
          <RecipeCard recipe={recipe} />
        </div>
      ))}
    </div>
  )
})

export default RecipeGrid
