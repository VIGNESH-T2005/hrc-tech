import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/errors';

// No role field anywhere on this page or in the request it sends — students only.
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="mb-6 text-2xl font-bold">Create a student account</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full name" className="w-full rounded border px-3 py-2"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input type="email" required placeholder="Email" className="w-full rounded border px-3 py-2"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" required minLength={8} placeholder="Password (8+ characters)" className="w-full rounded border px-3 py-2"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-[var(--brand-teal)] py-2 text-white disabled:opacity-60">
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </div>
  );
}