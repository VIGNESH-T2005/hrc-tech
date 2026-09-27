import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, TrendingUp, Sparkles, Play } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import YoutubeIcon from '../components/YoutubeIcon';
import CountUp from '../components/landing/CountUp';
import Marquee from '../components/landing/Marquee';
import VideoCarousel from '../components/landing/VideoCarousel';

const YOUTUBE_URL = 'https://www.youtube.com/@hrctechinsights';

// TODO: replace with real video IDs from your channel (the part after ?v= in the URL)
// and real titles/durations. The thumbnail loads straight from YouTube — no API key needed.
const videos = [
  { videoId: '7ZIhGOImnwA', title: 'Start Java Today 🔥 5 Easy Programs for Beginners | Java Basics Tamil' },
  { videoId: 'aZFYOiFlLbA', title: 'Unit Digit Concept & Problems in Tamil | Number System Chapter 2 | Placement & Govt Exams' },
  { videoId: 'ZQJXCOWrEPk', title: 'Divisibility Rules 1 to 20 in Tamil | Number System Chapter 1 | TNPSC, SSC, Bank Exams' },
];

const keywords = ['Java', 'Spring Boot', 'React', 'PostgreSQL', 'System Design', 'DSA', 'Placements', 'REST APIs', 'Full Stack', 'Interview Prep'];

export default function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  useEffect(() => {
    api.get('/courses').then(({ data }) => {
      const lessons = data.items.reduce((sum, c) => sum + c.lessonCount, 0);
      setStats({ courses: data.items.length, lessons });
    }).catch(() => setStats({ courses: 0, lessons: 0 }));
  }, []);

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section
        onMouseMove={onMouseMove}
        className="relative"
        style={{
          background: `radial-gradient(600px circle at ${mouse.x}% ${mouse.y}%, rgba(251,191,36,0.08), transparent 60%), radial-gradient(ellipse at top, #14141c 0%, #0a0a0f 70%)`
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -right-10 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" style={{ animation: 'drift 12s ease-in-out infinite' }} />
          <div className="absolute top-52 -left-20 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" style={{ animation: 'drift 15s ease-in-out infinite reverse' }} />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center">
          <motion.a
            href={YOUTUBE_URL} target="_blank" rel="noreferrer"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-800/40 bg-red-950/30 px-4 py-1.5 text-xs font-semibold text-red-300 shadow-lg shadow-red-950/20"
          >
            <YoutubeIcon size={14} /> New tutorials every week on @hrctechinsights
          </motion.a>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl font-extrabold tracking-tight text-slate-100 sm:text-6xl"
          >
            I teach on YouTube.<br />
            <span className="gradient-gold-text">Here, we go deeper.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }}
            className="mx-auto mt-5 max-w-xl text-slate-400"
          >
            Thousands watch the free videos every week. This is where those tutorials turn into
            real projects, graded quizzes, and skills you can actually put on your resume.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.25 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer"
              className="group flex items-center gap-2 rounded-full bg-red-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-red-900/30 transition hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-xl">
              <Play size={16} fill="currentColor" /> Watch free on YouTube
            </a>
            <Link to={user?.role === 'Admin' ? '/admin/courses' : '/courses'}
              className="group flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-7 py-3.5 font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-amber-500/50">
              {user?.role === 'Admin' ? 'Manage courses' : 'Explore courses'}
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {stats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="mx-auto mt-14 grid max-w-md grid-cols-3 gap-4">
              <StatBlock value={stats.courses} label="Courses" />
              <StatBlock value={stats.lessons} label="Lessons" />
              <StatBlock value={50} suffix="+" label="Free videos" />
            </motion.div>
          )}
        </div>
      </section>

      <Marquee items={keywords} />

           {/* FROM MY YOUTUBE CHANNEL */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100">From my YouTube channel</h2>
            <p className="mt-1 text-sm text-slate-500">Free, full-length, no signup required — swipe to browse.</p>
          </div>
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-sm font-semibold text-red-400 hover:text-red-300">
            View all videos <ArrowRight size={14} />
          </a>
        </motion.div>
        <VideoCarousel videos={videos} />
      </section>

            {/* WHY ENROLL */}
      <section className="relative overflow-hidden border-y border-[var(--border-subtle)] py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" style={{ animation: 'drift 13s ease-in-out infinite' }} />
          <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-red-600/10 blur-3xl" style={{ animation: 'drift 16s ease-in-out infinite reverse' }} />
        </div>

        <div className="relative mx-auto max-w-5xl px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Stop watching. Start finishing.</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Free videos are a great start, but they don't check if you actually understood anything.
              Every course here is built to get you from "I watched it" to "I can build it."
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { icon: TrendingUp, title: 'Follow one clear path', text: 'No jumping between random videos — each lesson builds on the last, so you always know what to do next.' },
              { icon: Sparkles, title: 'Prove you actually learned it', text: 'A graded quiz waits at the end of every course. Pass it, and you know the skill is really yours.' },
              { icon: ShieldCheck, title: 'Learn at your own pace', text: 'Every lesson is yours once you enroll — rewatch, pause, and resume exactly where you left off, anytime.' },
            ].map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-lg shadow-black/20 transition-colors hover:border-amber-500/40">
                <div className="gradient-gold mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-950"><f.icon size={19} /></div>
                <h3 className="font-semibold text-slate-100">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{f.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="mt-12 text-center">
            <Link to="/courses" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 font-semibold text-slate-950 shadow-md shadow-amber-900/20 transition hover:-translate-y-0.5 hover:bg-amber-300">
              See what's available <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden py-24 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" style={{ animation: 'drift 10s ease-in-out infinite' }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative mx-auto max-w-xl px-4">
          <h2 className="text-3xl font-extrabold text-slate-100">Subscribe. Then enroll.</h2>
          <p className="mt-3 text-slate-400">Free tutorials get you moving today. Courses get you placement-ready.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 rounded-full bg-red-600 px-7 py-3 font-semibold text-white transition hover:bg-red-500">
              <YoutubeIcon size={16} /> Subscribe free
            </a>
            {!user && (
              <Link to="/register" className="rounded-full bg-amber-400 px-7 py-3 font-semibold text-slate-950 transition hover:bg-amber-300">
                Create account
              </Link>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function StatBlock({ value, suffix = '', label }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-4">
      <p className="text-2xl font-extrabold text-amber-400"><CountUp to={value} suffix={suffix} /></p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}