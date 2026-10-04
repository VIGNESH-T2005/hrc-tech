import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const cancelled = params.get('cancelled') === 'true';
  const courseId = params.get('courseId');
  const [state, setState] = useState(cancelled ? 'cancelled' : 'confirming');

  useEffect(() => {
    if (cancelled || !courseId) return;
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const { data } = await api.get('/student/courses');
      if (data.some(c => c.courseId === courseId)) {
        setState('confirmed');
        clearInterval(poll);
      } else if (attempts >= 30) {
        setState('delayed');
        clearInterval(poll);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [cancelled, courseId]);

  return (
    <div className="mx-auto mt-20 max-w-md px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {state === 'cancelled' && (
          <>
            <XCircle size={44} className="mx-auto mb-4 text-neutral-400" />
            <h1 className="text-2xl font-bold text-white">Payment Cancelled</h1>
            <p className="mt-2 text-neutral-400">No charge was made. You can try again anytime.</p>
          </>
        )}
        {state === 'confirming' && (
          <>
            <Loader2 size={44} className="mx-auto mb-4 animate-spin text-neutral-400" />
            <h1 className="text-2xl font-bold text-white">Confirming your payment…</h1>
            <p className="mt-2 text-neutral-400">This usually takes just a few seconds.</p>
          </>
        )}
        {state === 'confirmed' && (
          <>
            <CheckCircle2 size={44} className="mx-auto mb-4 text-white" />
            <h1 className="text-2xl font-bold text-white">You're enrolled!</h1>
            <p className="mt-2 text-neutral-400">Your course is ready in My Courses.</p>
          </>
        )}
        {state === 'delayed' && (
          <>
            <Loader2 size={44} className="mx-auto mb-4 text-neutral-400" />
            <h1 className="text-2xl font-bold text-white">Still confirming…</h1>
            <p className="mt-2 text-neutral-400">This is taking longer than usual. Refresh My Courses in a moment.</p>
          </>
        )}
      </motion.div>
      <Link to="/dashboard" className="mt-7 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-black transition hover:bg-neutral-200">
        Go to My Courses
      </Link>
    </div>
  );
}