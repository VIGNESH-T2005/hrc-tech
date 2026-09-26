import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, PlayCircle, FileText, ShoppingCart, Settings, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/errors';

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'Admin';

  useEffect(() => { api.get(`/courses/${id}`).then(({ data }) => setCourse(data)); }, [id]);

  const buyNow = async () => {
    if (!user) return navigate('/login');
    setBuying(true); setError('');
    try {
      const { data } = await api.post('/payments/create', { courseId: id });
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBuying(false);
    }
  };

  if (!course) return <p className="p-8 text-center text-slate-400">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* Admins never see the purchase flow — this replaces it entirely so there's no mix-up. */}
        {isAdmin && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-700/40 bg-amber-950/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="shrink-0 text-amber-400" />
              <p className="text-sm text-amber-200">You're viewing this as the platform admin. Use the course editor to manage lessons and publishing.</p>
            </div>
            <Link to={`/admin/courses/${id}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
              <Settings size={14} /> Manage course
            </Link>
          </div>
        )}

        <p className="text-xs font-bold uppercase tracking-wide text-amber-400">{course.category}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-100">{course.title}</h1>
        <p className="mt-3 text-slate-400">{course.description}</p>

        {!isAdmin && (
          <div className="surface card-shadow mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
            <span className="text-3xl font-extrabold text-slate-100">₹{course.price}</span>
            <button onClick={buyNow} disabled={buying}
              className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-950 shadow-md transition hover:bg-amber-300 disabled:opacity-60">
              <ShoppingCart size={17} /> {buying ? 'Starting checkout…' : 'Buy Now'}
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <h2 className="mb-3 mt-9 font-semibold text-slate-100">Lessons</h2>
        <ul className="surface card-shadow divide-y divide-[var(--border-subtle)] overflow-hidden rounded-2xl">
          {course.lessons.map((l, i) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-300">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                <Lock size={13} />
              </span>
              <span className="flex-1">{i + 1}. {l.title}</span>
              <span className="flex items-center gap-1 text-xs uppercase text-slate-500">
                {l.contentType === 'Video' ? <PlayCircle size={14} /> : <FileText size={14} />} {l.contentType}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}