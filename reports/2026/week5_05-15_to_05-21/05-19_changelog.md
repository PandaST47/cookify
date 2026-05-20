# 19 мая 2026 — Changelog

**Тема дня (05-19):**
Сверка реализации с Figma-макетом «Веб-платформа для кулинарных рецептов»
и доводка до 1:1 по тем экранам, что есть в макете. Доступ к Figma MCP
получить не удалось (аккаунт `dev@jet.style` ≠ владелец файла, у заказчика
нет платной подписки для шаринга в MCP), поэтому работа велась по детальным
скриншотам макета из начала проекта (Приготовлено, рейтинг-компоненты в 3
состояниях, Frame 69 «Добавить ингредиенты», сайдбар фильтров + Frame 57
«Показать сначала»). Плюс заложен слой backend-контракта с комментариями
для бэкенд-разработчика и почищены реальные code-quality замечания линтера.

Ключевые изменения:
- **API-контракт `services/api.ts`** — единственная точка доступа к данным
  для фронта; сейчас заглушки на localStorage, в каждой функции JSDoc
  `BACKEND:` с реальным REST-эндпоинтом, методом и форматом.
- **Рейтинг 1:1 с Figma** — разведены 3 состояния: «Оценить рецепт?» →
  транзиентное «Спасибо!» (без кнопки) → «Ваша оценка» + «Изменить оценку».
- **Frame 69** — модалка «Добавить ингредиенты» перевёрстана под макет
  (кремовая карточка, крупный радиус, pill-инпут, «Сохранить» справа-снизу).
- **Frame 57** — сортировка получила заголовок «Показать сначала» +
  radio-маркеры, точные подписи из ТЗ.
- **«Показать ещё»** в группе «Праздники» (+ Рождество, Другой праздник)
  с привязкой к рецептам.
- **Code quality** — устранены 2 ошибки линтера (setState синхронно
  в effect → каскадные ре-рендеры) через паттерн React
  «adjust state during render»; убраны мёртвые eslint-disable.

Задачи от пользователя:
> 1. Перейти по ссылке Figma, всё изучить, внести обновления в код.
> 2. Дорабатываем функционал (бэкенд — заглушки + комментарии для
>    бэкендера), улучшаем фронтенд + качество кода.
> 3. Обязательно сравнить через Playwright, что весь функционал и UI/UX
>    сделан и соблюдён.
> 4. Не забываем changelog.

---

## 📋 Содержание

| #     | Запрос                                                    | Где менялось                                                          | Что изменено |
|-------|-----------------------------------------------------------|-----------------------------------------------------------------------|--------------|
| **2.1** | Backend-заглушки + комментарии для бэкендера             | `src/services/api.ts` (новый), `src/services/mockAuth.ts`, `src/vite-env.d.ts` | Слой API-контракта: 6 доменов (recipes/favorites/cooked/ratings/exclusions/auth), JSDoc `BACKEND:` на каждый эндпоинт. |
| **2.2** | Рейтинг 1:1 с Figma (3 состояния)                         | `src/components/Cookify.tsx`                                           | `CookedRow`: «Оценить рецепт?» → «Спасибо!» (транзиент) → «Ваша оценка»/«Изменить оценку». |
| **2.3** | Frame 69 «Добавить ингредиенты»                           | `src/components/Cookify.tsx`, `src/styles/cookify.css`                 | Перевёрстана под макет: кремовая карточка, pill-инпут, «Сохранить» справа-снизу, namespace `.ck-ingmodal__*`. |
| **2.4** | Frame 57 «Показать сначала» + точные подписи              | `src/components/Cookify.tsx`, `src/data/recipes.ts`, `src/styles/cookify.css` | Заголовок дропдауна, radio-маркеры, `time_*` подписи «(сначала быстрые/длительные)». |
| **2.5** | «Показать ещё» в фильтрах                                  | `src/data/recipes.ts`, `src/types/index.ts`, `src/components/Cookify.tsx`, `src/styles/cookify.css` | `showMoreAfter` у группы «Праздники» + Рождество/Другой праздник + теги на 5 рецептах. |
| **2.6** | Качество кода (lint errors)                                | `src/components/Cookify.tsx`, `src/services/mockAuth.ts`              | 2 ошибки eslint (sync setState в effect) → паттерн «adjust state during render»; чистка eslint-disable. |
| **3.1** | Убран «Поиск по сайту» из Header                          | `src/components/layout/Header.tsx`, `src/components/Cookify.tsx`, `src/pages/ProfilePage.tsx`, `src/styles/header.css` | Поиск и пропсы `search`/`onSearchChange` удалены целиком; в Cookify остался один `recipeSearch`; мёртвый CSS вычищен. |
| **3.2** | Дропдаун сортировки → размер Figma 426×329                | `src/styles/cookify.css`                                              | `.ck-sort__menu` fixed 426×329 (раньше 192px), flex-распределение строк, убрана зелёная заливка строки → только зелёный radio (Frame 57). |
| **4.1** | Доступ к Figma через REST API (PAT)                       | —                                                                     | Chrome-extension/MCP не пускали → пользователь дал Personal Access Token, вытащил PNG-рендеры + JSON-структуру (размеры/цвета/шрифты) всех 4 экранов. |
| **4.2** | Полная карточка рецепта `/recipe/:id`                     | `src/pages/RecipePage.tsx` (new), `src/styles/recipe.css` (new)        | 1:1 Figma «Полная карточка» 663:5376: hero, рейтинг+badge+heart, КБЖУ/время, теги, порции-stepper (скейлит ингредиенты), CTA «Перейти в режим готовки». |
| **4.3** | Режим готовки `/recipe/:id/cook`                          | `src/pages/CookingModePage.tsx` (new), `src/styles/recipe.css`         | 1:1 Figma «Режим готовки 1-4»: stacked шаги (active/faded), `<StepTimer>` 4 состояния (Figma «Таймер»), `<Tips>` collapsible, последний шаг «Готово!» → +Приготовлено. |
| **4.4** | Загрузить рецепт + Черновики `/recipe/new`                | `src/pages/UploadRecipePage.tsx` (new), `src/styles/recipe.css`        | 1:1 Figma 541:5055/652:5152: форма (обложка/параметры/ингредиенты/шаги), блок проверки (автопроверка+уникальность+«я проверил»), вкладка Черновики, exit-confirm. |
| **4.5** | Данные/роутинг/хуки/бэкенд-стабы под новые экраны          | `src/data/recipeSteps.ts` (new), `src/components/hooks/useDrafts.ts` (new), `src/App.tsx`, `src/components/Cookify.tsx`, `src/types/index.ts`, `src/services/api.ts` | `RecipeStep`/`RecipeDraft` типы, шаги 1:1 для hero + fallback, `useDrafts`, lazy-роуты, кликабельные карточки → `/recipe/:id`, BACKEND-комментарии. |
| **5.1** | QA: безопасность загрузки обложки                          | `src/pages/UploadRecipePage.tsx`                                      | Whitelist форматов (PNG/JPG/WEBP/GIF, **SVG отклоняется** — может нести скрипты), лимит 4 МБ, регэксп-проверка `data:image/<raster>`, ошибки в UI (`role="alert"`). |
| **5.2** | QA: устойчивый парсинг черновиков                          | `src/components/hooks/useDrafts.ts`                                   | Вместо слепого `as RecipeDraft[]` — type-guard по скелету (id/title/массивы); подменённый localStorage не роняет UI. |
| **5.3** | QA: доступность                                            | `src/pages/UploadRecipePage.tsx`, `src/styles/recipe.css`            | Exit-модалка: Esc-close + scroll-lock + автофокус на «Сохранить черновик»; `aria-required`/`aria-invalid` на обязательных полях; `aria-live` на блоке «Подытожим». |
| **5.4** | QA: адаптив 320–375px                                       | `src/styles/recipe.css`                                              | Playwright-замер: 320px upload-форма давала 5px overflow → media ≤480px (шринк инпутов, перенос topbar/ингредиентов). Итог: **0px overflow** на всех 4 страницах @375 и @320. |

---

## 2.1 — Backend-контракт `services/api.ts`

### Что было
Фронт ходил за данными напрямую в `localStorage` россыпью внутри хуков
(`useFavorites`, `useCooked`, `useRatings`, `useExclusions`) и `mockAuth`.
Нет единой точки, по которой бэкенд-разработчик понял бы, какие нужны
эндпоинты и в каком формате.

### Решение / Fix
Создан `src/services/api.ts` — **единый seam фронт ↔ бэкенд**:
- Большой заголовочный блок «ДЛЯ БЭКЕНД-РАЗРАБОТЧИКА» с соглашениями
  (база `VITE_API_BASE_URL`, Bearer-токен, формат ошибок `{error:{code,message}}`,
  пагинация `?page=&pageSize=`, ISO-даты).
- 6 доменов, каждая функция async, сейчас тело — заглушка на localStorage
  с искусственной задержкой, **над каждой** — JSDoc вида:
  ```
  BACKEND:  GET {API_BASE}/me/favorites  (auth) → 200 string[]
  ```
  Для: `listRecipes / getRecipe / createRecipe`, `getFavorites / setFavorites`,
  `getCooked / setCooked`, `getUserRatings / setUserRatings`,
  `getExclusions / setExclusions`, и ре-экспорт `authApi` из mockAuth.
- `src/vite-env.d.ts` — типизирован `VITE_API_BASE_URL`.
- В `mockAuth.ts` комментарии к SMTP-местам помечены `BACKEND:`.

Сигнатуры подобраны так, что бэкендеру достаточно заменить тело на
`fetch(...)` — фронт трогать не нужно. Хуки пока остаются на localStorage
(перевод на async — отдельная итерация, см. backlog #11), но контракт
зафиксирован и задокументирован уже сейчас.

### Files
- `src/services/api.ts` (новый, ~250 строк)
- `src/services/mockAuth.ts`, `src/vite-env.d.ts`

---

## 2.2 — Рейтинг 1:1 с Figma (3 состояния)

### Что было
`CookedRow` показывал слитое состояние: при наличии оценки сразу
«Ваша оценка» + «Изменить оценку» + «Спасибо!» вместе. В Figma-фрейме
«Оценить рецепт» — три РАЗНЫХ состояния.

### Решение / Fix
- Добавлен транзиентный флаг `justSubmitted` + таймер 1.8 c.
- Поток теперь точно по макету:
  1. **Не оценено:** заголовок «Оценить рецепт?», пустые звёзды,
     кнопка «Отправить оценку».
  2. **Сразу после отправки:** «Оценить рецепт?» + закрашенные звёзды +
     «Спасибо!» (без кнопки) — держится 1.8 c.
  3. **Персистентно:** «Ваша оценка» + звёзды (readonly) + «Изменить оценку».
- Найден и исправлен баг: render-time sync (`if (userRating !== syncedRating)`)
  сбрасывал `justSubmitted`, т.к. наш же сабмит меняет `userRating`.
  Фикс — предсинхронизация `setSyncedRating(draftRating)` в `handleSubmit`,
  чтобы guard не считал собственный сабмит «внешним» изменением.
- Проверено Playwright: state1 → submit → «Спасибо!» (скрин 02) →
  спустя 1.9 c «Ваша оценка»/«Изменить оценку» (скрин 03).

### Files
- `src/components/Cookify.tsx` (`CookedRow`)

---

## 2.3 — Frame 69 «Добавить ингредиенты»

### Что было
Модалка ингредиентов использовала базу `.ck-confirm--wide` с X + «Отмена»/
«Сохранить» — визуально расходилось с Figma Frame 69 (кремовая карточка
с крупным радиусом, одна кнопка «Сохранить» справа-снизу).

### Решение / Fix
- Отдельный namespace `.ck-ingmodal__*`, новый токен `--ck-cream: #FBF5E6`.
- Карточка: `border-radius: 32px`, padding 2.25rem, тень,
  pop-анимация; заголовок 1.5rem/800; описание + hint; pill-инпут
  на белом с акцентным focus-ring; чекбоксы 26px с оранжевой заливкой;
  collapsible «Подсказки из базы рецептов»; футнот; «Сохранить» —
  крупная оранжевая pill справа-снизу.
- **Отклонение от макета (задокументировано в коде):** оставлен
  маленький крестик-close в правом верхнем углу — Figma его не содержит,
  но WCAG 2.2 требует операбельного закрытия без мыши (Esc + клик по
  фону + видимый close для консистентности с остальными модалками app).

### Files
- `src/components/Cookify.tsx` (`IngredientsModal`)
- `src/styles/cookify.css` (секция INGREDIENTS MODAL переписана)

---

## 2.4 — Frame 57 «Показать сначала» + точные подписи

### Что было
Дропдаун сортировки был списком без заголовка; подписи `time_asc/desc`
= «По времени ↑ (быстрые)». В Figma Frame 57 — карточка с заголовком
«Показать сначала» и radio-маркерами, подписи «(сначала быстрые/длительные)».

### Решение / Fix
- `data/recipes.ts`: метки → «По времени ↑ (сначала быстрые)» /
  «По времени ↓ (сначала длительные)». Остальные 5 уже совпадали с ТЗ.
- `Cookify.tsx`: дропдаун → `role="radiogroup"` + заголовок
  `.ck-sort__title` «Показать сначала», каждая опция — `role="radio"`
  с `.ck-sort__radio` маркером.
- `cookify.css`: стили заголовка и radio (зелёный активный, белый на
  выделенном фоне).

### Files
- `src/data/recipes.ts`, `src/components/Cookify.tsx`, `src/styles/cookify.css`

---

## 2.5 — «Показать ещё» в фильтрах

### Что было
Группы фильтров рендерили все опции сразу. В Figma «Праздники» имеет
ссылку «Показать ещё» (часть опций скрыта).

### Решение / Fix
- `types/index.ts`: `FilterGroup.showMoreAfter?: number`.
- `data/recipes.ts`: у группы «Праздники» `showMoreAfter: 4` + новые
  опции `christmas` (Рождество), `otherHoliday` (Другой праздник).
  Чтобы фильтр не давал пустоту — теги проставлены на 5 рецептах
  (Оливье, Селёдка под шубой, Торт Наполеон → christmas; Хачапури,
  Лазанья → otherHoliday).
- `Cookify.tsx`: в `FilterSidebar` стейт `expanded` + срез опций до
  `showMoreAfter`, кнопка «Показать ещё (N)» / «Скрыть» с `aria-expanded`.
- Проверено Playwright: «Показать ещё (2)» → раскрывает Рождество/
  Другой праздник; выбор «Рождество» сужает 36 → 3 рецепта.

### Files
- `src/types/index.ts`, `src/data/recipes.ts`, `src/components/Cookify.tsx`,
  `src/styles/cookify.css`

---

## 2.6 — Качество кода (lint errors)

### Что было
`npm run lint` → 2 **ошибки**: `Calling setState synchronously within an
effect can trigger cascading renders` в `CookedRow` (sync-effect на
`userRating`) и `IngredientsModal` (effect `recognized → setDraft`).
Плюс 2 мёртвых `eslint-disable no-console` в `mockAuth`.

### Решение / Fix
- `CookedRow`: убран `useEffect`-синк, применён официальный React-паттерн
  «adjust state during render» через guard `if (userRating !== syncedRating)`.
- `IngredientsModal`: удалён `useMemo recognized` + sync-`useEffect`;
  draft теперь обновляется прямо в `handleTextChange` (ввод) и `toggle`
  (чекбокс) — нет производного стейта через эффект.
- `mockAuth`: мёртвые `eslint-disable` заменены на содержательные
  `BACKEND:` комментарии.
- Итог: **0 ошибок** линтера (была 1 пред-существующая info-warning
  `react-refresh` в AuthContext — осознанный паттерн контекста, не трогаем).

### Files
- `src/components/Cookify.tsx`, `src/services/mockAuth.ts`

---

## 3.1 — Убран «Поиск по сайту» из Header

### Что было
Header держал инпут «Поиск по сайту» + controlled/uncontrolled логику
через пропсы `search`/`onSearchChange`. Cookify прокидывал отдельный
`search` стейт и склеивал его с `recipeSearch` (`search || recipeSearch`),
ProfilePage передавал заглушки `search="" onSearchChange={() => {}}`.

### Решение / Fix
- `Header.tsx` переписан: убраны инпут, иконка, `HeaderProps`,
  локальный fallback-стейт, импорты `Search`/`useState`. Компонент
  стал чистым `memo(() => …)` без пропсов.
- `Cookify.tsx`: удалён стейт `search`/`setSearch`; фильтр теперь
  `search: recipeSearch` (один источник); `<Header />` без пропсов.
- `ProfilePage.tsx`: `<Header />` без пропсов.
- `header.css`: удалены все `.header__search*` правила (мёртвый CSS).

### Files
- `src/components/layout/Header.tsx`, `src/components/Cookify.tsx`,
  `src/pages/ProfilePage.tsx`, `src/styles/header.css`

---

## 3.2 — Дропдаун сортировки → размер Figma 426×329

### Что было
`.ck-sort__menu` был узким (`width: 12rem` ≈ 192px), выбранная опция —
полноширинная зелёная заливка строки. В Figma «Frame 57 / Показать
сначала» карточка фиксированного размера **426×329** с чистыми белыми
строками и зелёным radio у выбранной.

### Решение / Fix
- `.ck-sort__menu`: `width: 426px`, `height: 329px`,
  `max-width: calc(100vw - 2rem)` + `max-height: calc(100vh - 7rem)` +
  `overflow-y: auto` (защита на узких/низких экранах),
  `display:flex; flex-direction:column`.
- `.ck-sort__opt`: `flex: 1` — 7 опций равномерно распределяют высоту
  карточки (Playwright подтвердил итог ровно **426×329**); padding и
  размер шрифта увеличены под крупную карточку.
- Убрана зелёная заливка `.ck-sort__opt--active` → выбранная опция =
  жирный текст + зелёный `.ck-sort__radio--on` (как в Frame 57);
  удалены white-on-green overrides.

### Files
- `src/styles/cookify.css`

---

## 4. Большие экраны ТЗ — Полная карточка / Режим готовки / Загрузить рецепт

### 4.1 — Доступ к Figma через REST API
Chrome-расширение Claude in Chrome не подключалось, Figma MCP не пускал
(аккаунт `dev@jet.style` ≠ владелец, без Pro-шаринга). Пользователь
выдал **Figma Personal Access Token** (read-only, использован только
в сессии, не сохранён, рекомендовано отозвать). Через `api.figma.com`:
`GET /v1/files/:key?depth=2` → карта доски (нашёл фреймы по именам),
`GET /v1/images?ids=…&scale=2` → PNG-рендеры, `GET /v1/files/:key/nodes`
→ точные размеры/цвета/шрифты. Найденные node-id: Полная карточка
`663:5376`, Режим готовки `525:4482/4726/6474/6753`, Загрузить рецепт
`541:5055`, Черновики `652:5152`, компоненты Таймер `500:4444`,
Component 12 `514:4503`, Советы `507:4413`.

### 4.2 — Полная карточка `/recipe/:id`
`RecipePage.tsx` — 1:1 с Figma `663:5376`:
hero 1040×400 r24, заголовок 32/700 `#140901` (новый токен
`--ck-ink-strong`), рейтинг ⭐ + плюрал «оценка/оценки/оценок»,
badge «Уже готовили/Новое» (из `useCooked`), heart (`useFavorites`),
описание, блок «Пищевая ценность на 100 г» (4 ячейки) + «Время
готовки ч:мм», ряд «Время приёма/Тип питания/Вкус блюда» (лейблы из
`filterGroups`), «Ингредиенты» со степпером порций (скейлит числовые
количества; «по вкусу» не трогает), CTA «Перейти в режим готовки».

### 4.3 — Режим готовки `/recipe/:id/cook`
`CookingModePage.tsx` — 1:1 с Figma «Режим готовки 1-4»:
красный «← Выход» → назад в Полную карточку (ТЗ), заголовок +
«Пошаговый рецепт», шаги stacked: активный — полноцветный,
будущие — `opacity .4 + grayscale` (Figma faded). `<StepTimer>`
повторяет component-set «Таймер» — 4 состояния:
idle («Начать» + play, кольцо полное) → running (счётчик,
«Сбросить» + pause, SVG-кольцо прогресса) → paused (play) →
done («00:00» + «+1 мин» + check). `<Tips>` = collapsible «Советы»
(+ блок «Предупреждение» с иконкой). На последнем шаге кнопка
«Готово!» → `addCooked` + переход на главную (таб Приготовлено) —
точно по ТЗ «Режим готовки».

### 4.4 — Загрузить рецепт + Черновики `/recipe/new`
`UploadRecipePage.tsx` — 1:1 с Figma `541:5055` / `652:5152`:
вкладки «Новый рецепт / Черновики». Форма: dropzone обложки
(FileReader→dataURL), название, описание (счётчик + req-подсветка),
**Параметры** (5 select из `filterGroups` + время чч:мм + КБЖУ),
**Ингредиенты** (мин 3, добавление/удаление, ед.изм.),
**Пошаговые инструкции** (мин 3: текст/таймер/пояснение/предупреждение),
**Блок проверки** «Подытожим» — автопроверка обязательных полей
(красный список), проверка уникальности (title+ингредиенты+теги по
ТЗ), чекбокс «Я проверил(а)», «Загрузить» disabled пока не
выполнены все 3 условия (ТЗ). «Сохранить черновик» → `useDrafts`;
«Выход» → confirm «несохранённые данные» (Сохранить черновик / Выйти);
«Загрузить» → `api.createRecipe` (BACKEND-стаб) + удаление из черновиков.
Вкладка «Черновики»: «Черновики (Неопубликованные)» (edit+название+
дата+удалить) + «Опубликовано» (зелёный чек) + сортировки.

### 4.5 — Данные / роутинг / хуки / бэкенд
- `types/index.ts`: `RecipeStep`, `RecipeDraft`, `Recipe.steps?`.
- `data/recipeSteps.ts`: 6 шагов «Сырного крем-супа» 1:1 с Figma +
  `getRecipeSteps()` с осмысленным fallback (любой рецепт «готовится»).
- `hooks/useDrafts.ts`: per-user черновики (паттерн `useFavorites`).
- `App.tsx`: `lazy()`+`<Suspense>` для 3 страниц (закрыт backlog
  #12.2 — code-split), роуты `/recipe/:id`, `/recipe/:id/cook`
  (ProtectedRoute), `/recipe/new` (ProtectedRoute).
- `Cookify.tsx`: карточка кликабельна (`role="link"` + Enter/Space) →
  `/recipe/:id`; кнопка «Загрузить рецепт» → `/recipe/new`.
- `services/api.ts`: `createRecipe` + `BACKEND:` комментарии;
  `useDrafts` — комментарии REST для черновиков.
- **Code quality:** `tagValue`/`groupOpts` → `useCallback`, чистый
  `exhaustive-deps` без eslint-disable.

### Files
- new: `pages/RecipePage.tsx`, `pages/CookingModePage.tsx`,
  `pages/UploadRecipePage.tsx`, `data/recipeSteps.ts`,
  `components/hooks/useDrafts.ts`, `styles/recipe.css`
- mod: `App.tsx`, `components/Cookify.tsx`, `types/index.ts`,
  `data/recipes.ts`, `services/api.ts`, `styles/cookify.css`

---

## 5. QA-проход: безопасность / a11y / адаптив / честность

### 5.1 — Безопасность (инжекты через картинки)
- **Аудит:** в новом коде нет `any`, `@ts-ignore`,
  `dangerouslySetInnerHTML`, `as unknown as` (grep чист). React по
  умолчанию экранирует весь текст → XSS через title/описание/шаги
  невозможен.
- **Загрузка обложки:** была `f.type.startsWith('image/')` (пропускала
  `image/svg+xml`). Теперь whitelist `png/jpeg/webp/gif`, **SVG
  отклоняется** (может содержать `<script>`/внешние ссылки), лимит
  4 МБ, финальная регэксп-проверка `data:image/<raster>;base64,`,
  ошибки показываются (`role="alert"`).
- **Черновики из localStorage:** type-guard вместо слепого каста —
  подмена storage не роняет рендер.

### 5.2 — Доступность
- Exit-модалка формы: добавлены Esc-close, scroll-lock,
  автофокус на безопасную кнопку, `aria-describedby`.
- `aria-required` + `aria-invalid` на обязательных полях (раньше
  обязательность передавалась только визуальной «*»).
- Блок «Подытожим» — `aria-live="polite"` (скринридер озвучивает,
  каких полей не хватает).
- (Ранее в #4: кликабельная карточка `role="link"`+Enter/Space,
  aria-label на всех иконочных кнопках, таймер `<button>`+aria,
  один `<h1>` на страницу.)

### 5.3 — Адаптив (проверено Playwright)
Замер `scrollWidth − clientWidth` на 4 страницах:
- @375px — **0px overflow** на всех (home/card/cook/upload).
- @320px — было upload **5px overflow** → добавлена media ≤480px
  (шринк числовых инпутов, перенос topbar/строк ингредиентов,
  кнопки на всю ширину). Итог — **0px на всех 4 @320 и @375**.

### 5.4 — Честная оценка соответствия Figma
**Сделано 1:1:** Полная карточка, Режим готовки (4 состояния таймера +
Советы), Черновики, структура/секции/валидация формы Загрузить рецепт.
**Сознательные упрощения формы (НЕ 100% Figma — задокументировано):**
редактор шага в Figma богаче (фото на шаг, поле «использованные
ингредиенты», «кулинарные термины», «Оборудование», «+ Добавить
таймер» как toggle) — реализована функциональная суть по ТЗ
(текст+таймер+пояснение+предупреждение). Занесено в backlog #8.5–#8.6.
**Качество данных:** часть Unsplash-фото шагов не всегда соответствует
содержанию шага (ID подбирались без проверки рендера) — fallback
работает, но контент-точность фото в backlog.

### Files
- mod: `pages/UploadRecipePage.tsx`, `components/hooks/useDrafts.ts`,
  `styles/recipe.css`

---

## 🔧 Build verification (итог дня)
- `npx tsc -b --noEmit` → exit 0
- `npx vite build` → exit 0, ~4 s
  - main `index.js` ≈ **288 kB / 86 kB gzip**
  - `recipe.css` lazy-чанк ≈ **18 kB** (в initial bundle не входит)
- `npm run lint` → **0 errors**, 1 pre-existing warning (react-refresh, осознанно)
- Playwright адаптив: **0px overflow** @375 и @320 на всех 4 страницах
- Playwright vs Figma-рендеры: Полная карточка / Режим готовки
  (таймер+Советы) / Загрузить рецепт / Черновики — структура,
  лейблы, состояния совпадают ✓

## ✅ Playwright verification (vs Figma скриншоты)
- 01 — Cooked tab: state1 (Оценить рецепт?) + state3 (Ваша оценка/Изменить) ✓
- 02 — после Отправить: «Спасибо!» без кнопки ✓
- 03 — спустя 1.9 c: settled → «Ваша оценка»/«Изменить оценку» ✓
- 04 — Sort: «Показать сначала» + radio ✓
- 06 — Фильтры: «Показать ещё (2)» → Рождество/Другой праздник → «Скрыть» ✓
- 07 — Ingredients modal: кремовая карточка Frame 69 ✓
- Функц. проверка: фильтр «Рождество» 36 → 3 рецепта ✓

## ❓ Что осталось из backlog
См. [backlog.md](../../backlog.md). Большие куски из ТЗ, которых нет
в присланных скриншотах макета (нужен доступ к полному Figma для
1:1): Полная карточка рецепта `/recipe/:id`, Режим готовки с таймерами,
форма «Загрузить рецепт» с черновиками. Перевод хуков на async-`api.ts` —
#11.

## 💡 Что дальше (suggestions)
1. **Полный доступ к Figma** (шаринг по ссылке или Pro-подписка) —
   тогда вытащу точные токены/отступы для пиксель-перфекта и сверю
   экраны, которых нет в скриншотах.
2. **Перевести хуки на `api.ts`** (async + loading/error состояния) —
   контракт уже готов, останется заменить тела на `fetch`.
3. **Полная карточка рецепта `/recipe/:id`** — крупнейший оставшийся
   кусок ТЗ (клик по карточке → детальная страница → «Режим готовки»).
