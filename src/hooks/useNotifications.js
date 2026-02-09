import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const useNotifications = (currentUser) => {
    const [permission, setPermission] = useState(Notification.permission);

    // Request permission on user interaction
    const requestPermission = async () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notifications');
            return;
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
    };

    // Send a notification
    const sendNotification = (title, body) => {
        if (permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/icon.png',
                badge: '/icon.png',
                tag: 'kage-reminder' // Prevent stacking
            });
        }
    };

    // Check habits and notify if pending
    const checkAndNotify = async () => {
        if (!currentUser || permission !== 'granted') return;

        try {
            // Check user settings first
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const settings = userDoc.data().settings;
                if (settings?.notifications === false) return; // User disabled notifications
            }

            // Simple logic: If it's evening and habits are pending
            const now = new Date();
            const hour = now.getHours();

            // Notify only between 6 PM and 9 PM
            // In a real app, we'd use a service worker for background sync, 
            // but for this MVP we check when the app is open/focused.
            if (hour >= 18 && hour <= 21) {
                // We'd ideally check habit status here, but for now let's just send a generic nudge
                // if the last notification wasn't today.

                const lastNotified = localStorage.getItem('kage_last_notified');
                const today = new Date().toDateString();

                if (lastNotified !== today) {
                    sendNotification("Shadows wait for no one.", "You have pending protocols. Complete your habits.");
                    localStorage.setItem('kage_last_notified', today);
                }
            }
        } catch (error) {
            console.error("Notification check failed", error);
        }
    };

    return {
        permission,
        requestPermission,
        sendNotification,
        checkAndNotify
    };
};
