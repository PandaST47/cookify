/* ═══════════════════════════════════════════════════════════
   Общие типы проекта Cookify.
   Всё в одном файле — в проекте такого размера нет смысла
   дробить на auth.ts / recipes.ts / etc.

   Если у тебя остался legacy-файл types/auth.ts — его можно
   удалить: все типы теперь лежат здесь.
   ═══════════════════════════════════════════════════════════ */

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
    rating: number
    tags: string[]
    ingredients: Ingredient[]
    cookTime: number
    hasAllIngredients?: boolean
    isSimilarToCooked?: boolean
}

export interface Ingredient {
    name: string
    amount: string
    unit: string
}

export interface FilterGroup {
    id: string
    title: string
    options: FilterOption[]
    isOpen: boolean
}

export interface FilterOption {
    id: string
    label: string
    checked: boolean
}

export type TabId = 'recommendations' | 'favorites' | 'cooked' | 'myProducts'

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