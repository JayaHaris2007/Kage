import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { Plus, Search, Filter, X, Calendar } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import { AnimatePresence, motion } from 'framer-motion';

import ConfirmationModal from '../components/ConfirmationModal';

const Todos = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all'); // all, pending, completed
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const [loading, setLoading] = useState(true);

    // New Task Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (currentUser) {
            const unsubscribe = taskService.subscribeToTasks(currentUser.uid, (data) => {
                setTasks(data);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [currentUser]);

    const filteredTasks = tasks.filter(task => {
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'completed' ? task.completed :
                    !task.completed;

        const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    // Sort by completed (bottom) then priority (high > medium > low)
    const sortedTasks = filteredTasks.sort((a, b) => {
        if (a.completed === b.completed) {
            const p = { high: 3, medium: 2, low: 1 };
            return p[b.priority] - p[a.priority];
        }
        return a.completed ? 1 : -1;
    });

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            await taskService.addTask(currentUser.uid, {
                title,
                description,
                priority,
                dueDate
            });
            // Reset form
            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDate('');
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const handleToggleTask = async (taskId, status) => {
        try {
            await taskService.toggleTaskCompletion(taskId, status);
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    const confirmDeleteTask = async () => {
        if (taskToDelete) {
            try {
                await taskService.deleteTask(taskToDelete);
                setTaskToDelete(null);
            } catch (error) {
                console.error(error);
            }
        }
    }

    if (loading) return <div className="p-10 text-center animate-pulse text-textMuted">Loading tasks...</div>;

    return (
        <div className="pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-widest glow-white">Mission Log</h1>
                    <p className="text-textMuted text-xs font-mono mt-1">Execute your objectives.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white hover:bg-white/90 text-black px-4 py-2 rounded-lg font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all flex items-center space-x-2 uppercase tracking-wide text-sm"
                >
                    <Plus size={18} />
                    <span>New Mission</span>
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted" size={18} />
                    <input
                        type="text"
                        placeholder="Search objectives..."
                        className="w-full bg-surfaceHighlight border border-white/5 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-neutral-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex bg-surfaceHighlight p-1 rounded-lg border border-white/5">
                    {['all', 'pending', 'completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${filter === f
                                ? 'bg-white text-black shadow-sm'
                                : 'text-textMuted hover:text-white'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {sortedTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={handleToggleTask}
                            onDelete={(id) => {
                                setTaskToDelete(id);
                                setIsDeleteModalOpen(true);
                            }}
                        />
                    ))}
                </AnimatePresence>

                {sortedTasks.length === 0 && (
                    <div className="text-center py-20 text-textMuted italic">
                        No objectives found matching your criteria.
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteTask}
                title="Abort Objective?"
                message="Are you sure you want to delete this mission? This action cannot be undone."
            />

            {/* Add Task Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card w-full max-w-lg relative border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-textMuted hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-xl font-bold mb-6 text-white uppercase tracking-wide">New Objective</h2>

                            <form onSubmit={handleAddTask} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-textMuted uppercase mb-2">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-surfaceHighlight border border-white/5 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all font-mono placeholder:text-neutral-700"
                                        placeholder="Objective Name"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-textMuted uppercase mb-2">Description (Optional)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-surfaceHighlight border border-white/5 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all font-mono text-sm placeholder:text-neutral-700"
                                        placeholder="Briefing details..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-textMuted uppercase mb-2">Priority</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-full bg-surfaceHighlight border border-white/5 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white/50 transition-all font-mono text-sm"
                                        >
                                            <option value="low">LOW</option>
                                            <option value="medium">MEDIUM</option>
                                            <option value="high">HIGH</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-textMuted uppercase mb-2">Due Date</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full bg-surfaceHighlight border border-white/5 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white/50 transition-all font-mono text-sm [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!title.trim()}
                                    className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm mt-4"
                                >
                                    Create Objective
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Todos;
