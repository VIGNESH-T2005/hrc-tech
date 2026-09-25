import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  useEffect(() => { api.get(`/courses/${id}`).then(({ data }) => setCourse(data)); }, [id]);

  const buyNow = async () => {
    if (!user) return navigate('/login');
    setBuying(true); setError('');
    try {
      const { data } = await api.post('/payments/create', { courseId: id });
      window.location.href = data.checkoutUrl; // Stripe-hosted Checkout
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBuying(false);
    }
  };

  if (!course) return <p className="p-8">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase text-[var(--brand-orange)]">{course.category}</p>
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="mt-2 text-slate-600">{course.description}</p>
      <p className="mt-4 text-2xl font-bold">₹{course.price}</p>

      <button onClick={buyNow} disabled={buying}
        className="mt-4 rounded bg-[var(--brand-teal)] px-6 py-3 font-semibold text-white disabled:opacity-60">
        {buying ? 'Starting checkout…' : 'Buy Now'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <h2 className="mt-8 mb-3 font-semibold">Lessons</h2>
      <ul className="divide-y rounded border bg-white">
        {course.lessons.map((l, i) => (
          <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="text-slate-400">🔒</span>
            <span>{i + 1}. {l.title}</span>
            <span className="ml-auto text-xs uppercase text-slate-400">{l.contentType}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}