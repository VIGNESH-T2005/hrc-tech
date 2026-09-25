import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/errors';

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
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-bold">Log in</h1>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" required placeholder="Email" className="w-full rounded border px-3 py-2"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" required placeholder="Password" className="w-full rounded border px-3 py-2"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-[var(--brand-teal)] py-2 text-white disabled:opacity-60">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">No account? <Link to="/register" className="underline">Sign up</Link></p>
    </div>
  );
}