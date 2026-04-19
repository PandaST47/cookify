import { memo, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/components/contexts/AuthContext'
import '@/styles/header.css'

interface HeaderProps {
    /**
     * Если переданы — Header работает как controlled.
     * Если нет (вызов `<Header />` без пропсов) — держит локальный
     * стейт поиска. Это удобно для страниц, где поиск не нужен
     * (профиль, авторизация) или где он изолирован от страницы.
     */
    search?: string
    onSearchChange?: (value: string) => void
}

const Header = memo(function Header({
    search: searchProp,
    onSearchChange,
}: HeaderProps) {
    const { user, isAuthenticated } = useAuth()

    // Локальный fallback, если родитель не передал search/onSearchChange.
    const [localSearch, setLocalSearch] = useState('')
    const isControlled = searchProp !== undefined && !!onSearchChange
    const search = isControlled ? searchProp! : localSearch
    const handleChange = (value: string) => {
        if (isControlled) onSearchChange!(value)
        else setLocalSearch(value)
    }

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
                    <div className="header__search">
                        <Search
                            className="header__search-icon"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="Поиск по сайту"
                            className="header__search-input"
                            aria-label="Поиск по сайту"
                            autoComplete="off"
                        />
                    </div>

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