import { GraduationCap } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const icon = size === 'lg' ? 22 : 18;
  const text = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-2.5">
      <div className={`gradient-brand flex ${box} shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-purple-900/20`}>
        <GraduationCap size={icon} strokeWidth={2.25} />
      </div>
      <span className={`${text} font-extrabold tracking-tight text-slate-900`}>
        HRC <span className="gradient-brand-text">TECH</span>
      </span>
    </div>
  );
}