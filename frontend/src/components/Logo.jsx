import { GraduationCap } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const icon = size === 'lg' ? 22 : 18;
  const text = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-2.5">
      <div className={`gradient-gold flex ${box} shrink-0 items-center justify-center rounded-xl text-slate-950 shadow-md shadow-amber-900/30`}>
        <GraduationCap size={icon} strokeWidth={2.25} />
      </div>
      <span className={`${text} font-extrabold tracking-tight text-slate-100`}>
        HRC <span className="gradient-gold-text">TECH</span>
      </span>
    </div>
  );
}