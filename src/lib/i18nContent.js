// Helpers to read multilingual CONTENT fields (exercise/routine text).
//
// Base-catalog content is authored as objects like
//   { es: 'Dominadas', en: 'Pull-ups', pt: 'Barras fixas' }
// while user-created content stays a plain string (the user types it in their
// own language). These helpers resolve either shape to a single string for the
// active language, with a sensible fallback chain.

import i18n from '../i18n'

const FALLBACK_ORDER = ['en', 'es', 'pt']

// Resolve the active 2-letter language (e.g. 'en-US' -> 'en').
function activeLang() {
  return (i18n.language || 'es').split('-')[0]
}

// Resolve a single multilingual value (string | { es, en, pt }) to a string.
// - Plain strings pass through unchanged (user content).
// - Objects pick the active language, then fall back: active -> en -> es -> pt
//   -> first available value.
export function localized(value, lang = activeLang()) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return String(value)

  if (value[lang]) return value[lang]
  for (const key of FALLBACK_ORDER) {
    if (value[key]) return value[key]
  }
  const first = Object.values(value).find((v) => typeof v === 'string' && v)
  return first ?? ''
}

// Resolve a multilingual LIST value (cues, equipment). Accepts:
//   - an array of strings (user content) -> returned as-is
//   - an object of arrays { es: [...], en: [...], pt: [...] } -> active array
//   - an array of multilingual objects [{es,en,pt}, ...] -> mapped
export function localizedList(value, lang = activeLang()) {
  if (value == null) return []

  // { es: [...], en: [...], pt: [...] }
  if (!Array.isArray(value) && typeof value === 'object') {
    if (Array.isArray(value[lang])) return value[lang]
    for (const key of FALLBACK_ORDER) {
      if (Array.isArray(value[key])) return value[key]
    }
    const first = Object.values(value).find((v) => Array.isArray(v))
    return first ?? []
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      item && typeof item === 'object' ? localized(item, lang) : item,
    )
  }

  return []
}

// Merge an edited STRING value into the active language slot of a multilingual
// field, preserving the other languages. Used by editors that edit only the
// current language.
// - If `existing` is a { es, en, pt } object, returns a copy with [lang] set.
// - If `existing` is a plain string or missing, returns an object with the
//   edited value under [lang] (and keeps the old string under its own best-guess
//   slot is NOT attempted — a bare string has unknown language, so we just set
//   the active language).
export function mergeLang(existing, nextValue, lang = activeLang()) {
  const base = existing && typeof existing === 'object' && !Array.isArray(existing) ? { ...existing } : {}
  base[lang] = nextValue
  return base
}

// Same as mergeLang but for LIST fields (cues, equipment): merges a string[]
// into the active language slot of a { es, en, pt } object-of-arrays.
export function mergeLangList(existing, nextArray, lang = activeLang()) {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing) ? { ...existing } : {}
  base[lang] = nextArray
  return base
}
