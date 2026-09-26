import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle2, ArrowRight, Compass } from 'lucide-react';
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
        action={<Link to="/courses" className="gradient-gold mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md">Browse courses</Link>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-100">My Courses</h1>
      <p className="mt-1 text-slate-400">Pick up right where you left off.</p>

      {/* Nudge to buy more, shown once they own at least one course */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="surface card-shadow mt-6 flex flex-col items-center gap-4 rounded-2xl border-amber-700/30 bg-gradient-to-r from-amber-950/30 to-[var(--bg-surface)] p-5 text-center sm:flex-row sm:text-left"
      >
        <div className="gradient-gold flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-950">
          <Compass size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-100">Ready to learn something new?</h3>
          <p className="mt-0.5 text-sm text-slate-400">Explore the full catalog and add another course to your library.</p>
        </div>
        <Link to="/courses" className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
          Browse courses <ArrowRight size={15} />
        </Link>
      </motion.div>

      <div className="mt-6 space-y-4">
        {courses.map((c, i) => {
          const pct = c.lessonCount === 0 ? 0 : Math.round((c.completedLessons / c.lessonCount) * 100);
          const done = pct === 100;
          return (
            <motion.div key={c.courseId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link to={`/learn/${c.courseId}`} className="surface card-shadow group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-amber-700/40">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-900/30 to-amber-700/10 text-amber-400">
                  {done ? <CheckCircle2 size={24} /> : <GraduationCap size={24} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="truncate font-bold text-slate-100">{c.title}</h2>
                    <span className="ml-2 shrink-0 text-xs font-semibold text-slate-500">{c.completedLessons}/{c.lessonCount}</span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                      className={`h-2 rounded-full ${done ? 'bg-emerald-400' : 'gradient-gold'}`} />
                  </div>
                </div>
                <ArrowRight size={18} className="shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-amber-400" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}