import { useCallback, useEffect, useState } from 'react'

const baseKey = 'cookify:cooked'
const keyFor = (userId?: string) => (userId ? `${baseKey}:${userId}` : baseKey)

/**
 * Внутреннее представление: id рецепта → оценка пользователя 1..5
 * (или null, если пока не оценил). null важен — пользователь может
 * добавить блюдо в «Приготовлено» без оценки и поставить позже.
 */
export type CookedMap = Record<string, number | null>

const readInitial = (userId?: string): CookedMap => {
    try {
        const raw = localStorage.getItem(keyFor(userId))
        if (!raw) return {}
        const parsed = JSON.parse(raw) as unknown
        if (!parsed || typeof parsed !== 'object') return {}
        const out: CookedMap = {}
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (v === null) out[k] = null
            else if (typeof v === 'number' && v >= 1 && v <= 5) out[k] = v
        }
        return out
    } catch {
        return {}
    }
}

/**
 * Хук «Приготовлено» — список рецептов, которые пользователь готовил,
 * + персональная оценка от 1 до 5 (или null, если ещё не оценил).
 *
 * Привязан к userId, поэтому у двух разных профилей разные списки.
 * Если userId не передан — используется глобальный ключ (для гостей,
 * хотя в нашем UI «Приготовлено» под ProtectedRoute не нужно — ленту
 * это всё равно стабилизирует).
 */
export function useCooked(userId?: string) {
    const [cooked, setCooked] = useState<CookedMap>(() => readInitial(userId))

    // при смене юзера перечитываем стораж
    useEffect(() => {
        setCooked(readInitial(userId))
    }, [userId])

    useEffect(() => {
        try {
            localStorage.setItem(keyFor(userId), JSON.stringify(cooked))
        } catch {
            /* quota — игнорируем */
        }
    }, [cooked, userId])

    /** Добавить в «Приготовлено» (без оценки). Идемпотентно. */
    const add = useCallback((id: string) => {
        setCooked((prev) => {
            if (id in prev) return prev
            return { ...prev, [id]: null }
        })
    }, [])

    /** Полностью убрать из «Приготовлено» (и оценку тоже). */
    const remove = useCallback((id: string) => {
        setCooked((prev) => {
            if (!(id in prev)) return prev
            const next = { ...prev }
            delete next[id]
            return next
        })
    }, [])

    /** Поставить или изменить оценку. value: 1..5. */
    const rate = useCallback((id: string, value: number) => {
        if (value < 1 || value > 5 || !Number.isFinite(value)) return
        setCooked((prev) => ({ ...prev, [id]: Math.round(value) }))
    }, [])

    /** Снять только оценку, оставив рецепт в «Приготовлено». */
    const unrate = useCallback((id: string) => {
        setCooked((prev) => {
            if (!(id in prev) || prev[id] === null) return prev
            return { ...prev, [id]: null }
        })
    }, [])

    const has = useCallback((id: string) => id in cooked, [cooked])
    const ratingOf = useCallback(
        (id: string): number | null => cooked[id] ?? null,
        [cooked],
    )

    return { cooked, add, remove, rate, unrate, has, ratingOf }
}
