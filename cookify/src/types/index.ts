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
    /**
     * Пошаговая инструкция (для Полной карточки + Режима готовки).
     * Если пусто/нет — «Режим готовки» недоступен (кнопка disabled).
     */
    steps?: RecipeStep[]
}

export interface Ingredient {
    name: string
    amount?: string
    unit?: string
}

/** Один этап приготовления (Figma «Component 12» / «Шаг N из M»). */
export interface RecipeStep {
    /** Что делать на этапе (обязательно). */
    text: string
    /** Таймер этапа в секундах (обязательно по ТЗ; 0 = без таймера). */
    timerSeconds: number
    /** Пояснение сложных терминов (необязательно). */
    tip?: string
    /** Предупреждение о типичных ошибках (необязательно). */
    warning?: string
    /** Фото этапа (необязательно; иначе fallback). */
    image?: string
}

/* ── Черновики рецептов (форма «Загрузить рецепт») ── */
export interface RecipeDraft {
    id: string
    title: string
    description: string
    image?: string
    cookTime: string // формат «чч:мм» как в ТЗ
    calories: string
    protein: string
    fat: string
    carbs: string
    ingredients: Ingredient[]
    tags: string[]
    steps: RecipeStep[]
    /** Статус «уже готовили / новое» — по ТЗ автор указывает. */
    cookedStatus: 'new' | 'cooked'
    updatedAt: string
}

export interface FilterGroup {
    id: FilterGroupId
    title: string
    options: FilterOption[]
    isOpen: boolean
    /**
     * Если задано — показываем первые N опций, остальные прячем
     * под кнопку «Показать ещё» (как в Figma «Праздники»).
     */
    showMoreAfter?: number
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
