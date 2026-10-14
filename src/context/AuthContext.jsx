import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
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
      // Send the verification email. The app will gate access until verified.
      await sendEmailVerification(u)
      return true
    } catch (err) {
      setError(friendlyAuthError(err?.code))
      console.error('registerWithEmail', err)
      return false
    }
  }

  // Resend the verification email to the current user.
  async function resendVerification() {
    setError(null)
    if (!auth.currentUser) return false
    try {
      await sendEmailVerification(auth.currentUser)
      return true
    } catch (err) {
      setError(friendlyAuthError(err?.code))
      console.error('resendVerification', err)
      return false
    }
  }

  // Re-fetch the current user from Firebase to pick up a fresh emailVerified
  // value after the user clicks the link in their inbox.
  async function reloadUser() {
    if (!auth.currentUser) return false
    await auth.currentUser.reload()
    const fresh = auth.currentUser
    setUser({ ...fresh }) // new ref so React re-renders
    return fresh?.emailVerified ?? false
  }

  function clearError() {
    setError(null)
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  // Email/password accounts must verify their email. Google accounts come
  // pre-verified, so they're never gated.
  const isPasswordUser = !!user?.providerData?.some((p) => p.providerId === 'password')
  const needsEmailVerification = !!user && isPasswordUser && !user.emailVerified

  const value = {
    user,
    loading,
    error,
    needsEmailVerification,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resendVerification,
    reloadUser,
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
