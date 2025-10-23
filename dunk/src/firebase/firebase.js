// src/firebase/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  databaseURL: import.meta.env.VITE_DATABASE_URL
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const storage = getStorage(app)
import { getDatabase, ref, set, get, child, push, remove, update, onValue } from "firebase/database";
import { Database } from 'lucide-vue-next'

const db = getDatabase(app);

function writeUserData(UserId, name, email, role) {
    //const db = getDatabase();
    const reference = ref(db, "users/" + UserId);

    set(reference, {
        details: {
            about:"Welcome to GhostCooks! We're excited to support you in your culinary journey. Update your profile with more details to help others get to know you better and make the most out of your experience here.",
            finances: {
                profit: 0,
                earned: 0,
                fundsExpensed: 0,
                netProfit: 0
            }
        },
        username: name,
        email: email,
        type: role,
        profile_image: "default_user.png"
    });
}
export {writeUserData};


export async function getDataFromFirebase(table) {
    //const db = getDatabase();
    const dbRef = ref(db);

    try {
        // Get the data from the "users" node
        const snapshot = await get(child(dbRef, table));
        if (snapshot.exists()) {
             console.log(snapshot.val()); // Logs the data in the "users" node
            return snapshot.val(); 
        } else {
            // console.log("No data available");
        }
    } catch (error) {
        console.error("Error getting data:", error);
    }
}

/**
 * Resolve a user's display name / username from their uid in Realtime Database.
 * Returns the best available string (username, name, displayName, or email local-part) or null.
 */
export async function getUserName(uid) {
    if (!uid) return null
    try {
        const dbRef = ref(db)
        const snap = await get(child(dbRef, `users/${uid}`))
        if (!snap || !snap.exists()) return null
        const u = snap.val()
        // prefer username, then name, then displayName, then email local-part
        if (u.username) return u.username
        if (u.name) return u.name
        if (u.displayName) return u.displayName
        if (u.email) return u.email.split('@')[0]
        return null
    } catch (err) {
        console.error('getUserName error', err)
        return null
    }
}

export async function pushDataToFirebase(path, data) {
    // instructions
    // data: input in only the json data don't put a key/id
    try {
        const dataRef = ref(db, path); // Reference to the specified path in Firebase
        const newDataRef = push(dataRef); // Create a new reference for the new data
        await set(newDataRef, data); // Set the data at the new reference
        console.log(`Data successfully pushed to Firebase at path: ${newDataRef.key}`);
    } catch (error) {
        console.error("Error pushing data to Firebase:", error);
        throw error;
    }
}

export async function overwriteDataToFirebase(id, path, data) {
    // instructions
    // data: input in only the json data don't put a key/id
    try {
        const dataRef = ref(db, path + "/" + id); // Reference to the specified path in Firebase
        await set(dataRef, data); // Set the data at the new reference
        console.log(`Data successfully pushed to Firebase at path: ${dataRef.key}`);
    } catch (error) {
        console.error("Error pushing data to Firebase:", error);
        throw error;
    }
}

/**
 * Update a node with a partial payload (shallow merge) at the given path.
 * Example: updateDataToFirebase('users/uid', { score: 10 })
 */
export async function updateDataToFirebase(path, data) {
    try {
        const dataRef = ref(db, path);
        await update(dataRef, data);
        console.log(`Data successfully updated at path: ${path}`);
    } catch (error) {
        console.error("Error updating data to Firebase:", error);
        throw error;
    }
}

/**
 * Set a child key under a path. Useful to write only one child without touching siblings.
 * Example: setChildData('users/uid/following', otherUid, { at: 123 })
 */
export async function setChildData(path, key, data) {
    try {
        const dataRef = ref(db, `${path}/${key}`);
        await set(dataRef, data);
        console.log(`Child data set at ${path}/${key}`);
    } catch (error) {
        console.error("Error setting child data to Firebase:", error);
        throw error;
    }
}

/**
 * Remove a child key under a path.
 * Example: deleteChildData('users/uid/following', otherUid)
 */
export async function deleteChildData(path, key) {
    try {
        const dataRef = ref(db, `${path}/${key}`);
        await remove(dataRef);
        console.log(`Child data removed at ${path}/${key}`);
    } catch (error) {
        console.error("Error removing child data from Firebase:", error);
        throw error;
    }
}

// Function to delete data from Firebase Realtime Database
export async function deleteDataFromFirebase(path) {
    try {
        const dataRef = ref(db, path); // Reference to the specified path in Firebase
        await remove(dataRef); // Remove data at the specified path
        console.log(`Data at path ${path} deleted successfully.`);
        return true;
    } catch (error) {
        console.error("Error deleting data from Firebase:", error);
        return false;
    }
}

export { app, auth, storage }

/**
 * Subscribe to realtime changes at a path. Returns the unsubscribe function.
 * cb will be called with snapshot.val() (or null) whenever the data changes.
 */
export function onDataChange(path, cb) {
    const refPath = ref(db, path)
    const off = onValue(refPath, (snap) => {
        cb(snap.exists() ? snap.val() : null)
    }, (err) => {
        console.error('onDataChange error', err)
    })
    // onValue returns an unsubscribe function in firebase v9 when used like this
    return off
}


