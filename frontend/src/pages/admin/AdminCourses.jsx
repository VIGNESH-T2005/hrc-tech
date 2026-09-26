import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Layers } from 'lucide-react';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';

export default function AdminCourses() {
  const [courses, setCourses] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', price: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/admin/courses').then(({ data }) => setCourses(data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post('/admin/courses', { ...form, price: Number(form.price) });
      setForm({ title: '', description: '', category: '', price: '' });
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!courses) return <p className="p-8 text-center text-slate-400">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-100">Courses</h1>

      <form onSubmit={create} className="surface card-shadow mb-8 grid grid-cols-1 gap-3 rounded-2xl p-5 sm:grid-cols-2">
        <input required placeholder="Title"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
          value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input required placeholder="Category"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
          value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <input required type="number" placeholder="Price (INR)"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
          value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <input required placeholder="Description" className="sm:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
          value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        {error && <p className="sm:col-span-2 text-sm text-red-400">{error}</p>}
        <button disabled={saving} className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60">
          <Plus size={16} /> {saving ? 'Creating…' : 'Create Course'}
        </button>
      </form>

      <ul className="surface card-shadow divide-y divide-[var(--border-subtle)] overflow-hidden rounded-2xl">
        {courses.map((c, i) => (
          <motion.li key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
              {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <Layers size={18} className="text-slate-600" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-100">{c.title}</p>
              <p className="text-xs text-slate-500">
                <span className={c.isPublished ? 'text-emerald-400' : 'text-amber-400'}>{c.isPublished ? 'Published' : 'Draft'}</span> · {c.lessonCount} lessons
              </p>
            </div>
            <Link to={`/admin/courses/${c.id}`} className="shrink-0 rounded-full border border-[var(--border-subtle)] px-4 py-1.5 text-sm font-medium text-amber-400 transition hover:border-amber-500">
              Manage
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}