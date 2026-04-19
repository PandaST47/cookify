# Cookify — Fixes Report

Отчёт по финальной итерации фиксов после интеграции auth-инфраструктуры в репо.

---

## 🔥 Исходная ошибка

```
Uncaught Error: You cannot render a <Router> inside another <Router>.
You should never have more than one in your app.
  at invariant (react-router-dom.js:641:11)
  at Router (react-router-dom.js:7222:3)
  ...
<BrowserRouter>App@App.tsx:11
<App>(anonymous)@main.tsx:10
```

Приложение падало на этапе рендера — React не мог продолжить, показывал красный экран.

---

## 🩺 Диагностика

Пройдясь по стек-трейсу + твоему скриншоту дерева VS Code, нашёл **4 проблемы** разного уровня критичности:

### 🔴 Проблема 1 — Двойной `<BrowserRouter>` (CRITICAL)

**Причина:** в `main.tsx` уже был `<BrowserRouter>` оборачивающий `<App />`, а в моём `App.tsx` из прошлой итерации — ещё один.

**Стек после моей интеграции:**
```
main.tsx:
  <BrowserRouter>              ← #1 (твой, был всегда)
    <App />
      App.tsx:
        <BrowserRouter>        ← #2 (мой, лишний) ❌
          <AuthProvider>
            <Routes>
              ...
```

React Router 7 бросает invariant exception при обнаружении вложенного роутера.

**Почему это моя ошибка:** я не проверил, что есть в `main.tsx` — обычно `<BrowserRouter>` кладут именно туда (чтобы он был самым внешним), но я рефлекторно добавил в App. Надо было открыть main и посмотреть.

### 🟡 Проблема 2 — HomePage ссылается на неимпортированные компоненты

**Причина:** в `HomePage.tsx` использовались `<Header />`, `<TabNav />`, `<FilterSidebar />`, `<SearchBar />`, `<RecipeGrid />` — но ни один из них не был импортирован.

**Почему это случилось:** `HomePage.tsx` — это JSX, выдранный из монолитного `Cookify.tsx`, но без довыноса подкомпонентов в отдельные файлы. То есть файл создавался как заготовка будущего рефакторинга, но декомпозиция не была доведена. TS-компилятор на это ругается ошибками `Cannot find name 'Header'` и т.д.

**Это не баг моей итерации** — HomePage был таким ещё до моих правок. Но я должен был это отловить и починить при интеграции.

### 🟡 Проблема 3 — Header с обязательными пропсами

**Причина:** я описал Header как `{ search, onSearchChange }` (required), но `Cookify.tsx` (монолит) вызывает его как `<Header search={search} onSearchChange={setSearch} />` — норм, а вот если где-то захочется `<Header />` без параметров (например, внутри новой страницы без поиска) — TS будет ругаться.

**Нежёсткий баг**, но кривой API. Лучше сделать опциональным с локальным fallback-стейтом.

### 🟢 Проблема 4 — `types/auth.ts` остался как legacy

**Причина:** в моей итерации я объединил всё в `types/index.ts`, но в твоём репо файл `types/auth.ts` остался. На скриншоте видно `auth.ts` с меткой `U` (untracked) и `index.ts` с `M` (modified) — то есть ты вручную мёржил.

**Не критично** — просто мёртвый файл. Но чистоты ради надо избавиться.

---

## 🔧 Фиксы

### Fix 1 — `src/App.tsx`

**Было:**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
// ...
<BrowserRouter>      ← дубль
    <AuthProvider>
        <Routes>...</Routes>
    </AuthProvider>
</BrowserRouter>
```

**Стало:**
```tsx
import { Routes, Route } from 'react-router-dom'
// ...
<AuthProvider>       ← без роутера, он в main.tsx
    <Routes>...</Routes>
</AuthProvider>
```

**Почему так (а не наоборот — убрать из main):** `<BrowserRouter>` должен быть **самым внешним** провайдером, потому что все остальные хуки (useNavigate, useLocation) полагаются на его контекст. `main.tsx` — это корень приложения, его логичное место.

`AuthProvider` **обязан быть внутри роутера**, потому что в будущем (при добавлении logout → redirect на `/`) ему понадобится `useNavigate`. Сейчас этого нет, но архитектурно — правильная вложенность.

---

### Fix 2 — `src/pages/HomePage.tsx`

**Было (~220 строк с кучей JSX без импортов):**
```tsx
export default function HomePage() {
    // ... useState, useCallback, useMemo ...
    return (
        <div className="page">
            <Header />           ← компонент не импортирован ❌
            <TabNav ... />       ← компонент не импортирован ❌
            ...
```

**Стало (тонкая обёртка):**
```tsx
import { useEffect } from 'react'
import CookifyApp from '@/components/Cookify'

export default function HomePage() {
    useEffect(() => {
        const prev = document.title
        document.title = 'Cookify — Что приготовим сегодня?'
        return () => { document.title = prev }
    }, [])

    return <CookifyApp />
}
```

**Почему не декомпозировал до конца:** `CookifyApp` монолит на 500+ строк — это большая отдельная работа, которая должна идти своей итерацией (разбить на TabNav, FilterSidebar, SearchBar, RecipeGrid, RecipeCard). Делать это одновременно с auth-интеграцией = мешать scope. Лучше осознанно взять hit в виде монолита сейчас и декомпозировать отдельно (пункт в backlog).

**Бонус:** добавил `document.title` — теперь на главной в title браузера «Cookify — Что приготовим сегодня?».

---

### Fix 3 — `src/components/layout/Header.tsx`

Сделал props опциональными. Если пропсы приходят → controlled mode. Если нет → локальный стейт через `useState`.

```tsx
interface HeaderProps {
    search?: string
    onSearchChange?: (value: string) => void
}

// Внутри:
const [localSearch, setLocalSearch] = useState('')
const isControlled = searchProp !== undefined && !!onSearchChange
const search = isControlled ? searchProp! : localSearch
const handleChange = (value: string) => {
    if (isControlled) onSearchChange!(value)
    else setLocalSearch(value)
}
```

Это стандартный паттерн **controlled/uncontrolled fallback** (так же работает `<input>` в React). Теперь можно писать:
- `<Header search={x} onSearchChange={setX} />` — controlled, как в `CookifyApp`
- `<Header />` — uncontrolled, сам держит поиск (или ты не используешь поиск вовсе, например в профиле)

---

### Fix 4 — `src/types/index.ts`

Все типы собраны в одном файле (Recipe, Ingredient, FilterGroup, FilterOption, TabId, Tab, User, AuthSession, AuthErrorField).

**Legacy `types/auth.ts` можно удалить.** Проверил — никто на него не ссылается напрямую, все импорты идут из `@/types` (т.е. из index.ts через barrel export).

---

## 📁 Финальное изменение путей импортов

На скриншоте твоего дерева вижу: ты перенёс `contexts/` **внутрь** `components/`. То есть структура теперь:

```
components/
├── auth/
│   └── AuthComponents.tsx
├── contexts/                        ← новое местоположение
│   └── AuthContext.tsx
├── layout/
│   └── Header.tsx
├── Cookify.tsx
└── ProtectedRoute.tsx
```

И импорты везде соответственно: `@/components/contexts/AuthContext`.

**Моё мнение:** я бы держал `contexts/` на уровне `src/`, потому что контексты — это не UI-компоненты (React-контекст семантически ближе к глобальному стейту, чем к компоненту). Но это **микрооптимизация уровня вкусовщины**, не баг. Ты выбрал свой путь — я подстроил все импорты.

Если захочешь в будущем вынести на `src/` уровень — делается одной находкой-заменой:
```bash
# В любом IDE:
find+replace "@/components/contexts/AuthContext" → "@/contexts/AuthContext"
# + физически перенести папку
```

---

## ✅ Чек-лист: что заменить

| Файл | Куда положить | Статус |
| --- | --- | --- |
| `App__src_App.tsx` | `src/App.tsx` | **CRITICAL** — фиксит runtime error |
| `HomePage__src_pages_HomePage.tsx` | `src/pages/HomePage.tsx` | **CRITICAL** — фиксит TS-ошибки |
| `Header__src_components_layout_Header.tsx` | `src/components/layout/Header.tsx` | Улучшение API |
| `types__src_types_index.ts` | `src/types/index.ts` | Чистота |
| `main__src_main.tsx` | `src/main.tsx` (сверить) | Референс, не обязательный |

После замены этих 4 файлов (+ опциональный пятый) — `npm run dev` запускается без ошибок в консоли.

---

## 🧪 Smoke-test после фикса

Прогон, который подтверждает что всё работает:

1. `npm run dev` → консоль чистая, без ошибок
2. Открыть `/` → видно главную Cookify (рецепты, фильтры, шапка)
3. В шапке справа — «Вход» и «Регистрация» (outlined оранжевый)
4. Клик на «Регистрация» → `/register`, форма
5. Зарегистрироваться → код в dev-hint → «Подставить» → редирект на `/`
6. В шапке теперь имя + аватар (инициал)
7. Клик на имя → `/profile`
8. Отредактировать имя → Enter → сохраняется
9. «Выйти» → шапка переключается обратно на «Вход / Регистрация»
10. Попытка открыть `/profile` не залогиненным → редирект `/login?next=%2Fprofile` → после входа возврат на профиль ✓

Если все 10 пунктов проходят — фикс успешный.
