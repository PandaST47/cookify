/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** База REST API. Бэкенд-дев задаёт через `.env`: VITE_API_BASE_URL=https://api.cookify.ru */
    readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
