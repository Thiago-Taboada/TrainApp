import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext.jsx'
import { EXERCISES, ROUTINE_TEMPLATE } from '../data/seedData'

// -----------------------------------------------------------------------------
// useCatalog
// Single source of truth for exercises + routines. It merges:
//   - BASE catalog: the PDF exercises + template routine (local, read-only).
//   - USER data:   exercises & routines the user creates (Firestore, private,
//                  under users/{uid}/...).
// It also tracks which routines are active (users/{uid}.activeRoutineIds).
// -----------------------------------------------------------------------------
export function useCatalog() {
  const { user } = useAuth()
  const [userExercises, setUserExercises] = useState([])
  const [userRoutines, setUserRoutines] = useState([])
  const [activeRoutineIds, setActiveRoutineIds] = useState([ROUTINE_TEMPLATE.id])
  const [loading, setLoading] = useState(true)

  // Subscribe to user exercises
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'exercises'),
      (snap) => setUserExercises(snap.docs.map((d) => ({ id: d.id, ...d.data(), isCustom: true }))),
      (err) => console.error('userExercises', err),
    )
    return unsub
  }, [user])

  // Subscribe to user routines
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'routines'),
      (snap) => setUserRoutines(snap.docs.map((d) => ({ id: d.id, ...d.data(), isCustom: true }))),
      (err) => console.error('userRoutines', err),
    )
    return unsub
  }, [user])

  // Subscribe to the profile doc for activeRoutineIds
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.data()
        if (data?.activeRoutineIds) setActiveRoutineIds(data.activeRoutineIds)
        else setActiveRoutineIds([ROUTINE_TEMPLATE.id]) // default: template active
        setLoading(false)
      },
      (err) => {
        console.error('profile', err)
        setLoading(false)
      },
    )
    return unsub
  }, [user])

  // Merged collections (base + custom)
  const exercises = useMemo(() => {
    const base = EXERCISES.map((e) => ({ ...e, isCustom: false }))
    // user exercises override base ones with the same id
    const byId = new Map(base.map((e) => [e.id, e]))
    for (const e of userExercises) byId.set(e.id, e)
    return [...byId.values()]
  }, [userExercises])

  const routines = useMemo(() => {
    const base = [{ ...ROUTINE_TEMPLATE, isCustom: false }]
    return [...base, ...userRoutines]
  }, [userRoutines])

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

  const deleteRoutine = useCallback(
    async (id) => {
      if (!user) throw new Error('No autenticado')
      await deleteDoc(doc(db, 'users', user.uid, 'routines', id))
      // also drop it from active list
      await setActiveRoutine(id, false)
    },
    [user], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const setActiveRoutine = useCallback(
    async (routineId, active) => {
      if (!user) throw new Error('No autenticado')
      const next = active
        ? [...new Set([...activeRoutineIds, routineId])]
        : activeRoutineIds.filter((id) => id !== routineId)
      setActiveRoutineIds(next) // optimistic
      await setDoc(
        doc(db, 'users', user.uid),
        { activeRoutineIds: next, updatedAt: serverTimestamp() },
        { merge: true },
      )
    },
    [user, activeRoutineIds],
  )

  return {
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
