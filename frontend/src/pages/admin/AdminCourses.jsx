import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';

export default function AdminCourses() {
  const [courses, setCourses] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', price: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/admin/courses').then(({ data }) => setCourses(data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/courses', { ...form, price: Number(form.price) });
      setForm({ title: '', description: '', category: '', price: '' });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!courses) return <p className="p-8">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Courses</h1>

      <form onSubmit={create} className="mb-8 grid grid-cols-2 gap-3 rounded border bg-white p-4">
        <input required placeholder="Title" className="rounded border px-3 py-2" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input required placeholder="Category" className="rounded border px-3 py-2" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        <input required type="number" placeholder="Price (INR)" className="rounded border px-3 py-2" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <input required placeholder="Description" className="col-span-2 rounded border px-3 py-2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
        <button className="col-span-2 rounded bg-[var(--brand-purple)] py-2 text-white">Create Course</button>
      </form>

      <ul className="divide-y rounded border bg-white">
        {courses.map(c => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{c.title}</p>
              <p className="text-xs text-slate-400">{c.isPublished ? 'Published' : 'Draft'} · {c.lessonCount} lessons</p>
            </div>
            <Link to={`/admin/courses/${c.id}`} className="text-sm text-[var(--brand-purple)] underline">Manage</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}