import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
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
// Doc id == ISO date (one session per day), which makes a day's check-in a
// simple upsert. Exposed via Context so the subscription is opened once for
// the whole app instead of per client-side navigation.
const LogsContext = createContext(null)

export function LogsProvider({ children }) {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    const releaseTimer = setTimeout(() => setLoading(false), 1500)
    const release = () => {
      clearTimeout(releaseTimer)
      setLoading(false)
    }

    const q = query(collection(db, 'users', user.uid, 'logs'), orderBy('date', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        release()
      },
      (err) => {
        console.error('useLogs', err)
        release()
      },
    )

    return () => {
      clearTimeout(releaseTimer)
      unsub()
    }
  }, [user])

  const saveLog = useCallback(
    async (log) => {
      if (!user) throw new Error('No autenticado')
      const id = log.id ?? log.date // date-keyed
      await setDoc(
        doc(db, 'users', user.uid, 'logs', id),
        { ...log, id, updatedAt: Date.now() },
        { merge: true },
      )
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

  const value = { logs, loading, saveLog, deleteLog }
  return createElement(LogsContext.Provider, { value }, children)
}

export function useLogs() {
  const ctx = useContext(LogsContext)
  if (!ctx) throw new Error('useLogs must be used within LogsProvider')
  return ctx
}
