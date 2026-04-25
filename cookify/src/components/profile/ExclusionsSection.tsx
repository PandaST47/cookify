import {
    memo, useCallback, useEffect, useMemo, useRef, useState,
    type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Plus, Search as SearchIcon, X } from 'lucide-react'

/**
 * Список ингредиентов, которые можно исключить.
 * В проде уехал бы в /api/ingredients или таксономию backend'а.
 * Список покрывает популярные аллергены + бытовые "не любимое".
 */
const AVAILABLE_INGREDIENTS = [
    'Помидоры',
    'Лактоза',
    'Глютен',
    'Арахис',
    'Цитрусовые',
    'Лосось',
    'Пшеница',
    'Грибы',
    'Креветки',
    'Томаты',
    'Мёд',
    'Соя',
    'Фундук',
    'Яйца',
    'Коровье молоко',
    'Морепродукты',
    'Кунжут',
    'Горчица',
    'Сельдерей',
    'Орехи',
    'Рыба',
    'Курица',
] as const

interface ExclusionsSectionProps {
    exclusions: string[]
    onAdd: (items: string[]) => void
    onRemove: (item: string) => void
}

/**
 * Секция «Исключения» в профиле.
 * — chips с × для удаления
 * — кнопка "+ Добавить продукт" открывает модалку
 * — модалка: поиск, чекбоксы, авто-сохранение в стейт через onAdd
 */
export const ExclusionsSection = memo(function ExclusionsSection({
    exclusions, onAdd, onRemove,
}: ExclusionsSectionProps) {
    const [modalOpen, setModalOpen] = useState(false)

    const handleClose = useCallback(() => setModalOpen(false), [])

    return (
        <section
            className="profile-exclusions"
            aria-labelledby="profile-exclusions-title"
        >
            <header className="profile-exclusions__header">
                <h2
                    id="profile-exclusions-title"
                    className="profile-exclusions__title"
                >
                    Исключения
                </h2>
                <button
                    type="button"
                    className="profile-exclusions__add"
                    onClick={() => setModalOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={modalOpen}
                >
                    <Plus size={16} aria-hidden="true" />
                    <span>Добавить продукт</span>
                </button>
            </header>

            {exclusions.length === 0 ? (
                <p className="profile-exclusions__empty">
                    Пока нет исключений. Добавьте ингредиенты, которые не подходят
                    из-за аллергии, непереносимости или просто не нравятся.
                </p>
            ) : (
                <ul className="profile-exclusions__list" role="list">
                    {exclusions.map((item) => (
                        <li key={item} className="profile-exclusions__chip">
                            <span className="profile-exclusions__chip-label">
                                {item}
                            </span>
                            <button
                                type="button"
                                className="profile-exclusions__chip-x"
                                onClick={() => onRemove(item)}
                                aria-label={`Удалить «${item}» из исключений`}
                            >
                                <X size={12} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {modalOpen && (
                <ExclusionsModal
                    available={AVAILABLE_INGREDIENTS as unknown as string[]}
                    initial={exclusions}
                    onClose={handleClose}
                    onApply={(next) => {
                        // Определяем дельту: какие добавить
                        const toAdd = next.filter((x) => !exclusions.includes(x))
                        const toRemove = exclusions.filter((x) => !next.includes(x))
                        if (toAdd.length) onAdd(toAdd)
                        for (const item of toRemove) onRemove(item)
                        handleClose()
                    }}
                />
            )}
        </section>
    )
})

/* ═══════════════════════════════════════════
   Modal
   ═══════════════════════════════════════════ */

interface ExclusionsModalProps {
    available: string[]
    initial: string[]
    onClose: () => void
    onApply: (next: string[]) => void
}

const ExclusionsModal = memo(function ExclusionsModal({
    available, initial, onClose, onApply,
}: ExclusionsModalProps) {
    const [query, setQuery] = useState('')
    const [draft, setDraft] = useState<Set<string>>(() => new Set(initial))
    const dialogRef = useRef<HTMLDivElement>(null)
    const titleId = 'profile-exclusions-modal-title'
    const descId = 'profile-exclusions-modal-desc'

    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        // фокус на поиск, удобно сразу искать
        dialogRef.current
            ?.querySelector<HTMLInputElement>('[data-autofocus]')
            ?.focus()
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [onClose])

    const toggle = useCallback((item: string) => {
        setDraft((prev) => {
            const next = new Set(prev)
            if (next.has(item)) next.delete(item)
            else next.add(item)
            return next
        })
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return available
        return available.filter((i) => i.toLowerCase().includes(q))
    }, [available, query])

    const handleListKey = (e: KeyboardEvent<HTMLDivElement>) => {
        // Поддержка пробела/Enter на чекбоксе уже встроена в <input>,
        // но мы перехватываем Esc на уровне диалога — там это уже сделано.
        if (e.key === 'Escape') onClose()
    }

    return createPortal(
        <div
            className="profile-exclusions-modal-backdrop"
            role="presentation"
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                className="profile-exclusions-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descId}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleListKey}
            >
                <button
                    type="button"
                    className="profile-exclusions-modal__close"
                    onClick={onClose}
                    aria-label="Закрыть"
                >
                    <X size={18} aria-hidden="true" />
                </button>

                <h3 id={titleId} className="profile-exclusions-modal__title">
                    Добавить ингредиенты
                </h3>
                <p
                    id={descId}
                    className="profile-exclusions-modal__desc"
                >
                    Выберите ингредиенты, которые нужно исключить из подбора
                    рецептов: аллергия, непереносимость или просто нелюбимые
                    ингредиенты.
                </p>

                <div className="profile-exclusions-modal__search">
                    <SearchIcon
                        size={16}
                        className="profile-exclusions-modal__search-icon"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Поиск ингредиента"
                        className="profile-exclusions-modal__search-input"
                        aria-label="Поиск ингредиента"
                        autoComplete="off"
                        data-autofocus
                    />
                </div>

                <ul
                    className="profile-exclusions-modal__list"
                    role="list"
                    aria-label="Список ингредиентов"
                >
                    {filtered.length === 0 ? (
                        <li className="profile-exclusions-modal__empty">
                            Ничего не найдено
                        </li>
                    ) : (
                        filtered.map((item) => {
                            const checked = draft.has(item)
                            return (
                                <li key={item}>
                                    <label className="profile-exclusions-modal__opt">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggle(item)}
                                            className="profile-exclusions-modal__opt-input"
                                        />
                                        <span
                                            className={`profile-exclusions-modal__opt-box ${checked ? 'profile-exclusions-modal__opt-box--on' : ''}`}
                                            aria-hidden="true"
                                        >
                                            {checked && (
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M2 6.5L4.8 9.2L10 4"
                                                        stroke="white"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            )}
                                        </span>
                                        <span className="profile-exclusions-modal__opt-label">
                                            {item}
                                        </span>
                                    </label>
                                </li>
                            )
                        })
                    )}
                </ul>

                <div className="profile-exclusions-modal__footer">
                    <button
                        type="button"
                        className="profile-exclusions-modal__btn profile-exclusions-modal__btn--ghost"
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        className="profile-exclusions-modal__btn profile-exclusions-modal__btn--primary"
                        onClick={() => onApply([...draft])}
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
})
