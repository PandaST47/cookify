# Cookify — Project Guide for Claude

> Этот файл загружается автоматически в каждый новый чат Claude Code.
> Не дублировать его содержимое в промптах — оно и так в контексте.

---

## 0. Quality bar (non-negotiable)

Уровень — топ-1% индустрии (Vercel / Linear / Stripe). Production-ready, без компромиссов.
Если задача неоднозначна или конфликтует с уже существующим решением в коде — **спросить, не догадываться**.

Проект — **учебная практика**, но это не повод халтурить: каждая правка должна быть прод-качества.

---

## 1. Stack (canonical)

- **Build:** Vite 6 + SWC. **Это НЕ Next.js** — никаких `next/image`, `next/head`, `next/router`, app router.
- **UI:** React 19, TypeScript 5.9 strict
- **Styles:** Tailwind CSS v4 (через `@tailwindcss/vite`); тема в `@theme {}` блоке `src/index.css` + namespaced CSS файлы в `src/styles/`
- **Routing:** `react-router-dom` v7 (`<BrowserRouter>` в `main.tsx`, не в `App.tsx`)
- **Animation:** `framer-motion` 12 (доступно, использовать сдержанно)
- **Icons:** `lucide-react` (≥ 0.563)
- **State:** локальный + custom hooks с localStorage-синхронизацией (`useFavorites`, `useExclusions`, `useCooked`, `useRatings`)
- **Auth:** mock на localStorage (`src/services/mockAuth.ts`) — в проде уйдёт за HTTP-слой
- **Языки:** UI/copy — RU. Имена файлов URL-friendly латиницей. Технические комментарии — RU+EN смешанно.

---

## 2. Build & verify

```bash
cd cookify
npx tsc -b --noEmit       # type-check, должен быть exit 0
npx vite build            # production build, должен быть exit 0
npm run lint              # eslint
npm run dev               # vite dev server
```

**Правило проекта:** после значимых правок запускать `tsc -b --noEmit` + `vite build`. Результат (exit code, время) фиксируется в changelog.

---

## 3. Architecture: используй существующее, не переизобретай

### 3.1 Components map

```
src/
  components/
    Cookify.tsx              # MAIN APP-component (tabs, sidebar, recipe list)
    ProtectedRoute.tsx       # роут-гард для /profile
    auth/AuthComponents.tsx  # PasswordField и пр. shared-формы
    contexts/AuthContext.tsx # AuthProvider (mock auth, localStorage)
    layout/Header.tsx        # header с логотипом, поиском, аватаркой/входом
    profile/
      ExclusionsSection.tsx  # секция «Исключения» в профиле
    hooks/
      useFavorites.ts        # Set<id> с localStorage + cross-tab sync
      useExclusions.ts       # string[] исключённых ингредиентов (per userId)
      useCooked.ts           # Set<id> приготовленных + per-recipe rating
      useRatings.ts          # средний рейтинг + кол-во оценок (per recipe)
      useFilteredRecipes.ts  # pure-фильтрация (вся иерархия §5)
      useDrafts.ts           # черновики формы «Загрузить рецепт» (per userId)
  pages/
    HomePage.tsx             # тонкая обёртка над <CookifyApp>
    LoginPage.tsx, RegisterPage.tsx
    ProfilePage.tsx          # avatar / fields / exclusions / change password
    RecipePage.tsx           # Полная карточка /recipe/:id (lazy)
    CookingModePage.tsx      # Режим готовки /recipe/:id/cook (lazy, StepTimer+Tips)
    UploadRecipePage.tsx     # Загрузить рецепт + Черновики /recipe/new (lazy)
  data/
    recipes.ts               # 30+ recipes + filterGroups + sortOptions
    recipeSteps.ts           # шаги рецептов (hero 1:1 Figma + fallback)
  services/
    mockAuth.ts              # mock auth API (localStorage)
    api.ts                   # КОНТРАКТ фронт↔бэк: 6 доменов, JSDoc BACKEND:
  styles/                    # один CSS на компонент-семейство
  types/index.ts             # все типы проекта в одном файле
```

**Правило backend-стабов:** любой новый доступ к данным проходит через
`services/api.ts` (async-сигнатура + JSDoc `BACKEND:` с REST-эндпоинтом).
Не разбрасывать `localStorage.*` по компонентам.

### 3.2 Shared хуки (`src/components/hooks/`)

| Хук | Назначение |
|---|---|
| `useFavorites` | Set ID-ов избранных рецептов. localStorage + cross-tab sync. |
| `useExclusions(userId?)` | Массив исключённых ингредиентов, привязан к userId. |
| `useCooked(userId?)` | Map<recipeId, ratingOrNull> приготовленных рецептов. Per-user storage. |
| `useRatings()` | Глобальный «средний рейтинг + кол-во оценок» по recipeId. Сейчас seed из `recipes.ts`, плюс пользовательские оценки. |

**Правило:** не дублировать localStorage-хуки. Если нужно «список ID-ов c persist'ом» — переиспользуй паттерн `useFavorites` (Set + storage event listener).

### 3.3 Layouts

- `Header.tsx` — единый header (логотип + профиль/вход). **Без пропсов** — поиск по сайту убран; поиск рецептов живёт в тулбаре ленты.
- `Cookify.tsx` — единый «оркестратор» главной: tabs (Рекомендации/Избранное/Приготовлено), sidebar фильтров, лента, sort, search.
- `RecipePage` → CTA «Режим готовки» → `CookingModePage` (роут `/recipe/:id/cook`). Клик по карточке в ленте → `/recipe/:id`. «Загрузить рецепт» → `/recipe/new`.
- ProfilePage / LoginPage / RegisterPage / Recipe* — самостоятельные страницы со своим header'ом.

---

## 4. CSS архитектура

### 4.1 Намspaces (по контекстам)

| Префикс | Где |
|---|---|
| `.ck-*` | главная (Cookify): tabs, sidebar, recipe cards, controls, modals — `styles/cookify.css` |
| `.header__*` | header — `styles/header.css` |
| `.profile-*`, `.profile-exclusions*` | профиль и его модалка — `styles/profile.css` |
| `.auth-*` | формы входа/регистрации — `styles/auth.css` |
| `.rp-*` / `.cm-*` / `.ur-*` / `.ck-timer*` / `.ck-tips*` / `.ck-step*` | Полная карточка / Режим готовки / Загрузить рецепт — `styles/recipe.css` |

**Импорт:** каждая страница / компонент импортирует свой CSS напрямую (`import '@/styles/cookify.css'`). Глобально подключён только `index.css` через `main.tsx`.

### 4.2 Design tokens (CSS custom properties в `cookify.css`)

```
--ck-bg          #FFFFF7  основной фон (тёплый кремовый)
--ck-accent      #E47809  оранжевый акцент (CTA, активные ссылки)
--ck-accent-hover #C96704
--ck-accent-soft rgba(228, 120, 9, 0.12)
--ck-green       #33624C  зелёный акцент (чек, активные пилюли, чипсы)
--ck-green-hover #284F3C
--ck-block       #FFF4BE  фон блоков
--ck-ink         #2C1605  основной текст / иконки / обводка
--ck-muted       #6B6355
--ck-muted-2     #9C9585
--ck-line        #E8E4DD  светлая линия
--ck-line-strong #D1CCBF
--ck-surface     #FFFFFF
--ck-surface-2   #F5F3EF
--ck-cream       #FBF5E6  фон модалок (Figma Frame 69)
```

CSS namespace `.ck-ingmodal__*` — модалка «Добавить ингредиенты» (Frame 69),
свой namespace (не использует базу `.ck-confirm`).

**Правило:** хардкод произвольных hex — нельзя. Используй токен.

### 4.3 Шрифт

`Nunito` (Google Fonts), через `body { font-family }` в `index.css`. 400 / 600 / 700 / 800 веса.

---

## 5. Filtering hierarchy (КРИТИЧНО — из ТЗ)

> Это самое сложное место в приложении. Игнорировать = регрессия.

Лента формируется в **этом порядке приоритета** (см. §ВНИМАНИЕ в `Use cases_User Story.docx`):

1. **Сортировка** — применяется ВСЕГДА последней, к уже отфильтрованному результату.
2. **Выбранные ингредиенты** (модалка «Ингредиенты», условие **ИЛИ** между ингредиентами): рецепт остаётся, если **хотя бы один** ингредиент совпал с любым из выбранных.
3. **Исключённые ингредиенты** (профиль, условие **И** между исключениями): рецепт удаляется, если содержит **любой** из исключённых.
   - **Важно:** если ингредиент явно выбран пользователем в (2), он **бьёт** исключения — рецепт остаётся.
4. **Фильтры ленты** (sidebar, теги по группам):
   - Внутри группы:
     - `Время приёма` → **ИЛИ**
     - `Праздники` → **ИЛИ**
     - `Национальные кухни` → **ИЛИ**
     - `Особое питание` → **И**
     - `Вкус` → **И**
   - Между группами — всегда **И**.

Между табами (Рекомендации / Избранное / Приготовлено) и поисковой строкой — фильтрация дополнительная (intersection).

Реализация — в `getFilteredRecipes(...)` (в `Cookify.tsx` или вынесенный pure-функцией). Любая правка фильтрации **обязана** соответствовать этой иерархии.

---

## 6. Performance & accessibility (зелёная зона)

| Метрика | Цель | Как держим |
|---|---|---|
| **LCP** | < 2.5s | Recipe images `loading="lazy"`, decoding="async", explicit width/height. |
| **CLS** | < 0.1 | Всегда `aspect-ratio` на медиа, reserve space. |
| **INP** | < 200ms | `useMemo` на тяжёлой фильтрации, `useCallback` на хэндлерах в хот-листах, `memo()` на RecipeCard. |

**A11y (WCAG 2.2 AA):**
- Семантика: `<nav>`, `<main>`, `<article>`, `<button>` vs `<a>`.
- 1 `<h1>` на страницу.
- ARIA — только когда семантика не покрывает (`aria-label`, `aria-expanded`, `aria-pressed`, `aria-live`, `role="alertdialog"`).
- Keyboard: Tab order, `:focus-visible`, Esc закрывает модалки, focus в модалке не уходит наружу (минимум — autofocus на «Отмена» в confirm).
- Контраст ≥ 4.5:1.
- `prefers-reduced-motion` → анимации сокращены (есть глобальный media query в `cookify.css`).
- Все интерактивы имеют accessible name.

---

## 7. UX-копирайт (RU)

- CTA: глагол + ценность («Сохранить», «Применить», «Отправить оценку»).
- Loading / empty / error — все три состояния обработаны.
- Inline-валидация форм (email, password, etc) через `validators` в `mockAuth.ts`.
- Подтверждения деструктивных действий (удаление из избранного / приготовленного) — через `<ConfirmModal>`-паттерн с focus на «Отмена» по дефолту.
- Микро-анимации: 150–300 ms, ease-out. Сдержанные.

---

## 8. Anti-patterns общие (никогда)

- `<div onClick>` вместо `<button>`
- `!important` в Tailwind/CSS без крайней нужды
- Inline `style={}` для постоянных стилей (только для динамических координат, как portal positioning)
- `any` / `as unknown as` / `@ts-ignore` для «быстрого фикса»
- `useEffect` для того, что выводится в render
- `useState` для того, что выводится из props
- Дублирующийся state (single source of truth)
- Хардкод цветов/spacing вместо `--ck-*` токенов
- Создание нового хука для localStorage-persisted списка вместо переиспользования паттерна `useFavorites`
- Ломать иерархию фильтрации из §5

---

## 9. Documentation discipline (обязательно после правок)

### 9.1 Backlog — `reports/backlog.md`

Единый список задач со сквозной нумерацией. Чекбоксы:
- `- [ ]` — в работе / ждёт
- `- [x]` — сделано
- `- [~]` — отменено

После завершения задачи: поменять `- [ ]` на `- [x]` в её строке, опционально с reference на changelog `(#XX.Y)`.

### 9.2 Changelog (по неделям)

**Путь:** `reports/{ГОД}/week{N}_{MM-DD}_to_{MM-DD}/{MM-DD}_changelog.md`

Неделя считается с понедельника. Если файл за сегодня уже есть — **дополнять**, продолжая нумерацию (`#1.1` → `#1.2` или `#2.1` для нового блока).

**Структура файла** (берём ровно как в DirectStudio, см. эталон в `C:\WEB\Websites\directStudio\directstudio\docs\reports\2026\week3_05-01_to_05-07\05-02_changelog.md`):

```markdown
# {ДД месяца ГГГГ} — Changelog

**Тема дня ({MM-DD}):**
1–2 абзаца + bullet list ключевых изменений.

Задачи от пользователя:
> 1. {оригинальная формулировка пользователя}
> 2. ...

---

## 📋 Содержание

| # | Запрос | Где менялось | Что изменено |
|---|---|---|---|
| **X.Y** | ... | `файл.tsx`, `файл.css` | краткое summary |

---

## X.Y — {название}

### Что было
{исходное состояние}

### Решение / Fix
{что сделал, с кодом}

### Files
- `путь/файл.tsx`

### Build verification
`npx vite build` → exit 0, X.Xs.

---

## 🔧 Build verification (итог дня)
- `npx tsc -b --noEmit` → exit 0
- `npx vite build` → exit 0, X.Xs

## ❓ Что осталось из backlog
(см. [backlog.md](../../backlog.md))

## 💡 Что дальше (suggestions)
1. ...
```

### 9.3 Index

`reports/{ГОД}/index.md` — общий индекс по неделям. Обновлять при открытии новой недели.

---

## 10. Folder map

```
cook/                              # корень репо
  CLAUDE.md                        # этот файл
  cookify/                         # сам Vite-проект
    package.json
    vite.config.ts
    index.html
    public/
    src/
      App.tsx, main.tsx, index.css, vite-env.d.ts
      components/                  # см. §3.1
      pages/
      data/recipes.ts
      services/mockAuth.ts
      styles/                      # один CSS на компонент-семейство
      types/index.ts
      assets/
  reports/
    backlog.md                     # задачник + список выполненного
    {ГОД}/
      index.md
      week{N}_{MM-DD}_to_{MM-DD}/
        {MM-DD}_changelog.md
```

---

## 11. Misc constraints

- **AuthProvider** — обязан быть **внутри** роутера (`<BrowserRouter>` в `main.tsx`, `<AuthProvider>` в `App.tsx`).
- **localStorage keys** — все под префиксом `cookify:`, опционально с `:userId` суффиксом для персональных данных:
  - `cookify:users`, `cookify:session`, `cookify:pending` — auth
  - `cookify:favorites` — избранное (без userId, т.к. до auth не привязывалось)
  - `cookify:exclusions:{userId}` — исключения профиля
  - `cookify:cooked:{userId}` — приготовленные рецепты + оценки
  - `cookify:ratings` — глобальные usercount-оценки по рецептам (для пересчёта среднего)
- **Recipe images** — берём с Unsplash (deterministic photo IDs, не random). Fallback: 🍽️-эмодзи в `.ck-card__fallback`.
- **ProtectedRoute** — рендерит `null` пока не определён `user`; если `user === null` → редирект на `/login`.

---

## 12. Working protocol для каждой задачи

1. **Понять** — прочитать `reports/backlog.md`; найти текущую задачу. Прочитать **последний** changelog для контекста и нумерации.
2. **Спланировать** — 1–3 строки: что делаю, какие хуки/компоненты переиспользую, какие риски (фильтрация, a11y).
3. **Реализовать** — production-ready код, без `any`/`@ts-ignore`, с использованием существующей архитектуры (§3, §5).
4. **Проверить** — `npx tsc -b --noEmit` + `npx vite build`. Зафиксировать exit-коды/время.
5. **Задокументировать** — обновить changelog (новая `#X.Y` секция) + backlog (чекбокс).
6. **Self-check** (см. §13).

---

## 13. Self-check перед выдачей кода

- [ ] 320px — без горизонтального скролла?
- [ ] Keyboard nav + visible focus-ring?
- [ ] Контраст ≥ 4.5:1?
- [ ] Нет лишних re-renders (memo + useCallback в hot-path)?
- [ ] Нет `any` / `@ts-ignore`?
- [ ] Семантические теги (`<button>`, `<nav>`, `<main>`, etc)?
- [ ] Изображения с lazy + alt + width/height?
- [ ] Использовал shared-хук / компонент, не дублировал?
- [ ] Не сломал иерархию фильтрации §5?
- [ ] `npx tsc -b --noEmit` exit 0?
- [ ] `npx vite build` exit 0?
- [ ] Changelog (#X.Y) + backlog обновлены?

Если что-то не сходится — фикс до выдачи.

---

## 14. Maintenance log

Журнал изменений CLAUDE.md. Самые свежие — сверху.

| Дата | Раздел(ы) | Что изменилось | Триггер |
|---|---|---|---|
| 2026-05-19 | §3.1, §3.3, §4.1, §4.2 | +3 страницы (Recipe/CookingMode/Upload, lazy) + `useDrafts` + `recipeSteps.ts` в folder map; namespace `.rp-*/.cm-*/.ur-*/.ck-timer*/.ck-tips*/.ck-step*` (`styles/recipe.css`); токен `--ck-ink-strong`; Header без пропсов | новые страницы/хук/CSS-namespace/токен (sync, #4.x) |
| 2026-05-19 | §3.1, §4.2 | Добавлен `services/api.ts` (backend-контракт) + правило «доступ к данным через api.ts»; токен `--ck-cream` + namespace `.ck-ingmodal__*` | новый shared-модуль + новый design token (sync с реальностью кода, #2.1/#2.3) |
| 2026-05-02 | initial | Создан CLAUDE.md (13 разделов + maintenance log) | bootstrap по запросу |

**Last updated:** 2026-05-19
