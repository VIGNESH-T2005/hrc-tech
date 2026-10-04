import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle2, ArrowRight, Compass } from 'lucide-react';
import api from '../services/api';
import EmptyState from '../components/EmptyState';

export default function StudentDashboard() {
  const [courses, setCourses] = useState(null);

  useEffect(() => { api.get('/student/courses').then(({ data }) => setCourses(data)); }, []);

  if (!courses) return <p className="p-8 text-center text-neutral-400">Loading your courses…</p>;
  if (courses.length === 0) {
    return (
      <EmptyState icon={GraduationCap} title="You haven't enrolled in any courses yet"
        message="Browse the catalog and find something to start learning today."
        action={<Link to="/courses" className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black shadow-md">Browse courses</Link>} />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-white">My Courses</h1>
      <p className="mt-1 text-neutral-400">Pick up right where you left off.</p>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="surface card-shadow mt-6 flex flex-col items-center gap-4 rounded-2xl p-5 text-center sm:flex-row sm:text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black"><Compass size={20} /></div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">Ready to learn something new?</h3>
          <p className="mt-0.5 text-sm text-neutral-400">Explore the full catalog and add another course to your library.</p>
        </div>
        <Link to="/courses" className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200">
          Browse courses <ArrowRight size={15} />
        </Link>
      </motion.div>

      <div className="mt-6 space-y-4">
        {courses.map((c, i) => {
          const pct = c.lessonCount === 0 ? 0 : Math.round((c.completedLessons / c.lessonCount) * 100);
          const done = pct === 100;
          return (
            <motion.div key={c.courseId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link to={`/learn/${c.courseId}`} className="surface card-shadow group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-white/30">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white">
                  {done ? <CheckCircle2 size={24} /> : <GraduationCap size={24} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="truncate font-bold text-white">{c.title}</h2>
                    <span className="ml-2 shrink-0 text-xs font-semibold text-neutral-500">{c.completedLessons}/{c.lessonCount}</span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-neutral-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }} className="h-2 rounded-full bg-white" />
                  </div>
                </div>
                <ArrowRight size={18} className="shrink-0 text-neutral-600 transition group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}