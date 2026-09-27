export default function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-3">
      <div className="flex w-max gap-10 whitespace-nowrap" style={{ animation: 'marquee 22s linear infinite' }}>
        {doubled.map((item, i) => (
          <span key={i} className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            {item} <span className="ml-10 text-amber-500/40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}