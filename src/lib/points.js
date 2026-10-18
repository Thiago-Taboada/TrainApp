// Reward points system (client-side, trust-based).
//
// Design for robustness against double-paying / log deletions:
//   - Session points are DERIVED from the number of trained sessions
//     (count * POINTS_PER_SESSION), not incremented on each save. This makes
//     the value deterministic and self-correcting.
//   - Streak milestone bonuses are paid once; which milestones were reached is
//     derived from the best streak, so it can't be farmed by toggling.
//   - Total earned = session points + milestone bonuses.
//   - Spendable balance = total earned - points spent (store purchases).

export const POINTS_PER_SESSION = 10

// streak days -> bonus points
export const STREAK_MILESTONES = [
  { days: 7, bonus: 50 },
  { days: 14, bonus: 120 },
  { days: 30, bonus: 300 },
  { days: 60, bonus: 700 },
  { days: 100, bonus: 1500 },
]

export const BASE_ROUTINE_SLOTS = 3
export const SLOT_COST = 100

// Milestones reached given a best streak (in days).
export function reachedMilestones(bestStreak) {
  return STREAK_MILESTONES.filter((m) => bestStreak >= m.days)
}

// Total points EARNED across history (not spent).
//   trainedCount: number of trained sessions logged
//   bestStreak:   best streak in days
export function computeEarnedPoints(trainedCount, bestStreak) {
  const sessionPoints = trainedCount * POINTS_PER_SESSION
  const milestonePoints = reachedMilestones(bestStreak).reduce((a, m) => a + m.bonus, 0)
  return sessionPoints + milestonePoints
}

// Spendable balance = earned - spent.
export function computeBalance(trainedCount, bestStreak, pointsSpent = 0) {
  return Math.max(0, computeEarnedPoints(trainedCount, bestStreak) - pointsSpent)
}

// The next milestone not yet reached (for "faltan X días" hints). Null if maxed.
export function nextMilestone(bestStreak) {
  return STREAK_MILESTONES.find((m) => bestStreak < m.days) ?? null
}
