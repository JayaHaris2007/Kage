import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { habitService } from '../services/habitService';
import { Plus, X, Activity, BookOpen, Droplets, Moon, Sun, Zap, Coffee, Music, Code } from 'lucide-react';
import HabitCard from '../components/HabitCard';
import { AnimatePresence, motion } from 'framer-motion';

import ConfirmationModal from '../components/ConfirmationModal';

const icons = [
    { name: 'Activity', component: Activity },
    { name: 'BookOpen', component: BookOpen },
    { name: 'Droplets', component: Droplets },
    { name: 'Moon', component: Moon },
    { name: 'Sun', component: Sun },
    { name: 'Zap', component: Zap },
    { name: 'Coffee', component: Coffee },
    { name: 'Music', component: Music },
    { name: 'Code', component: Code },
];

const Habits = () => {
    const { currentUser } = useAuth();
    const [habits, setHabits] = useState([]);

    // Add Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [habitToDelete, setHabitToDelete] = useState(null);

    const [newHabitName, setNewHabitName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Activity');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            const unsubscribe = habitService.subscribeToHabits(currentUser.uid, (data) => {
                setHabits(data);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [currentUser]);

    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim()) return;

        try {
            await habitService.addHabit(currentUser.uid, {
                name: newHabitName,
                icon: selectedIcon,
                dailyGoal: 1,
            });
            setNewHabitName('');
            setSelectedIcon('Activity');
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adding habit:", error);
        }
    };

    const handleToggleHabit = async (habit) => {
        // Optimistic update handled by Firestore subscription, but we can animate immediately
        const today = new Date().toISOString().split('T')[0];

        try {
            await habitService.toggleHabitCompletion(habit.id, currentUser.uid, today, habit.completedDates || []);
        } catch (error) {
            console.error("Error toggling habit:", error);
        }
    };

    const confirmDeleteHabit = async () => {
        if (habitToDelete) {
            try {
                await habitService.deleteHabit(habitToDelete);
                setHabitToDelete(null);
            } catch (error) {
                console.error("Error deleting habit:", error);
            }
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-textMuted">Loading protocols...</div>;

    return (
        <div className="relative min-h-[calc(100vh-100px)] pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-widest glow-white">Habit Protocol</h1>
                    <p className="text-textMuted text-xs font-mono mt-1">Consistency is key.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white hover:bg-white/90 text-black p-2 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {habits.map(habit => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            onToggle={handleToggleHabit}
                            onDelete={(id) => {
                                setHabitToDelete(id);
                                setIsDeleteModalOpen(true);
                            }}
                        />
                    ))}
                </AnimatePresence>

                {habits.length === 0 && (
                    <div className="col-span-full text-center py-20 text-textMuted">
                        <p className="text-lg">No habits defined.</p>
                        <p className="text-sm">Initialize a new protocol to begin.</p>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteHabit}
                title="Delete Protocol"
                message="Are you sure you want to delete this habit? All streak data will be lost in the void."
            />

            {/* Add Habit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card w-full max-w-md relative border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-textMuted hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-xl font-bold mb-6 text-white uppercase tracking-wide">New Protocol</h2>

                            <form onSubmit={handleAddHabit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-textMuted uppercase mb-2">Habit Name</label>
                                    <input
                                        type="text"
                                        value={newHabitName}
                                        onChange={(e) => setNewHabitName(e.target.value)}
                                        className="w-full bg-surfaceHighlight border border-white/5 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all font-mono placeholder:text-neutral-700"
                                        placeholder="e.g. Read 10 Pages"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-textMuted uppercase mb-2">Icon Identifier</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {icons.map(({ name, component: Icon }) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => setSelectedIcon(name)}
                                                className={`p-3 rounded-lg flex items-center justify-center transition-all ${selectedIcon === name
                                                    ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                                    : 'bg-surfaceHighlight text-textMuted hover:bg-surfaceHighlight/80 hover:text-white'
                                                    }`}
                                            >
                                                <Icon size={20} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!newHabitName.trim()}
                                    className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                                >
                                    Initialize
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Habits;
