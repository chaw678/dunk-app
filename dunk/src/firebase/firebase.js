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
import { getDatabase, ref, set, get, child, push, remove } from "firebase/database";
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


