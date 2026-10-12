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

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, writeBatch } from 'firebase/firestore'
import { EXERCISES, ROUTINE_TEMPLATE } from '../src/data/seedData.js'

const firebaseConfig = {
  apiKey: 'AIzaSyCNeGeT48b7oHfBY01VxDAY8hbeKGfnn5U',
  authDomain: 'trainapp-bce35.firebaseapp.com',
  projectId: 'trainapp-bce35',
  storageBucket: 'trainapp-bce35.firebasestorage.app',
  messagingSenderId: '991879746134',
  appId: '1:991879746134:web:753d38d4722b60d188a1f7',
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
