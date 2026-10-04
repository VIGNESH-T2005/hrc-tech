export default function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" style={{ animation: 'drift 13s ease-in-out infinite' }} />
      <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" style={{ animation: 'drift 16s ease-in-out infinite reverse' }} />
    </div>
  );
}