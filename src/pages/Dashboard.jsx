import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { habitService } from '../services/habitService';
import { taskService } from '../services/taskService';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, Target, Focus } from 'lucide-react';
import HabitCard from '../components/HabitCard';
import TaskCard from '../components/TaskCard';
import CircularProgress from '../components/CircularProgress';
import AnimeQuote from '../components/AnimeQuote';
import ConfirmationModal from '../components/ConfirmationModal';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [habits, setHabits] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [focusMode, setFocusMode] = useState(false);
    const [loading, setLoading] = useState(true);

    const [userData, setUserData] = useState(null);

    // Confirmation State
    const [deleteConfig, setDeleteConfig] = useState({
        isOpen: false,
        type: null, // 'habit' | 'task'
        id: null,
        title: '',
        message: ''
    });

    useEffect(() => {
        if (currentUser) {
            const unsubHabits = habitService.subscribeToHabits(currentUser.uid, (data) => {
                setHabits(data);
            });
            const unsubTasks = taskService.subscribeToTasks(currentUser.uid, (data) => {
                setTasks(data);
                setLoading(false);
            });

            // Listen to user data for global streak
            const userRef = doc(db, 'users', currentUser.uid);
            const unsubUser = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setUserData(doc.data());
                }
            });

            return () => {
                unsubHabits();
                unsubTasks();
                unsubUser();
            };
        }
    }, [currentUser]);

    // Derived Stats
    const today = format(new Date(), 'yyyy-MM-dd');

    // Habits Stats
    const todaysHabits = habits; // All habits are for today typically, daily goal style
    const completedHabitsCount = habits.filter(h => h.completedDates?.includes(today)).length;
    const totalHabitsCount = habits.length;
    const habitProgress = totalHabitsCount > 0 ? (completedHabitsCount / totalHabitsCount) * 100 : 0;

    // Tasks Stats
    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed); // Just for stats if needed

    // Focus Mode Filter: Show only incomplete habits and top 3 high priority pending tasks
    const focusHabits = habits.filter(h => !h.completedDates?.includes(today));
    const focusTasks = pendingTasks
        .sort((a, b) => {
            const bg = { high: 3, medium: 2, low: 1 };
            return bg[b.priority] - bg[a.priority];
        })
        .slice(0, 3);

    const handleToggleHabit = async (habit) => {
        try {
            await habitService.toggleHabitCompletion(habit.id, currentUser.uid, today, habit.completedDates || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleTask = async (taskId, status) => {
        try {
            await taskService.toggleTaskCompletion(taskId, status);
        } catch (error) {
            console.error(error);
        }
    };

    const confirmDelete = async () => {
        const { type, id } = deleteConfig;
        if (!id) return;

        try {
            if (type === 'task') {
                await taskService.deleteTask(id);
            } else if (type === 'habit') {
                await habitService.deleteHabit(id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted animate-pulse">Scanning shadows...</div>;

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-widest uppercase glow-white">
                        {focusMode ? 'Focus' : `Shadows of ${currentUser?.displayName?.split(' ')[0]}`}
                    </h1>
                    <p className="text-textMuted text-sm font-mono tracking-wide mt-1">
                        {focusMode ? 'Silence the noise.' : format(new Date(), 'EEEE, MMMM do')}
                    </p>
                </div>

                <button
                    onClick={() => setFocusMode(!focusMode)}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all border ${focusMode
                        ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                        : 'bg-transparent border-white/10 text-textMuted hover:text-white hover:border-white/30'
                        }`}
                >
                    <Focus size={18} />
                    <span className="uppercase text-xs font-bold tracking-wider">{focusMode ? 'Exit Focus' : 'Enter Focus'}</span>
                </button>
            </header>

            {!focusMode && <AnimeQuote />}

            {!focusMode && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Progress Card */}
                    <div className="glass-card flex flex-col items-center justify-center p-6 space-y-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted self-start w-full mb-2">Daily Progress</h3>
                        <CircularProgress value={completedHabitsCount} max={totalHabitsCount || 1} />
                        <div className="text-xs text-textMuted text-center font-mono">
                            {completedHabitsCount} / {totalHabitsCount} habits completed
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="glass-card flex flex-col justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted mb-4">Overview</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg group hover:border-white/20 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="text-white"><CheckCircle size={18} /></div>
                                    <span className="text-text text-sm">Tasks Done</span>
                                </div>
                                <span className="font-bold text-lg text-white font-mono">{completedTasks.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg group hover:border-white/20 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="text-textMuted group-hover:text-white transition-colors"><Target size={18} /></div>
                                    <span className="text-text text-sm">Pending</span>
                                </div>
                                <span className="font-bold text-lg text-white font-mono">{pendingTasks.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg group hover:border-white/20 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="text-white"><Zap size={18} /></div>
                                    <span className="text-text text-sm">Global Streak</span>
                                </div>
                                <span className="font-bold text-lg text-white font-mono">
                                    {userData?.globalStreak || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Next Priority Task */}
                    <div className="glass-card relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                            <Target size={120} />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted mb-4">Top Priority</h3>
                        {focusTasks.length > 0 ? (
                            <div className="mt-2 flex-1 flex flex-col justify-between">
                                <div>
                                    <h4 className="text-lg font-bold text-white truncate">{focusTasks[0].title}</h4>
                                    <p className="text-textMuted text-sm mt-1 line-clamp-2">{focusTasks[0].description || 'No description'}</p>
                                </div>
                                <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white border border-white/20`}>
                                        {focusTasks[0].priority}
                                    </span>
                                    <span className="text-xs text-textMuted font-mono">
                                        Due: {focusTasks[0].dueDate ? format(new Date(focusTasks[0].dueDate), 'MMM d') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-textMuted">
                                <p className="font-mono text-xs">No pending tasks</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Habits Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center space-x-2 text-white/90 uppercase tracking-widest">
                        <Zap size={18} />
                        <span>{focusMode ? 'Pending Habits' : 'Habit Protocol'}</span>
                    </h2>
                    <div className="space-y-3">
                        {(focusMode ? focusHabits : todaysHabits).map(habit => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                onToggle={handleToggleHabit}
                                onDelete={(id) => setDeleteConfig({
                                    isOpen: true,
                                    type: 'habit',
                                    id,
                                    title: 'Delete Protocol',
                                    message: 'Remove this habit from your dashboard?'
                                })}
                            />
                        ))}
                        {(focusMode ? focusHabits : todaysHabits).length === 0 && (
                            <p className="text-textMuted italic text-sm border-l-2 border-white/10 pl-4 py-2">Protocol complete.</p>
                        )}
                    </div>
                </section>

                {/* Tasks Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center space-x-2 text-white/90 uppercase tracking-widest">
                        <CheckCircle size={18} />
                        <span>{focusMode ? 'Critical Tasks' : 'Mission Log'}</span>
                    </h2>
                    <div className="space-y-3">
                        {(focusMode ? focusTasks : pendingTasks.slice(0, 5)).map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onToggle={handleToggleTask}
                                onDelete={(id) => setDeleteConfig({
                                    isOpen: true,
                                    type: 'task',
                                    id,
                                    title: 'Abort Objective',
                                    message: 'Remove this task from your mission log?'
                                })}
                            />
                        ))}
                        {(focusMode ? focusTasks : pendingTasks).length === 0 && (
                            <p className="text-textMuted italic text-sm border-l-2 border-white/10 pl-4 py-2">Log clear.</p>
                        )}
                    </div>
                </section>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfig.isOpen}
                onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
                onConfirm={confirmDelete}
                title={deleteConfig.title}
                message={deleteConfig.message}
            />
        </div>
    );
};

export default Dashboard;
