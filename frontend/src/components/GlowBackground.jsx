// Fixed to the viewport, not the parent container — this guarantees full-screen coverage
// even when dropped inside a narrow max-w-* content wrapper. Purely decorative:
// pointer-events-none means it never intercepts clicks, and -z-10 keeps it behind everything.
export default function GlowBackground({ variant = 'default' }) {
  const colors = variant === 'admin'
    ? ['bg-amber-500/10', 'bg-purple-600/10']
    : ['bg-amber-500/10', 'bg-red-600/10'];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute -left-16 top-10 h-72 w-72 rounded-full ${colors[0]} blur-3xl`} style={{ animation: 'drift 13s ease-in-out infinite' }} />
      <div className={`absolute -right-10 bottom-0 h-80 w-80 rounded-full ${colors[1]} blur-3xl`} style={{ animation: 'drift 16s ease-in-out infinite reverse' }} />
    </div>
  );
}