import { addDays, toISODate, weekdayKey } from './dates'
import { sessionForDay } from './sessions'

// Adherence streak: consecutive days where the plan was honored.
//   - A planned training day counts only if it was logged as trained.
//   - A planned rest day never breaks the streak (and doesn't add to it).
//   - Today, if it's a training day not yet logged, does NOT break the streak
//     (you can still train); it simply doesn't add until logged.
//
// Returns { current, best } in days.
export function computeStreak(logs, activeRoutines) {
  const trainedDates = new Set(logs.filter((l) => l.trained).map((l) => l.date))

  const isRestDay = (date) =>
    sessionForDay(activeRoutines, weekdayKey(date)).sessionType === 'rest'

  // --- Current streak: walk backwards from today ---------------------------
  let current = 0
  let cursor = new Date()
  const todayISO = toISODate(new Date())

  for (let i = 0; i < 1000; i++) {
    const iso = toISODate(cursor)
    if (isRestDay(cursor)) {
      // planned rest: neutral, keep going
    } else if (trainedDates.has(iso)) {
      current++
    } else if (iso === todayISO) {
      // today still pending: don't break, just don't count yet
    } else {
      break // a missed training day breaks the streak
    }
    cursor = addDays(cursor, -1)
  }

  // --- Best streak: scan the whole logged history --------------------------
  const best = computeBestStreak(trainedDates, isRestDay)

  return { current, best }
}

function computeBestStreak(trainedDates, isRestDay) {
  if (trainedDates.size === 0) return 0
  const sorted = [...trainedDates].sort()
  const start = new Date(sorted[0])
  const end = new Date() // up to today

  let best = 0
  let run = 0
  let cursor = new Date(start)
  for (let i = 0; i < 5000 && cursor <= end; i++) {
    const iso = toISODate(cursor)
    if (isRestDay(cursor)) {
      // neutral
    } else if (trainedDates.has(iso)) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
    cursor = addDays(cursor, 1)
  }
  return best
}
