import { memo } from 'react'
import { Search, User } from 'lucide-react'
import '@/layout/header.css'

interface HeaderProps {
  search: string
  onSearchChange: (value: string) => void
}

const Header = memo(function Header({ search, onSearchChange }: HeaderProps) {
  return (
    <header className="header" role="banner">
      <div className="header__inner">
        <a href="/" className="header__logo" aria-label="Cookify — Главная">
          <div className="header__logo-icon">
            <span role="img" aria-hidden="true">🍳</span>
          </div>
          <span className="header__logo-text">Cookify</span>
        </a>

        <div className="header__right">
          <div className="header__search">
            <Search className="header__search-icon" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Поиск по сайту"
              className="header__search-input"
              aria-label="Поиск по сайту"
              autoComplete="off"
            />
          </div>
          <button className="header__profile" aria-label="Открыть профиль">
            <User size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
})

export default Header