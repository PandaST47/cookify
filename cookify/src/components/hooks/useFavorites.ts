import { useCallback, useEffect, useState } from 'react'

const KEY = 'cookify:favorites'

const readInitial = (): Set<string> => {
    try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return new Set()
        const arr = JSON.parse(raw) as unknown
        if (!Array.isArray(arr)) return new Set()
        return new Set(arr.filter((x): x is string => typeof x === 'string'))
    } catch {
        return new Set()
    }
}

/**
 * Хук «избранное» — Set ID-ов рецептов, синхронизированный с localStorage.
 * Кросс-вкладочная синхронизация через storage event, чтобы сердечко
 * не "разъезжалось" между вкладками одного юзера.
 */
export function useFavorites() {
    const [favorites, setFavorites] = useState<Set<string>>(readInitial)

    useEffect(() => {
        try {
            localStorage.setItem(KEY, JSON.stringify([...favorites]))
        } catch {
            /* quota — игнорируем, фолбэк на in-memory */
        }
    }, [favorites])

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key !== KEY && e.key !== null) return
            setFavorites(readInitial())
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const add = useCallback((id: string) => {
        setFavorites((prev) => {
            if (prev.has(id)) return prev
            const next = new Set(prev)
            next.add(id)
            return next
        })
    }, [])

    const remove = useCallback((id: string) => {
        setFavorites((prev) => {
            if (!prev.has(id)) return prev
            const next = new Set(prev)
            next.delete(id)
            return next
        })
    }, [])

    const has = useCallback((id: string) => favorites.has(id), [favorites])

    return { favorites, add, remove, has }
}
