import { auth } from './firebase'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

import { getDatabase, ref, push, set } from 'firebase/database';

export async function saveUserToDatabase(user) {
  const db = getDatabase();
  const userRef = ref(db, 'users/' + user.uid);
  
  // Define user data to save (customize as needed)
  const userData = {
    name: user.displayName || '',
    email: user.email || '',
    uid: user.uid,
    skill: '',
    age: null,
    gender: '',
    bio: '',
    match_ids: {},
    following: {},
    followers: {}
  };

  return set(userRef, userData);
}



// Sign in using Google popup
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  try {
    // Prefer popup when possible for better UX
    return await signInWithPopup(auth, provider)
  } catch (err) {
    // If the environment blocks popups (Cross-Origin-Opener-Policy / COOP),
    // fall back to redirect-based sign-in which is compatible with COOP.
    // Known condition: errors mentioning Cross-Origin-Opener-Policy or
    // auth/operation-not-supported-in-this-environment.
    const msg = (err && err.message) ? err.message : ''
    if (err && (err.code === 'auth/operation-not-supported-in-this-environment' || msg.includes('Cross-Origin-Opener-Policy') || msg.includes('blocked the window.closed call'))) {
      return signInWithRedirect(auth, provider)
    }
    throw err
  }
}

// After a redirect sign-in, call this on app start to complete sign-in and
// obtain the result if any. Returns the redirect result or null.
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth)
    return result || null
  } catch (err) {
    // No redirect result or user cancelled — not an app-breaking error.
    console.warn('handleRedirectResult: no redirect result', err)
    return null
  }
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