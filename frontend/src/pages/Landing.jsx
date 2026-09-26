import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, FileCheck2, TrendingUp, Sparkles, ArrowRight, Play } from 'lucide-react';
import YoutubeIcon from '../components/YoutubeIcon';

const YOUTUBE_URL = 'https://www.youtube.com/@hrctechinsights'; // TODO: replace with your real channel URL
const YOUTUBE_EMBED = 'https://www.youtube.com/embed/videoseries?list=PLNZ_OXckl0-gVKyepradjsl73RABRtvXV'; // TODO: replace with a real video/playlist embed URL

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
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#1b1b26_0%,_#0a0a0f_70%)]" />
        <div className="absolute -top-24 -right-24 -z-10 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-40 -left-24 -z-10 h-72 w-72 rounded-full bg-amber-700/10 blur-3xl" />

        <div className="mx-auto max-w-4xl px-4 py-24 text-center">
          <motion.span
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-semibold text-amber-300 shadow-sm"
          >
            <Sparkles size={13} /> Learn. Build. Get Placed.
          </motion.span>

          <motion.h1
            initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl font-extrabold tracking-tight text-slate-100 sm:text-5xl"
          >
            Your Learning Journey Starts with HRC Tech<br /><span className="gradient-gold-text">engaging courses and practical lessons.</span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mt-5 max-w-xl text-slate-400"
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
              className="gradient-gold group flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-slate-950 shadow-lg shadow-amber-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Browse courses <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-7 py-3.5 font-semibold text-slate-200 transition hover:border-amber-700/50"
            >
              Create account
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="surface card-shadow rounded-2xl p-5 transition hover:-translate-y-1 hover:border-amber-700/40"
            >
              <div className="gradient-gold mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-950">
                <f.icon size={19} />
              </div>
              <h3 className="font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* YouTube promo showcase */}
      <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white">
            <YoutubeIcon size={22} />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Watch us on YouTube</h2>
            <p className="mt-1 max-w-md text-sm text-slate-400">Free full-stack tutorials, project walkthroughs, and placement tips — the same team behind HRC TECH.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="surface card-shadow mx-auto max-w-3xl overflow-hidden rounded-2xl"
          >
            <div className="aspect-video w-full bg-black">
              <iframe
                src={YOUTUBE_EMBED}
                title="HRC TECH on YouTube"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-slate-400">@hrctech</span>
              <a href={YOUTUBE_URL} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500">
                <Play size={14} fill="currentColor" /> View channel
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-100">Ready to start learning?</h2>
          <p className="mt-2 text-slate-400">Sign up free and get instant access to every published course.</p>
          <Link to="/register" className="mt-6 inline-block rounded-full bg-amber-400 px-7 py-3 font-semibold text-slate-950 shadow-md transition hover:bg-amber-300">
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
}