/**
 * PrimePOS Internationalization (i18n) System
 * 
 * This is a lightweight, client-side i18n implementation designed for POS performance.
 * It supports instant language switching without page reloads, ensuring active sales
 * are never interrupted.
 * 
 * Supported Languages:
 * - English (en) - Default
 * - Chichewa (ny) - Malawi national language
 */

export type Locale = 'en' | 'ny'

export const LOCALES: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa' },
]

export const DEFAULT_LOCALE: Locale = 'en'

// Translation namespaces - matches file structure
export type TranslationNamespace = 
  | 'common'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'sales'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'shifts'
  | 'validation'

// Type for nested translation objects
export type TranslationValue = string | { [key: string]: TranslationValue }
export type Translations = { [key: string]: TranslationValue }

// Cache for loaded translations
const translationCache: Map<string, Translations> = new Map()

/**
 * Load translations for a specific locale and namespace
 * Uses dynamic imports for code splitting
 */
export async function loadTranslations(
  locale: Locale,
  namespace: TranslationNamespace
): Promise<Translations> {
  const cacheKey = `${locale}:${namespace}`
  
  // Return cached translations if available
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }
  
  try {
    // Dynamic import for code splitting
    const translations = await import(`@/locales/${locale}/${namespace}.json`)
    const data = translations.default || translations
    translationCache.set(cacheKey, data)
    return data
  } catch (error) {
    console.warn(`Failed to load translations for ${locale}/${namespace}:`, error)
    
    // Fallback to English if loading fails
    if (locale !== DEFAULT_LOCALE) {
      return loadTranslations(DEFAULT_LOCALE, namespace)
    }
    
    return {}
  }
}

/**
 * Clear cache for a specific locale (useful when switching languages)
 */
export function clearLocaleCache(locale: Locale): void {
  const namespaces: TranslationNamespace[] = [
    'common', 'pos', 'products', 'inventory', 'sales',
    'customers', 'reports', 'settings', 'shifts', 'validation',
  ]
  namespaces.forEach(ns => {
    translationCache.delete(`${locale}:${ns}`)
  })
}

/**
 * Load all translations for a locale (for initial load)
 */
export async function loadAllTranslations(locale: Locale, forceReload = false): Promise<Record<TranslationNamespace, Translations>> {
  const namespaces: TranslationNamespace[] = [
    'common',
    'pos',
    'products',
    'inventory',
    'sales',
    'customers',
    'reports',
    'settings',
    'shifts',
    'validation',
  ]
  
  // Clear cache if force reload
  if (forceReload) {
    clearLocaleCache(locale)
  }
  
  const results = await Promise.all(
    namespaces.map(async (ns) => ({
      namespace: ns,
      translations: await loadTranslations(locale, ns),
    }))
  )
  
  return results.reduce((acc, { namespace, translations }) => {
    acc[namespace] = translations
    return acc
  }, {} as Record<TranslationNamespace, Translations>)
}

/**
 * Get a nested value from an object using dot notation
 * Example: getNestedValue({ a: { b: 'value' } }, 'a.b') => 'value'
 */
export function getNestedValue(obj: Translations, path: string): string | undefined {
  const keys = path.split('.')
  let current: TranslationValue = obj
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined
    }
    if (typeof current === 'string') {
      return undefined
    }
    current = current[key]
  }
  
  return typeof current === 'string' ? current : undefined
}

/**
 * Interpolate variables in a translation string
 * Example: interpolate('Hello {name}!', { name: 'John' }) => 'Hello John!'
 */
export function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text
  
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key]
    return value !== undefined ? String(value) : match
  })
}

/**
 * Get the stored locale from localStorage
 */
export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem('primepos_locale')
  if (stored && (stored === 'en' || stored === 'ny')) {
    return stored as Locale
  }
  return null
}

/**
 * Store the locale in localStorage
 */
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('primepos_locale', locale)
}

/**
 * Clear translation cache (useful for development)
 */
export function clearTranslationCache(): void {
  translationCache.clear()
}

