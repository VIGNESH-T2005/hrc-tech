import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, CheckCircle2, FileEdit, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import GlowBackground from '../../components/GlowBackground';

export default function AdminDashboard() {
  const [courses, setCourses] = useState(null);

  useEffect(() => { api.get('/admin/courses').then(({ data }) => setCourses(data)); }, []);
  if (!courses) return <p className="p-8 text-center text-slate-400">Loading…</p>;

  const published = courses.filter(c => c.isPublished).length;

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-12">
      <GlowBackground variant="admin" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3">
        <div className="gradient-gold flex h-10 w-10 items-center justify-center rounded-xl text-slate-950">
          <LayoutDashboard size={19} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100">Admin Dashboard</h1>
      </motion.div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat icon={BookOpen} label="Total courses" value={courses.length} delay={0} />
        <Stat icon={CheckCircle2} label="Published" value={published} delay={0.08} />
        <Stat icon={FileEdit} label="Drafts" value={courses.length - published} delay={0.16} />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Link to="/admin/courses"
          className="group inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-950 shadow-md shadow-amber-900/20 transition hover:-translate-y-0.5 hover:bg-amber-300">
          Manage Courses <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }}
      whileHover={{ y: -4 }}
      className="surface card-shadow rounded-2xl p-5 text-center transition hover:border-amber-700/40">
      <Icon size={20} className="mx-auto mb-2 text-amber-400" />
      <p className="text-2xl font-extrabold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </motion.div>
  );
}