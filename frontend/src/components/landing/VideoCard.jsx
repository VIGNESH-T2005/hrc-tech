import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function VideoCard({ videoId, title, duration, index }) {
  const [broken, setBroken] = useState(false);
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <motion.a
      href={url} target="_blank" rel="noreferrer"
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.08 }} whileHover={{ y: -6 }}
      className="group relative block overflow-hidden rounded-2xl border border-neutral-800 bg-[var(--bg-surface)] shadow-lg transition-colors hover:border-white/40"
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-900">
        {!broken && (
          <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt={title} onError={() => setBroken(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
        )}
        {broken && <div className="flex h-full items-center justify-center text-neutral-600"><Play size={36} /></div>}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} whileHover={{ scale: 1, opacity: 1 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-lg transition group-hover:opacity-100">
            <Play size={18} fill="currentColor" />
          </motion.div>
        </div>
        {duration && <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">{duration}</span>}
      </div>
      <div className="p-3.5">
        <p className="line-clamp-2 text-sm font-medium text-neutral-200">{title}</p>
        <p className="mt-1 text-xs text-neutral-500">@hrctechinsights</p>
      </div>
    </motion.a>
  );
}