import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AuthShowcase({ icon: Icon, heading, sub }) {
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div onMouseMove={onMove} className="relative hidden flex-col justify-center overflow-hidden px-14 lg:flex"
      style={{ background: `radial-gradient(500px circle at ${mouse.x}% ${mouse.y}%, rgba(255,255,255,0.1), transparent 60%), linear-gradient(150deg, #141414 0%, #000000 100%)` }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
      <div className="pointer-events-none absolute -top-16 -right-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" style={{ animation: 'drift 12s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" style={{ animation: 'drift 15s ease-in-out infinite reverse' }} />

      <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="relative">
        <motion.div initial={{ scale: 0.6, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
          <Icon size={26} strokeWidth={1.75} />
        </motion.div>
        <h1 className="text-3xl font-bold leading-snug text-white">{heading}</h1>
        <p className="mt-3 max-w-sm text-neutral-400">{sub}</p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 w-64 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm" style={{ animation: 'drift 8s ease-in-out infinite' }}>
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-xs font-semibold text-neutral-300">HRC TECH</span>
            <span className="text-[10px] text-neutral-400">SECURE</span>
          </div>
          <div className="mt-2.5 space-y-1.5 text-[11px] text-neutral-500">
            <div className="flex justify-between"><span>Session</span><span className="text-neutral-200">Encrypted</span></div>
            <div className="flex justify-between"><span>Content</span><span className="text-neutral-200">Watermarked</span></div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}