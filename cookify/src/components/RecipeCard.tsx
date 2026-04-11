import { memo, useState } from 'react'
import { Heart, Star } from 'lucide-react'
import type { Recipe } from '../types'
import IngredientsDropdown from './IngredientsDropdown'
import '../styles/RecipeCard.css'

interface RecipeCardProps {
  recipe: Recipe
}

const RecipeCard = memo(function RecipeCard({ recipe }: RecipeCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <article className="recipe-card" aria-label={recipe.title}>
      <div className="recipe-card__image-wrap">
        {!imgError ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="recipe-card__image"
          />
        ) : (
          <div className="recipe-card__image-fallback">
            <span role="img" aria-label="Нет изображения">🍽️</span>
          </div>
        )}

        <div className="recipe-card__top-bar">
          <div className="recipe-card__badges">
            <IngredientsDropdown ingredients={recipe.ingredients} />
            <span className="recipe-card__kbzhu">
              КБЖУ {recipe.calories}/{recipe.protein}/{recipe.fat}/{recipe.carbs}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsFavorite(!isFavorite)
            }}
            className="recipe-card__fav"
            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            aria-pressed={isFavorite}
          >
            <Heart
              className={`recipe-card__fav-icon ${isFavorite ? 'recipe-card__fav-icon--active' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="recipe-card__tags-bar">
          <div className="recipe-card__tags-list">
            {recipe.tags.slice(0, 6).map((tag) => (
              <span key={tag} className="recipe-card__tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="recipe-card__body">
        <h3 className="recipe-card__title">{recipe.title}</h3>
        <p className="recipe-card__description">{recipe.description}</p>

        <div className="recipe-card__footer">
          <div className="recipe-card__rating">
            <Star className="recipe-card__rating-star" aria-hidden="true" />
            <span className="recipe-card__rating-value">
              {recipe.rating.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
})

export default RecipeCard
