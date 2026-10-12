import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext.jsx'

// Realtime subscription to the current user's session logs.
// Doc id == ISO date (one session per day keeps things simple and lets us
// upsert a day's check-in easily).
export function useLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'logs'), orderBy('date', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('useLogs', err)
        setLoading(false)
      },
    )
    return unsub
  }, [user])

  const saveLog = useCallback(
    async (log) => {
      if (!user) throw new Error('No autenticado')
      const id = log.id ?? log.date // date-keyed
      await setDoc(doc(db, 'users', user.uid, 'logs', id), { ...log, id, updatedAt: Date.now() }, { merge: true })
      return id
    },
    [user],
  )

  const deleteLog = useCallback(
    async (id) => {
      if (!user) throw new Error('No autenticado')
      await deleteDoc(doc(db, 'users', user.uid, 'logs', id))
    },
    [user],
  )

  const getLog = useCallback((id) => logs.find((l) => l.id === id) ?? null, [logs])

  return { logs, loading, saveLog, deleteLog, getLog }
}
