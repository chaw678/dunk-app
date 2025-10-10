import { auth } from './firebase'
import {
  GoogleAuthProvider,
  signInWithPopup,
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