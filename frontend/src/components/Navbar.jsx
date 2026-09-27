import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { LogOut, Menu, X, Search, ChevronDown, LayoutDashboard, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOutsideClick } from '../hooks/useOutsideClick';
import Logo from './Logo';
import YoutubeIcon from './YoutubeIcon';

const YOUTUBE_URL = 'https://www.youtube.com/@hrctechinsights';

export default function Navbar() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);
  const searchInputRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const progressX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  useOutsideClick(avatarRef, () => setAvatarOpen(false));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setAvatarOpen(false); }, [location.pathname]);
  useEffect(() => { if (searchOpen) searchInputRef.current?.focus(); }, [searchOpen]);

  const links = [
    ...(user?.role !== 'Admin' ? [{ to: '/courses', label: 'Courses' }] : []),
    ...(user?.role === 'Student' ? [{ to: '/dashboard', label: 'My Courses' }] : []),
    ...(user?.role === 'Admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const runSearch = (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate(`/courses?search=${encodeURIComponent(searchValue.trim())}`);
    setSearchOpen(false);
    setSearchValue('');
  };

  const initials = user?.name?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 shadow-lg shadow-black/20 backdrop-blur-md' : 'border-b border-transparent bg-[var(--bg-base)]/40 backdrop-blur-sm'
      }`}
    >
      {/* Scroll progress */}
      <motion.div style={{ scaleX: progressX }} className="absolute left-0 top-0 h-[2.5px] w-full origin-left bg-gradient-to-r from-amber-500 via-amber-300 to-red-500" />

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5">
        <Link to="/" className="shrink-0">
          <motion.div whileHover={{ rotate: -6, scale: 1.04 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Logo />
          </motion.div>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link key={l.to} to={l.to} className="relative px-3.5 py-2 text-sm font-medium text-slate-400 transition hover:text-slate-100">
                {active && (
                  <motion.span layoutId="nav-active" className="absolute inset-0 rounded-full bg-slate-800/70"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                )}
                <span className={`relative ${active ? 'text-amber-300' : ''}`}>{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          {/* Expanding search */}
          <form onSubmit={runSearch} className="flex items-center">
            <motion.div animate={{ width: searchOpen ? 190 : 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
              <input
                ref={searchInputRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onBlur={() => !searchValue && setSearchOpen(false)}
                placeholder="Search courses…"
                className="w-[190px] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-500/60"
              />
            </motion.div>
            <button type={searchOpen ? 'submit' : 'button'} onClick={() => !searchOpen && setSearchOpen(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-800/70 hover:text-amber-300"
              aria-label="Search courses">
              <Search size={16} />
            </button>
          </form>

          {/* YouTube pill with a pulsing activity dot */}
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-red-600/10 px-3.5 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-600/30 transition hover:bg-red-600 hover:text-white hover:ring-red-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
            </span>
            <YoutubeIcon size={14} /> YouTube
          </a>

          {ready && !user && (
            <>
              <Link to="/login" className="px-2 text-sm font-medium text-slate-400 transition hover:text-slate-100">Login</Link>
              <Link to="/register" className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-amber-900/20 transition hover:bg-amber-300">
                Sign up
              </Link>
            </>
          )}

          {/* Avatar dropdown */}
          {user && (
            <div className="relative" ref={avatarRef}>
              <button onClick={() => setAvatarOpen(o => !o)}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] py-1 pl-1 pr-2.5 transition hover:border-amber-500/40">
                <span className="gradient-gold flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-slate-950">
                  {initials}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${avatarOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {avatarOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xl shadow-black/40"
                  >
                    <div className="border-b border-[var(--border-subtle)] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Link to={user.role === 'Admin' ? '/admin' : '/dashboard'}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800/60">
                      {user.role === 'Admin' ? <LayoutDashboard size={15} /> : <GraduationCap size={15} />}
                      {user.role === 'Admin' ? 'Admin dashboard' : 'My Courses'}
                    </Link>
                    <button
                      onClick={async () => { await logout(); navigate('/'); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-950/40"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <button onClick={() => setMenuOpen(o => !o)} className="text-slate-300 md:hidden" aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--bg-base)] md:hidden"
          >
            <form onSubmit={runSearch} className="flex items-center gap-2 px-4 pt-4">
              <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search courses…"
                className="flex-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-500/60" />
              <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/70 text-slate-300"><Search size={16} /></button>
            </form>

            <div className="flex flex-col gap-1 px-4 py-4">
              {links.map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={l.to} className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${location.pathname === l.to ? 'bg-slate-800/70 text-amber-300' : 'text-slate-300'}`}>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400">
                <YoutubeIcon size={15} /> YouTube
              </a>

              <div className="mt-2 border-t border-[var(--border-subtle)] pt-3">
                {ready && !user && (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300">Login</Link>
                    <Link to="/register" className="rounded-full bg-amber-400 px-4 py-2.5 text-center text-sm font-semibold text-slate-950">Sign up</Link>
                  </div>
                )}
                {user && (
                  <>
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <span className="gradient-gold flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-slate-950">{initials}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={async () => { await logout(); navigate('/'); }}
                      className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm text-red-400">
                      <LogOut size={14} /> Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}