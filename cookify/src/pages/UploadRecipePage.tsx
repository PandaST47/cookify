import {
    useState, useMemo, useCallback, useEffect, useRef,
    type ChangeEvent,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    ArrowLeft, Plus, Trash2, Check, ImagePlus, Pencil,
    CircleCheck, X,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import Header from '@/components/layout/Header'
import { useAuth } from '@/components/contexts/AuthContext'
import { useDrafts } from '@/components/hooks/useDrafts'
import { recipes, filterGroups } from '@/data/recipes'
import { createRecipe } from '@/services/api'
import type { Ingredient, RecipeDraft, RecipeStep } from '@/types'
import '@/styles/recipe.css'

const MAX_DESC = 240
const newId = () =>
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `draft-${Date.now()}`

const emptyIngredient = (): Ingredient => ({ name: '', amount: '', unit: 'г' })
const emptyStep = (): RecipeStep => ({ text: '', timerSeconds: 0 })

const emptyDraft = (): RecipeDraft => ({
    id: newId(),
    title: '',
    description: '',
    image: undefined,
    cookTime: '0:00',
    calories: '', protein: '', fat: '', carbs: '',
    ingredients: [emptyIngredient(), emptyIngredient(), emptyIngredient()],
    tags: [],
    steps: [emptyStep(), emptyStep(), emptyStep()],
    cookedStatus: 'new',
    updatedAt: new Date().toISOString(),
})

/** Уникальность по связке title + набор ингредиентов + набор тегов (ТЗ). */
function isUnique(d: RecipeDraft): boolean {
    const norm = (s: string) => s.trim().toLowerCase()
    const key = (t: string, ing: string[], tags: string[]) =>
        `${norm(t)}|${[...ing].map(norm).sort().join(',')}|${[...tags].map(norm).sort().join(',')}`
    const draftKey = key(
        d.title,
        d.ingredients.map((i) => i.name).filter(Boolean),
        d.tags,
    )
    return !recipes.some((r) =>
        key(r.title, r.ingredients.map((i) => i.name), [
            ...r.filters.mealType, ...r.filters.health, ...r.filters.taste,
        ]) === draftKey,
    )
}

export default function UploadRecipePage() {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const { user } = useAuth()
    const { drafts, save, remove, getById } = useDrafts(user?.id)

    const [tab, setTab] = useState<'new' | 'drafts'>(
        params.get('tab') === 'drafts' ? 'drafts' : 'new',
    )
    const editId = params.get('draft')
    const [draft, setDraft] = useState<RecipeDraft>(() => {
        if (editId) {
            const d = getById(editId)
            if (d) return d
        }
        return emptyDraft()
    })
    const [checkedTypos, setCheckedTypos] = useState(false)
    const [exitOpen, setExitOpen] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const prev = document.title
        document.title = 'Загрузить рецепт — Cookify'
        window.scrollTo(0, 0)
        return () => { document.title = prev }
    }, [])

    // Exit-модалка: Esc закрывает + блок скролла фона + автофокус
    // на безопасную «Сохранить черновик» (паттерн как у ConfirmModal).
    const exitDialogRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!exitOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setExitOpen(false)
        }
        document.addEventListener('keydown', onKey)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        exitDialogRef.current
            ?.querySelector<HTMLButtonElement>('[data-autofocus]')
            ?.focus()
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prevOverflow
        }
    }, [exitOpen])

    const patch = useCallback((p: Partial<RecipeDraft>) => {
        setDraft((d) => ({ ...d, ...p, updatedAt: new Date().toISOString() }))
    }, [])

    /* ── tag dropdowns from filterGroups ──
       Стабильные через useCallback, чтобы безопасно входить в deps
       у useMemo/useCallback ниже (без eslint-disable). */
    const groupOpts = useCallback(
        (gid: string) =>
            filterGroups.find((g) => g.id === gid)?.options ?? [],
        [],
    )

    const tagValue = useCallback(
        (gid: string) => {
            const ids = groupOpts(gid).map((o) => o.id)
            return draft.tags.find((t) => ids.includes(t)) ?? ''
        },
        [draft.tags, groupOpts],
    )
    const setTag = (gid: string, value: string) => {
        const ids = groupOpts(gid).map((o) => o.id)
        setDraft((d) => ({
            ...d,
            tags: [...d.tags.filter((t) => !ids.includes(t)), value].filter(Boolean),
            updatedAt: new Date().toISOString(),
        }))
    }

    /* ── ingredients ── */
    const setIng = (i: number, p: Partial<Ingredient>) => {
        setDraft((d) => {
            const next = [...d.ingredients]
            next[i] = { ...next[i], ...p }
            return { ...d, ingredients: next, updatedAt: new Date().toISOString() }
        })
    }
    const addIng = () => patch({ ingredients: [...draft.ingredients, emptyIngredient()] })
    const delIng = (i: number) =>
        patch({ ingredients: draft.ingredients.filter((_, idx) => idx !== i) })

    /* ── steps ── */
    const setStep = (i: number, p: Partial<RecipeStep>) => {
        setDraft((d) => {
            const next = [...d.steps]
            next[i] = { ...next[i], ...p }
            return { ...d, steps: next, updatedAt: new Date().toISOString() }
        })
    }
    const addStep = () => patch({ steps: [...draft.steps, emptyStep()] })
    const delStep = (i: number) =>
        patch({ steps: draft.steps.filter((_, idx) => idx !== i) })

    /* ── cover image ──
       Безопасность: разрешаем только растровые форматы (SVG исключаем —
       он может нести встроенные скрипты/внешние ссылки), ограничиваем
       размер (защита от localStorage-quota и тяжёлых data:URL). На выходе
       — только `data:image/<raster>;base64,...`. */
    const [coverError, setCoverError] = useState<string | null>(null)
    const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    const MAX_COVER_BYTES = 4 * 1024 * 1024 // 4 МБ
    const onCover = (e: ChangeEvent<HTMLInputElement>) => {
        setCoverError(null)
        const f = e.target.files?.[0]
        e.target.value = ''
        if (!f) return
        if (!ALLOWED.includes(f.type)) {
            setCoverError('Только PNG, JPG, WEBP или GIF (SVG не поддерживается).')
            return
        }
        if (f.size > MAX_COVER_BYTES) {
            setCoverError('Изображение слишком большое (максимум 4 МБ).')
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            const url = String(reader.result)
            // финальная проверка: это действительно растровый data:image
            if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(url)) {
                setCoverError('Не удалось распознать изображение.')
                return
            }
            patch({ image: url })
        }
        reader.onerror = () => setCoverError('Ошибка чтения файла.')
        reader.readAsDataURL(f)
    }

    /* ── validation (ТЗ: автопроверка обязательных полей) ── */
    const missing = useMemo(() => {
        const m: string[] = []
        if (!draft.image) m.push('Обложка рецепта')
        if (!draft.title.trim()) m.push('Название рецепта')
        if (!draft.description.trim()) m.push('Краткое описание рецепта')
        if (!/^\d+:\d{2}$/.test(draft.cookTime) || draft.cookTime === '0:00')
            m.push('Время приготовления')
        if (!draft.calories || !draft.protein || !draft.fat || !draft.carbs)
            m.push('Пищевая ценность (КБЖУ)')
        if (!tagValue('mealType')) m.push('Время приёма')
        if (!tagValue('health')) m.push('Тип питания')
        if (!tagValue('taste')) m.push('Вкус блюда')
        const filledIng = draft.ingredients.filter((i) => i.name.trim())
        if (filledIng.length < 3) m.push('Минимум 3 ингредиента')
        const filledSteps = draft.steps.filter((s) => s.text.trim())
        if (filledSteps.length < 3) m.push('Минимум 3 шага')
        return m
    }, [draft, tagValue])

    const unique = useMemo(() => isUnique(draft), [draft])
    const canUpload = missing.length === 0 && checkedTypos && unique

    /* ── actions ── */
    const handleSaveDraft = useCallback(() => {
        save({ ...draft, updatedAt: new Date().toISOString() })
        navigate('/')
    }, [draft, save, navigate])

    const handleUpload = useCallback(async () => {
        if (!canUpload) return
        // BACKEND: POST /api/recipes — сервер присваивает id + проверяет
        // уникальность повторно. Здесь — заглушка через api.createRecipe.
        await createRecipe({
            title: draft.title,
            description: draft.description,
            image: draft.image ?? '',
            calories: Number(draft.calories) || 0,
            protein: Number(draft.protein) || 0,
            fat: Number(draft.fat) || 0,
            carbs: Number(draft.carbs) || 0,
            cookTime: (() => {
                const [h, mm] = draft.cookTime.split(':').map(Number)
                return (h || 0) * 60 + (mm || 0)
            })(),
            displayTags: draft.tags.map((t) => t.toUpperCase()),
            filters: {
                mealType: [tagValue('mealType')].filter(Boolean),
                occasions: [],
                health: [tagValue('health')].filter(Boolean),
                cuisine: [],
                taste: [tagValue('taste')].filter(Boolean),
            },
            ingredients: draft.ingredients.filter((i) => i.name.trim()),
            steps: draft.steps.filter((s) => s.text.trim()),
        })
        remove(draft.id) // удаляется из черновиков (ТЗ)
        navigate('/')
    }, [canUpload, draft, navigate, remove, tagValue])

    /* ═══════════════════ DRAFTS TAB ═══════════════════ */
    const publishedSample = recipes.slice(0, 3) // мок «Опубликовано»

    return (
        <>
            <Header />
            <main className="ur" role="main">
                <div className="ur__container">
                    <div className="ur__topbar">
                        <button
                            type="button"
                            className="ur__back"
                            onClick={() => setExitOpen(true)}
                        >
                            <ArrowLeft size={18} aria-hidden="true" />
                            <span>На главную</span>
                        </button>
                        <div className="ur__tabs" role="tablist">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tab === 'new'}
                                className={`ur__tab ${tab === 'new' ? 'ur__tab--active' : ''}`}
                                onClick={() => setTab('new')}
                            >
                                Новый рецепт
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tab === 'drafts'}
                                className={`ur__tab ${tab === 'drafts' ? 'ur__tab--active' : ''}`}
                                onClick={() => setTab('drafts')}
                            >
                                Черновики
                            </button>
                        </div>
                        <div className="ur__topbar-spacer" />
                    </div>

                    {tab === 'drafts' ? (
                        <div className="ur__drafts">
                            <section aria-label="Черновики">
                                <div className="ur__drafts-head">
                                    <h2 className="ur__h2">Черновики (Неопубликованные)</h2>
                                    <span className="ur__sort-lbl">
                                        По времени редактирования ↓
                                    </span>
                                </div>
                                {drafts.length === 0 ? (
                                    <p className="ur__empty">
                                        Черновиков пока нет. Создайте рецепт во вкладке
                                        «Новый рецепт» и нажмите «Сохранить черновик».
                                    </p>
                                ) : (
                                    <ul className="ur__draft-list" role="list">
                                        {[...drafts]
                                            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                                            .map((d) => (
                                                <li key={d.id} className="ur__draft-row">
                                                    <button
                                                        type="button"
                                                        className="ur__draft-open"
                                                        onClick={() => {
                                                            setDraft(d)
                                                            setTab('new')
                                                        }}
                                                    >
                                                        <Pencil size={16} className="ur__draft-ic" aria-hidden="true" />
                                                        <span className="ur__draft-name">
                                                            {d.title || 'Без названия'}
                                                        </span>
                                                    </button>
                                                    <span className="ur__draft-date">
                                                        {new Date(d.updatedAt).toLocaleDateString('ru-RU')}{' '}
                                                        {new Date(d.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="ur__draft-del"
                                                        onClick={() => remove(d.id)}
                                                        aria-label={`Удалить черновик «${d.title || 'Без названия'}»`}
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </section>

                            <section aria-label="Опубликовано">
                                <div className="ur__drafts-head">
                                    <h2 className="ur__h2">Опубликовано</h2>
                                    <span className="ur__sort-lbl">
                                        По времени публикации ↑
                                    </span>
                                </div>
                                <ul className="ur__draft-list" role="list">
                                    {publishedSample.map((r) => (
                                        <li key={r.id} className="ur__draft-row">
                                            <div className="ur__draft-open ur__draft-open--static">
                                                <CircleCheck size={16} className="ur__draft-ic ur__draft-ic--ok" aria-hidden="true" />
                                                <span className="ur__draft-name">{r.title}</span>
                                            </div>
                                            <span className="ur__draft-date">18.05.26 12:32</span>
                                            <span className="ur__draft-del ur__draft-del--off" aria-hidden="true">
                                                <Trash2 size={16} />
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>
                    ) : (
                        <form
                            className="ur__form"
                            onSubmit={(e) => e.preventDefault()}
                            noValidate
                        >
                            <h1 className="ur__h1">Оформление рецепта</h1>

                            {/* Обложка */}
                            <div className={`ur__cover ${draft.image ? 'ur__cover--has' : ''}`}>
                                {draft.image ? (
                                    <img src={draft.image} alt="Обложка рецепта" className="ur__cover-img" />
                                ) : (
                                    <div className="ur__cover-empty">
                                        <ImagePlus size={40} aria-hidden="true" />
                                        <p>
                                            Добавьте обложку рецепта. Перетащите изображение
                                            в эту область или выберите файл с устройства.
                                            Допустимые форматы: JPG, PNG.
                                        </p>
                                    </div>
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={onCover}
                                />
                                <button
                                    type="button"
                                    className="ur__cover-btn"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    {draft.image ? 'Заменить обложку' : 'Загрузить обложку рецепта с устройства'}
                                    <Plus size={16} aria-hidden="true" />
                                </button>
                                {coverError && (
                                    <p className="ur__cover-err" role="alert">
                                        {coverError}
                                    </p>
                                )}
                            </div>

                            <label className="ur__field">
                                <span className="ur__label">Название рецепта <i>*</i></span>
                                <input
                                    type="text"
                                    className="ur__input"
                                    value={draft.title}
                                    onChange={(e) => patch({ title: e.target.value })}
                                    aria-required="true"
                                    aria-invalid={!draft.title.trim() || undefined}
                                    placeholder="Например, «Сырный крем-суп»"
                                />
                            </label>

                            <label className="ur__field">
                                <span className="ur__label">Краткое описание рецепта <i>*</i></span>
                                <textarea
                                    className={`ur__textarea ${!draft.description.trim() ? 'ur__textarea--req' : ''}`}
                                    value={draft.description}
                                    maxLength={MAX_DESC}
                                    rows={3}
                                    onChange={(e) => patch({ description: e.target.value })}
                                    aria-required="true"
                                    aria-invalid={!draft.description.trim() || undefined}
                                    placeholder="Какие эмоции дарит блюдо? В чём его главная особенность?"
                                />
                                <span className="ur__count">
                                    {draft.description.length}/{MAX_DESC}
                                </span>
                            </label>

                            {/* Параметры */}
                            <h2 className="ur__section">Параметры</h2>
                            <div className="ur__grid3">
                                <Select label="Время приёма" required
                                    value={tagValue('mealType')}
                                    onChange={(v) => setTag('mealType', v)}
                                    options={groupOpts('mealType')} />
                                <Select label="Тип питания" required
                                    value={tagValue('health')}
                                    onChange={(v) => setTag('health', v)}
                                    options={groupOpts('health')} />
                                <Select label="Вкус блюда" required
                                    value={tagValue('taste')}
                                    onChange={(v) => setTag('taste', v)}
                                    options={groupOpts('taste')} />
                                <Select label="Праздник"
                                    value={tagValue('occasions')}
                                    onChange={(v) => setTag('occasions', v)}
                                    options={groupOpts('occasions')} />
                                <Select label="Национальная кухня"
                                    value={tagValue('cuisine')}
                                    onChange={(v) => setTag('cuisine', v)}
                                    options={groupOpts('cuisine')} />
                            </div>

                            <div className="ur__grid3 ur__grid3--nums">
                                <div className="ur__field">
                                    <span className="ur__label">Время приготовления <i>*</i></span>
                                    <div className="ur__time">
                                        <input type="number" min={0} max={24}
                                            className="ur__time-in"
                                            value={draft.cookTime.split(':')[0]}
                                            onChange={(e) => patch({ cookTime: `${e.target.value || 0}:${draft.cookTime.split(':')[1] || '00'}` })}
                                            aria-label="Часы" />
                                        <span>ч</span>
                                        <input type="number" min={0} max={59}
                                            className="ur__time-in"
                                            value={draft.cookTime.split(':')[1]}
                                            onChange={(e) => patch({ cookTime: `${draft.cookTime.split(':')[0] || 0}:${String(e.target.value || 0).padStart(2, '0')}` })}
                                            aria-label="Минуты" />
                                        <span>мин</span>
                                    </div>
                                </div>
                                <div className="ur__field">
                                    <span className="ur__label">Пищевая ценность на 100 г <i>*</i></span>
                                    <div className="ur__kbzhu">
                                        {([
                                            ['calories', 'ккал'],
                                            ['protein', 'Б'],
                                            ['fat', 'Ж'],
                                            ['carbs', 'У'],
                                        ] as const).map(([k, lbl]) => (
                                            <label key={k} className="ur__kbzhu-cell">
                                                <input type="number" min={0}
                                                    className="ur__kbzhu-in"
                                                    value={draft[k]}
                                                    onChange={(e) => patch({ [k]: e.target.value })}
                                                    aria-label={lbl} />
                                                <span>{lbl}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Ингредиенты */}
                            <h2 className="ur__section">Ингредиенты</h2>
                            <p className="ur__hint">Добавьте минимум 3 ингредиента</p>
                            <ul className="ur__ings" role="list">
                                {draft.ingredients.map((ing, i) => (
                                    <li key={i} className="ur__ing">
                                        <input
                                            type="text"
                                            className="ur__input ur__ing-name"
                                            placeholder="Название, например «Картофель»"
                                            value={ing.name}
                                            onChange={(e) => setIng(i, { name: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="ur__input ur__ing-amt"
                                            placeholder="Кол-во"
                                            value={ing.amount}
                                            onChange={(e) => setIng(i, { amount: e.target.value })}
                                        />
                                        <select
                                            className="ur__select ur__ing-unit"
                                            value={ing.unit}
                                            onChange={(e) => setIng(i, { unit: e.target.value })}
                                            aria-label="Единица измерения"
                                        >
                                            {['г', 'кг', 'мл', 'л', 'шт', 'ч.л.', 'ст.л.', 'зуб.', 'по вкусу'].map((u) => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="ur__icon-btn"
                                            onClick={() => delIng(i)}
                                            aria-label="Удалить ингредиент"
                                            disabled={draft.ingredients.length <= 1}
                                        >
                                            <Trash2 size={16} aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <button type="button" className="ur__add" onClick={addIng}>
                                <Plus size={16} aria-hidden="true" /> Добавить ингредиент
                            </button>

                            {/* Шаги */}
                            <h2 className="ur__section">Пошаговые инструкции</h2>
                            <p className="ur__hint">Добавьте минимум 3 шага</p>
                            <ol className="ur__steps" role="list">
                                {draft.steps.map((s, i) => (
                                    <li key={i} className="ur__step">
                                        <div className="ur__step-head">
                                            <h3 className="ur__step-num">Шаг {i + 1}</h3>
                                            <button
                                                type="button"
                                                className="ur__icon-btn"
                                                onClick={() => delStep(i)}
                                                aria-label={`Удалить шаг ${i + 1}`}
                                                disabled={draft.steps.length <= 1}
                                            >
                                                <Trash2 size={16} aria-hidden="true" />
                                            </button>
                                        </div>
                                        <textarea
                                            className="ur__textarea"
                                            rows={3}
                                            placeholder="Что делать на этом шаге? *"
                                            value={s.text}
                                            onChange={(e) => setStep(i, { text: e.target.value })}
                                        />
                                        <div className="ur__step-extra">
                                            <label className="ur__field">
                                                <span className="ur__label">Таймер (мин)</span>
                                                <input
                                                    type="number" min={0}
                                                    className="ur__input"
                                                    value={s.timerSeconds ? s.timerSeconds / 60 : ''}
                                                    onChange={(e) => setStep(i, { timerSeconds: (Number(e.target.value) || 0) * 60 })}
                                                    placeholder="0"
                                                />
                                            </label>
                                            <label className="ur__field">
                                                <span className="ur__label">Пояснение (необяз.)</span>
                                                <input
                                                    type="text"
                                                    className="ur__input"
                                                    value={s.tip ?? ''}
                                                    onChange={(e) => setStep(i, { tip: e.target.value })}
                                                    placeholder="Совет / пояснение термина"
                                                />
                                            </label>
                                            <label className="ur__field">
                                                <span className="ur__label">Предупреждение (необяз.)</span>
                                                <input
                                                    type="text"
                                                    className="ur__input"
                                                    value={s.warning ?? ''}
                                                    onChange={(e) => setStep(i, { warning: e.target.value })}
                                                    placeholder="Типичная ошибка на этом шаге"
                                                />
                                            </label>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                            <button type="button" className="ur__add" onClick={addStep}>
                                <Plus size={16} aria-hidden="true" /> Добавить шаг
                            </button>

                            {/* Блок проверки — статус озвучивается скринридером */}
                            <div className="ur__check" aria-live="polite">
                                <h2 className="ur__section">Подытожим</h2>
                                {missing.length > 0 ? (
                                    <ul className="ur__check-list" role="list">
                                        {missing.map((m) => (
                                            <li key={m} className="ur__check-bad">
                                                <X size={14} aria-hidden="true" /> Заполните: {m}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="ur__check-ok">
                                        <Check size={15} aria-hidden="true" />
                                        Все обязательные поля заполнены
                                    </p>
                                )}
                                <p className={`ur__uniq ${unique ? 'ur__uniq--ok' : 'ur__uniq--bad'}`}>
                                    {unique
                                        ? '✓ Уникальность: рецепт уникален'
                                        : '✕ Такой рецепт уже есть (название + ингредиенты + теги совпадают)'}
                                </p>
                                <p className="ur__check-note">
                                    При наличии ошибок в названии, составе ингредиентов
                                    или времени готовки рецепт могут не увидеть. Проверьте
                                    всё перед отправкой и подтвердите галочкой.
                                </p>
                                <label className="ur__typo">
                                    <input
                                        type="checkbox"
                                        checked={checkedTypos}
                                        onChange={(e) => setCheckedTypos(e.target.checked)}
                                        className="ur__typo-input"
                                    />
                                    <span className={`ur__typo-box ${checkedTypos ? 'ur__typo-box--on' : ''}`} aria-hidden="true">
                                        {checkedTypos && <Check size={13} color="#fff" strokeWidth={3} />}
                                    </span>
                                    Я проверил(а) рецепт на опечатки
                                </label>

                                <div className="ur__actions">
                                    <button
                                        type="button"
                                        className="ur__btn ur__btn--ghost"
                                        onClick={handleSaveDraft}
                                    >
                                        Сохранить черновик
                                    </button>
                                    <button
                                        type="button"
                                        className="ur__btn ur__btn--primary"
                                        onClick={handleUpload}
                                        disabled={!canUpload}
                                        title={!canUpload ? 'Заполните обязательные поля, отметьте проверку и убедитесь в уникальности' : undefined}
                                    >
                                        Загрузить рецепт
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </main>

            {exitOpen && createPortal(
                <div className="ck-confirm-backdrop" role="presentation" onClick={() => setExitOpen(false)}>
                    <div
                        ref={exitDialogRef}
                        className="ck-confirm"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="ur-exit-t"
                        aria-describedby="ur-exit-d"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="ur-exit-t" className="ck-confirm__title">Выйти без сохранения?</h2>
                        <p id="ur-exit-d" className="ck-confirm__desc">
                            Несохранённые данные будут удалены. Можно сохранить
                            черновик и вернуться к нему позже.
                        </p>
                        <div className="ck-confirm__actions">
                            <button
                                type="button"
                                className="ck-confirm__btn ck-confirm__btn--ghost"
                                onClick={() => { handleSaveDraft() }}
                                data-autofocus
                            >
                                Сохранить черновик
                            </button>
                            <button
                                type="button"
                                className="ck-confirm__btn ck-confirm__btn--danger"
                                onClick={() => navigate('/')}
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}

/* ── Select helper ── */
function Select({
    label, required, value, onChange, options,
}: {
    label: string
    required?: boolean
    value: string
    onChange: (v: string) => void
    options: { id: string; label: string }[]
}) {
    return (
        <label className="ur__field">
            <span className="ur__label">
                {label} {required && <i>*</i>}
            </span>
            <select
                className={`ur__select ${required && !value ? 'ur__select--req' : ''}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-required={required || undefined}
                aria-invalid={required && !value ? true : undefined}
            >
                <option value="">Выберите…</option>
                {options.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                ))}
            </select>
        </label>
    )
}
