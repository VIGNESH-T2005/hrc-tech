import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/errors';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'Admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-2">
      <div className="gradient-brand relative hidden flex-col justify-center overflow-hidden px-14 text-white lg:flex">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <ShieldCheck size={40} strokeWidth={1.5} className="mb-6 opacity-90" />
          <h1 className="text-3xl font-bold leading-snug">Welcome back to<br />HRC TECH</h1>
          <p className="mt-3 max-w-sm text-white/80">Your courses, progress, and certificates of completion — all right where you left them.</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo size="lg" /></div>
          <h2 className="text-2xl font-bold text-slate-900">Log in</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your details to continue learning.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Email</label>
              <input type="email" required placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-purple-100"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Password</label>
              <input type="password" required placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-purple-100"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button disabled={loading} className="gradient-brand flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60">
              <LogIn size={16} /> {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            No account? <Link to="/register" className="font-semibold text-[var(--brand-purple)]">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}