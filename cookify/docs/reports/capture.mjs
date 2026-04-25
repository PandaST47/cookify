// Скрипт для захвата скриншотов отчёта.
// Запускается единоразово: `node docs/reports/capture.mjs`.
// Требует, чтобы dev-сервер уже был поднят (npm run dev) — порт читается из BASE_URL.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS = resolve(__dirname, 'assets')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5174'

await mkdir(ASSETS, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'ru-RU',
})
const page = await context.newPage()

// 1) Открыть пустую страницу один раз, чтобы получить доступ к localStorage origin'а.
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

// 2) Сидим тестового юзера + избранное + исключения, чтобы не возиться с регистрацией.
await page.evaluate(() => {
    const userId = '00000000-0000-4000-8000-000000000001'
    const users = [
        {
            id: userId,
            email: 'tester@cookify.local',
            // hashPassword('Test12345!') — соль/алгоритм совпадают с mockAuth.
            // Для скриншотов мы не логинимся через UI, важна лишь структура.
            passwordHash: 'placeholder',
            username: 'tester',
            createdAt: new Date().toISOString(),
        },
    ]
    localStorage.setItem('cookify:users', JSON.stringify(users))
    localStorage.setItem(
        'cookify:session',
        JSON.stringify({ userId, issuedAt: Date.now() }),
    )
    localStorage.setItem(
        'cookify:favorites',
        JSON.stringify(['1', '3', '7', '11']),
    )
    localStorage.setItem(
        `cookify:exclusions:${userId}`,
        JSON.stringify(['Помидоры', 'Лактоза', 'Глютен', 'Арахис']),
    )
})

const shoot = async (name) => {
    await page.waitForTimeout(350) // дать анимациям и шрифтам осесть
    await page.screenshot({
        path: resolve(ASSETS, `${name}.png`),
        fullPage: false,
    })
    console.log(`✓ ${name}.png`)
}

// 3) Главная — рекомендации.
await page.goto(BASE_URL + '/', { waitUntil: 'networkidle' })
await page.waitForSelector('.ck-grid')
await shoot('home-recommendations')

// 4) Вкладка Избранное.
await page.getByRole('tab', { name: 'Избранное' }).click()
await page.waitForSelector('.ck-grid')
await shoot('home-favorites')

// 5) Confirm-модалка при попытке убрать из избранного.
await page
    .locator('button[aria-label="Убрать из избранного"]')
    .first()
    .click()
await page.waitForSelector('[role="alertdialog"]')
await shoot('home-confirm-unfavorite')

// 5.1) Закрыть модалку (Отмена) — чтобы не остаться в состоянии диалога.
await page.getByRole('button', { name: 'Отмена' }).click()
await page.waitForSelector('[role="alertdialog"]', { state: 'detached' })

// 6) Профиль.
await page.goto(BASE_URL + '/profile', { waitUntil: 'networkidle' })
await page.waitForSelector('.profile-exclusions')
await shoot('profile-page')

// 7) Модалка "Добавить ингредиенты".
await page.getByRole('button', { name: /Добавить продукт/i }).click()
await page.waitForSelector('[role="dialog"]')
await shoot('profile-exclusions-modal')

await browser.close()
console.log('\nDone.')
