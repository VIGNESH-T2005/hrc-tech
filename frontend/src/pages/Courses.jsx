import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses').then(({ data }) => setCourses(data.items)).catch(() => setError('Could not load courses.'));
  }, []);

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!courses) return <p className="p-8">Loading…</p>;
  if (courses.length === 0) return <p className="p-8 text-slate-500">No courses are published yet.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Courses</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map(c => (
          <Link key={c.id} to={`/courses/${c.id}`} className="rounded-lg border bg-white p-4 hover:shadow-md">
            <div className="mb-3 aspect-video rounded bg-slate-100">
              {c.thumbnailUrl && <img src={c.thumbnailUrl} alt="" className="h-full w-full rounded object-cover" />}
            </div>
            <p className="text-xs uppercase text-[var(--brand-orange)]">{c.category}</p>
            <h2 className="font-semibold">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{c.description}</p>
            <p className="mt-2 font-bold">₹{c.price} <span className="text-xs font-normal text-slate-400">· {c.lessonCount} lessons</span></p>
          </Link>
        ))}
      </div>
    </div>
  );
}