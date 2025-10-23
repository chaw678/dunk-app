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

import { getDatabase, ref, push, set, get, child, update } from 'firebase/database';

export async function saveUserToDatabase(user) {
  const db = getDatabase();
  const userRef = ref(db, 'users/' + user.uid);
  
  // Define user data to save (customize as needed)
  try {
    // Fetch existing user node if any so we preserve followers/following etc.
    const dbRef = ref(db)
    const snap = await get(child(dbRef, `users/${user.uid}`))
    const existing = (snap && snap.exists()) ? snap.val() : {}

    //change 22: Build an update payload that PRESERVES nested maps, but OVERRIDES with incoming profile edits
    // // Build an update payload that preserves existing nested maps like following/followers
    const updatePayload = {
      name: user.displayName || existing.name || '',
      email: user.email || existing.email || '',
      uid: user.uid,
      skill: existing.skill || '',
      // age: existing.age != null ? existing.age : null,
      // gender: existing.gender || '',
      age: user.age != null ? user.age : existing.age, // <-- this can be undefined!
      gender: user.gender || existing.gender || '', // <-- always use incoming unless blank
      bio: existing.bio || '',
      match_ids: existing.match_ids || {}
      // NOTE: we intentionally do NOT reset following/followers here
    }
    // const updatePayload = {
    //   name: user.displayName || existing.name || '',
    //   email: user.email || existing.email || '',
    //   uid: user.uid,
    //   skill: existing.skill || '',
    //   age: user.age != null ? user.age : existing.age,
    //   gender: user.gender || existing.gender || '', // <-- always use incoming unless blank
    //   bio: user.bio || existing.bio || '',
    //   match_ids: existing.match_ids || {}
    //   }

  // change 23: Remove any undefined fields before saving to Firebase
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) delete updatePayload[key];
    });


    await update(userRef, updatePayload)
    return true
  } catch (err) {
    console.error('saveUserToDatabase error', err)
    // fallback: try a simple set that won't wipe nested maps if called
    const userData = {
      name: user.displayName || '',
      email: user.email || '',
      uid: user.uid
    }
    return set(userRef, userData)
  }
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