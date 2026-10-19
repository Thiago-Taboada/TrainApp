// Reward points system (client-side, trust-based).
//
// Design for robustness against double-paying / log deletions:
//   - Session points are DERIVED from the number of trained sessions
//     (count * POINTS_PER_SESSION), not incremented on each save. This makes
//     the value deterministic and self-correcting.
//   - Achievement bonuses (see src/lib/achievements.js) are also derived from
//     state, so they can't be farmed by toggling logs.
//   - Total earned = session points + achievement bonuses.
//   - Spendable balance = total earned - points spent (store purchases).

// Base economy is intentionally low so points feel earned and the store costs
// something. Streak rewards now live in achievements (one source of truth).
export const POINTS_PER_SESSION = 3

export const BASE_ROUTINE_SLOTS = 3
export const SLOT_COST = 100

// Session points from the number of trained sessions logged.
export function sessionPoints(trainedCount) {
  return trainedCount * POINTS_PER_SESSION
}
