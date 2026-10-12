// Firebase initialization for TrainApp.
// Note: these config values are safe to expose in client code. Data is
// protected by Firestore security rules, not by hiding this config.
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCNeGeT48b7oHfBY01VxDAY8hbeKGfnn5U',
  authDomain: 'trainapp-bce35.firebaseapp.com',
  projectId: 'trainapp-bce35',
  storageBucket: 'trainapp-bce35.firebasestorage.app',
  messagingSenderId: '991879746134',
  appId: '1:991879746134:web:753d38d4722b60d188a1f7',
  measurementId: 'G-NG58SMJ3KF',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export default app
