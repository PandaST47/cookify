import { useMemo } from 'react'
import type { FilterGroupId, Recipe, TabId } from '@/types'
import type { SortId } from '@/data/recipes'

/* ═══════════════════════════════════════════════════════════
   useFilteredRecipes
   Реализует иерархию фильтрации из CLAUDE.md §5:

     1. Сортировка     — применяется ВСЕГДА последней.
     2. Ингредиенты    — ИЛИ внутри списка (хотя бы один совпал).
     3. Исключения     — И между собой (НИ один из исключённых не должен
                          присутствовать; но явно выбранный ингредиент
                          бьёт исключение для этого рецепта).
     4. Sidebar-фильтры:
          mealType  — ИЛИ
          occasions — ИЛИ
          cuisine   — ИЛИ
          health    — И
          taste     — И
          между группами — И.
     5. Поиск (по названию/описанию/тегам/ингредиентам).
     6. Таб (recommendations/favorites/cooked) — отдельным фильтром.
   ═══════════════════════════════════════════════════════════ */

/** Условие комбинации опций внутри одной группы фильтров. */
const GROUP_LOGIC: Record<FilterGroupId, 'AND' | 'OR'> = {
    mealType: 'OR',
    occasions: 'OR',
    cuisine: 'OR',
    health: 'AND',
    taste: 'AND',
}

interface Args {
    recipes: Recipe[]
    activeTab: TabId
    favorites: Set<string>
    cookedIds: Set<string>
    /** Из модалки «Кнопка Ингредиенты». Уже нормализованные (lowercase). */
    chosenIngredients: string[]
    /** Из профиля. Уже нормализованные (lowercase). */
    excludedIngredients: string[]
    /** ID-ы фильтров sidebar'а: { mealType: ['breakfast'], cuisine: ['italian'] } */
    sidebarFilters: Record<FilterGroupId, string[]>
    search: string
    sortBy: SortId
    /** Из useRatings — для сортировки по рейтингу. */
    ratingFor: (id: string) => { average: number; count: number }
}

/** Без учёта регистра, безопасно к undefined. */
const norm = (s: string) => s.trim().toLowerCase()

/** Содержит ли recipe.ingredients какое-либо из имён в списке (case-insensitive). */
const hasAnyIngredient = (recipe: Recipe, names: string[]): boolean => {
    if (names.length === 0) return false
    const recipeNames = recipe.ingredients.map((i) => norm(i.name))
    return names.some((n) => recipeNames.some((rn) => rn.includes(n) || n.includes(rn)))
}

export function useFilteredRecipes({
    recipes,
    activeTab,
    favorites,
    cookedIds,
    chosenIngredients,
    excludedIngredients,
    sidebarFilters,
    search,
    sortBy,
    ratingFor,
}: Args): Recipe[] {
    return useMemo(() => {
        let list = recipes

        /* ── Tab ── */
        if (activeTab === 'favorites') {
            list = list.filter((r) => favorites.has(r.id))
        } else if (activeTab === 'cooked') {
            list = list.filter((r) => cookedIds.has(r.id))
        }

        /* ── Поиск ── */
        const q = norm(search)
        if (q) {
            list = list.filter((r) =>
                r.title.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.displayTags.some((t) => t.toLowerCase().includes(q)) ||
                r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
            )
        }

        /* ── Sidebar фильтры ── */
        const sbEntries = (Object.entries(sidebarFilters) as [
            FilterGroupId,
            string[],
        ][]).filter(([, ids]) => ids.length > 0)

        if (sbEntries.length > 0) {
            list = list.filter((r) =>
                sbEntries.every(([groupId, selectedIds]) => {
                    const recipeTags = r.filters[groupId] ?? []
                    if (recipeTags.length === 0) return false
                    if (GROUP_LOGIC[groupId] === 'OR') {
                        return selectedIds.some((id) => recipeTags.includes(id))
                    }
                    return selectedIds.every((id) => recipeTags.includes(id))
                }),
            )
        }

        /* ── Исключения (профиль) ──
           Рецепт удаляется, если содержит ЛЮБОЙ из excludedIngredients,
           но ПРИ УСЛОВИИ что этот ингредиент не выбран явно в chosenIngredients
           (см. ВНИМАНИЕ из ТЗ).
        */
        const exclNorm = excludedIngredients.map(norm)
        const chosenNorm = chosenIngredients.map(norm)
        if (exclNorm.length > 0) {
            list = list.filter((r) => {
                const recipeNames = r.ingredients.map((i) => norm(i.name))
                return !exclNorm.some((excl) => {
                    // если пользователь явно хотел этот ингредиент — исключение бьётся
                    if (chosenNorm.some((c) => c === excl || c.includes(excl) || excl.includes(c))) {
                        return false
                    }
                    return recipeNames.some(
                        (rn) => rn === excl || rn.includes(excl) || excl.includes(rn),
                    )
                })
            })
        }

        /* ── Ингредиенты (модалка) ── */
        if (chosenNorm.length > 0) {
            list = list.filter((r) => hasAnyIngredient(r, chosenNorm))
        }

        /* ── Сортировка ── */
        const result = [...list]
        switch (sortBy) {
            case 'rating_desc':
                result.sort((a, b) => ratingFor(b.id).average - ratingFor(a.id).average)
                break
            case 'rating_asc':
                result.sort((a, b) => ratingFor(a.id).average - ratingFor(b.id).average)
                break
            case 'calories_asc':
                result.sort((a, b) => a.calories - b.calories)
                break
            case 'calories_desc':
                result.sort((a, b) => b.calories - a.calories)
                break
            case 'time_asc':
                result.sort((a, b) => a.cookTime - b.cookTime)
                break
            case 'time_desc':
                result.sort((a, b) => b.cookTime - a.cookTime)
                break
            // 'popular' — без явной сортировки, оставляем порядок recipes[]
        }

        return result
    }, [
        recipes,
        activeTab,
        favorites,
        cookedIds,
        chosenIngredients,
        excludedIngredients,
        sidebarFilters,
        search,
        sortBy,
        ratingFor,
    ])
}
