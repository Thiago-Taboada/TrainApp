// Builds a JSON backup of the user's data and triggers a download in the
// browser. Everything runs client-side; no server involved.
export function exportUserData({ user, logs, weights, customExercises, customRoutines, activeRoutineIds }) {
  const payload = {
    app: 'Vortx',
    exportedAt: new Date().toISOString(),
    account: {
      uid: user?.uid ?? null,
      displayName: user?.displayName ?? null,
      email: user?.email ?? null,
    },
    activeRoutineIds: activeRoutineIds ?? [],
    customExercises: customExercises ?? [],
    customRoutines: customRoutines ?? [],
    logs: logs ?? [],
    weights: weights ?? [],
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `vortx-datos-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
