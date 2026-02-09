import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    getDocs,
    getDoc,
    arrayUnion,
    arrayRemove,
    writeBatch
} from 'firebase/firestore';
import { differenceInDays, parseISO, startOfDay, subDays, isSameDay, format } from 'date-fns';

const HABITS_COLLECTION = 'habits';

const calculateStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;

    // Sort dates descending just to be safe, though set lookup is O(1)
    // We'll use a set for easy lookup
    const completedSet = new Set(completedDates);

    // Normalize today
    const today = new Date(); // Local time
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterday = subDays(today, 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    // Check if the streak is alive (either today or yesterday is completed)
    const hasToday = completedSet.has(todayStr);
    const hasYesterday = completedSet.has(yesterdayStr);

    if (!hasToday && !hasYesterday) {
        return 0;
    }

    let currentStreak = 0;
    // Start checking from today if completed, otherwise yesterday
    let checkDate = hasToday ? today : yesterday;

    while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (completedSet.has(dateStr)) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
        } else {
            break;
        }
    }

    return currentStreak;
};

export const habitService = {
    // Subscribe to user's habits
    subscribeToHabits: (userId, callback) => {
        const q = query(
            collection(db, HABITS_COLLECTION),
            where('userId', '==', userId)
        );

        return onSnapshot(q, (snapshot) => {
            const habits = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(habits);
        });
    },

    // Add a new habit
    addHabit: async (userId, habitData) => {
        try {
            await addDoc(collection(db, HABITS_COLLECTION), {
                userId,
                name: habitData.name,
                icon: habitData.icon || 'activity',
                dailyGoal: habitData.dailyGoal || 1,
                streak: 0,
                completedDates: [],
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding habit: ", error);
            throw error;
        }
    },

    // Toggle habit completion
    toggleHabitCompletion: async (habitId, userId, dateString, currentCompletedDates = []) => {
        const habitRef = doc(db, HABITS_COLLECTION, habitId);

        // Determine new completed dates locally to calc streak
        let newCompletedDates;
        if (currentCompletedDates.includes(dateString)) {
            newCompletedDates = currentCompletedDates.filter(d => d !== dateString);
        } else {
            newCompletedDates = [...currentCompletedDates, dateString];
        }

        // Recalculate individual habit streak
        const newStreak = calculateStreak(newCompletedDates);

        try {
            await updateDoc(habitRef, {
                completedDates: newCompletedDates,
                streak: newStreak
            });

            // Update Global Streak (70% Rule)
            await habitService.updateGlobalStreak(userId, dateString);

        } catch (error) {
            console.error("Error toggling habit: ", error);
            throw error;
        }
    },

    // Delete a habit
    deleteHabit: async (habitId) => {
        try {
            await deleteDoc(doc(db, HABITS_COLLECTION, habitId));
        } catch (error) {
            console.error("Error deleting habit: ", error);
            throw error;
        }
    },

    // Check and update global streak based on 70% rule
    updateGlobalStreak: async (userId, dateString) => {
        try {
            // 1. Get all habits for the user
            const q = query(collection(db, HABITS_COLLECTION), where('userId', '==', userId));
            const snapshot = await getDocs(q);

            const habits = snapshot.docs.map(doc => doc.data());
            const totalHabits = habits.length;

            if (totalHabits === 0) return;

            // 2. Count how many are completed for dateString
            const completedCount = habits.filter(h => h.completedDates && h.completedDates.includes(dateString)).length;

            // 3. Calculate percentage
            const percentage = completedCount / totalHabits;

            // 4. Update User's Streak History
            const userRef = doc(db, 'users', userId);

            if (percentage >= 0.7) {
                await updateDoc(userRef, {
                    validStreakDates: arrayUnion(dateString)
                });
            } else {
                await updateDoc(userRef, {
                    validStreakDates: arrayRemove(dateString)
                });
            }

            // 5. Recalculate Global Streak from validStreakDates
            // This requires reading the user doc again
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();
            const validDates = userData.validStreakDates || [];
            const globalStreak = calculateStreak(validDates);

            await updateDoc(userRef, {
                globalStreak: globalStreak
            });

            await updateDoc(userRef, {
                globalStreak: globalStreak
            });

        } catch (error) {
            console.error("Error updating global streak: ", error);
        }
    },

    // Sync streaks with database to ensure they are up to date (e.g. handle missed days)
    checkAndResetStreaks: async (userId) => {
        try {
            const q = query(collection(db, HABITS_COLLECTION), where('userId', '==', userId));
            const snapshot = await getDocs(q);

            // We use batch to perform multiple updates atomically/efficiently
            const batch = writeBatch(db);
            let hasUpdates = false;

            snapshot.docs.forEach(docSnap => {
                const habit = docSnap.data();
                const storedStreak = habit.streak || 0;
                const actualStreak = calculateStreak(habit.completedDates || []);

                if (storedStreak !== actualStreak) {
                    // Update the doc in the batch
                    batch.update(docSnap.ref, { streak: actualStreak });
                    hasUpdates = true;
                }
            });

            if (hasUpdates) {
                await batch.commit();
                console.log('Streaks synchronized with Firebase.');
            }
        } catch (error) {
            console.error("Error synchronizing streaks:", error);
        }
    }
};
