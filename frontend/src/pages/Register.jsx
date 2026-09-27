import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/errors';
import Logo from '../components/Logo';
import AuthShowcase from '../components/auth/AuthShowcase';
import PasswordInput from '../components/auth/PasswordInput';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account.'));
      setShake(s => s + 1);
    } finally {
      setLoading(false);
    }
  };

  const fieldIn = (delay) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 bg-[var(--bg-base)] lg:grid-cols-2">
      <AuthShowcase icon={GraduationCap} heading={<>Start learning<br />with HRC TECH</>} sub="Create a free student account and get instant access to every course you purchase." />

      <div className="relative flex items-center justify-center overflow-hidden px-4 py-16">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl lg:hidden" />

        <motion.div
          key={shake}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, x: shake ? [0, -8, 8, -6, 6, -3, 3, 0] : 0 }}
          transition={{ duration: shake ? 0.45 : 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm"
        >
          <div className="mb-8 lg:hidden"><Logo size="lg" /></div>

          <motion.h2 {...fieldIn(0.05)} className="text-2xl font-bold text-slate-100">Create a student account</motion.h2>
          <motion.p {...fieldIn(0.1)} className="mt-1 text-sm text-slate-400">Takes less than a minute.</motion.p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <motion.div {...fieldIn(0.15)}>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Full name</label>
              <input required placeholder="Your name"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-900/30"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </motion.div>

            <motion.div {...fieldIn(0.2)}>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Email</label>
              <input type="email" required placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-900/30"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </motion.div>

            <motion.div {...fieldIn(0.25)}>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Password</label>
              <PasswordInput
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="8+ characters"
                minLength={8}
                showStrength
              />
            </motion.div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">
                {error}
              </motion.p>
            )}

            <motion.button
              {...fieldIn(0.3)}
              disabled={loading}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-semibold text-slate-950 shadow-md shadow-amber-900/20 transition hover:bg-amber-300 disabled:opacity-60"
            >
              <UserPlus size={16} /> {loading ? 'Creating account…' : 'Sign up'}
            </motion.button>
          </form>

          <motion.p {...fieldIn(0.35)} className="mt-6 text-center text-sm text-slate-400">
            Already have an account? <Link to="/login" className="font-semibold text-amber-400 transition hover:text-amber-300">Log in</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}