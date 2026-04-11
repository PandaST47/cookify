import { memo } from 'react'
import { Search } from 'lucide-react'
import '../styles/SearchBar.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

const SearchBar = memo(function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="searchbar">
      <Search className="searchbar__icon" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск рецептов..."
        className="searchbar__input"
        aria-label="Поиск рецептов"
        autoComplete="off"
      />
    </div>
  )
})

export default SearchBar
