import { useCallback, useEffect, useState } from 'react'

const baseKey = 'cookify:exclusions'
const keyFor = (userId?: string) => (userId ? `${baseKey}:${userId}` : baseKey)

const readInitial = (userId?: string): string[] => {
    try {
        const raw = localStorage.getItem(keyFor(userId))
        if (!raw) return []
        const arr = JSON.parse(raw) as unknown
        if (!Array.isArray(arr)) return []
        return arr.filter((x): x is string => typeof x === 'string')
    } catch {
        return []
    }
}

/**
 * Хук «исключения» — список ингредиентов, которые пользователь
 * не хочет видеть в рекомендациях (аллергия / непереносимость / нелюбовь).
 *
 * Привязан к userId, поэтому у двух разных профилей разные списки.
 * Если userId не передан — используется глобальный ключ (для гостей).
 */
export function useExclusions(userId?: string) {
    const [exclusions, setExclusions] = useState<string[]>(() =>
        readInitial(userId),
    )

    // при смене юзера перечитываем стораж
    useEffect(() => {
        setExclusions(readInitial(userId))
    }, [userId])

    useEffect(() => {
        try {
            localStorage.setItem(keyFor(userId), JSON.stringify(exclusions))
        } catch {
            /* quota — игнорируем */
        }
    }, [exclusions, userId])

    const add = useCallback((items: string | string[]) => {
        setExclusions((prev) => {
            const list = Array.isArray(items) ? items : [items]
            const set = new Set(prev)
            for (const i of list) set.add(i)
            return [...set]
        })
    }, [])

    const remove = useCallback((item: string) => {
        setExclusions((prev) => prev.filter((i) => i !== item))
    }, [])

    const replace = useCallback((items: string[]) => {
        setExclusions([...new Set(items)])
    }, [])

    return { exclusions, add, remove, replace }
}
