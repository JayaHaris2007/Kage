import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA2xgtrT4-44pN8JN7GaeBPdJ9otN34Mbg",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kage-40c41.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kage-40c41",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kage-40c41.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "880667768970",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:880667768970:web:6286e0382c37544821d573",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4MGYK4MGJD"
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
