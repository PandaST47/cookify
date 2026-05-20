import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/components/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ProfilePage from '@/pages/ProfilePage'

/**
 * Тяжёлые/редкие страницы — через lazy() + Suspense, чтобы не тянуть
 * их в initial bundle (Полная карточка / Режим готовки / Загрузить
 * рецепт нужны не сразу). Это закрывает backlog #12.2.
 */
const RecipePage = lazy(() => import('@/pages/RecipePage'))
const CookingModePage = lazy(() => import('@/pages/CookingModePage'))
const UploadRecipePage = lazy(() => import('@/pages/UploadRecipePage'))

function PageFallback() {
    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9C9585',
                fontWeight: 600,
            }}
        >
            Загрузка…
        </div>
    )
}

/**
 * ВАЖНО: <BrowserRouter> НЕ здесь — он уже в main.tsx,
 * оборачивает <App />. Два роутера в одном дереве = runtime error.
 *
 * AuthProvider должен лежать ВНУТРИ роутера (главное требование),
 * потому что AuthContext использует useNavigate и другие хуки
 * react-router. Роутер — в main.tsx → тут AuthProvider оборачивает
 * роуты, и порядок корректный.
 */
export default function App() {
    return (
        <AuthProvider>
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    {/* Полная карточка рецепта */}
                    <Route path="/recipe/new" element={
                        <ProtectedRoute>
                            <UploadRecipePage />
                        </ProtectedRoute>
                    } />
                    <Route path="/recipe/:id" element={<RecipePage />} />
                    {/* Режим готовки — только из Полной карточки */}
                    <Route path="/recipe/:id/cook" element={
                        <ProtectedRoute>
                            <CookingModePage />
                        </ProtectedRoute>
                    } />
                    {/* 404 → на главную. В проде тут отдельная NotFoundPage. */}
                    <Route path="*" element={<HomePage />} />
                </Routes>
            </Suspense>
        </AuthProvider>
    )
}
