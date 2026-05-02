# 2 мая 2026 — Changelog

**Тема дня (05-02):**
Большой стартовый день. Поднят полноценный CLAUDE.md по эталону
`directStudio`, расширен справочник рецептов (6 → **36** записей с
покрытием всех фильтров), добавлены три новых хука, реализована полная
иерархия фильтрации из ТЗ и воссоздан макет «Приготовлено» один-в-один
со скриншота. Добавлена модалка «Кнопка Ингредиенты».

Ключевые изменения:
- `CLAUDE.md` — единый «контракт» проекта (13 разделов + maintenance log).
- `data/recipes.ts` — 36 рецептов, новая типизация `RecipeFilters`,
  `sortOptions`, `allIngredientNames`.
- `components/hooks/` — добавлены `useCooked`, `useRatings`,
  `useFilteredRecipes`.
- `components/Cookify.tsx` — полная переработка под новые данные/хуки,
  таб «Приготовлено» переписан с RecipeCard-сетки на список
  `<CookedRow>` со шкалой оценки и общим рейтингом.
- `styles/cookify.css` — добавлены стили для `.ck-cooked-row*`,
  `.ck-stars*`, `.ck-ingmodal*`, `.ck-card__cook-btn*`,
  `.ck-card__time`, `.ck-confirm--wide`, `.ck-chip--accent`,
  `.ck-chip--muted`, `.ck-confirm__btn--primary`.
- `reports/` — заведена папка с этим changelog'ом + индексом + backlog'ом.

Задачи от пользователя:
> 1. Изучить .docx, доделать сайт по ним, сделать нужный функционал
>    (бэкенд сделай заглушками). Делай четко и внимательно, с лучшими
>    практиками. Пиши сразу чистый код, отличную оптимизацию,
>    accessibility, адаптивность.
> 2. Воссоздать макет «Приготовлено» (по скриншоту), добавить функционал
>    добавления приготовленных блюд, систему рейтинга (заполни своими
>    значениями) и увеличь количество блюд на сайте.
> 3. Сделай все нужные фильтрации, чтобы они реально работали — учёт
>    исключений из профиля, фильтры слева, добавь блюд 30+, фото
>    сгенерируй или возьми из интернета, плюс функционал сортировки.
> 4. Сделай папку reports с отчётами по неделям + backlog.md что уже
>    сделано и какие улучшения добавить (как в DirectStudio).

---

## 📋 Содержание

| #     | Запрос                                          | Где менялось                                                                | Что изменено                                                                                          |
|-------|--------------------------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| **1.1** | CLAUDE.md по эталону DirectStudio              | `CLAUDE.md`                                                                 | Создан 13-разделный гайд + maintenance log + reports-структура.                                       |
| **1.2** | Расширение справочника рецептов до 30+         | `src/data/recipes.ts`, `src/types/index.ts`                                 | 6 → 36 рецептов; новые поля `displayTags`, `filters` (machine-readable IDs), `ratingCount`; `SortId`, `sortOptions`, `allIngredientNames`. |
| **1.3** | Хуки персистенции                                | `src/components/hooks/useCooked.ts`, `useRatings.ts`                        | Per-user «Приготовлено» + Map оценок, глобальный аггрегат seed + user-submissions с CRUD методами.    |
| **1.4** | Pure-функция фильтрации (полная иерархия из ТЗ)  | `src/components/hooks/useFilteredRecipes.ts`                                | Sort → ingredients (OR) → exclusions (AND, с правилом «явный ингредиент бьёт исключение») → sidebar (per-group AND/OR + cross-group AND) → search → tab. |
| **1.5** | Главная переписана под новые данные/хуки         | `src/components/Cookify.tsx`, `src/styles/cookify.css`                      | Импорт из `data/recipes.ts`; кнопка «Приготовлено» на карточке; время готовки в футере; чипсы для exclusions / chosen ingredients; модалка «Ингредиенты». |
| **1.6** | Таб «Приготовлено» one-to-one со скриншотом      | `src/components/Cookify.tsx`, `src/styles/cookify.css`                      | `<CookedList>` + `<CookedRow>` (3 колонки: card / rate / aggregate+delete), интерактивный `<StarRating>`, ConfirmModal на удаление, auth-gate на закрытых табах. |
| **1.7** | Reports + backlog                                | `reports/backlog.md`, `reports/2026/index.md`, `reports/.../05-02_changelog.md` | Структура отчётов по неделям, как в DirectStudio.                                                     |

---

## 1.1 — CLAUDE.md по эталону DirectStudio

### Что было
В корне `cook/` не было `CLAUDE.md`. Каждый чат начинался с нуля,
без знаний о стеке, токенах, иерархии фильтрации.

### Решение / Fix
Написан `CLAUDE.md` (13 разделов + maintenance log) по эталону
`C:\WEB\Websites\directStudio\CLAUDE.md`, с адаптацией под Cookify:
- §1 Stack — Vite 6 + React 19 + Tailwind v4 + RR v7 + lucide-react.
- §2 Build & verify — команды и правило «после правок — `tsc -b --noEmit` + `vite build`».
- §3 Architecture — карта компонентов / shared хуков / layouts.
- §4 CSS архитектура — namespaces (`.ck-*`, `.header__*`, `.profile-*`,
  `.auth-*`) + design tokens.
- **§5 Filtering hierarchy — критичный раздел, описывающий
  иерархию фильтрации из ТЗ** (sort → chosen ingredients → exclusions
  → sidebar groups), правило «явный ингредиент бьёт исключение»,
  внутри-группы AND/OR (mealType/occasions/cuisine = OR, health/taste = AND),
  между группами всегда AND.
- §6 Performance & accessibility — целевые CWV + правила a11y.
- §8 Anti-patterns — список запретов.
- §9 Documentation discipline — формат backlog/changelog.
- §10 Folder map.
- §11 Misc constraints — порядок `<BrowserRouter>` / `<AuthProvider>`,
  ключи localStorage, ProtectedRoute.
- §12 Working protocol per task.
- §13 Self-check checklist.
- §14 Maintenance log.

### Files
- `CLAUDE.md` (новый)

---

## 1.2 — Расширение справочника рецептов до 30+

### Что было
В проекте было два конфликтующих источника рецептов: `data/recipes.ts`
(6 записей с полем `tags: string[]`) и инлайн-массив `RECIPES` в
`Cookify.tsx` (15 записей с другим shape'ом). Фильтрация через теги
работала «как-нибудь» — теги были человекочитаемыми строками
(«ПП», «БЕЗ ЛУКА»), а filter group options использовали машинные ID
(`breakfast`, `vegan`). Связи между ними не было — sidebar-фильтры
просто не работали.

### Решение / Fix
1. **Один источник правды.** Из `Cookify.tsx` удалены инлайн-данные,
   всё импортируется из `data/recipes.ts`.
2. **Новая модель Recipe** в `types/index.ts`:
   ```ts
   interface Recipe {
     // ... title, image, КБЖУ, cookTime ...
     rating: number          // seed average
     ratingCount: number     // seed count (новое поле!)
     displayTags: string[]   // RU UPPERCASE для карточки
     filters: RecipeFilters  // machine-readable IDs по группам
     ingredients: Ingredient[]
   }
   type RecipeFilters = Record<FilterGroupId, string[]>
   type FilterGroupId = 'mealType' | 'occasions' | 'health' | 'cuisine' | 'taste'
   ```
3. **36 рецептов** с покрытием всех фильтров: 5 супов, 5 завтраков,
   5 итальянских, 3 грузинских, 6 русских (включая Оливье/Селёдку под
   шубой/Блины Масленичные/Кулич Пасхальный/Торт Наполеон), 3 индийских,
   4 диетических (греческий салат, киноа-боул, лосось, куриная грудка
   на гриле), 3 десерта, 2 перекуса. Каждый рецепт имеет правдоподобный
   набор `filters`.
4. **`sortOptions`** — 7 вариантов из ТЗ (по умолчанию, рейтинг ↑↓,
   КБЖУ ↑↓, время ↑↓).
5. **`allIngredientNames`** — уникальный список ингредиентов из всех
   рецептов (для подсказок в модалке «Ингредиенты»).
6. Изображения — Unsplash deterministic photo IDs через helper:
   ```ts
   const img = (id: string) =>
     `https://images.unsplash.com/${id}?w=720&h=400&fit=crop&auto=format&q=80`
   ```
   На случай 404 в `RecipeCard` уже есть fallback `<div>🍽️</div>`.

### Files
- `src/data/recipes.ts` (полностью переписан, ~620 строк)
- `src/types/index.ts` (новые поля + типы)

---

## 1.3 — Хуки персистенции `useCooked` / `useRatings`

### Что было
Был только `useFavorites` (Set ID-ов в localStorage). Для «Приготовлено»
+ оценок ничего не было — в старом `Cookify.tsx` стояла заглушка
`const [cooked] = useState<Set<string>>(new Set())`, ничего не сохранялось.

### Решение / Fix
Два новых хука по паттерну `useFavorites` (storage write на изменение,
cross-tab sync через storage event listener):

#### `useCooked(userId?)` (`src/components/hooks/useCooked.ts`)
- Per-user storage: `cookify:cooked:{userId}` (или `cookify:cooked` для
  гостей).
- Тип: `Record<recipeId, ratingOrNull>`. Null важен — пользователь может
  отметить блюдо приготовленным до того, как поставит оценку.
- API: `add(id) / remove(id) / rate(id, 1..5) / unrate(id) / has(id) / ratingOf(id)`.
- При смене userId — перечитывает storage в useEffect.

#### `useRatings()` (`src/components/hooks/useRatings.ts`)
- Глобальный (не per-user) ключ `cookify:ratings` хранит **только**
  массивы пользовательских оценок: `Record<recipeId, number[]>`.
- На чтение `getRating(id)` подмешивает seed:
  ```
  average = (recipe.rating × recipe.ratingCount + Σ user ratings) / (recipe.ratingCount + user count)
  count = recipe.ratingCount + user count
  ```
- API: `submit(id, value) / replace(id, prev, next) / withdraw(id, value) / getRating(id)`.
- `replace` нужен для «изменить оценку»: убирает старое значение,
  добавляет новое — агрегат пересчитывается.
- `withdraw` — на случай удаления из «Приготовлено» (если оценка была,
  снимаем её из агрегата).

### Files
- `src/components/hooks/useCooked.ts` (новый)
- `src/components/hooks/useRatings.ts` (новый)

---

## 1.4 — Pure-функция фильтрации (полная иерархия из ТЗ)

### Что было
В старом `Cookify.tsx` `visibleRecipes` считалось inline-`useMemo`'ом —
поиск работал, sort работал, но фильтры sidebar'а **в визуал не
влияли вообще**. Нет учёта исключений из профиля. Нет модалки
«Ингредиенты» → нет фильтра по ингредиентам.

### Решение / Fix
Новый хук `useFilteredRecipes(...)` (`src/components/hooks/useFilteredRecipes.ts`)
реализует **полную иерархию из ТЗ** (см. CLAUDE.md §5):

```
list = recipes
1. Фильтр по табу (favorites / cooked).
2. Фильтр по поиску (name / desc / tags / ingredients, case-insensitive).
3. Фильтр по sidebar group:
     внутри группы — AND/OR по таблице GROUP_LOGIC,
     между группами — всегда AND.
4. Фильтр по exclusions (AND между exclusion'ами):
     рецепт выкидывается, если содержит ХОТЯ БЫ ОДИН exclusion,
     НО если этот ингредиент явно выбран в chosen — exclusion бьётся.
5. Фильтр по chosen ingredients (OR):
     рецепт остаётся, если содержит ХОТЯ БЫ ОДИН выбранный ингредиент.
6. Sort (rating / calories / time, asc/desc; popular = original order).
```

```ts
const GROUP_LOGIC: Record<FilterGroupId, 'AND' | 'OR'> = {
  mealType: 'OR',
  occasions: 'OR',
  cuisine: 'OR',
  health: 'AND',
  taste: 'AND',
}
```

Sub-string match для ингредиентов (case-insensitive +
`includes()` в обе стороны), чтобы «Помидоры» матчилось с «помидор» и т.д.

Хук принимает `ratingFor: (id) => snapshot` — DI'ит вход агрегатной
оценки извне (из `useRatings`), чтобы сортировка по рейтингу видела
актуальные значения.

### Files
- `src/components/hooks/useFilteredRecipes.ts` (новый)

---

## 1.5 — Главная переписана под новые данные/хуки

### Что было
`Cookify.tsx` имел inline-данные, не использовал exclusions из профиля,
не имел кнопки «Приготовлено», не имел модалки «Ингредиенты». В UX-теле
не отрисовывались чипсы для chosen ingredients и exclusions.

### Решение / Fix
- Импорт всего из `data/recipes.ts` (recipes / filterGroups / sortOptions
  / allIngredientNames / SortId).
- Подключены новые хуки: `useExclusions(user?.id)`, `useCooked(user?.id)`,
  `useRatings()`, `useFilteredRecipes(...)`.
- В `RecipeCard`:
  - В футер добавлено время готовки `⏱ N мин`.
  - Добавлена кнопка «Приготовлено» (`Plus` icon, при клике → `addCooked(id)`,
    после клика становится зелёной с галочкой и disabled). Скрывается через
    проп `showCookButton={false}` в табе «Приготовлено» (там уже сама
    карточка показана внутри `<CookedRow>`).
- Чипсы под title-row отрисовывают:
  - выбранные ингредиенты (зелёные с `+`),
  - исключения из профиля (приглушённые с `−`, `cursor: default` —
    управляются на странице профиля),
  - sidebar-фильтры (зелёные).
- Модалка «Ингредиенты» (`<IngredientsModal>`):
  - Поле ввода через запятую, парсинг case-insensitive.
  - Список «Используемые продукты» с галочками-чипсами.
  - `<details>` «Подсказки из базы рецептов» с первыми 30 ингредиентами.
  - Кнопки «Отмена» / «Сохранить» (последняя — оранжевая primary).
- Новая sort-кнопка на табе «Приготовлено» тоже работает.
- `auth-gate`: на табах «Избранное» и «Приготовлено» для неавторизованных
  юзеров — empty-state «🔒 Войдите, чтобы продолжить» (соответствует ТЗ).
- Empty-state на «Рекомендации» обновлён под формулировку ТЗ:
  «рецептов с такими условиями нет или возможно была допущена ошибка
  при формировании списка фильтров».

### Files
- `src/components/Cookify.tsx` (полностью переписан, ~960 строк)
- `src/styles/cookify.css` (добавлены `.ck-card__cook-btn*`,
  `.ck-card__time`, `.ck-chip--accent/--muted`, `.ck-confirm--wide`,
  `.ck-confirm__btn--primary`)

---

## 1.6 — Таб «Приготовлено» one-to-one со скриншотом

### Что было
Таб «Приготовлено» использовал ту же сетку `<RecipeCard>`-ов, что и
«Рекомендации». Шкалы оценки нет, кнопки «Удалить»/«Оценить»/«Изменить
оценку» нет.

### Решение / Fix
Новый компонент `<CookedList>` + `<CookedRow>` — реализует макет
со скриншота:

- 3 колонки на десктопе (`grid-template-columns: minmax(280px, 380px) 1fr minmax(180px, 220px)`):
  1. Карточка рецепта (`<RecipeCard showCookButton={false}>`).
  2. «Оценить рецепт?» / «Ваша оценка» — `<StarRating>` (1..5) +
     кнопка «Отправить оценку» / «Изменить оценку» + опционально
     «Спасибо!» под шкалой.
  3. «Общий рейтинг» — `⭐ 4.98 / 121 оценка` (число и «оценка/оценки/оценок»
     согласовано по правилам RU plurals) + кнопка «Удалить» (с trash icon).
- На мобилке колонки складываются в стек (1fr).

`<StarRating>` — отдельный компонент:
- 5 кнопок-звёзд, hover-превью (заполнение по hover N).
- Keyboard: ← / → меняет, Tab фокусит группу, Enter/Space на стрелке-кнопке.
- `role="radiogroup"` / `role="radio"` (или `role="img"` в readOnly).
- В readOnly стиле — без hover-эффектов и cursor: default.

Поток оценки:
- Пустая шкала (userRating=null) → editing=true, можно кликать звёзды.
  Кнопка «Отправить оценку» disabled пока draftRating=null.
- После клика «Отправить» → `onSubmitRating(id, null, 5)` →
  `submitRating(id, 5) + rateCooked(id, 5)` → шкала становится readonly,
  показывается «Спасибо!» + кнопка «Изменить оценку».
- Клик «Изменить оценку» → editing=true, выбор → «Отправить» →
  `onSubmitRating(id, 5, 4)` → `replaceRating(id, 5, 4) + rateCooked(id, 4)`.
- Клик «Удалить» → ConfirmModal с текстом из ТЗ
  («Хотите удалить рецепт из списка приготовленных?...») →
  `withdrawRating(id, prevRating)` (если был) + `removeCooked(id)`.

Empty-state:
- Когда «Приготовлено» пустое — «🍳 Здесь пока пусто» + подсказка.

### Files
- `src/components/Cookify.tsx` (CookedList + CookedRow + StarRating + ConfirmModal)
- `src/styles/cookify.css` (добавлены `.ck-cooked-list`, `.ck-cooked-row*`,
  `.ck-stars*`)

---

## 1.7 — Reports + backlog

### Что было
В корне репозитория не было ни `reports/`, ни `backlog.md` — нет места
для changelog'ов и список «что сделано / что в планах».

### Решение / Fix
Заведена структура по эталону DirectStudio:
```
reports/
  backlog.md                                  ← список задач (этот файл)
  2026/
    index.md                                  ← хронологический индекс
    week3_05-01_to_05-07/
      05-02_changelog.md                      ← этот файл
```

`backlog.md` содержит:
- Раздел «✅ Сделано» с группировкой по тематическим бакам #1–#5
  (bootstrap / data / hooks / Cookify / Cooked tab) и сквозной нумерацией
  `#X.Y`.
- Раздел «🚧 В работе» (пустой пока).
- Раздел «📝 Бэклог» с #6–#15 темами на будущее (Полная карточка,
  Режим готовки, Загрузка рецепта, бэк, перф, тесты, SEO).
- Раздел «💡 Идеи» — nice-to-have'ы (drag&drop фото, голосовой режим,
  шеринг, дневник питания, обратный поиск «что есть в холодильнике»).

### Files
- `reports/backlog.md` (новый)
- `reports/2026/index.md` (новый)
- `reports/2026/week3_05-01_to_05-07/05-02_changelog.md` (этот файл)

---

## 🔧 Build verification (итог дня)
- `npx tsc -b --noEmit` → exit 0
- `npx vite build` → exit 0, **5.62s**, 1740 модулей
  - bundle: `index-DqION6li.js` **284.85 kB / 85.14 kB gzip**
  - css:    `index-4nAOQ6Sp.css` **54.29 kB / 9.99 kB gzip**

## ❓ Что осталось из backlog
См. [backlog.md](../../backlog.md) — разделы #6–#15 + «Идеи».
Главные большие куски на завтра:
- Полная карточка рецепта (`/recipe/:id`).
- Режим готовки (с таймерами).
- Шаблон загрузки рецепта (с черновиками + проверкой уникальности).

## 💡 Что дальше (suggestions)
1. **Полная карточка рецепта** — сейчас клик по карточке ничего не
   делает. По ТЗ карточка ленты ведёт на `/recipe/:id`, на ней есть
   кнопка «Режим готовки» (отдельная страница с таймерами). Это самое
   крупное оставшееся в скоупе ТЗ.
2. **Загрузить рецепт** — сейчас CTA-кнопка есть только в верхнем
   toolbar'е и ничего не делает. По ТЗ — отдельная страница с шаблоном
   по блокам (описание / инструкция / проверка), с черновиками.
3. **Подтверждение почтой при смене email/пароля** — `mockAuth`
   уже умеет генерить коды (`register/resendCode/verifyCode`),
   но `updateProfile` сейчас меняет email без подтверждения.
4. **Виртуализация списка** — при 36 рецептах ещё нормально, но при
   N > 100 будут тормоза. `react-window` решит.
