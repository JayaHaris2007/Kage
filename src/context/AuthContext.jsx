import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, isConfigured, db } from "../services/firebase";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isConfigured || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = () => {
        if (auth) {
            return signOut(auth);
        }
    };

    const googleSignIn = async () => {
        if (!auth || !googleProvider) return;

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user exists in Firestore, if not create them
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    createdAt: new Date().toISOString(),
                    settings: {
                        theme: 'dark',
                        notifications: true
                    }
                });
            }
            return user;
        } catch (error) {
            console.error("Google Sign In Error:", error);
            throw error;
        }
    };

    const value = {
        currentUser,
        logout,
        googleSignIn,
        loading,
        isConfigured
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
