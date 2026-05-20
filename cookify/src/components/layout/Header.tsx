import { memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/components/contexts/AuthContext'
import '@/styles/header.css'

/**
 * Глобальный хедер: логотип + профиль / вход-регистрация.
 * Поиск по сайту убран по требованию — поиск рецептов живёт
 * в тулбаре ленты (Cookify.tsx), а не в хедере.
 */
const Header = memo(function Header() {
    const { user, isAuthenticated } = useAuth()

    const initial = useMemo(() => {
        if (!user) return ''
        return (user.username || user.email).charAt(0).toUpperCase()
    }, [user])

    return (
        <header className="header" role="banner">
            <div className="header__inner">
                <Link
                    to="/"
                    className="header__logo"
                    aria-label="Cookify — Главная"
                >
                    <div className="header__logo-icon" aria-hidden="true">
                        <UtensilsCrossed size={20} strokeWidth={2.25} />
                    </div>
                    <span className="header__logo-text">Cookify</span>
                </Link>

                <div className="header__right">
                    {isAuthenticated && user ? (
                        <Link
                            to="/profile"
                            className="header__user"
                            aria-label="Открыть профиль"
                        >
                            <span className="header__user-name">
                                {user.username}
                            </span>
                            <div
                                className="header__user-avatar"
                                aria-hidden="true"
                            >
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt=""
                                        className="header__user-avatar-img"
                                    />
                                ) : (
                                    <span className="header__user-avatar-initial">
                                        {initial}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ) : (
                        <div className="header__auth-links">
                            <Link to="/login" className="header__auth-link">
                                Вход
                            </Link>
                            <Link
                                to="/register"
                                className="header__auth-link header__auth-link--primary"
                            >
                                Регистрация
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
})

export default Header
