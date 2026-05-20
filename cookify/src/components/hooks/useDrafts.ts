import { useCallback, useEffect, useState } from 'react'
import type { RecipeDraft } from '@/types'

const baseKey = 'cookify:drafts'
const keyFor = (userId?: string) => (userId ? `${baseKey}:${userId}` : baseKey)

const readInitial = (userId?: string): RecipeDraft[] => {
    try {
        const raw = localStorage.getItem(keyFor(userId))
        if (!raw) return []
        const arr = JSON.parse(raw) as unknown
        if (!Array.isArray(arr)) return []
        // Лёгкая валидация формы: localStorage может быть подменён —
        // отбрасываем записи без обязательного скелета (id/массивы).
        return arr.filter(
            (d): d is RecipeDraft =>
                !!d && typeof d === 'object' &&
                typeof (d as RecipeDraft).id === 'string' &&
                typeof (d as RecipeDraft).title === 'string' &&
                Array.isArray((d as RecipeDraft).ingredients) &&
                Array.isArray((d as RecipeDraft).steps) &&
                Array.isArray((d as RecipeDraft).tags),
        )
    } catch {
        return []
    }
}

/**
 * Хук «Черновики рецептов» — список незавершённых форм «Загрузить рецепт».
 * Привязан к userId. Паттерн идентичен useFavorites/useCooked
 * (localStorage + cross-tab sync), не дублируем логику.
 *
 * BACKEND:
 *   GET    {API_BASE}/me/drafts        (auth) → RecipeDraft[]
 *   PUT    {API_BASE}/me/drafts/:id    (auth) body RecipeDraft → 204
 *   DELETE {API_BASE}/me/drafts/:id    (auth) → 204
 */
export function useDrafts(userId?: string) {
    const [drafts, setDrafts] = useState<RecipeDraft[]>(() => readInitial(userId))

    useEffect(() => {
        setDrafts(readInitial(userId))
    }, [userId])

    useEffect(() => {
        try {
            localStorage.setItem(keyFor(userId), JSON.stringify(drafts))
        } catch {
            /* quota — игнорируем */
        }
    }, [drafts, userId])

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key !== keyFor(userId) && e.key !== null) return
            setDrafts(readInitial(userId))
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [userId])

    /** Сохранить (создать или обновить по id). */
    const save = useCallback((draft: RecipeDraft) => {
        setDrafts((prev) => {
            const idx = prev.findIndex((d) => d.id === draft.id)
            if (idx === -1) return [draft, ...prev]
            const next = [...prev]
            next[idx] = draft
            return next
        })
    }, [])

    const remove = useCallback((id: string) => {
        setDrafts((prev) => prev.filter((d) => d.id !== id))
    }, [])

    const getById = useCallback(
        (id: string) => drafts.find((d) => d.id === id) ?? null,
        [drafts],
    )

    return { drafts, save, remove, getById }
}
