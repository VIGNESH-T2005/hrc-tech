import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link to="/"><Logo /></Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link to="/courses" className="transition hover:text-[var(--brand-purple)]">Courses</Link>
          {!user && <Link to="/login" className="transition hover:text-[var(--brand-purple)]">Login</Link>}
          {!user && (
            <Link to="/register" className="gradient-brand rounded-full px-4 py-2 text-white shadow-sm transition hover:opacity-90 hover:shadow-md">
              Sign up
            </Link>
          )}
          {user?.role === 'Student' && <Link to="/dashboard" className="transition hover:text-[var(--brand-purple)]">My Courses</Link>}
          {user?.role === 'Admin' && <Link to="/admin" className="transition hover:text-[var(--brand-purple)]">Admin</Link>}
          {user && (
            <button
              onClick={async () => { await logout(); navigate('/'); }}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={14} /> Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}