import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function signInWithGoogle() {
    setError(null)
    try {
      const { user: u } = await signInWithPopup(auth, googleProvider)
      // Create / merge the user profile document.
      await setDoc(
        doc(db, 'users', u.uid),
        {
          displayName: u.displayName ?? '',
          email: u.email ?? '',
          photoURL: u.photoURL ?? '',
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (err) {
      // Ignore the common "popup closed by user" noise.
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message ?? 'No se pudo iniciar sesión.')
      }
      console.error('signInWithGoogle', err)
    }
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  const value = { user, loading, error, signInWithGoogle, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
