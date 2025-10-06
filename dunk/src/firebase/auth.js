import { auth } from './firebase'
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

// Sign in using Google popup
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  return await signInWithPopup(auth, provider)
}

// Register new user with email and password
export function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

// Login existing user with email and password
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

// Logout current user
export function logout() {
  return signOut(auth)
}

// Listen to authentication state changes
export function onUserStateChanged(callback) {
  return onAuthStateChanged(auth, callback)
}
