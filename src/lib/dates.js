// Lightweight date helpers (no external deps). All week math is Monday-based.

import i18n from '../i18n'

// Maps the i18n language code to a BCP-47 locale for Intl date formatting.
function currentLocale() {
  const lang = (i18n.language || 'es').split('-')[0]
  return { es: 'es-ES', en: 'en-US', pt: 'pt-BR' }[lang] ?? 'es-ES'
}

export const WEEKDAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

// Local YYYY-MM-DD (avoids UTC off-by-one from toISOString()).
export function toISODate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Monday-based weekday index: Mon=0 ... Sun=6
export function weekdayIndex(date) {
  const js = new Date(date).getDay() // Sun=0..Sat=6
  return (js + 6) % 7
}

export function weekdayKey(date) {
  return WEEKDAY_KEYS[weekdayIndex(date)]
}

// Monday of the week containing `date`.
export function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - weekdayIndex(d))
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function weekDates(reference = new Date()) {
  const start = startOfWeek(reference)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// e.g. "lun 12 oct"
export function formatShort(date) {
  return new Date(date).toLocaleDateString(currentLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatLong(date) {
  return new Date(date).toLocaleDateString(currentLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// e.g. "12 oct 2026" — day, short month, year (no weekday).
export function formatMedium(date) {
  return new Date(date).toLocaleDateString(currentLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function isSameDay(a, b) {
  return toISODate(a) === toISODate(b)
}

// Week id like "2026-W41" for grouping logs by week.
export function weekId(date) {
  const d = startOfWeek(date)
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}
