import { Play } from 'lucide-react';
import YoutubeIcon from './YoutubeIcon';
import Logo from './Logo';

const YOUTUBE_URL = 'https://www.youtube.com/@hrctechinsights';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-800 bg-[var(--bg-surface)]">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="surface-raised card-shadow flex flex-col items-center gap-5 rounded-2xl p-8 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
            <YoutubeIcon size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Free tutorials on our YouTube channel</h3>
            <p className="mt-1 text-sm text-neutral-400">Full-stack builds, interview prep, and behind-the-scenes of HRC TECH courses.</p>
          </div>
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-black shadow-md transition hover:bg-neutral-200">
            <Play size={16} fill="currentColor" /> Subscribe
          </a>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 sm:flex-row">
          <Logo />
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} HRC TECH. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}