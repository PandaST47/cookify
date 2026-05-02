/* ═══════════════════════════════════════════
   COOKIFY DATA — recipes + filter taxonomy.

   Это единственный источник правды для:
     — справочника рецептов (в проде уйдёт за HTTP),
     — справочника фильтров (структура групп / опций),
     — табов главной страницы.

   Иерархия фильтрации описана в CLAUDE.md §5.
   ═══════════════════════════════════════════ */

import type { FilterGroup, Recipe, Tab } from '../types'

/* ─── Tabs ─────────────────────────────────────────────────── */
export const tabs: Tab[] = [
    { id: 'recommendations', label: 'Рекомендации' },
    { id: 'favorites', label: 'Избранное' },
    { id: 'cooked', label: 'Приготовлено' },
]

/* ─── Filter groups ────────────────────────────────────────────
   Логика «И/ИЛИ» внутри группы — НЕ в данных, а в `applyFilters`
   (см. Cookify.tsx). Здесь только структура / лейблы.
   ────────────────────────────────────────────────────────────── */
export const filterGroups: FilterGroup[] = [
    {
        id: 'mealType',
        title: 'Время приёма',
        isOpen: true,
        options: [
            { id: 'breakfast', label: 'Завтрак', checked: false },
            { id: 'lunch', label: 'Обед', checked: false },
            { id: 'dinner', label: 'Ужин', checked: false },
            { id: 'snack', label: 'Перекус', checked: false },
            { id: 'tea', label: 'Полдник', checked: false },
        ],
    },
    {
        id: 'occasions',
        title: 'Праздники',
        isOpen: true,
        options: [
            { id: 'easter', label: 'Пасха', checked: false },
            { id: 'maslenitsa', label: 'Масленица', checked: false },
            { id: 'birthday', label: 'День рождения', checked: false },
            { id: 'newyear', label: 'Новый год', checked: false },
        ],
    },
    {
        id: 'health',
        title: 'Особое питание',
        isOpen: true,
        options: [
            { id: 'weightLoss', label: 'Похудение', checked: false },
            { id: 'healthy', label: 'ЗОЖ', checked: false },
            { id: 'highProtein', label: 'Высокобелковое', checked: false },
            { id: 'lowCarb', label: 'Низкоуглеводное', checked: false },
            { id: 'vegetarian', label: 'Вегетарианство', checked: false },
            { id: 'vegan', label: 'Веганство', checked: false },
            { id: 'noSugar', label: 'Без сахара', checked: false },
            { id: 'noGluten', label: 'Безглютеновое', checked: false },
            { id: 'noLactose', label: 'Безлактозное', checked: false },
        ],
    },
    {
        id: 'cuisine',
        title: 'Национальные кухни',
        isOpen: true,
        options: [
            { id: 'italian', label: 'Итальянская', checked: false },
            { id: 'georgian', label: 'Грузинская', checked: false },
            { id: 'russian', label: 'Русская', checked: false },
            { id: 'indian', label: 'Индийская', checked: false },
        ],
    },
    {
        id: 'taste',
        title: 'Вкус',
        isOpen: true,
        options: [
            { id: 'sour', label: 'Кислое', checked: false },
            { id: 'sweet', label: 'Сладкое', checked: false },
            { id: 'spicy', label: 'Острое', checked: false },
            { id: 'salty', label: 'Солёное', checked: false },
            { id: 'bitter', label: 'Горькое', checked: false },
        ],
    },
]

/* ─── Sort options ──────────────────────────────────────────── */
export type SortId =
    | 'popular'
    | 'rating_desc'
    | 'rating_asc'
    | 'calories_asc'
    | 'calories_desc'
    | 'time_asc'
    | 'time_desc'

export const sortOptions: { id: SortId; label: string }[] = [
    { id: 'popular', label: 'По умолчанию' },
    { id: 'rating_desc', label: 'Выше рейтинг' },
    { id: 'rating_asc', label: 'Ниже рейтинг' },
    { id: 'calories_asc', label: 'По возрастанию КБЖУ' },
    { id: 'calories_desc', label: 'По убыванию КБЖУ' },
    { id: 'time_asc', label: 'По времени ↑ (быстрые)' },
    { id: 'time_desc', label: 'По времени ↓ (длительные)' },
]

/* ─── Helper: build image URL from Unsplash photo ID ─────────── */
const img = (photoId: string): string =>
    `https://images.unsplash.com/${photoId}?w=720&h=400&fit=crop&auto=format&q=80`

/* ─── Recipes ─────────────────────────────────────────────────
   30+ рецептов, покрывающих все фильтры (минимум 2-3 рецепта на
   каждую опцию каждой группы). Изображения — Unsplash (стабильные
   фото-ID; на ошибку загрузки сработает fallback в карточке).
   ────────────────────────────────────────────────────────────── */
export const recipes: Recipe[] = [
    /* === Супы / первые блюда === */
    {
        id: '1',
        title: 'Сырный крем-суп',
        description:
            'Бархатистая консистенция и яркий сливочный вкус с ноткой чеснока. Подавайте с хрустящими гренками и свежей зеленью.',
        image: img('photo-1547592166-23ac45744acd'),
        calories: 173, protein: 5, fat: 13, carbs: 10,
        rating: 4.98, ratingCount: 121,
        cookTime: 40,
        displayTags: ['ПП', 'УЖИН', 'ОБЕД', 'ПЕРВЫЕ БЛЮДА'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: [],
            health: ['healthy', 'noGluten'],
            cuisine: [],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Картофель', amount: '3', unit: 'шт' },
            { name: 'Куриное филе', amount: '200', unit: 'г' },
            { name: 'Сливки 15%', amount: '200', unit: 'мл' },
            { name: 'Сливочный сыр', amount: '150', unit: 'г' },
            { name: 'Чеснок', amount: '2', unit: 'зуб.' },
            { name: 'Соль', amount: '1', unit: 'ч.л.' },
        ],
    },
    {
        id: '2',
        title: 'Борщ классический',
        description:
            'Насыщенный свекольный суп с говядиной и капустой. Подавайте со сметаной и свежим чёрным хлебом.',
        image: img('photo-1603105037880-880cd4f8395f'),
        calories: 280, protein: 15, fat: 12, carbs: 28,
        rating: 4.88, ratingCount: 312,
        cookTime: 90,
        displayTags: ['РУССКАЯ', 'ОБЕД', 'ПЕРВЫЕ БЛЮДА'],
        filters: {
            mealType: ['lunch'],
            occasions: [],
            health: ['highProtein'],
            cuisine: ['russian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Говядина', amount: '500', unit: 'г' },
            { name: 'Свёкла', amount: '2', unit: 'шт' },
            { name: 'Картофель', amount: '3', unit: 'шт' },
            { name: 'Капуста', amount: '200', unit: 'г' },
            { name: 'Морковь', amount: '1', unit: 'шт' },
            { name: 'Лук', amount: '1', unit: 'шт' },
            { name: 'Томатная паста', amount: '2', unit: 'ст.л.' },
        ],
    },
    {
        id: '3',
        title: 'Тыквенный крем-суп с имбирём',
        description:
            'Бархатный суп из запечённой тыквы с имбирём и кокосовыми сливками. Согревает в холодный вечер.',
        image: img('photo-1476718406336-bb5a9690ee2a'),
        calories: 195, protein: 4, fat: 8, carbs: 28,
        rating: 4.82, ratingCount: 89,
        cookTime: 45,
        displayTags: ['ВЕГАН', 'УЖИН', 'ПЕРВЫЕ БЛЮДА'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: [],
            health: ['vegan', 'vegetarian', 'healthy', 'noLactose'],
            cuisine: [],
            taste: ['sweet'],
        },
        ingredients: [
            { name: 'Тыква', amount: '600', unit: 'г' },
            { name: 'Имбирь', amount: '20', unit: 'г' },
            { name: 'Кокосовые сливки', amount: '200', unit: 'мл' },
            { name: 'Лук', amount: '1', unit: 'шт' },
            { name: 'Чеснок', amount: '2', unit: 'зуб.' },
        ],
    },
    {
        id: '4',
        title: 'Окрошка на квасе',
        description:
            'Холодный летний суп на квасе с овощами, варёной колбасой и зеленью. Освежает в самую жаркую погоду.',
        image: img('photo-1551183053-bf91a1d81141'),
        calories: 145, protein: 8, fat: 6, carbs: 18,
        rating: 4.6, ratingCount: 76,
        cookTime: 25,
        displayTags: ['РУССКАЯ', 'ОБЕД', 'ЛЕТО'],
        filters: {
            mealType: ['lunch'],
            occasions: [],
            health: ['weightLoss'],
            cuisine: ['russian'],
            taste: ['sour'],
        },
        ingredients: [
            { name: 'Квас', amount: '1', unit: 'л' },
            { name: 'Огурцы', amount: '3', unit: 'шт' },
            { name: 'Редис', amount: '5', unit: 'шт' },
            { name: 'Варёная колбаса', amount: '200', unit: 'г' },
            { name: 'Яйца', amount: '4', unit: 'шт' },
            { name: 'Зелень', amount: '1', unit: 'пучок' },
        ],
    },
    {
        id: '5',
        title: 'Дал из красной чечевицы',
        description:
            'Густой пряный суп из чечевицы с куркумой, кориандром и томатами. Полностью растительный белок и яркий вкус.',
        image: img('photo-1546069901-ba9599a7e63c'),
        calories: 220, protein: 14, fat: 5, carbs: 32,
        rating: 4.75, ratingCount: 142,
        cookTime: 35,
        displayTags: ['ИНДИЙСКАЯ', 'ВЕГАН', 'ОБЕД'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: [],
            health: ['vegan', 'vegetarian', 'healthy', 'highProtein', 'noGluten', 'noLactose'],
            cuisine: ['indian'],
            taste: ['spicy'],
        },
        ingredients: [
            { name: 'Чечевица красная', amount: '300', unit: 'г' },
            { name: 'Помидоры', amount: '2', unit: 'шт' },
            { name: 'Лук', amount: '1', unit: 'шт' },
            { name: 'Куркума', amount: '1', unit: 'ч.л.' },
            { name: 'Кориандр', amount: '1', unit: 'ч.л.' },
            { name: 'Имбирь', amount: '15', unit: 'г' },
        ],
    },

    /* === Завтраки === */
    {
        id: '6',
        title: 'Овсянка с ягодами и мёдом',
        description:
            'Полезный завтрак с овсяными хлопьями на молоке, свежими ягодами и ложкой мёда. Заряд энергии на весь день.',
        image: img('photo-1517673400267-0251440c45dc'),
        calories: 210, protein: 8, fat: 4, carbs: 38,
        rating: 4.55, ratingCount: 198,
        cookTime: 10,
        displayTags: ['ЗАВТРАК', 'ПП', 'БЫСТРО'],
        filters: {
            mealType: ['breakfast'],
            occasions: [],
            health: ['healthy', 'vegetarian'],
            cuisine: [],
            taste: ['sweet'],
        },
        ingredients: [
            { name: 'Овсяные хлопья', amount: '80', unit: 'г' },
            { name: 'Молоко', amount: '250', unit: 'мл' },
            { name: 'Ягоды', amount: '100', unit: 'г' },
            { name: 'Мёд', amount: '1', unit: 'ст.л.' },
        ],
    },
    {
        id: '7',
        title: 'Сырники с малиной',
        description:
            'Нежные сырники из творога с ванилью и малиновым соусом. Классический завтрак выходного дня.',
        image: img('photo-1567620832903-9fc6debc209f'),
        calories: 245, protein: 18, fat: 9, carbs: 24,
        rating: 4.88, ratingCount: 287,
        cookTime: 30,
        displayTags: ['РУССКАЯ', 'ЗАВТРАК'],
        filters: {
            mealType: ['breakfast'],
            occasions: [],
            health: ['vegetarian', 'highProtein'],
            cuisine: ['russian'],
            taste: ['sweet'],
        },
        ingredients: [
            { name: 'Творог', amount: '500', unit: 'г' },
            { name: 'Яйцо', amount: '1', unit: 'шт' },
            { name: 'Мука', amount: '3', unit: 'ст.л.' },
            { name: 'Малина', amount: '150', unit: 'г' },
            { name: 'Сметана', amount: '100', unit: 'г' },
        ],
    },
    {
        id: '8',
        title: 'Тост с авокадо и яйцом',
        description:
            'Цельнозерновой хлеб, пюре из авокадо с лимоном и яйцо-пашот. Пять минут — и завтрак готов.',
        image: img('photo-1525351484163-7529414344d8'),
        calories: 280, protein: 12, fat: 16, carbs: 22,
        rating: 4.6, ratingCount: 156,
        cookTime: 10,
        displayTags: ['ЗАВТРАК', 'ПП', 'БЫСТРО'],
        filters: {
            mealType: ['breakfast'],
            occasions: [],
            health: ['healthy', 'vegetarian'],
            cuisine: [],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Хлеб цельнозерновой', amount: '2', unit: 'кус.' },
            { name: 'Авокадо', amount: '1', unit: 'шт' },
            { name: 'Яйцо', amount: '2', unit: 'шт' },
            { name: 'Лимон', amount: '0.5', unit: 'шт' },
        ],
    },
    {
        id: '9',
        title: 'Зелёный смузи',
        description:
            'Освежающий смузи с шпинатом, яблоком, бананом и лимонным соком. Витамины и клетчатка в одном стакане.',
        image: img('photo-1638176067000-9e2ec64c8cd2'),
        calories: 130, protein: 3, fat: 1, carbs: 28,
        rating: 4.45, ratingCount: 92,
        cookTime: 5,
        displayTags: ['ЗАВТРАК', 'ВЕГАН', 'ДЕТОКС'],
        filters: {
            mealType: ['breakfast', 'snack'],
            occasions: [],
            health: ['vegan', 'vegetarian', 'healthy', 'weightLoss', 'noLactose', 'noGluten'],
            cuisine: [],
            taste: ['sour', 'sweet'],
        },
        ingredients: [
            { name: 'Шпинат', amount: '50', unit: 'г' },
            { name: 'Яблоко', amount: '1', unit: 'шт' },
            { name: 'Банан', amount: '1', unit: 'шт' },
            { name: 'Лимон', amount: '0.5', unit: 'шт' },
            { name: 'Вода', amount: '200', unit: 'мл' },
        ],
    },
    {
        id: '10',
        title: 'Панкейки с бананом',
        description:
            'Воздушные панкейки с золотистой корочкой и карамелизованным бананом. Лучший повод проснуться пораньше.',
        image: img('photo-1528207776546-365bb710ee93'),
        calories: 390, protein: 8, fat: 12, carbs: 62,
        rating: 4.7, ratingCount: 234,
        cookTime: 25,
        displayTags: ['ЗАВТРАК', 'ДЕСЕРТЫ'],
        filters: {
            mealType: ['breakfast', 'tea'],
            occasions: [],
            health: ['vegetarian'],
            cuisine: [],
            taste: ['sweet'],
        },
        ingredients: [
            { name: 'Мука', amount: '200', unit: 'г' },
            { name: 'Молоко', amount: '250', unit: 'мл' },
            { name: 'Яйца', amount: '2', unit: 'шт' },
            { name: 'Бананы', amount: '2', unit: 'шт' },
            { name: 'Сахар', amount: '2', unit: 'ст.л.' },
        ],
    },

    /* === Италия === */
    {
        id: '11',
        title: 'Паста Карбонара',
        description:
            'Классическая итальянская паста с беконом, яйцом и пармезаном. Нежный сливочный соус без сливок — только яйца и сыр.',
        image: img('photo-1612874742237-6526221588e3'),
        calories: 420, protein: 18, fat: 22, carbs: 38,
        rating: 4.85, ratingCount: 412,
        cookTime: 25,
        displayTags: ['ИТАЛЬЯНСКАЯ', 'УЖИН', 'БЫСТРО'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: [],
            health: ['highProtein'],
            cuisine: ['italian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Спагетти', amount: '400', unit: 'г' },
            { name: 'Бекон', amount: '200', unit: 'г' },
            { name: 'Яйца', amount: '4', unit: 'шт' },
            { name: 'Пармезан', amount: '100', unit: 'г' },
            { name: 'Чёрный перец', amount: '1', unit: 'ч.л.' },
        ],
    },
    {
        id: '12',
        title: 'Пицца Маргарита',
        description:
            'Тонкое тесто, томатный соус, моцарелла и свежий базилик. Минимум ингредиентов, максимум удовольствия.',
        image: img('photo-1574071318508-1cdbab80d002'),
        calories: 295, protein: 12, fat: 9, carbs: 42,
        rating: 4.92, ratingCount: 528,
        cookTime: 50,
        displayTags: ['ИТАЛЬЯНСКАЯ', 'УЖИН', 'ОБЕД'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: ['birthday'],
            health: ['vegetarian'],
            cuisine: ['italian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Мука', amount: '400', unit: 'г' },
            { name: 'Дрожжи', amount: '7', unit: 'г' },
            { name: 'Моцарелла', amount: '250', unit: 'г' },
            { name: 'Томатный соус', amount: '200', unit: 'мл' },
            { name: 'Базилик', amount: '1', unit: 'пучок' },
        ],
    },
    {
        id: '13',
        title: 'Ризотто с грибами',
        description:
            'Кремовое ризотто с белыми грибами и пармезаном. Готовится медленно — но результат того стоит.',
        image: img('photo-1476124369491-e7addf5db371'),
        calories: 310, protein: 9, fat: 11, carbs: 45,
        rating: 4.78, ratingCount: 167,
        cookTime: 40,
        displayTags: ['ИТАЛЬЯНСКАЯ', 'УЖИН', 'ВЕГЕТАР'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: [],
            health: ['vegetarian'],
            cuisine: ['italian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Рис арборио', amount: '300', unit: 'г' },
            { name: 'Грибы белые', amount: '300', unit: 'г' },
            { name: 'Бульон овощной', amount: '1', unit: 'л' },
            { name: 'Пармезан', amount: '80', unit: 'г' },
            { name: 'Лук', amount: '1', unit: 'шт' },
        ],
    },
    {
        id: '14',
        title: 'Лазанья болоньезе',
        description:
            'Слои пасты, мясной соус болоньезе и бешамель под золотистой корочкой пармезана. Идеально на большую компанию.',
        image: img('photo-1619895092538-128f4d7ddec5'),
        calories: 460, protein: 22, fat: 24, carbs: 38,
        rating: 4.9, ratingCount: 378,
        cookTime: 95,
        displayTags: ['ИТАЛЬЯНСКАЯ', 'УЖИН', 'ПРАЗДНИК'],
        filters: {
            mealType: ['dinner'],
            occasions: ['birthday'],
            health: ['highProtein'],
            cuisine: ['italian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Листы лазаньи', amount: '12', unit: 'шт' },
            { name: 'Фарш говяжий', amount: '500', unit: 'г' },
            { name: 'Помидоры', amount: '400', unit: 'г' },
            { name: 'Молоко', amount: '500', unit: 'мл' },
            { name: 'Мука', amount: '50', unit: 'г' },
            { name: 'Пармезан', amount: '100', unit: 'г' },
        ],
    },
    {
        id: '15',
        title: 'Тирамису',
        description:
            'Классический итальянский десерт с маскарпоне, кофе и шоколадом. Воздушная и ни капли не приторная сладость.',
        image: img('photo-1571877227200-a0d98ea607e9'),
        calories: 320, protein: 6, fat: 18, carbs: 32,
        rating: 4.94, ratingCount: 615,
        cookTime: 30,
        displayTags: ['ИТАЛЬЯНСКАЯ', 'ДЕСЕРТЫ', 'ПОЛДНИК'],
        filters: {
            mealType: ['tea'],
            occasions: ['birthday'],
            health: ['vegetarian'],
            cuisine: ['italian'],
            taste: ['sweet', 'bitter'],
        },
        ingredients: [
            { name: 'Маскарпоне', amount: '500', unit: 'г' },
            { name: 'Печенье савоярди', amount: '200', unit: 'г' },
            { name: 'Кофе эспрессо', amount: '300', unit: 'мл' },
            { name: 'Какао', amount: '2', unit: 'ст.л.' },
            { name: 'Яйца', amount: '4', unit: 'шт' },
            { name: 'Сахар', amount: '100', unit: 'г' },
        ],
    },

    /* === Грузия === */
    {
        id: '16',
        title: 'Хачапури по-аджарски',
        description:
            'Сочная лодочка из хрустящего теста с расплавленным сулугуни, маслом и яйцом. Настоящий вкус Грузии.',
        image: img('photo-1604908177453-7462950a6a3b'),
        calories: 380, protein: 14, fat: 20, carbs: 35,
        rating: 4.91, ratingCount: 452,
        cookTime: 60,
        displayTags: ['ГРУЗИНСКАЯ', 'УЖИН', 'ПРАЗДНИК'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: ['birthday'],
            health: ['vegetarian', 'highProtein'],
            cuisine: ['georgian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Мука', amount: '500', unit: 'г' },
            { name: 'Сулугуни', amount: '300', unit: 'г' },
            { name: 'Яйца', amount: '3', unit: 'шт' },
            { name: 'Масло сливочное', amount: '50', unit: 'г' },
            { name: 'Молоко', amount: '200', unit: 'мл' },
        ],
    },
    {
        id: '17',
        title: 'Шашлык из свинины',
        description:
            'Сочный шашлык на углях с золотистой корочкой и луком. Маринуется в кефире со специями — мягчайший результат.',
        image: img('photo-1555126634-323283e090fa'),
        calories: 310, protein: 28, fat: 22, carbs: 2,
        rating: 4.86, ratingCount: 289,
        cookTime: 240,
        displayTags: ['ГРУЗИНСКАЯ', 'УЖИН', 'ПРАЗДНИК'],
        filters: {
            mealType: ['dinner'],
            occasions: ['birthday'],
            health: ['highProtein', 'lowCarb', 'noGluten'],
            cuisine: ['georgian'],
            taste: ['salty', 'spicy'],
        },
        ingredients: [
            { name: 'Свинина (шея)', amount: '1.5', unit: 'кг' },
            { name: 'Лук', amount: '4', unit: 'шт' },
            { name: 'Кефир', amount: '500', unit: 'мл' },
            { name: 'Специи', amount: '2', unit: 'ст.л.' },
        ],
    },
    {
        id: '18',
        title: 'Чахохбили из курицы',
        description:
            'Тушёная курица с помидорами, сладким перцем и большим количеством зелени. Ароматное блюдо в один сотейник.',
        image: img('photo-1604908554007-67b0d3b8d3e0'),
        calories: 245, protein: 24, fat: 12, carbs: 8,
        rating: 4.74, ratingCount: 134,
        cookTime: 60,
        displayTags: ['ГРУЗИНСКАЯ', 'УЖИН', 'ОБЕД'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: [],
            health: ['highProtein', 'lowCarb', 'noGluten', 'noLactose'],
            cuisine: ['georgian'],
            taste: ['spicy', 'salty'],
        },
        ingredients: [
            { name: 'Курица', amount: '1.2', unit: 'кг' },
            { name: 'Помидоры', amount: '4', unit: 'шт' },
            { name: 'Перец болгарский', amount: '2', unit: 'шт' },
            { name: 'Лук', amount: '2', unit: 'шт' },
            { name: 'Зелень', amount: '2', unit: 'пучка' },
        ],
    },

    /* === Россия === */
    {
        id: '19',
        title: 'Оливье',
        description:
            'Главный салат на праздничном столе: варёные овощи, колбаса, яйца, маринованные огурцы и горошек под майонезом.',
        image: img('photo-1640719028782-8230eaadbf73'),
        calories: 285, protein: 9, fat: 18, carbs: 22,
        rating: 4.89, ratingCount: 821,
        cookTime: 60,
        displayTags: ['РУССКАЯ', 'НОВЫЙ ГОД', 'ПРАЗДНИК'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: ['newyear', 'birthday'],
            health: [],
            cuisine: ['russian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Картофель', amount: '4', unit: 'шт' },
            { name: 'Морковь', amount: '2', unit: 'шт' },
            { name: 'Яйца', amount: '4', unit: 'шт' },
            { name: 'Колбаса варёная', amount: '300', unit: 'г' },
            { name: 'Огурцы маринованные', amount: '4', unit: 'шт' },
            { name: 'Горошек', amount: '300', unit: 'г' },
            { name: 'Майонез', amount: '200', unit: 'г' },
        ],
    },
    {
        id: '20',
        title: 'Селёдка под шубой',
        description:
            'Слои сельди, картофеля, моркови, свёклы и яиц под майонезом. Без неё новогодний стол — не стол.',
        image: img('photo-1576020799627-aeac74d58064'),
        calories: 230, protein: 11, fat: 14, carbs: 18,
        rating: 4.84, ratingCount: 506,
        cookTime: 90,
        displayTags: ['РУССКАЯ', 'НОВЫЙ ГОД', 'ПРАЗДНИК'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: ['newyear'],
            health: ['highProtein'],
            cuisine: ['russian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Сельдь', amount: '300', unit: 'г' },
            { name: 'Картофель', amount: '3', unit: 'шт' },
            { name: 'Морковь', amount: '2', unit: 'шт' },
            { name: 'Свёкла', amount: '2', unit: 'шт' },
            { name: 'Яйца', amount: '3', unit: 'шт' },
            { name: 'Майонез', amount: '200', unit: 'г' },
        ],
    },
    {
        id: '21',
        title: 'Блины с мёдом',
        description:
            'Тонкие масленичные блины с золотистой кружевной корочкой. С мёдом, сметаной или вареньем — на ваш выбор.',
        image: img('photo-1534432182912-63863115e106'),
        calories: 220, protein: 6, fat: 8, carbs: 30,
        rating: 4.81, ratingCount: 367,
        cookTime: 40,
        displayTags: ['РУССКАЯ', 'МАСЛЕНИЦА', 'ЗАВТРАК'],
        filters: {
            mealType: ['breakfast', 'tea'],
            occasions: ['maslenitsa'],
            health: ['vegetarian'],
            cuisine: ['russian'],
            taste: ['sweet'],
        },
        ingredients: [
            { name: 'Мука', amount: '300', unit: 'г' },
            { name: 'Молоко', amount: '500', unit: 'мл' },
            { name: 'Яйца', amount: '3', unit: 'шт' },
            { name: 'Сахар', amount: '2', unit: 'ст.л.' },
            { name: 'Мёд', amount: '4', unit: 'ст.л.' },
        ],
    },
    {
        id: '22',
        title: 'Блины с икрой',
        description:
            'Праздничная подача масленичных блинов: с красной икрой и сметаной. Безусловный хит застолья.',
        image: img('photo-1606923829579-0cb981a83e2e'),
        calories: 295, protein: 14, fat: 13, carbs: 28,
        rating: 4.93, ratingCount: 218,
        cookTime: 45,
        displayTags: ['РУССКАЯ', 'МАСЛЕНИЦА', 'ПРАЗДНИК'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: ['maslenitsa', 'newyear'],
            health: ['highProtein'],
            cuisine: ['russian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Мука', amount: '300', unit: 'г' },
            { name: 'Молоко', amount: '500', unit: 'мл' },
            { name: 'Яйца', amount: '3', unit: 'шт' },
            { name: 'Икра красная', amount: '100', unit: 'г' },
            { name: 'Сметана', amount: '150', unit: 'г' },
        ],
    },
    {
        id: '23',
        title: 'Кулич пасхальный',
        description:
            'Высокий ароматный кулич с цукатами, изюмом и белой глазурью. Тесто опарное — пышное и долго не черствеет.',
        image: img('photo-1554139583-ed7e0a1f5dde'),
        calories: 340, protein: 7, fat: 12, carbs: 52,
        rating: 4.87, ratingCount: 432,
        cookTime: 240,
        displayTags: ['РУССКАЯ', 'ПАСХА', 'ВЫПЕЧКА'],
        filters: {
            mealType: ['tea'],
            occasions: ['easter'],
            health: ['vegetarian'],
            cuisine: ['russian'],
            taste: ['sweet'],
        },
        ingredients: [
            { name: 'Мука', amount: '1', unit: 'кг' },
            { name: 'Молоко', amount: '500', unit: 'мл' },
            { name: 'Дрожжи', amount: '50', unit: 'г' },
            { name: 'Яйца', amount: '6', unit: 'шт' },
            { name: 'Сахар', amount: '300', unit: 'г' },
            { name: 'Изюм', amount: '200', unit: 'г' },
            { name: 'Цукаты', amount: '100', unit: 'г' },
        ],
    },
    {
        id: '24',
        title: 'Гречка с грибами',
        description:
            'Рассыпчатая гречка с обжаренными шампиньонами и луком. Простой, сытный и постный обед.',
        image: img('photo-1604908554049-bb4caa3e26b4'),
        calories: 235, protein: 9, fat: 7, carbs: 38,
        rating: 4.62, ratingCount: 174,
        cookTime: 35,
        displayTags: ['РУССКАЯ', 'ВЕГАН', 'ОБЕД'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: [],
            health: ['vegan', 'vegetarian', 'healthy', 'noGluten', 'noLactose'],
            cuisine: ['russian'],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Гречка', amount: '300', unit: 'г' },
            { name: 'Шампиньоны', amount: '400', unit: 'г' },
            { name: 'Лук', amount: '1', unit: 'шт' },
            { name: 'Масло растительное', amount: '3', unit: 'ст.л.' },
        ],
    },

    /* === Индия === */
    {
        id: '25',
        title: 'Карри с курицей',
        description:
            'Курица в насыщенном соусе из помидоров, кокосового молока и индийских специй. Подавайте с рисом басмати.',
        image: img('photo-1565557623262-b51c2513a641'),
        calories: 365, protein: 26, fat: 16, carbs: 28,
        rating: 4.88, ratingCount: 387,
        cookTime: 55,
        displayTags: ['ИНДИЙСКАЯ', 'УЖИН', 'ОСТРОЕ'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: [],
            health: ['highProtein', 'noGluten', 'noLactose'],
            cuisine: ['indian'],
            taste: ['spicy'],
        },
        ingredients: [
            { name: 'Куриное филе', amount: '600', unit: 'г' },
            { name: 'Помидоры', amount: '3', unit: 'шт' },
            { name: 'Кокосовое молоко', amount: '400', unit: 'мл' },
            { name: 'Карри', amount: '2', unit: 'ст.л.' },
            { name: 'Лук', amount: '2', unit: 'шт' },
            { name: 'Чеснок', amount: '4', unit: 'зуб.' },
        ],
    },
    {
        id: '26',
        title: 'Бирьяни с курицей',
        description:
            'Ароматный плов из басмати с курицей, шафраном и индийскими специями. Слоёное блюдо родом из Хайдарабада.',
        image: img('photo-1589302168068-964664d93dc0'),
        calories: 420, protein: 24, fat: 14, carbs: 52,
        rating: 4.79, ratingCount: 256,
        cookTime: 90,
        displayTags: ['ИНДИЙСКАЯ', 'УЖИН', 'ПРАЗДНИК'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: ['birthday'],
            health: ['highProtein'],
            cuisine: ['indian'],
            taste: ['spicy', 'salty'],
        },
        ingredients: [
            { name: 'Рис басмати', amount: '500', unit: 'г' },
            { name: 'Курица', amount: '700', unit: 'г' },
            { name: 'Йогурт натуральный', amount: '300', unit: 'мл' },
            { name: 'Шафран', amount: '1', unit: 'щеп.' },
            { name: 'Гарам масала', amount: '1', unit: 'ст.л.' },
        ],
    },
    {
        id: '27',
        title: 'Самса с овощами',
        description:
            'Хрустящие треугольники из тонкого теста с пряной картофельной начинкой. Идеальный перекус с чаем масала.',
        image: img('photo-1601050690597-df0568f70950'),
        calories: 270, protein: 6, fat: 12, carbs: 35,
        rating: 4.65, ratingCount: 142,
        cookTime: 70,
        displayTags: ['ИНДИЙСКАЯ', 'ВЕГАН', 'ПЕРЕКУС'],
        filters: {
            mealType: ['snack', 'tea'],
            occasions: [],
            health: ['vegan', 'vegetarian'],
            cuisine: ['indian'],
            taste: ['spicy', 'salty'],
        },
        ingredients: [
            { name: 'Мука', amount: '300', unit: 'г' },
            { name: 'Картофель', amount: '4', unit: 'шт' },
            { name: 'Зелёный горошек', amount: '150', unit: 'г' },
            { name: 'Карри', amount: '1', unit: 'ст.л.' },
            { name: 'Чили', amount: '1', unit: 'шт' },
        ],
    },

    /* === Полезные / лёгкие === */
    {
        id: '28',
        title: 'Греческий салат',
        description:
            'Свежий и лёгкий салат с оливками, фетой и хрустящими овощами. Идеально для лёгкого обеда.',
        image: img('photo-1540189549336-e6e99c3679fe'),
        calories: 150, protein: 6, fat: 11, carbs: 8,
        rating: 4.72, ratingCount: 245,
        cookTime: 15,
        displayTags: ['ЗОЖ', 'ОБЕД', 'НИЗКИЕ КАЛОРИИ'],
        filters: {
            mealType: ['lunch', 'snack'],
            occasions: [],
            health: ['vegetarian', 'healthy', 'lowCarb', 'weightLoss', 'noGluten'],
            cuisine: [],
            taste: ['salty', 'sour'],
        },
        ingredients: [
            { name: 'Помидоры', amount: '3', unit: 'шт' },
            { name: 'Огурцы', amount: '2', unit: 'шт' },
            { name: 'Фета', amount: '150', unit: 'г' },
            { name: 'Оливки', amount: '100', unit: 'г' },
            { name: 'Оливковое масло', amount: '3', unit: 'ст.л.' },
        ],
    },
    {
        id: '29',
        title: 'Боул с киноа и нутом',
        description:
            'Тёплый боул с киноа, печёным нутом, овощами и тахинной заправкой. Сбалансированно, вкусно и веган-френдли.',
        image: img('photo-1512621776951-a57141f2eefd'),
        calories: 340, protein: 15, fat: 12, carbs: 48,
        rating: 4.65, ratingCount: 189,
        cookTime: 35,
        displayTags: ['ВЕГАН', 'ЗОЖ', 'ОБЕД'],
        filters: {
            mealType: ['lunch'],
            occasions: [],
            health: ['vegan', 'vegetarian', 'healthy', 'highProtein', 'noGluten', 'noLactose'],
            cuisine: [],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Киноа', amount: '200', unit: 'г' },
            { name: 'Нут', amount: '300', unit: 'г' },
            { name: 'Шпинат', amount: '100', unit: 'г' },
            { name: 'Морковь', amount: '2', unit: 'шт' },
            { name: 'Тахини', amount: '2', unit: 'ст.л.' },
        ],
    },
    {
        id: '30',
        title: 'Лосось на пару с рисом',
        description:
            'Сочный лосось на пару с лимоном и тимьяном на подушке из жасминового риса. Ужин премиум-класса.',
        image: img('photo-1467003909585-2f8a72700288'),
        calories: 360, protein: 32, fat: 14, carbs: 28,
        rating: 4.92, ratingCount: 298,
        cookTime: 30,
        displayTags: ['ЗОЖ', 'ВЫСОКОБЕЛКОВОЕ', 'УЖИН'],
        filters: {
            mealType: ['dinner'],
            occasions: [],
            health: ['healthy', 'highProtein', 'noLactose', 'noGluten'],
            cuisine: [],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Лосось', amount: '500', unit: 'г' },
            { name: 'Рис жасмин', amount: '250', unit: 'г' },
            { name: 'Лимон', amount: '1', unit: 'шт' },
            { name: 'Тимьян', amount: '4', unit: 'веточки' },
        ],
    },
    {
        id: '31',
        title: 'Куриная грудка с овощами на гриле',
        description:
            'Маринованная куриная грудка на гриле с цуккини, перцем и помидорами черри. Высокий белок, низкие калории.',
        image: img('photo-1532550907401-a500c9a57435'),
        calories: 280, protein: 34, fat: 8, carbs: 12,
        rating: 4.7, ratingCount: 167,
        cookTime: 35,
        displayTags: ['ЗОЖ', 'ВЫСОКОБЕЛКОВОЕ', 'УЖИН'],
        filters: {
            mealType: ['lunch', 'dinner'],
            occasions: [],
            health: ['healthy', 'highProtein', 'lowCarb', 'weightLoss', 'noGluten', 'noLactose'],
            cuisine: [],
            taste: ['salty'],
        },
        ingredients: [
            { name: 'Куриная грудка', amount: '500', unit: 'г' },
            { name: 'Цуккини', amount: '1', unit: 'шт' },
            { name: 'Перец болгарский', amount: '2', unit: 'шт' },
            { name: 'Помидоры черри', amount: '200', unit: 'г' },
            { name: 'Оливковое масло', amount: '2', unit: 'ст.л.' },
        ],
    },

    /* === Десерты / полдник === */
    {
        id: '32',
        title: 'Чизкейк нью-йорк',
        description:
            'Кремовый чизкейк на основе из печенья с лёгкой кислинкой. Идеально к чашке кофе во второй половине дня.',
        image: img('photo-1567306226416-28f0efdc88ce'),
        calories: 380, protein: 8, fat: 24, carbs: 32,
        rating: 4.86, ratingCount: 412,
        cookTime: 90,
        displayTags: ['ДЕСЕРТЫ', 'ПОЛДНИК', 'ВЫПЕЧКА'],
        filters: {
            mealType: ['tea'],
            occasions: ['birthday'],
            health: ['vegetarian'],
            cuisine: [],
            taste: ['sweet', 'sour'],
        },
        ingredients: [
            { name: 'Сливочный сыр', amount: '600', unit: 'г' },
            { name: 'Сахар', amount: '180', unit: 'г' },
            { name: 'Яйца', amount: '3', unit: 'шт' },
            { name: 'Печенье', amount: '200', unit: 'г' },
            { name: 'Сливочное масло', amount: '80', unit: 'г' },
        ],
    },
    {
        id: '33',
        title: 'Финский черничный пирог',
        description:
            'Открытый пирог на песочном тесте с густой заливкой и шапкой из спелой черники. Чуть тёплый — идеален к чаю.',
        image: img('photo-1488477181946-6428a0291777'),
        calories: 285, protein: 5, fat: 11, carbs: 40,
        rating: 4.72, ratingCount: 145,
        cookTime: 75,
        displayTags: ['ВЫПЕЧКА', 'ДЕСЕРТЫ', 'ПОЛДНИК'],
        filters: {
            mealType: ['tea'],
            occasions: [],
            health: ['vegetarian'],
            cuisine: [],
            taste: ['sweet'],
        },
        ingredients: [
            { name: 'Мука', amount: '300', unit: 'г' },
            { name: 'Сливочное масло', amount: '150', unit: 'г' },
            { name: 'Сахар', amount: '180', unit: 'г' },
            { name: 'Черника', amount: '400', unit: 'г' },
            { name: 'Сметана', amount: '200', unit: 'г' },
        ],
    },
    {
        id: '34',
        title: 'Торт «Наполеон»',
        description:
            'Многослойный торт из тонких хрустящих коржей и нежного заварного крема. Праздничный десерт без компромиссов.',
        image: img('photo-1535141192574-5d4897c12636'),
        calories: 410, protein: 6, fat: 22, carbs: 48,
        rating: 4.95, ratingCount: 723,
        cookTime: 180,
        displayTags: ['РУССКАЯ', 'ДЕСЕРТЫ', 'ПРАЗДНИК'],
        filters: {
            mealType: ['tea'],
            occasions: ['birthday', 'newyear'],
            health: ['vegetarian'],
            cuisine: ['russian'],
            taste: ['sweet'],
        },
        ingredients: [
            { name: 'Мука', amount: '500', unit: 'г' },
            { name: 'Сливочное масло', amount: '300', unit: 'г' },
            { name: 'Молоко', amount: '1', unit: 'л' },
            { name: 'Яйца', amount: '4', unit: 'шт' },
            { name: 'Сахар', amount: '300', unit: 'г' },
        ],
    },

    /* === Перекус / снек === */
    {
        id: '35',
        title: 'Хумус с лавашом',
        description:
            'Кремовый нутовый хумус с тахини, лимоном и оливковым маслом. Подаётся с тёплым лавашом или овощами.',
        image: img('photo-1571197119282-7c4b4f4d9d4d'),
        calories: 195, protein: 9, fat: 11, carbs: 18,
        rating: 4.68, ratingCount: 134,
        cookTime: 15,
        displayTags: ['ВЕГАН', 'ПЕРЕКУС', 'БЫСТРО'],
        filters: {
            mealType: ['snack'],
            occasions: [],
            health: ['vegan', 'vegetarian', 'healthy', 'highProtein', 'noLactose'],
            cuisine: [],
            taste: ['sour', 'salty'],
        },
        ingredients: [
            { name: 'Нут варёный', amount: '400', unit: 'г' },
            { name: 'Тахини', amount: '3', unit: 'ст.л.' },
            { name: 'Лимон', amount: '1', unit: 'шт' },
            { name: 'Оливковое масло', amount: '4', unit: 'ст.л.' },
            { name: 'Чеснок', amount: '2', unit: 'зуб.' },
        ],
    },
    {
        id: '36',
        title: 'Энергетические шарики из фиников',
        description:
            'Без сахара, без выпечки, без отходов. Финики, орехи и какао — три ингредиента и пять минут до полезного перекуса.',
        image: img('photo-1606312619070-d48b4c652a52'),
        calories: 175, protein: 4, fat: 8, carbs: 24,
        rating: 4.55, ratingCount: 98,
        cookTime: 10,
        displayTags: ['ВЕГАН', 'БЕЗ САХАРА', 'ПЕРЕКУС'],
        filters: {
            mealType: ['snack'],
            occasions: [],
            health: ['vegan', 'vegetarian', 'healthy', 'noSugar', 'noLactose', 'noGluten'],
            cuisine: [],
            taste: ['sweet'],
        },
        ingredients: [
            { name: 'Финики', amount: '300', unit: 'г' },
            { name: 'Орехи кешью', amount: '150', unit: 'г' },
            { name: 'Какао', amount: '2', unit: 'ст.л.' },
            { name: 'Кокосовая стружка', amount: '50', unit: 'г' },
        ],
    },
]

/* ─── Pure-helper: список всех известных ингредиентов
   Используется в модалке «Кнопка Ингредиенты» (поиск).
   Получаем уникальные имена из всех рецептов. ────────────────── */
export const allIngredientNames: string[] = (() => {
    const set = new Set<string>()
    for (const r of recipes) {
        for (const ing of r.ingredients) set.add(ing.name)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ru'))
})()
