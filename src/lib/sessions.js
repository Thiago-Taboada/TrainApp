// Helpers to derive a day's planned session from the set of ACTIVE routines.
// Multiple routines can be active at once; for a given weekday we merge their
// day definitions so the schedule shows everything planned that day.

import { SESSION_TYPE_META } from '../data/seedData'

// Priority to decide the dominant session type / color when several routines
// land on the same weekday.
const TYPE_PRIORITY = ['strength', 'flexibility', 'mobility', 'rest']

// Returns a merged "day" for a weekday across active routines:
// { weekday, label, content, sessionType, blocks: [{...block, routineId, routineName}] }
export function sessionForDay(activeRoutines, weekday) {
  const parts = []
  for (const routine of activeRoutines) {
    const day = routine.days?.find((d) => d.weekday === weekday)
    if (!day) continue
    parts.push({ routine, day })
  }

  if (parts.length === 0) {
    return { weekday, label: 'Sin sesión', content: '', sessionType: 'rest', blocks: [], routineNames: [] }
  }

  // Blocks tagged with their routine
  const blocks = []
  for (const { routine, day } of parts) {
    for (const b of day.blocks ?? []) {
      blocks.push({ ...b, routineId: routine.id, routineName: routine.name })
    }
  }

  // Dominant session type
  const types = parts.map((p) => p.day.sessionType)
  const sessionType =
    TYPE_PRIORITY.find((t) => types.includes(t)) ?? parts[0].day.sessionType

  // Labels: if single routine use its own label; else combine
  const label =
    parts.length === 1
      ? parts[0].day.label
      : parts.map((p) => p.day.label).join(' + ')
  const content =
    parts.length === 1
      ? parts[0].day.content
      : parts.map((p) => `${p.routine.name}: ${p.day.content}`).join(' · ')

  // If every active routine marks this as rest, it's a rest day.
  const allRest = parts.every((p) => p.day.sessionType === 'rest')

  return {
    weekday,
    label: allRest ? 'Descanso' : label,
    content,
    sessionType: allRest ? 'rest' : sessionType,
    blocks: allRest ? [] : blocks,
    routineNames: parts.map((p) => p.routine.name),
  }
}

export function metaFor(sessionType) {
  return SESSION_TYPE_META[sessionType] ?? SESSION_TYPE_META.rest
}

// Human-readable rest from a seconds value: 90 -> "1:30", 120 -> "2:00".
export function formatRest(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0))
  if (s === 0) return '—'
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem === 0 ? `${m} min` : `${m}:${String(rem).padStart(2, '0')} min`
}

// mm:ss clock format for the running timer: 90 -> "1:30".
export function formatClock(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${String(rem).padStart(2, '0')}`
}
