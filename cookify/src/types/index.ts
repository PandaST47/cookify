/* ═══════════════════════════════════════════════════════════
   Общие типы проекта Cookify.
   Всё в одном файле — в проекте такого размера нет смысла
   дробить на auth.ts / recipes.ts / etc.
   ═══════════════════════════════════════════════════════════ */

/* ── Filters ── */
export type FilterGroupId =
    | 'mealType'
    | 'occasions'
    | 'health'
    | 'cuisine'
    | 'taste'

/** ID-набор тегов рецепта по группам — используется фильтрацией. */
export type RecipeFilters = Record<FilterGroupId, string[]>

/* ── Recipes ── */
export interface Recipe {
    id: string
    title: string
    description: string
    image: string
    calories: number
    protein: number
    fat: number
    carbs: number
    /** Стартовый средний рейтинг (seed). Рантайм-средний — в `useRatings`. */
    rating: number
    /** Стартовое кол-во оценок (seed). */
    ratingCount: number
    cookTime: number
    /** Видимые на карточке теги (RU, ВЕРХНИМ регистром). */
    displayTags: string[]
    /** Машиночитаемые ID-теги по группам — drives `applyFilters`. */
    filters: RecipeFilters
    ingredients: Ingredient[]
}

export interface Ingredient {
    name: string
    amount?: string
    unit?: string
}

export interface FilterGroup {
    id: FilterGroupId
    title: string
    options: FilterOption[]
    isOpen: boolean
}

export interface FilterOption {
    id: string
    label: string
    checked: boolean
}

export type TabId = 'recommendations' | 'favorites' | 'cooked'

export interface Tab {
    id: TabId
    label: string
}

/* ── Auth ── */
export interface User {
    id: string
    email: string
    username: string
    avatar?: string
    createdAt: string
}

export interface AuthSession {
    userId: string
    issuedAt: number
}

export type AuthErrorField =
    | 'email'
    | 'password'
    | 'confirmPassword'
    | 'code'
    | 'username'
    | 'general'
