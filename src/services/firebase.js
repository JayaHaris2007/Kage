import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log("Firebase Config Loaded:", firebaseConfig); // Debugging line
// Trigger new build to pick up secrets

// Check if config is valid
const isConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app;
let auth;
let db;
let analytics;
let googleProvider;

if (isConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        googleProvider = new GoogleAuthProvider();

        // Analytics is optional and might fail in some environments (like non-browser)
        if (typeof window !== 'undefined') {
            analytics = getAnalytics(app);
        }
    } catch (error) {
        console.error("Firebase initialization error:", error);
    }
} else {
    console.warn("Firebase credentials missing. App will run in setup mode.");
}

export { auth, db, analytics, googleProvider, isConfigured };
