import { memo } from 'react'
import { User } from 'lucide-react'
import '../styles/Header.css'

const Header = memo(function Header() {
  return (
    <header className="header" role="banner">
      <div className="header__inner">
        <a href="/" className="header__logo" aria-label="Cookify — Главная">
          <div className="header__logo-icon">
            <span role="img" aria-hidden="true">🍳</span>
          </div>
          <span className="header__logo-text">Cookify</span>
        </a>

        <button
          className="header__profile"
          aria-label="Открыть профиль"
        >
          <User className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
})

export default Header
