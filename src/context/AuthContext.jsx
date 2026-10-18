import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { auth, googleProvider, db } from '../lib/firebase'

const AuthContext = createContext(null)

// How fresh the login must be to allow sensitive actions (ms). Firebase's own
// internal window is ~5 min; we use the same so we only reauth when needed.
const FRESH_LOGIN_MS = 5 * 60 * 1000

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

// Delete every document in a user subcollection, in batches of 400
// (Firestore batches cap at 500 writes).
async function deleteSubcollection(uid, name) {
  const snap = await getDocs(collection(db, 'users', uid, name))
  const docs = snap.docs
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db)
    for (const d of docs.slice(i, i + 400)) batch.delete(d.ref)
    await batch.commit()
  }
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
    case 'auth/requires-recent-login':
      return 'Por seguridad, vuelve a iniciar sesión antes de borrar tu cuenta.'
    case 'auth/popup-closed-by-user':
      return null // user cancelled, not an error to show
    default:
      return 'Ocurrió un error. Inténtalo de nuevo.'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      // Read the `admin` custom claim from the token (force refresh so a
      // freshly-granted claim is picked up without re-login).
      if (u) {
        try {
          const token = await u.getIdTokenResult(true)
          setIsAdmin(token.claims.admin === true)
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
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

  // Update the display name (Auth profile + Firestore profile doc).
  async function updateDisplayName(displayName) {
    setError(null)
    const name = (displayName ?? '').trim()
    if (!auth.currentUser || !name) return false
    try {
      await updateProfile(auth.currentUser, { displayName: name })
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        { displayName: name, updatedAt: serverTimestamp() },
        { merge: true },
      )
      setUser({ ...auth.currentUser })
      return true
    } catch (err) {
      setError(friendlyAuthError(err?.code))
      console.error('updateDisplayName', err)
      return false
    }
  }

  // Delete the account: remove the Firestore profile doc, then the Auth user.
  // Firebase requires a recent login; if it's stale it throws
  // 'auth/requires-recent-login', which we surface to the user.
  // True if the current session logged in recently enough for sensitive ops.
  function isLoginFresh() {
    const t = auth.currentUser?.metadata?.lastSignInTime
    if (!t) return false
    return Date.now() - new Date(t).getTime() < FRESH_LOGIN_MS
  }

  // Reauthenticate the current user. For email accounts a password is needed.
  async function reauthenticate(password) {
    const current = auth.currentUser
    if (!current) return false
    const usesGoogle = current.providerData?.some((p) => p.providerId === 'google.com')
    if (usesGoogle) {
      await reauthenticateWithPopup(current, googleProvider)
      return true
    }
    // password provider
    if (!password) return false
    const cred = EmailAuthProvider.credential(current.email, password)
    await reauthenticateWithCredential(current, cred)
    return true
  }

  // Delete the account. Checks session freshness first and only reauthenticates
  // if the login is stale.
  //   - returns { ok: true } on success
  //   - returns { ok: false, needsReauth: true } when a fresh login is required
  //     (the UI should ask for the password / trigger Google reauth)
  //   - returns { ok: false, error } on other failures
  async function deleteAccount(password) {
    setError(null)
    const current = auth.currentUser
    if (!current) return { ok: false }

    try {
      // Ensure a fresh session before touching anything.
      if (!isLoginFresh()) {
        try {
          const reauthed = await reauthenticate(password)
          if (!reauthed) return { ok: false, needsReauth: true }
        } catch (err) {
          if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
            setError('Contraseña incorrecta.')
          }
          console.error('reauthenticate', err)
          return { ok: false, needsReauth: true }
        }
      }

      // Remove the user's own data first (while authenticated), then profile,
      // then the Auth user.
      await Promise.all([
        deleteSubcollection(current.uid, 'logs'),
        deleteSubcollection(current.uid, 'routines'),
        deleteSubcollection(current.uid, 'exercises'),
        deleteSubcollection(current.uid, 'weights'),
      ])
      await deleteDoc(doc(db, 'users', current.uid))
      await deleteUser(current)
      return { ok: true }
    } catch (err) {
      if (err?.code === 'auth/requires-recent-login') {
        return { ok: false, needsReauth: true }
      }
      setError(friendlyAuthError(err?.code))
      console.error('deleteAccount', err)
      return { ok: false, error: true }
    }
  }

  function clearError() {
    setError(null)
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  // Which provider the account uses.
  const isGoogleUser = !!user?.providerData?.some((p) => p.providerId === 'google.com')
  const isPasswordUser = !!user?.providerData?.some((p) => p.providerId === 'password')
  const providerLabel = isGoogleUser ? 'Google' : isPasswordUser ? 'Correo electrónico' : null

  // Email/password accounts must verify their email. Google accounts come
  // pre-verified, so they're never gated.
  const needsEmailVerification = !!user && isPasswordUser && !user.emailVerified

  const value = {
    user,
    isAdmin,
    loading,
    error,
    needsEmailVerification,
    isGoogleUser,
    isPasswordUser,
    providerLabel,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resendVerification,
    reloadUser,
    updateDisplayName,
    deleteAccount,
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
