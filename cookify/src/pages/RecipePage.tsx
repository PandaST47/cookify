import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Star, Minus, Plus, ArrowRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useFavorites } from '@/components/hooks/useFavorites'
import { useCooked } from '@/components/hooks/useCooked'
import { useRatings } from '@/components/hooks/useRatings'
import { useAuth } from '@/components/contexts/AuthContext'
import { recipes, filterGroups } from '@/data/recipes'
import { getRecipeSteps } from '@/data/recipeSteps'
import type { FilterGroupId } from '@/types'
import '@/styles/recipe.css'

/** Базовое кол-во порций, на которое рассчитаны количества в данных. */
const BASE_SERVINGS = 2

/** Русский плюрал «оценка/оценки/оценок» (Figma: «121 оценка»). */
function ratingWord(n: number): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return 'оценка'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'оценки'
    return 'оценок'
}

/** Масштабирует количество ингредиента под выбранные порции. */
function scaleAmount(amount: string | undefined, factor: number): string {
    if (!amount) return ''
    const num = parseFloat(amount.replace(',', '.'))
    if (!Number.isFinite(num)) return amount // «по вкусу», «по желанию» и т.п.
    const scaled = num * factor
    // округляем до 2 знаков, без хвостовых нулей
    return String(Math.round(scaled * 100) / 100)
}

/** label опции фильтра по id группы (для «Время приёма/Вкус/...»). */
function labelsFor(groupId: FilterGroupId, ids: string[]): string {
    const g = filterGroups.find((x) => x.id === groupId)
    if (!g) return '—'
    const got = ids
        .map((id) => g.options.find((o) => o.id === id)?.label)
        .filter(Boolean)
    return got.length ? got.join(', ') : '—'
}

export default function RecipePage() {
    const { id = '' } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { favorites, add: addFav, remove: removeFav } = useFavorites()
    const { has: isCooked } = useCooked(user?.id)
    const { getRating } = useRatings()

    const recipe = useMemo(() => recipes.find((r) => r.id === id), [id])
    const [servings, setServings] = useState(BASE_SERVINGS)

    useEffect(() => {
        const prev = document.title
        document.title = recipe
            ? `${recipe.title} — Cookify`
            : 'Рецепт не найден — Cookify'
        window.scrollTo(0, 0)
        return () => { document.title = prev }
    }, [recipe])

    const onToggleFav = useCallback(() => {
        if (!recipe) return
        if (favorites.has(recipe.id)) removeFav(recipe.id)
        else addFav(recipe.id)
    }, [recipe, favorites, addFav, removeFav])

    if (!recipe) {
        return (
            <>
                <Header />
                <main className="rp" role="main">
                    <div className="rp__container rp__notfound">
                        <h1>Рецепт не найден</h1>
                        <Link to="/" className="rp__cta">На главную</Link>
                    </div>
                </main>
            </>
        )
    }

    const factor = servings / BASE_SERVINGS
    const rating = getRating(recipe.id)
    const cooked = isCooked(recipe.id)
    const isFav = favorites.has(recipe.id)
    const steps = getRecipeSteps(recipe)
    const hours = Math.floor(recipe.cookTime / 60)
    const mins = recipe.cookTime % 60
    const hasSteps = steps.length > 0

    return (
        <>
            <Header />
            <main className="rp" role="main">
                <div className="rp__container">
                    <button
                        type="button"
                        className="rp__back"
                        onClick={() => navigate(-1)}
                        aria-label="Назад"
                    >
                        <ArrowLeft size={18} aria-hidden="true" />
                        <span>Назад</span>
                    </button>

                    <div className="rp__hero">
                        <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="rp__hero-img"
                            loading="eager"
                            decoding="async"
                            width={1040}
                            height={400}
                        />
                    </div>

                    <div className="rp__head">
                        <div className="rp__head-left">
                            <h1 className="rp__title">{recipe.title}</h1>
                            <div className="rp__rating">
                                <Star size={18} className="rp__rating-star" aria-hidden="true" />
                                <span className="rp__rating-val">
                                    {rating.average.toFixed(2)}
                                </span>
                                <span className="rp__rating-count">
                                    {rating.count} {ratingWord(rating.count)}
                                </span>
                            </div>
                        </div>
                        <div className="rp__head-right">
                            <span
                                className={`rp__status ${cooked ? 'rp__status--cooked' : 'rp__status--new'}`}
                            >
                                {cooked ? 'Уже готовили' : 'Новое'}
                            </span>
                            <button
                                type="button"
                                className="rp__fav"
                                onClick={onToggleFav}
                                aria-pressed={isFav}
                                aria-label={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                            >
                                <Heart
                                    size={22}
                                    className={`rp__fav-icon ${isFav ? 'rp__fav-icon--on' : ''}`}
                                    aria-hidden="true"
                                />
                            </button>
                        </div>
                    </div>

                    <p className="rp__desc">{recipe.description}</p>

                    <div className="rp__meta">
                        <section className="rp__nutri" aria-label="Пищевая ценность">
                            <h2 className="rp__meta-title">Пищевая ценность на 100 г</h2>
                            <div className="rp__nutri-row">
                                {[
                                    { v: recipe.calories, l: 'Калорийность, ккал' },
                                    { v: recipe.protein, l: 'Белки, г' },
                                    { v: recipe.fat, l: 'Жиры, г' },
                                    { v: recipe.carbs, l: 'Углеводы, г' },
                                ].map((s) => (
                                    <div key={s.l} className="rp__nutri-cell">
                                        <span className="rp__nutri-val">{s.v}</span>
                                        <span className="rp__nutri-lbl">{s.l}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="rp__time" aria-label="Время готовки">
                            <h2 className="rp__meta-title">Время готовки</h2>
                            <div className="rp__time-val">
                                <strong>{hours}</strong>
                                <span aria-hidden="true">:</span>
                                <strong>{String(mins).padStart(2, '0')}</strong>
                            </div>
                            <span className="rp__time-lbl">Общее время</span>
                        </section>
                    </div>

                    <div className="rp__tags">
                        <div className="rp__tag-col">
                            <span className="rp__meta-title">Время приёма</span>
                            <span className="rp__tag-val">
                                {labelsFor('mealType', recipe.filters.mealType)}
                            </span>
                        </div>
                        <div className="rp__tag-col">
                            <span className="rp__meta-title">Тип питания</span>
                            <span className="rp__tag-val">
                                {labelsFor('health', recipe.filters.health)}
                            </span>
                        </div>
                        <div className="rp__tag-col">
                            <span className="rp__meta-title">Вкус блюда</span>
                            <span className="rp__tag-val">
                                {labelsFor('taste', recipe.filters.taste)}
                            </span>
                        </div>
                    </div>

                    <section className="rp__ing" aria-label="Ингредиенты">
                        <h2 className="rp__h2">Ингредиенты</h2>
                        <div className="rp__servings">
                            <span className="rp__meta-title">Количество порций</span>
                            <div className="rp__stepper">
                                <button
                                    type="button"
                                    className="rp__step-btn"
                                    onClick={() => setServings((s) => Math.max(1, s - 1))}
                                    aria-label="Меньше порций"
                                    disabled={servings <= 1}
                                >
                                    <Minus size={16} aria-hidden="true" />
                                </button>
                                <span className="rp__step-val" aria-live="polite">
                                    {servings}
                                </span>
                                <button
                                    type="button"
                                    className="rp__step-btn"
                                    onClick={() => setServings((s) => Math.min(20, s + 1))}
                                    aria-label="Больше порций"
                                    disabled={servings >= 20}
                                >
                                    <Plus size={16} aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <ul className="rp__ing-list" role="list">
                            {recipe.ingredients.map((ing) => {
                                const amt = scaleAmount(ing.amount, factor)
                                const right = amt
                                    ? `${amt}${ing.unit ? ' ' + ing.unit : ''}`
                                    : (ing.unit || '')
                                const soft = !ing.amount ||
                                    !Number.isFinite(parseFloat((ing.amount || '').replace(',', '.')))
                                return (
                                    <li key={ing.name} className="rp__ing-row">
                                        <span className="rp__ing-name">{ing.name}</span>
                                        <span className="rp__ing-dots" aria-hidden="true" />
                                        <span className={`rp__ing-amt ${soft ? 'rp__ing-amt--soft' : ''}`}>
                                            {right || 'по вкусу'}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>

                    <div className="rp__cta-wrap">
                        <button
                            type="button"
                            className="rp__cta"
                            disabled={!hasSteps}
                            onClick={() => navigate(`/recipe/${recipe.id}/cook`)}
                        >
                            Перейти в режим готовки
                            <ArrowRight size={18} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </main>
        </>
    )
}
