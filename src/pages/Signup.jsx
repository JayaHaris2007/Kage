import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import AppLogo from '../assets/App logo.png';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { googleSignIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: name
            });

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                displayName: name,
                email: email,
                createdAt: new Date().toISOString(),
                settings: {
                    theme: 'dark',
                    notifications: true
                }
            });

            navigate('/');
        } catch (err) {
            setError('Failed to create an account. ' + err.message);
            console.error(err);
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setLoading(true);
            await googleSignIn();
            navigate('/');
        } catch (err) {
            setError('Google authentication failed.');
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none opacity-20" />

            <div className="max-w-md w-full glass-card border-t border-white/10 relative z-10 p-8 sm:p-10">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        <img src={AppLogo} alt="Kage Logo" className="w-full h-full object-cover" />
                    </div>
                </div>
                <h2 className="text-4xl font-black text-center mb-2 text-white text-glow tracking-[0.2em] uppercase">Join Kage</h2>
                <p className="text-center text-neutral-500 text-xs mb-10 tracking-[0.3em] font-mono uppercase">Begin your journey</p>

                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-center text-xs mb-6 font-mono tracking-wide">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">Display Name</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-600 w-4 h-4 transition-colors group-focus-within:text-white" />
                            <input
                                type="text"
                                required
                                className="w-full bg-surfaceHighlight border border-white/5 rounded-full py-3.5 pl-12 pr-4 text-white placeholder:text-neutral-800 focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all font-mono text-sm"
                                placeholder="SHADOW HUNTER"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-600 w-4 h-4 transition-colors group-focus-within:text-white" />
                            <input
                                type="email"
                                required
                                className="w-full bg-surfaceHighlight border border-white/5 rounded-full py-3.5 pl-12 pr-4 text-white placeholder:text-neutral-800 focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all font-mono text-sm"
                                placeholder="USER@KAGE.APP"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">Passcode</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-600 w-4 h-4 transition-colors group-focus-within:text-white" />
                            <input
                                type="password"
                                required
                                className="w-full bg-surfaceHighlight border border-white/5 rounded-full py-3.5 pl-12 pr-4 text-white placeholder:text-neutral-800 focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all font-mono text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">Confirm Passcode</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-600 w-4 h-4 transition-colors group-focus-within:text-white" />
                            <input
                                type="password"
                                required
                                className="w-full bg-surfaceHighlight border border-white/5 rounded-full py-3.5 pl-12 pr-4 text-white placeholder:text-neutral-800 focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all font-mono text-sm"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-black py-4 px-4 rounded-full transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest text-xs"
                        >
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Execute Signup'}
                        </button>

                        <div className="relative flex items-center justify-center my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative bg-black px-4 text-[10px] text-neutral-600 uppercase tracking-widest">
                                Or join via
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full bg-surfaceHighlight hover:bg-white/10 text-white font-bold py-4 px-4 rounded-full transition-all duration-300 border border-white/5 hover:border-white/20 flex items-center justify-center uppercase tracking-widest text-xs group"
                        >
                            <svg className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                            </svg>
                            Google Protocol
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center text-[10px] text-neutral-600 uppercase tracking-wider">
                    Already one of us?{' '}
                    <Link to="/login" className="text-neutral-400 hover:text-white font-bold transition-colors border-b border-transparent hover:border-white/50 pb-0.5 ml-1">
                        Authenticate
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
