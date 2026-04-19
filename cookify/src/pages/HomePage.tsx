import { useEffect } from 'react'
import CookifyApp from '@/components/Cookify'

/**
 * HomePage — тонкая обёртка над монолитным CookifyApp.
 *
 * Почему так, а не декомпозиция:
 * — CookifyApp уже содержит всё дерево (Header, TabNav, FilterSidebar,
 *   RecipeGrid, sort/filter state, scroll-top). Разбивать его сейчас
 *   на 5-6 файлов внесёт больше багов, чем пользы.
 * — Header внутри CookifyApp уже auth-aware (видит useAuth из контекста).
 * — SEO: ставим document.title на уровне страницы, это роль HomePage,
 *   а не CookifyApp (он — presentational компонент).
 *
 * Если в будущем захочется декомпозировать — делаем это отдельной
 * итерацией, чтобы не смешивать рефакторинг с роутингом.
 */
export default function HomePage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Cookify — Что приготовим сегодня?'
        return () => {
            document.title = prev
        }
    }, [])

    return <CookifyApp />
}