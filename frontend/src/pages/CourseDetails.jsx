import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, PlayCircle, FileText, ShoppingCart, Settings, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/errors';
import GlowBackground from '../components/GlowBackground';

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

  if (!course) return <p className="p-8 text-center text-neutral-400">Loading…</p>;

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-12">
      <GlowBackground />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-neutral-700 bg-neutral-900 px-5 py-4">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="shrink-0 text-neutral-300" />
              <p className="text-sm text-neutral-300">You're viewing this as the platform admin. Use the course editor to manage lessons and publishing.</p>
            </div>
            <Link to={`/admin/courses/${id}`} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200">
              <Settings size={14} /> Manage course
            </Link>
          </motion.div>
        )}

        <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{course.category}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">{course.title}</h1>
        <p className="mt-3 text-neutral-400">{course.description}</p>

        {!isAdmin && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="surface card-shadow mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl p-5 transition hover:border-white/30 sm:flex-row sm:items-center">
            <span className="text-3xl font-extrabold text-white">₹{course.price}</span>
            <button onClick={buyNow} disabled={buying}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black shadow-md transition hover:-translate-y-0.5 hover:bg-neutral-200 disabled:opacity-60">
              <ShoppingCart size={17} /> {buying ? 'Starting checkout…' : 'Buy Now'}
            </button>
          </motion.div>
        )}
        {error && <p className="mt-2 text-sm text-neutral-400">{error}</p>}

        <h2 className="mb-3 mt-9 font-semibold text-white">Lessons</h2>
        <ul className="surface card-shadow divide-y divide-neutral-800 overflow-hidden rounded-2xl">
          {course.lessons.map((l, i) => (
            <motion.li key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-4 py-3.5 text-sm text-neutral-300">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-500"><Lock size={13} /></span>
              <span className="flex-1">{i + 1}. {l.title}</span>
              <span className="flex items-center gap-1 text-xs uppercase text-neutral-500">
                {l.contentType === 'Video' ? <PlayCircle size={14} /> : <FileText size={14} />} {l.contentType}
              </span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}