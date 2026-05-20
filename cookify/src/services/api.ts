/* ═══════════════════════════════════════════════════════════════════════
   Cookify — API CONTRACT LAYER  (frontend ↔ backend seam)

   ┌─────────────────────────────────────────────────────────────────────┐
   │  ДЛЯ БЭКЕНД-РАЗРАБОТЧИКА                                              │
   │                                                                      │
   │  Это единственная точка, через которую фронтенд ходит за данными.    │
   │  Сейчас каждая функция — ЗАГЛУШКА на localStorage с искусственной    │
   │  задержкой (имитация сети). Твоя задача — заменить тело каждой        │
   │  функции на реальный `fetch(...)` к указанному в JSDoc эндпоинту,    │
   │  НЕ меняя сигнатуру (тип аргументов и возвращаемого значения).        │
   │  Если контракт сохранён — фронтенд трогать не нужно вообще.          │
   │                                                                      │
   │  Соглашения:                                                         │
   │   • База: переменная окружения `VITE_API_BASE_URL` (по умолч. /api). │
   │   • Авторизация: Bearer-токен в заголовке Authorization.             │
   │     Сейчас сессия — это `cookify:session` в localStorage; в проде —  │
   │     httpOnly-cookie или Authorization: Bearer <jwt>.                  │
   │   • Формат ошибок: HTTP 4xx/5xx + JSON `{ error: { code, message }}`. │
   │     Фронт ждёт, что функция бросит Error с человекочитаемым message.  │
   │   • Все деньги/время — числа; даты — ISO-8601 строки.                │
   │   • Пагинация лент: query `?page=&pageSize=` → `{ items, total }`.   │
   └─────────────────────────────────────────────────────────────────────┘
   ═══════════════════════════════════════════════════════════════════════ */

import type { Recipe } from '@/types'
import { recipes as SEED_RECIPES } from '@/data/recipes'

/** База API. В проде задаётся через .env (`VITE_API_BASE_URL=https://api.cookify.ru`). */
export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** Имитация сетевой задержки — убрать после перехода на реальный fetch. */
const NETWORK_DELAY_MS = 280
const delay = (ms = NETWORK_DELAY_MS) =>
    new Promise<void>((r) => setTimeout(r, ms))

const safeParse = <T>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback
    try {
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

/* ───────────────────────────────────────────────────────────────────────
   1. RECIPES
   ─────────────────────────────────────────────────────────────────────── */

/**
 * Список всех рецептов (каталог).
 *
 * BACKEND:  GET {API_BASE}/recipes?page=&pageSize=&q=
 *   → 200 { items: Recipe[], total: number }
 *   Фильтрацию/сортировку/поиск делает ФРОНТ (см. useFilteredRecipes) —
 *   backend отдаёт сырой каталог + пагинацию. Если рецептов станет
 *   тысячи, перенести фильтры на сервер и принимать их в query.
 */
export async function listRecipes(): Promise<Recipe[]> {
    await delay()
    // BACKEND: return (await fetch(`${API_BASE}/recipes`)).json()
    return SEED_RECIPES
}

/**
 * Один рецепт по id (для будущей «Полной карточки рецепта» /recipe/:id).
 *
 * BACKEND:  GET {API_BASE}/recipes/:id
 *   → 200 Recipe | 404 { error }
 */
export async function getRecipe(id: string): Promise<Recipe | null> {
    await delay()
    // BACKEND: const r = await fetch(`${API_BASE}/recipes/${id}`); if (r.status===404) return null; return r.json()
    return SEED_RECIPES.find((r) => r.id === id) ?? null
}

/**
 * Черновик/новый рецепт из формы «Загрузить рецепт».
 * Проверка уникальности (title + набор ингредиентов + теги) — на бэке.
 *
 * BACKEND:  POST {API_BASE}/recipes        body: NewRecipeDraft
 *   → 201 Recipe | 409 { error: { code:'NOT_UNIQUE' } }
 *   POST {API_BASE}/recipes/drafts        — сохранить черновик
 *   GET  {API_BASE}/recipes/drafts        — список черновиков юзера
 */
export async function createRecipe(
    draft: Omit<Recipe, 'id' | 'rating' | 'ratingCount'>,
): Promise<Recipe> {
    await delay()
    // BACKEND: POST {API_BASE}/recipes — сервер присваивает id, считает уникальность.
    // Заглушка: эмулируем успешное создание, в каталог не пишем (нет персистентного хранилища рецептов на фронте).
    return { ...draft, id: `local-${Date.now()}`, rating: 0, ratingCount: 0 }
}

/* ───────────────────────────────────────────────────────────────────────
   2. FAVORITES  (избранное; ключ cookify:favorites)
   ─────────────────────────────────────────────────────────────────────── */

const FAV_KEY = 'cookify:favorites'

/**
 * BACKEND:  GET {API_BASE}/me/favorites  (auth)
 *   → 200 string[]   (массив recipeId)
 */
export async function getFavorites(): Promise<string[]> {
    await delay(120)
    const arr = safeParse<unknown>(localStorage.getItem(FAV_KEY), [])
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
}

/**
 * BACKEND:  PUT {API_BASE}/me/favorites/:recipeId      (auth) → 204
 *           DELETE {API_BASE}/me/favorites/:recipeId    (auth) → 204
 */
export async function setFavorites(ids: string[]): Promise<void> {
    await delay(80)
    // BACKEND: дифф между старым и новым множеством → серия PUT/DELETE,
    // либо один PUT {API_BASE}/me/favorites c полным массивом.
    localStorage.setItem(FAV_KEY, JSON.stringify(ids))
}

/* ───────────────────────────────────────────────────────────────────────
   3. COOKED  (приготовлено + личная оценка; ключ cookify:cooked:{userId})
   ─────────────────────────────────────────────────────────────────────── */

const cookedKey = (userId?: string) =>
    userId ? `cookify:cooked:${userId}` : 'cookify:cooked'

/**
 * BACKEND:  GET {API_BASE}/me/cooked  (auth)
 *   → 200 { [recipeId: string]: number | null }   (null = добавлено, но не оценено)
 */
export async function getCooked(
    userId?: string,
): Promise<Record<string, number | null>> {
    await delay(120)
    return safeParse(localStorage.getItem(cookedKey(userId)), {})
}

/**
 * BACKEND:
 *   PUT    {API_BASE}/me/cooked/:recipeId           (auth) body { rating?: 1..5 } → 204
 *   DELETE {API_BASE}/me/cooked/:recipeId           (auth) → 204
 *   Сервер сам должен пересчитывать агрегатный рейтинг рецепта
 *   (см. секцию RATINGS) при изменении/снятии личной оценки.
 */
export async function setCooked(
    map: Record<string, number | null>,
    userId?: string,
): Promise<void> {
    await delay(80)
    localStorage.setItem(cookedKey(userId), JSON.stringify(map))
}

/* ───────────────────────────────────────────────────────────────────────
   4. RATINGS  (агрегатные оценки; ключ cookify:ratings)
   ─────────────────────────────────────────────────────────────────────── */

const RATINGS_KEY = 'cookify:ratings'

/**
 * Пользовательские оценки по рецептам (без seed — seed зашит в каталог).
 *
 * BACKEND:  В реальном API агрегат считает сервер. Эндпоинты:
 *   GET  {API_BASE}/recipes/:id/rating          → { average, count }
 *   POST {API_BASE}/recipes/:id/rating  (auth)  body { value:1..5 } → { average, count }
 *   PUT  {API_BASE}/recipes/:id/rating  (auth)  body { value }      → { average, count }
 *   DELETE {API_BASE}/recipes/:id/rating (auth)                     → { average, count }
 *   Фронтовый useRatings смешивает seed + это; на бэке seed не нужен —
 *   среднее/кол-во хранятся в таблице ratings и пересчитываются триггером.
 */
export async function getUserRatings(): Promise<Record<string, number[]>> {
    await delay(100)
    return safeParse(localStorage.getItem(RATINGS_KEY), {})
}

export async function setUserRatings(
    map: Record<string, number[]>,
): Promise<void> {
    await delay(60)
    localStorage.setItem(RATINGS_KEY, JSON.stringify(map))
}

/* ───────────────────────────────────────────────────────────────────────
   5. EXCLUSIONS  (исключённые ингредиенты; ключ cookify:exclusions:{userId})
   ─────────────────────────────────────────────────────────────────────── */

const exclKey = (userId?: string) =>
    userId ? `cookify:exclusions:${userId}` : 'cookify:exclusions'

/**
 * BACKEND:
 *   GET {API_BASE}/me/exclusions          (auth) → 200 string[]
 *   PUT {API_BASE}/me/exclusions          (auth) body string[] → 204
 */
export async function getExclusions(userId?: string): Promise<string[]> {
    await delay(100)
    const arr = safeParse<unknown>(localStorage.getItem(exclKey(userId)), [])
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
}

export async function setExclusions(
    list: string[],
    userId?: string,
): Promise<void> {
    await delay(60)
    localStorage.setItem(exclKey(userId), JSON.stringify(list))
}

/* ───────────────────────────────────────────────────────────────────────
   6. AUTH
   Реализация — в services/mockAuth.ts (там свои BACKEND-комментарии:
   register/verifyCode/login/logout/updateProfile/changePassword).
   В проде mockAuth целиком заменяется на этот же модуль с fetch:
     POST {API_BASE}/auth/register      → { ... } (письмо с кодом)
     POST {API_BASE}/auth/verify        → { token, user }
     POST {API_BASE}/auth/login         → { token, user }
     POST {API_BASE}/auth/logout        → 204
     PATCH {API_BASE}/me                 → User      (смена email/имени/аватара)
     POST {API_BASE}/me/change-password  → 204
   Подтверждение смены email/пароля письмом — обязательно (см. ТЗ).
   ─────────────────────────────────────────────────────────────────────── */
export { mockAuth as authApi, validators, AuthError } from './mockAuth'
