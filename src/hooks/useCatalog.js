import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { createElement } from 'react'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext.jsx'
import { EXERCISES, ROUTINE_TEMPLATE } from '../data/seedData'

// Delete every doc in a user subcollection, in batches (Firestore caps at 500).
async function wipeSubcollection(uid, name) {
  const snap = await getDocs(collection(db, 'users', uid, name))
  const docs = snap.docs
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db)
    for (const d of docs.slice(i, i + 400)) batch.delete(d.ref)
    await batch.commit()
  }
}

// -----------------------------------------------------------------------------
// Catalog = single source of truth for exercises + routines. It merges:
//   - BASE catalog: the PDF exercises + template routine (local, read-only).
//   - USER data:   exercises & routines the user creates (Firestore, private).
//   - activeRoutineIds (users/{uid}.activeRoutineIds).
//
// Exposed through a Context so the Firestore subscriptions are opened ONCE for
// the whole app (not re-created on every client-side navigation, which was
// causing the loader to hang between pages).
// -----------------------------------------------------------------------------
const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const { user } = useAuth()
  const [userExercises, setUserExercises] = useState([])
  const [userRoutines, setUserRoutines] = useState([])
  const [activeRoutineIds, setActiveRoutineIds] = useState([ROUTINE_TEMPLATE.id])
  const [loading, setLoading] = useState(true)

  // Keep latest activeRoutineIds for callbacks without re-creating them.
  const activeRef = useRef(activeRoutineIds)
  activeRef.current = activeRoutineIds

  useEffect(() => {
    if (!user) {
      // Signed out: reset to defaults and stop loading.
      setUserExercises([])
      setUserRoutines([])
      setActiveRoutineIds([ROUTINE_TEMPLATE.id])
      setLoading(false)
      return
    }

    setLoading(true)
    // Safety net: never let the loader hang. Local seed data is enough to
    // render, so release the UI shortly even if a snapshot is slow.
    const releaseTimer = setTimeout(() => setLoading(false), 1500)
    const release = () => {
      clearTimeout(releaseTimer)
      setLoading(false)
    }

    const unsubExercises = onSnapshot(
      collection(db, 'users', user.uid, 'exercises'),
      (snap) => {
        setUserExercises(snap.docs.map((d) => ({ id: d.id, ...d.data(), isCustom: true })))
        release()
      },
      (err) => {
        console.error('userExercises', err)
        release()
      },
    )

    const unsubRoutines = onSnapshot(
      collection(db, 'users', user.uid, 'routines'),
      (snap) => setUserRoutines(snap.docs.map((d) => ({ id: d.id, ...d.data(), isCustom: true }))),
      (err) => console.error('userRoutines', err),
    )

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.data()
        setActiveRoutineIds(data?.activeRoutineIds ?? [ROUTINE_TEMPLATE.id])
        release()
      },
      (err) => {
        console.error('profile', err)
        release()
      },
    )

    return () => {
      clearTimeout(releaseTimer)
      unsubExercises()
      unsubRoutines()
      unsubProfile()
    }
  }, [user])

  // Merged collections (base + custom)
  const exercises = useMemo(() => {
    const byId = new Map(EXERCISES.map((e) => [e.id, { ...e, isCustom: false }]))
    for (const e of userExercises) byId.set(e.id, e) // custom overrides base
    return [...byId.values()]
  }, [userExercises])

  const routines = useMemo(
    () => [{ ...ROUTINE_TEMPLATE, isCustom: false }, ...userRoutines],
    [userRoutines],
  )

  const activeRoutines = useMemo(
    () => routines.filter((r) => activeRoutineIds.includes(r.id)),
    [routines, activeRoutineIds],
  )

  // ---- mutations -----------------------------------------------------------

  const saveExercise = useCallback(
    async (exercise) => {
      if (!user) throw new Error('No autenticado')
      const id = exercise.id || slugify(exercise.name) + '-' + Date.now().toString(36)
      const { id: _omit, isCustom: _c, ...rest } = exercise
      await setDoc(
        doc(db, 'users', user.uid, 'exercises', id),
        { ...rest, updatedAt: serverTimestamp() },
        { merge: true },
      )
      return id
    },
    [user],
  )

  const deleteExercise = useCallback(
    async (id) => {
      if (!user) throw new Error('No autenticado')
      await deleteDoc(doc(db, 'users', user.uid, 'exercises', id))
    },
    [user],
  )

  const saveRoutine = useCallback(
    async (routine) => {
      if (!user) throw new Error('No autenticado')
      const id = routine.id || slugify(routine.name) + '-' + Date.now().toString(36)
      const { id: _omit, isCustom: _c, ...rest } = routine
      await setDoc(
        doc(db, 'users', user.uid, 'routines', id),
        { ...rest, isTemplate: false, updatedAt: serverTimestamp() },
        { merge: true },
      )
      return id
    },
    [user],
  )

  const setActiveRoutine = useCallback(
    async (routineId, active) => {
      if (!user) throw new Error('No autenticado')
      const current = activeRef.current
      const next = active
        ? [...new Set([...current, routineId])]
        : current.filter((id) => id !== routineId)
      setActiveRoutineIds(next) // optimistic
      await setDoc(
        doc(db, 'users', user.uid),
        { activeRoutineIds: next, updatedAt: serverTimestamp() },
        { merge: true },
      )
    },
    [user],
  )

  const deleteRoutine = useCallback(
    async (id) => {
      if (!user) throw new Error('No autenticado')
      await deleteDoc(doc(db, 'users', user.uid, 'routines', id))
      await setActiveRoutine(id, false) // drop from active list
    },
    [user, setActiveRoutine],
  )

  // Restore custom exercises + routines from a backup: WIPES existing custom
  // data first, then writes exactly what's in the file. Active routine ids are
  // replaced by the file's value (defaulting to the template if empty).
  const importCatalog = useCallback(
    async ({ customExercises = [], customRoutines = [], activeRoutineIds: ids = [] }) => {
      if (!user) throw new Error('No autenticado')
      await wipeSubcollection(user.uid, 'exercises')
      await wipeSubcollection(user.uid, 'routines')
      for (const ex of customExercises) {
        if (!ex.id) continue
        const { id, isCustom: _c, ...rest } = ex
        await setDoc(doc(db, 'users', user.uid, 'exercises', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        })
      }
      for (const r of customRoutines) {
        if (!r.id) continue
        const { id, isCustom: _c, ...rest } = r
        await setDoc(doc(db, 'users', user.uid, 'routines', id), {
          ...rest,
          isTemplate: false,
          updatedAt: serverTimestamp(),
        })
      }
      await setDoc(
        doc(db, 'users', user.uid),
        {
          activeRoutineIds: ids.length ? ids : [ROUTINE_TEMPLATE.id],
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      return { exercises: customExercises.length, routines: customRoutines.length }
    },
    [user],
  )

  const value = {
    loading,
    exercises,
    routines,
    activeRoutines,
    activeRoutineIds,
    saveExercise,
    deleteExercise,
    saveRoutine,
    deleteRoutine,
    setActiveRoutine,
    importCatalog,
  }

  return createElement(CatalogContext.Provider, { value }, children)
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}

export function slugify(str) {
  return (str || 'item')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
