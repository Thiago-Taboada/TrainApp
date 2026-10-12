// One-time seed script for TrainApp.
// Loads exercises + the routine template into Firestore using the Firebase
// client SDK (no service-account key needed).
//
// Prerequisite: during seeding, the `exercises` and `routines` collections
// must be writable. Either:
//   (a) run this once right after creating the project while rules are in
//       test mode, OR
//   (b) temporarily relax firestore.rules to allow writes, run, then restore.
//
// Usage:  npm run seed
//
// Because seedData.js uses ESM exports, we import it directly.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, writeBatch } from 'firebase/firestore'
import { EXERCISES, ROUTINE_TEMPLATE } from '../src/data/seedData.js'

// Minimal .env loader (no dependency). Reads KEY=VALUE lines from ../.env
const __dirname = dirname(fileURLToPath(import.meta.url))
const env = {}
try {
  const raw = readFileSync(resolve(__dirname, '../.env'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].trim()
  }
} catch {
  console.error('❌ No se encontró .env. Copia .env.example a .env y completa los valores.')
  process.exit(1)
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function run() {
  console.log(`Seeding ${EXERCISES.length} exercises + 1 routine template…`)
  const batch = writeBatch(db)

  for (const ex of EXERCISES) {
    const { id, ...rest } = ex
    batch.set(doc(db, 'exercises', id), rest)
  }

  const { id: routineId, ...routineRest } = ROUTINE_TEMPLATE
  batch.set(doc(db, 'routines', routineId), routineRest)

  await batch.commit()
  console.log('✅ Seed completo.')
  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Seed falló:', err)
  process.exit(1)
})
