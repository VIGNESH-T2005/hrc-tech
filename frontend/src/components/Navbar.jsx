import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import YoutubeIcon from './YoutubeIcon';

const YOUTUBE_URL = 'https://youtube.com/@hrctechinsights'; // TODO: replace with your real channel URL

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link to="/"><Logo /></Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-400">
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 transition hover:text-red-400">
            <YoutubeIcon size={16} /> YouTube
          </a>
          {user?.role !== 'Admin' && (
            <Link to="/courses" className="transition hover:text-amber-300">Courses</Link>
          )}
          {!user && <Link to="/login" className="transition hover:text-amber-300">Login</Link>}
          {!user && (
            <Link to="/register" className="gradient-gold rounded-full px-4 py-2 font-semibold text-slate-950 shadow-sm transition hover:brightness-105">
              Sign up
            </Link>
          )}
          {user?.role === 'Student' && <Link to="/dashboard" className="transition hover:text-amber-300">My Courses</Link>}
          {user?.role === 'Admin' && <Link to="/admin" className="transition hover:text-amber-300">Admin</Link>}
          {user && (
            <button
              onClick={async () => { await logout(); navigate('/'); }}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-3.5 py-1.5 text-slate-400 transition hover:border-red-800 hover:bg-red-950/40 hover:text-red-400"
            >
              <LogOut size={14} /> Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}