import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: 'var(--hairline)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-4 text-left"
        style={{ color: 'var(--paper)' }}
      >
        <span className="pr-6 text-sm font-medium">{question}</span>
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition-transform"
          style={{ borderColor: 'var(--hairline)', color: 'var(--muted)', transform: open ? 'rotate(45deg)' : 'none' }}
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-4 pr-8 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}