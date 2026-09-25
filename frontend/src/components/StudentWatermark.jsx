import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Client-side, repositioning, semi-transparent overlay with the real logged-in student's
// identity. This is a deterrent, not DRM — the actual protection is server-side
// (Phase 6's short-lived, entitlement-checked stream) plus the burned-in watermark from Phase 5.
export default function StudentWatermark() {
  const { user } = useAuth();
  const [pos, setPos] = useState({ top: '10%', left: '10%' });

  useEffect(() => {
    const id = setInterval(() => {
      setPos({ top: `${10 + Math.random() * 70}%`, left: `${5 + Math.random() * 60}%` });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  if (!user) return null;

  return (
    <div
      className="pointer-events-none absolute select-none rounded bg-black/30 px-2 py-1 text-xs text-white/70 transition-all duration-1000"
      style={pos}
    >
      {user.name} · {user.email}
    </div>
  );
}