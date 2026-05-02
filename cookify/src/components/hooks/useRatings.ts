import { useCallback, useEffect, useMemo, useState } from 'react'
import { recipes } from '@/data/recipes'

/**
 * KEY хранит **только пользовательские** оценки, накопленные в localStorage:
 *   { recipeId: number[] }   — массив значений 1..5 от пользователей.
 *
 * При выводе рейтинга мы складываем это с seed-значением рецепта
 * (recipe.rating × recipe.ratingCount), чтобы средний оставался
 * «правдоподобным» и обновлялся, когда пользователь оценил блюдо.
 */
const KEY = 'cookify:ratings'

type UserRatingsMap = Record<string, number[]>

const readInitial = (): UserRatingsMap => {
    try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw) as unknown
        if (!parsed || typeof parsed !== 'object') return {}
        const out: UserRatingsMap = {}
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (Array.isArray(v)) {
                out[k] = v.filter(
                    (x): x is number =>
                        typeof x === 'number' && x >= 1 && x <= 5,
                )
            }
        }
        return out
    } catch {
        return {}
    }
}

interface RatingSnapshot {
    average: number
    count: number
}

/**
 * Хук «глобальный рейтинг рецептов».
 * Хранит ТОЛЬКО оценки текущего пользователя (анонимные накопления),
 * а seed (recipe.rating × recipe.ratingCount) подмешивает на лету.
 *
 * Возвращает map snapshot-ов и helper'ы:
 *   getRating(id)     — { average, count } для одного рецепта
 *   submit(id, value) — добавить оценку (1..5)
 *   replace(id, prev, next) — пересчитать «изменение оценки» (был prev, стал next)
 *   withdraw(id, value) — убрать оценку (если пользователь снял её)
 */
export function useRatings() {
    const [user, setUser] = useState<UserRatingsMap>(readInitial)

    useEffect(() => {
        try {
            localStorage.setItem(KEY, JSON.stringify(user))
        } catch {
            /* quota — игнорируем */
        }
    }, [user])

    // cross-tab
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key !== KEY && e.key !== null) return
            setUser(readInitial())
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    /** Сводка по всем рецептам (seed + пользовательские оценки). */
    const ratings = useMemo<Record<string, RatingSnapshot>>(() => {
        const out: Record<string, RatingSnapshot> = {}
        for (const r of recipes) {
            const userArr = user[r.id] ?? []
            const userSum = userArr.reduce((a, b) => a + b, 0)
            const userCount = userArr.length
            const seedSum = r.rating * r.ratingCount
            const totalCount = r.ratingCount + userCount
            const average =
                totalCount === 0
                    ? 0
                    : (seedSum + userSum) / totalCount
            out[r.id] = { average, count: totalCount }
        }
        return out
    }, [user])

    const getRating = useCallback(
        (id: string): RatingSnapshot =>
            ratings[id] ?? { average: 0, count: 0 },
        [ratings],
    )

    /** Добавить новую оценку (1..5). */
    const submit = useCallback((id: string, value: number) => {
        if (value < 1 || value > 5 || !Number.isFinite(value)) return
        setUser((prev) => {
            const arr = prev[id] ? [...prev[id]] : []
            arr.push(Math.round(value))
            return { ...prev, [id]: arr }
        })
    }, [])

    /**
     * Изменить ранее поставленную оценку: убираем prev, добавляем next.
     * Если prev в массиве нет (рассинхрон) — просто добавляем next.
     */
    const replace = useCallback(
        (id: string, prevValue: number | null, nextValue: number) => {
            if (nextValue < 1 || nextValue > 5 || !Number.isFinite(nextValue)) return
            setUser((p) => {
                const arr = p[id] ? [...p[id]] : []
                if (prevValue !== null) {
                    const idx = arr.indexOf(Math.round(prevValue))
                    if (idx !== -1) arr.splice(idx, 1)
                }
                arr.push(Math.round(nextValue))
                return { ...p, [id]: arr }
            })
        },
        [],
    )

    /** Снять оценку (например, при удалении из «Приготовлено»). */
    const withdraw = useCallback((id: string, value: number) => {
        setUser((p) => {
            if (!p[id]) return p
            const arr = [...p[id]]
            const idx = arr.indexOf(Math.round(value))
            if (idx === -1) return p
            arr.splice(idx, 1)
            return { ...p, [id]: arr }
        })
    }, [])

    return { getRating, submit, replace, withdraw }
}
