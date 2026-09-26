import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

// The redirect back from Stripe proves nothing on its own — it's the signature-verified
// webhook (server-side) that actually confirms payment and creates the enrollment.
// This page just polls "My Courses" until that enrollment shows up, or times out.
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
      } else if (attempts >= 15) {   // ~30 seconds
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
            <XCircle size={44} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-slate-100">Payment Cancelled</h1>
            <p className="mt-2 text-slate-400">No charge was made. You can try again anytime.</p>
          </>
        )}
        {state === 'confirming' && (
          <>
            <Loader2 size={44} className="mx-auto mb-4 animate-spin text-amber-400" />
            <h1 className="text-2xl font-bold text-slate-100">Confirming your payment…</h1>
            <p className="mt-2 text-slate-400">This usually takes just a few seconds.</p>
          </>
        )}
        {state === 'confirmed' && (
          <>
            <CheckCircle2 size={44} className="mx-auto mb-4 text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-100">You're enrolled!</h1>
            <p className="mt-2 text-slate-400">Your course is ready in My Courses.</p>
          </>
        )}
        {state === 'delayed' && (
          <>
            <Loader2 size={44} className="mx-auto mb-4 text-amber-400" />
            <h1 className="text-2xl font-bold text-slate-100">Still confirming…</h1>
            <p className="mt-2 text-slate-400">This is taking longer than usual. Refresh My Courses in a moment — if it still isn't there, contact support.</p>
          </>
        )}
      </motion.div>
      <Link to="/dashboard" className="mt-7 inline-block rounded-full bg-amber-400 px-6 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-300">
        Go to My Courses
      </Link>
    </div>
  );
}