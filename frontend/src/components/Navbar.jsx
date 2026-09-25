import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-[var(--brand-purple)]">HRC TECH</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/courses">Courses</Link>
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/register" className="rounded bg-[var(--brand-teal)] px-3 py-1.5 text-white">Sign up</Link>}
          {user?.role === 'Student' && <Link to="/dashboard">My Courses</Link>}
          {user?.role === 'Admin' && <Link to="/admin">Admin</Link>}
          {user && (
            <button onClick={async () => { await logout(); navigate('/'); }} className="text-slate-500">
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}