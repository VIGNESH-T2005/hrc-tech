import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

function scorePassword(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

export default function PasswordInput({ value, onChange, showStrength = false, placeholder = '••••••••', minLength }) {
  const [visible, setVisible] = useState(false);
  const score = scorePassword(value);

  return (
    <div>
      <div className="relative">
        <input type={visible ? 'text' : 'password'} required minLength={minLength} placeholder={placeholder}
          className="w-full rounded-xl border border-neutral-700 bg-[var(--bg-surface)] px-4 py-2.5 pr-11 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white focus:ring-2 focus:ring-white/10"
          value={value} onChange={onChange} />
        <button type="button" onClick={() => setVisible(v => !v)} tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white">
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 overflow-hidden">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-800">
                {i < score && <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.25 }} className="h-full origin-left bg-white" />}
              </div>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">{labels[score]}</p>
        </motion.div>
      )}
    </div>
  );
}