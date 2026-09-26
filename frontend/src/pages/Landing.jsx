import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, PlayCircle, FileCheck2, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

const features = [
  { icon: ShieldCheck, title: 'Protected Content', text: 'Every video and PDF is streamed through short-lived, entitlement-checked links — never a raw file.' },
  { icon: Sparkles, title: 'HRC TECH Watermark', text: 'Your identity is burned into every video and stamped on every PDF page automatically.' },
  { icon: TrendingUp, title: 'Real Progress Tracking', text: 'Pick up exactly where you left off, on any device, any time.' },
  { icon: FileCheck2, title: 'Secure Quizzes', text: 'Answers are graded server-side and never exposed before you submit.' },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

export default function Landing() {
  return (
    <div className="overflow-hidden">
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 via-white to-teal-50" />
        <div className="absolute -top-24 -right-24 -z-10 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="absolute top-40 -left-24 -z-10 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />

        <div className="mx-auto max-w-4xl px-4 py-24 text-center">
          <motion.span
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-purple)] shadow-sm"
          >
            <Sparkles size={13} /> Learn. Build. Get Placed.
          </motion.span>

          <motion.h1
            initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
          >
            Master real skills with<br /><span className="gradient-brand-text">watermarked, protected courses</span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mt-5 max-w-xl text-slate-600"
          >
            Video and PDF lessons, tracked progress, and a quiz to confirm what you've learned —
            every course built and taught by HRC TECH.
          </motion.p>

          <motion.div
            initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-9 flex justify-center gap-3"
          >
            <Link
              to="/courses"
              className="gradient-brand group flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Browse courses <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Create account
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="card-shadow rounded-2xl border border-slate-100 bg-white p-5 transition hover:-translate-y-1"
            >
              <div className="gradient-brand mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-white">
                <f.icon size={19} />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <PlayCircle size={36} className="mx-auto mb-4 text-[var(--brand-purple)]" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold text-slate-900">Ready to start learning?</h2>
          <p className="mt-2 text-slate-500">Sign up free and get instant access to every published course.</p>
          <Link to="/register" className="mt-6 inline-block rounded-full bg-[var(--brand-teal)] px-7 py-3 font-semibold text-white shadow-md transition hover:opacity-90">
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
}