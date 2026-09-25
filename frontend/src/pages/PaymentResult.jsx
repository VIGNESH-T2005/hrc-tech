import { useSearchParams, Link } from 'react-router-dom';

// This page never decides success on its own — it's just a landing spot.
// The webhook (server-side, signature-verified) is the only thing that unlocks the course.
export default function PaymentResult() {
  const [params] = useSearchParams();
  const cancelled = params.get('cancelled') === 'true';

  return (
    <div className="mx-auto mt-20 max-w-md px-4 text-center">
      {cancelled ? (
        <>
          <h1 className="text-2xl font-bold text-red-600">Payment Cancelled</h1>
          <p className="mt-2 text-slate-600">No charge was made. You can try again anytime.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-[var(--brand-teal)]">Thanks!</h1>
          <p className="mt-2 text-slate-600">
            We're confirming your payment now — this usually takes a few seconds.
            Your course will appear in "My Courses" once it's confirmed.
          </p>
        </>
      )}
      <Link to="/dashboard" className="mt-6 inline-block rounded bg-[var(--brand-teal)] px-5 py-2 text-white">
        Go to My Courses
      </Link>
    </div>
  );
}