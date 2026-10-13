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
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { createElement } from 'react'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext.jsx'
import { EXERCISES, ROUTINE_TEMPLATE } from '../data/seedData'

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
