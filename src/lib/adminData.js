// Admin-only reads of other users' training CONTENT (routines + exercises).
// Never touches personal data (logs/weights) — Firestore rules block that too.
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// List all users with a lightweight profile summary.
export async function fetchUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => {
    const data = d.data() ?? {}
    return {
      uid: d.id,
      displayName: data.displayName ?? '',
      email: data.email ?? '',
      photoURL: data.photoURL ?? '',
      activeRoutineIds: data.activeRoutineIds ?? [],
    }
  })
}

// Fetch a single user's custom routines and exercises (read-only).
export async function fetchUserContent(uid) {
  const [rtSnap, exSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'routines')),
    getDocs(collection(db, 'users', uid, 'exercises')),
  ])
  return {
    routines: rtSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    exercises: exSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  }
}
