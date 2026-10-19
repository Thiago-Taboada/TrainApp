// Achievements (client-side, trust-based — same philosophy as points.js).
//
// Every achievement is DERIVED from the user's data, so unlocking is
// deterministic and self-correcting (deleting/redoing logs recomputes it).
//
// Each achievement:
//   id          stable key (also the i18n key: achievements.items.<id>.title/desc)
//   tier        'easy' | 'medium' | 'hard' | 'epic' | 'secret'
//   points      reward added to the balance when unlocked (0 = badge only)
//   secret      true => hidden (no title/desc/progress) until unlocked
//   progress(ctx) => { current, target }  (target 1 for boolean achievements)
//
// Points integration: session points (points.js) + sum of `points` of every
// unlocked achievement = total earned. The "accumulated points" badges give 0
// points, so there is no recursion.

import { sessionPoints } from './points'

export const TIERS = ['easy', 'medium', 'hard', 'epic', 'secret']

// Boolean helper: progress is 1/1 when `cond` is truthy, else 0/1.
const bool = (cond) => ({ current: cond ? 1 : 0, target: 1 })
// Count helper, clamped to target for the bar.
const count = (n, target) => ({ current: Math.min(n, target), target })

export const ACHIEVEMENTS = [
  // ---- Easy (badge only) -------------------------------------------------
  { id: 'firstStep', tier: 'easy', points: 0, progress: (c) => count(c.trainedCount, 1) },
  { id: 'routineActivated', tier: 'easy', points: 0, progress: (c) => bool(c.activeCount >= 1) },
  { id: 'onTheScale', tier: 'easy', points: 0, progress: (c) => count(c.weightCount, 1) },
  { id: 'personalTouch', tier: 'easy', points: 0, progress: (c) => bool(c.customCount >= 1) },
  { id: 'weekDone', tier: 'easy', points: 0, progress: (c) => bool(c.hasPerfectWeek) },

  // ---- Medium (badge only; streak-7 gives points) ------------------------
  { id: 'tenSessions', tier: 'medium', points: 0, progress: (c) => count(c.trainedCount, 10) },
  { id: 'fiftySessions', tier: 'medium', points: 0, progress: (c) => count(c.trainedCount, 50) },
  { id: 'toTheLimit', tier: 'medium', points: 0, progress: (c) => count(c.maxEffortSets, 20) },
  { id: 'toFailure', tier: 'medium', points: 0, progress: (c) => count(c.failureSets, 10) },
  { id: 'collector', tier: 'medium', points: 0, progress: (c) => count(c.distinctExercises, 15) },
  { id: 'streak7', tier: 'medium', points: 20, progress: (c) => count(c.bestStreak, 7) },

  // ---- Hard (points) -----------------------------------------------------
  { id: 'streak30', tier: 'hard', points: 75, progress: (c) => count(c.bestStreak, 30) },
  { id: 'centurion', tier: 'hard', points: 80, progress: (c) => count(c.trainedCount, 100) },
  { id: 'monthlyMarathon', tier: 'hard', points: 60, progress: (c) => count(c.bestMonthDays, 20) },
  { id: 'fullBody', tier: 'hard', points: 50, progress: (c) => count(c.muscleGroupsWorked, c.totalMuscleGroups) },
  { id: 'shopper', tier: 'hard', points: 30, progress: (c) => bool(c.purchasesMade) },

  // ---- Epic (points; the accumulated-points badges give 0 to avoid loops) -
  { id: 'streak100', tier: 'epic', points: 200, progress: (c) => count(c.bestStreak, 100) },
  { id: 'unstoppable', tier: 'epic', points: 300, progress: (c) => count(c.trainedCount, 365) },
  { id: 'loyal', tier: 'epic', points: 150, progress: (c) => count(c.daysSinceFirstLog, 365) },
  { id: 'points1k', tier: 'epic', points: 0, progress: (c) => count(c.earnedForBadges, 1000) },
  { id: 'points3k', tier: 'epic', points: 0, progress: (c) => count(c.earnedForBadges, 3000) },
  { id: 'points5k', tier: 'epic', points: 0, progress: (c) => count(c.earnedForBadges, 5000) },

  // ---- Secret (hidden until unlocked; small points) ----------------------
  { id: 'nightOwl', tier: 'secret', points: 25, progress: (c) => bool(c.nightOwl) },
  { id: 'earlyBird', tier: 'secret', points: 25, progress: (c) => bool(c.earlyBird) },
  { id: 'weekendWarrior', tier: 'secret', points: 25, progress: (c) => bool(c.weekendWarrior) },
]

// Is an achievement unlocked given its progress?
export function isUnlocked(a, ctx) {
  const { current, target } = a.progress(ctx)
  return current >= target
}

// Sum of reward points from unlocked achievements.
export function achievementPoints(ctx) {
  return ACHIEVEMENTS.reduce((sum, a) => (isUnlocked(a, ctx) ? sum + a.points : sum), 0)
}

// Total earned across history: session points + achievement rewards.
export function computeEarned(ctx) {
  return sessionPoints(ctx.trainedCount) + achievementPoints(ctx)
}

// Spendable balance = earned - spent.
export function computeBalance(ctx) {
  return Math.max(0, computeEarned(ctx) - (ctx.pointsSpent ?? 0))
}

// Build the evaluation context from raw app state. Pure + deterministic.
//   logs            user session logs
//   bestStreak      best streak in days (from computeStreak)
//   weights         body-weight entries
//   exercises       merged catalog (to resolve muscle groups + count custom)
//   routines        merged routines (to count custom)
//   activeCount     number of active routines
//   plannedPerWeek  non-rest planned days per week (for perfect week)
//   trainedThisWeek trained sessions in the current week
//   pointsSpent     store spending
//   ownedThemes     owned themes (for "shopper": >1 theme OR extra slots)
//   routineSlots    current routine slots (base = 3)
//   totalMuscleGroups  number of muscle-group keys
export function buildAchievementContext({
  logs = [],
  bestStreak = 0,
  weights = [],
  exercises = [],
  routines = [],
  activeCount = 0,
  hasPerfectWeek = false,
  pointsSpent = 0,
  ownedThemes = [],
  routineSlots = 3,
  baseRoutineSlots = 3,
  totalMuscleGroups = 0,
}) {
  const trained = logs.filter((l) => l.trained)
  const trainedCount = trained.length

  // Per-set aggregates.
  let maxEffortSets = 0
  let failureSets = 0
  const distinctEx = new Set()
  const musclesWorked = new Set()
  const exById = new Map(exercises.map((e) => [e.id, e]))
  for (const l of trained) {
    for (const e of l.entries ?? []) {
      distinctEx.add(e.exerciseId)
      const ex = exById.get(e.exerciseId)
      for (const m of ex?.muscleGroups ?? []) musclesWorked.add(m)
      for (const s of e.sets ?? []) {
        if (s.effort === 'max') maxEffortSets++
        if (s.toFailure) failureSets++
      }
    }
  }

  // Best number of trained days within a single calendar month (YYYY-MM).
  const byMonth = {}
  for (const l of trained) {
    const ym = (l.date ?? '').slice(0, 7)
    if (ym) byMonth[ym] = (byMonth[ym] ?? 0) + 1
  }
  const bestMonthDays = Object.values(byMonth).reduce((a, n) => Math.max(a, n), 0)

  // Days since the first logged session (any log, trained or not).
  const dates = logs.map((l) => l.date).filter(Boolean).sort()
  let daysSinceFirstLog = 0
  if (dates[0]) {
    const first = new Date(dates[0] + 'T00:00:00')
    daysSinceFirstLog = Math.floor((Date.now() - first.getTime()) / 86400000)
  }

  // Custom content the user created.
  const customCount =
    exercises.filter((e) => e.isCustom).length + routines.filter((r) => r.isCustom).length

  // "Shopper": bought anything in the store (owns a non-default theme OR has
  // extra routine slots OR has spent points).
  const purchasesMade =
    pointsSpent > 0 || routineSlots > baseRoutineSlots || (ownedThemes?.length ?? 0) > 1

  // Time-of-day / weekday secrets (need loggedHour; old logs without it skip).
  let nightOwl = false
  let earlyBird = false
  for (const l of trained) {
    if (typeof l.loggedHour === 'number') {
      if (l.loggedHour >= 0 && l.loggedHour < 5) nightOwl = true
      if (l.loggedHour >= 5 && l.loggedHour < 6) earlyBird = true
    }
  }
  // Weekend warrior: trained a Saturday and the Sunday of the same week.
  const weekendWarrior = hasWeekendPair(trained)

  const ctx = {
    trainedCount,
    bestStreak,
    weightCount: weights.length,
    customCount,
    activeCount,
    hasPerfectWeek,
    maxEffortSets,
    failureSets,
    distinctExercises: distinctEx.size,
    muscleGroupsWorked: musclesWorked.size,
    totalMuscleGroups,
    bestMonthDays,
    daysSinceFirstLog,
    purchasesMade,
    pointsSpent,
    nightOwl,
    earlyBird,
    weekendWarrior,
    earnedForBadges: 0,
  }

  // The accumulated-points badges (1k/3k/5k) measure TOTAL earned (session +
  // achievement rewards). Those badges give 0 points, so computing rewards
  // first and feeding the total back introduces no recursion in the reward sum.
  ctx.earnedForBadges = sessionPoints(trainedCount) + achievementPoints(ctx)
  return ctx
}

// Saturday+Sunday of the same ISO week both trained.
function hasWeekendPair(trained) {
  const dateSet = new Set(trained.map((l) => l.date))
  for (const iso of dateSet) {
    const d = new Date(iso + 'T00:00:00')
    if (d.getDay() === 6) {
      // Saturday -> check the next day (Sunday)
      const sun = new Date(d)
      sun.setDate(d.getDate() + 1)
      const y = sun.getFullYear()
      const m = String(sun.getMonth() + 1).padStart(2, '0')
      const day = String(sun.getDate()).padStart(2, '0')
      if (dateSet.has(`${y}-${m}-${day}`)) return true
    }
  }
  return false
}
