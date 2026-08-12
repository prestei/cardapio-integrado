/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_DEFAULT_SLUG?: string
  readonly VITE_USE_MOCK?: string
  readonly VITE_ADMIN_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {}
