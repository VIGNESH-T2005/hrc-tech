import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-[var(--brand-purple)]">HRC TECH</h1>
      <p className="mx-auto mt-4 max-w-xl text-slate-600">
        Learn from real, watermarked, protected course content — video and PDF lessons, tracked progress, and a quiz to confirm what you've learned.
      </p>
      <Link to="/courses" className="mt-8 inline-block rounded bg-[var(--brand-teal)] px-6 py-3 text-white">
        Browse courses
      </Link>
    </div>
  );
}