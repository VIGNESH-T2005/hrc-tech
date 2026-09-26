import { Youtube, Play } from 'lucide-react';
import Logo from './Logo';

const YOUTUBE_URL = 'https://youtube.com/@hrctech'; // TODO: replace with your real channel URL

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="surface-raised card-shadow flex flex-col items-center gap-5 rounded-2xl border-red-900/30 bg-gradient-to-br from-red-950/40 to-[var(--bg-surface-raised)] p-8 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
            <Youtube size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-100">Free tutorials on our YouTube channel</h3>
            <p className="mt-1 text-sm text-slate-400">Full-stack builds, interview prep, and behind-the-scenes of HRC TECH courses — new videos every week.</p>
          </div>
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-red-500">
            <Play size={16} fill="currentColor" /> Subscribe
          </a>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-8 sm:flex-row">
          <Logo />
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} HRC TECH. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}