import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import EmptyState from '../components/EmptyState';

export default function StudentDashboard() {
  const [courses, setCourses] = useState(null);

  useEffect(() => { api.get('/student/courses').then(({ data }) => setCourses(data)); }, []);

  if (!courses) return <p className="p-8 text-center text-slate-400">Loading your courses…</p>;
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="You haven't enrolled in any courses yet"
        message="Browse the catalog and find something to start learning today."
        action={<Link to="/courses" className="gradient-brand mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md">Browse courses</Link>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">My Courses</h1>
      <p className="mt-1 text-slate-500">Pick up right where you left off.</p>

      <div className="mt-8 space-y-4">
        {courses.map((c, i) => {
          const pct = c.lessonCount === 0 ? 0 : Math.round((c.completedLessons / c.lessonCount) * 100);
          const done = pct === 100;
          return (
            <motion.div key={c.courseId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link to={`/learn/${c.courseId}`} className="card-shadow group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-teal-100 text-[var(--brand-purple)]">
                  {done ? <CheckCircle2 size={24} /> : <GraduationCap size={24} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="truncate font-bold text-slate-900">{c.title}</h2>
                    <span className="ml-2 shrink-0 text-xs font-semibold text-slate-400">{c.completedLessons}/{c.lessonCount}</span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                      className={`h-2 rounded-full ${done ? 'bg-[var(--brand-teal)]' : 'gradient-brand'}`} />
                  </div>
                </div>
                <ArrowRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[var(--brand-purple)]" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}