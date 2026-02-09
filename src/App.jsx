import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { isConfigured } from './services/firebase';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Todos from './pages/Todos';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { AlertCircle } from 'lucide-react';

const SetupScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
    <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-xl p-8 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
      <div className="flex items-center space-x-3 text-red-500 mb-6">
        <AlertCircle size={32} />
        <h1 className="text-2xl font-bold">Setup Required</h1>
      </div>
      <p className="text-zinc-400 mb-6">
        The application cannot connect to Firebase because the configuration is missing.
      </p>
      <div className="space-y-4">
        <div className="p-4 bg-black rounded border border-white/10">
          <p className="text-sm font-mono text-green-400">1. Create a file named <span className="text-white font-bold">.env</span> in the project root.</p>
        </div>
        <div className="p-4 bg-black rounded border border-white/10">
          <p className="text-sm font-mono text-green-400">2. Copy the contents from <span className="text-white font-bold">.env.example</span> into it.</p>
        </div>
        <div className="p-4 bg-black rounded border border-white/10">
          <p className="text-sm font-mono text-green-400">3. Fill in your Firebase project details.</p>
        </div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="w-full mt-8 bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
      >
        I've created the file, Reload
      </button>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, isConfigured } = useAuth();

  // If not configured, we shouldn't be here mostly, but safe guard
  if (!isConfigured) return <Navigate to="/setup" />;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary">Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

import { useNotifications } from './hooks/useNotifications';
import { useMidnightReset } from './hooks/useMidnightReset';
import { habitService } from './services/habitService';

const AppLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const { checkAndNotify } = useNotifications(currentUser);
  useMidnightReset();

  useEffect(() => {
    if (currentUser) {
      checkAndNotify();
      // Ensure streaks are accurate (e.g. if user missed yesterday)
      habitService.checkAndResetStreaks(currentUser.uid);
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col md:flex-row">
      <Navbar />
      <div className="flex-1 md:ml-20 min-w-0 transition-all duration-300 flex flex-col">
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full mb-16 md:mb-0">
          <div className="mt-4 md:mt-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  if (!isConfigured) {
    return <SetupScreen />;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/habits" element={
            <ProtectedRoute>
              <AppLayout><Habits /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/todos" element={
            <ProtectedRoute>
              <AppLayout><Todos /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AppLayout><Analytics /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout><Settings /></AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
