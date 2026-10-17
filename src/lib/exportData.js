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

// Reads and validates an exported JSON file. Returns a normalized payload with
// only the importable data (account info — name/email — is intentionally
// dropped). Throws with a friendly message if the file is invalid.
export async function parseImportFile(file) {
  let data
  try {
    const text = await file.text()
    data = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }

  if (!data || typeof data !== 'object') {
    throw new Error('El archivo no tiene el formato esperado.')
  }

  const asArray = (v) => (Array.isArray(v) ? v : [])

  const payload = {
    activeRoutineIds: asArray(data.activeRoutineIds).filter((x) => typeof x === 'string'),
    customExercises: asArray(data.customExercises).filter((e) => e && e.id),
    customRoutines: asArray(data.customRoutines).filter((r) => r && r.id),
    logs: asArray(data.logs).filter((l) => l && (l.id || l.date)),
    weights: asArray(data.weights).filter((w) => w && w.weekId),
  }

  const total =
    payload.customExercises.length +
    payload.customRoutines.length +
    payload.logs.length +
    payload.weights.length

  if (total === 0 && payload.activeRoutineIds.length === 0) {
    throw new Error('El archivo no contiene datos para importar.')
  }

  return payload
}
