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
    serverTimestamp
} from 'firebase/firestore';

const TASKS_COLLECTION = 'tasks';

export const taskService = {
    // Subscribe to user's tasks
    subscribeToTasks: (userId, callback) => {
        const q = query(
            collection(db, TASKS_COLLECTION),
            where('userId', '==', userId)
        );

        return onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(tasks);
        });
    },

    // Add a new task
    addTask: async (userId, taskData) => {
        try {
            await addDoc(collection(db, TASKS_COLLECTION), {
                userId,
                title: taskData.title,
                description: taskData.description || '',
                priority: taskData.priority || 'medium', // low, medium, high
                dueDate: taskData.dueDate || null,
                completed: false,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding task: ", error);
            throw error;
        }
    },

    // Toggle task completion
    toggleTaskCompletion: async (taskId, isCompleted) => {
        try {
            await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
                completed: isCompleted
            });
        } catch (error) {
            console.error("Error toggling task: ", error);
            throw error;
        }
    },

    // Delete a task
    deleteTask: async (taskId) => {
        try {
            await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
        } catch (error) {
            console.error("Error deleting task: ", error);
            throw error;
        }
    }
};
