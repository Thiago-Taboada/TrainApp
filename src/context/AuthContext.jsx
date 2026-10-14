import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../lib/firebase'

const AuthContext = createContext(null)

// Persist / merge the user's profile document in Firestore.
async function upsertProfile(u) {
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
}

// Translate common Firebase Auth error codes to friendly Spanish messages.
function friendlyAuthError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es válido.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo.'
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Prueba de nuevo en unos minutos.'
    case 'auth/popup-closed-by-user':
      return null // user cancelled, not an error to show
    default:
      return 'Ocurrió un error. Inténtalo de nuevo.'
  }
}

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
      await upsertProfile(u)
    } catch (err) {
      const msg = friendlyAuthError(err?.code)
      if (msg) setError(msg)
      console.error('signInWithGoogle', err)
    }
  }

  async function signInWithEmail(email, password) {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (err) {
      setError(friendlyAuthError(err?.code))
      console.error('signInWithEmail', err)
      return false
    }
  }

  async function registerWithEmail(email, password, displayName) {
    setError(null)
    try {
      const { user: u } = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(u, { displayName })
      }
      await upsertProfile({ ...u, displayName: displayName || u.displayName })
      return true
    } catch (err) {
      setError(friendlyAuthError(err?.code))
      console.error('registerWithEmail', err)
      return false
    }
  }

  function clearError() {
    setError(null)
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    clearError,
    signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
