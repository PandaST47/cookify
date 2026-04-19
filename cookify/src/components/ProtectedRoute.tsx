import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/components/contexts/AuthContext'
import type { ReactNode } from 'react'

/**
 * Гейт для приватных роутов.
 * Пока сессия восстанавливается — ничего не рендерит (не мигает логином).
 * Если не залогинен — перебрасывает на /login?next=<откуда пришёл>,
 * чтобы после авторизации вернуть юзера ровно туда, куда он шёл.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isReady } = useAuth()
    const location = useLocation()

    if (!isReady) return null

    if (!isAuthenticated) {
        const next = encodeURIComponent(location.pathname + location.search)
        return <Navigate to={`/login?next=${next}`} replace />
    }
    return <>{children}</>
}