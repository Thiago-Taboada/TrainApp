import { useMemo } from 'react'
import { useCatalog } from './useCatalog'
import { useLogs } from './useLogs'
import { computeStreak } from '../lib/streak'
import { sessionForDay } from '../lib/sessions'
import { WEEKDAYS, MUSCLE_GROUPS } from '../data/seedData'
import { weekDates, toISODate } from '../lib/dates'
import { BASE_ROUTINE_SLOTS } from '../lib/points'
import {
  ACHIEVEMENTS,
  buildAchievementContext,
  isUnlocked,
  computeBalance,
  computeEarned,
} from '../lib/achievements'

// Combines catalog + logs into the achievement evaluation context and returns
// the evaluated achievements, the spendable balance and total earned. Used by
// Today, Store and the Account achievements view so the logic lives in one spot.
export function useAchievements() {
  const {
    exercises,
    routines,
    activeRoutines,
    activeRoutineIds,
    pointsSpent,
    ownedThemes,
    routineSlots,
  } = useCatalog()
  const { logs, weights } = useLogs()

  return useMemo(() => {
    const { best: bestStreak } = computeStreak(logs, activeRoutines)

    // Perfect week: every planned (non-rest) weekday this week was trained,
    // and there was at least one planned day.
    const week = weekDates(new Date()).map(toISODate)
    const plannedDays = WEEKDAYS.filter(
      (w) => sessionForDay(activeRoutines, w.key).sessionType !== 'rest',
    ).length
    const trainedThisWeek = logs.filter((l) => week.includes(l.date) && l.trained).length
    const hasPerfectWeek = plannedDays > 0 && trainedThisWeek >= plannedDays

    const ctx = buildAchievementContext({
      logs,
      bestStreak,
      weights,
      exercises,
      routines,
      activeCount: activeRoutineIds.length,
      hasPerfectWeek,
      pointsSpent,
      ownedThemes,
      routineSlots,
      baseRoutineSlots: BASE_ROUTINE_SLOTS,
      totalMuscleGroups: Object.keys(MUSCLE_GROUPS).length,
    })

    const evaluated = ACHIEVEMENTS.map((a) => {
      const { current, target } = a.progress(ctx)
      return { ...a, current, target, unlocked: current >= target }
    })

    return {
      ctx,
      achievements: evaluated,
      unlockedCount: evaluated.filter((a) => a.unlocked).length,
      balance: computeBalance(ctx),
      earned: computeEarned(ctx),
      isUnlocked: (a) => isUnlocked(a, ctx),
    }
  }, [
    logs,
    weights,
    exercises,
    routines,
    activeRoutines,
    activeRoutineIds,
    pointsSpent,
    ownedThemes,
    routineSlots,
  ])
}
