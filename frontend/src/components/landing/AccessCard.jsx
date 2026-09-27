import { motion } from 'framer-motion';

// A credential mockup, not a gradient blob — the whole product is "protected access",
// so the hero visual should look like the thing it protects.
export default function AccessCard() {
  return (
    <div className="relative flex items-center justify-center py-6">
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-72 overflow-hidden rounded-md border"
        style={{ borderColor: 'var(--hairline)', background: 'var(--panel)' }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--hairline)' }}>
          <span className="font-display text-sm tracking-tight" style={{ color: 'var(--paper)' }}>HRC TECH</span>
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>ACCESS TOKEN</span>
        </div>
        <div className="space-y-2.5 px-4 py-4 text-xs" style={{ color: 'var(--muted)' }}>
          <Row label="Lesson" value="02 — Building the REST API" />
          <Row label="Entitlement" value="Verified" ok />
          <Row label="Watermark" value="Applied" ok />
          <Row label="Token expires" value="04:58" />
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: 'var(--hairline)' }}>
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>student@hrctech</span>
          <StampSeal />
        </div>
      </motion.div>

      {/* A second card peeking out behind, to suggest a stack of lessons rather than one static box */}
      <div
        className="absolute w-72 -translate-x-6 translate-y-3 rotate-3 rounded-md border opacity-40"
        style={{ borderColor: 'var(--hairline)', background: 'var(--panel)', height: '190px', zIndex: -1 }}
      />
    </div>
  );
}

function Row({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between border-b border-dotted pb-2" style={{ borderColor: 'var(--hairline)' }}>
      <span>{label}</span>
      <span style={{ color: ok ? 'var(--seal)' : 'var(--paper)' }}>{value}</span>
    </div>
  );
}

function StampSeal() {
  return (
    <motion.div
      initial={{ scale: 2.2, opacity: 0, rotate: -18 }}
      animate={{ scale: 1, opacity: 1, rotate: -18 }}
      transition={{ delay: 0.55, duration: 0.35, ease: 'backOut' }}
      className="flex h-8 w-8 items-center justify-center rounded-full border-2"
      style={{ borderColor: 'var(--seal)', color: 'var(--seal)' }}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
}