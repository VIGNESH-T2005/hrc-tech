import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Layers } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses').then(({ data }) => setCourses(data.items)).catch(() => setError('Could not load courses.'));
  }, []);

  if (error) return <p className="p-8 text-center text-red-400">{error}</p>;
  if (!courses) return <SkeletonGrid />;
  if (courses.length === 0) {
    return <EmptyState icon={BookOpen} title="No courses yet" message="Check back soon — new courses are published regularly." />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-100">Courses</h1>
      <p className="mt-1 text-slate-400">{courses.length} course{courses.length !== 1 && 's'} available</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}>
            <Link to={user?.role === 'Admin' ? `/admin/courses/${c.id}` : `/courses/${c.id}`}
              className="surface card-shadow group block overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-amber-700/40">
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-amber-900/20 to-amber-700/10">
                {c.thumbnailUrl
                  ? <img src={c.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  : <div className="flex h-full items-center justify-center text-amber-700"><Layers size={40} strokeWidth={1.5} /></div>}
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-400">{c.category}</p>
                <h2 className="mt-1 font-bold text-slate-100">{c.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{c.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <span className="text-lg font-extrabold text-slate-100">₹{c.price}</span>
                  <span className="text-xs text-slate-500">{c.lessonCount} lessons</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 h-8 w-40 animate-pulse rounded bg-slate-800" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="surface overflow-hidden rounded-2xl">
            <div className="aspect-video animate-pulse bg-slate-800" />
            <div className="space-y-2 p-5">
              <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}