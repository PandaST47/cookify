import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/components/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ProfilePage from '@/pages/ProfilePage'

/**
 * ВАЖНО: <BrowserRouter> НЕ здесь — он уже в main.tsx,
 * оборачивает <App />. Два роутера в одном дереве = runtime error.
 *
 * AuthProvider должен лежать ВНУТРИ роутера (главное требование),
 * потому что AuthContext использует useNavigate и другие хуки
 * react-router в будущих расширениях. Роутер — в main.tsx → тут
 * AuthProvider оборачивает роуты, и порядок корректный.
 */
export default function App() {
    return (
        <AuthProvider>
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
                {/* 404 → на главную. В проде тут отдельная NotFoundPage. */}
                <Route path="*" element={<HomePage />} />
            </Routes>
        </AuthProvider>
    )
}