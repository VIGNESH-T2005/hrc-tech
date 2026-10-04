import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/errors';
import Logo from '../components/Logo';
import AuthShowcase from '../components/auth/AuthShowcase';
import PasswordInput from '../components/auth/PasswordInput';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'Admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Invalid email or password.'));
      setShake(s => s + 1);
    } finally {
      setLoading(false);
    }
  };

  const fieldIn = (delay) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay } });

  return (
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 bg-black lg:grid-cols-2">
      <AuthShowcase icon={ShieldCheck} heading={<>Welcome back to<br />HRC TECH</>} sub="Your courses, progress, and quizzes — all right where you left them." />
      <div className="relative flex items-center justify-center overflow-hidden px-4 py-16">
        <motion.div key={shake} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, x: shake ? [0, -8, 8, -6, 6, -3, 3, 0] : 0 }}
          transition={{ duration: shake ? 0.45 : 0.5 }} className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-[var(--bg-surface)] p-8 shadow-2xl">
          <div className="mb-8 lg:hidden"><Logo size="lg" /></div>
          <motion.h2 {...fieldIn(0.05)} className="text-2xl font-bold text-white">Log in</motion.h2>
          <motion.p {...fieldIn(0.1)} className="mt-1 text-sm text-neutral-400">Enter your details to continue learning.</motion.p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <motion.div {...fieldIn(0.15)}>
              <label className="mb-1 block text-xs font-semibold text-neutral-500">Email</label>
              <input type="email" required placeholder="you@example.com"
                className="w-full rounded-xl border border-neutral-700 bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white focus:ring-2 focus:ring-white/10"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </motion.div>
            <motion.div {...fieldIn(0.2)}>
              <label className="mb-1 block text-xs font-semibold text-neutral-500">Password</label>
              <PasswordInput value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </motion.div>
            {error && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-neutral-300">{error}</motion.p>}
            <motion.button {...fieldIn(0.25)} disabled={loading} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-semibold text-black shadow-md transition hover:bg-neutral-200 disabled:opacity-60">
              <LogIn size={16} /> {loading ? 'Logging in…' : 'Log in'}
            </motion.button>
          </form>
          <motion.p {...fieldIn(0.3)} className="mt-6 text-center text-sm text-neutral-400">
            No account? <Link to="/register" className="font-semibold text-white">Sign up</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}