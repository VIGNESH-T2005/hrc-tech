import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Layers, SearchX } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import GlowBackground from '../components/GlowBackground';

export default function Courses() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setCourses(null);
    const query = search ? { params: { search } } : undefined;
    api.get('/courses', query).then(({ data }) => setCourses(data.items)).catch(() => setError('Could not load courses.'));
  }, [search]);

  if (error) return <p className="p-8 text-center text-neutral-400">{error}</p>;
  if (!courses) return <SkeletonGrid />;
  if (courses.length === 0) {
    return (
      <div className="relative">
        <GlowBackground />
        <EmptyState icon={search ? SearchX : BookOpen} title={search ? `No results for "${search}"` : 'No courses yet'}
          message={search ? 'Try a different search term.' : 'Check back soon — new courses are published regularly.'} />
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-12">
      <GlowBackground />
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold text-white">
        {search ? `Results for "${search}"` : 'Courses'}
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mt-1 text-neutral-400">
        {courses.length} course{courses.length !== 1 && 's'} available
      </motion.p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}>
            <Link to={user?.role === 'Admin' ? `/admin/courses/${c.id}` : `/courses/${c.id}`}
              className="surface card-shadow group block overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-white/30">
              <div className="aspect-video overflow-hidden bg-neutral-900">
                {c.thumbnailUrl
                  ? <img src={c.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  : <div className="flex h-full items-center justify-center text-neutral-700"><Layers size={40} strokeWidth={1.5} /></div>}
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{c.category}</p>
                <h2 className="mt-1 font-bold text-white">{c.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm text-neutral-400">{c.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-lg font-extrabold text-white">₹{c.price}</span>
                  <span className="text-xs text-neutral-500">{c.lessonCount} lessons</span>
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
    <div className="relative mx-auto max-w-6xl px-4 py-12">
      <GlowBackground />
      <div className="mb-8 h-8 w-40 animate-pulse rounded bg-neutral-800" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="surface overflow-hidden rounded-2xl">
            <div className="aspect-video animate-pulse bg-neutral-800" />
            <div className="space-y-2 p-5">
              <div className="h-3 w-16 animate-pulse rounded bg-neutral-800" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
              <div className="h-3 w-full animate-pulse rounded bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}