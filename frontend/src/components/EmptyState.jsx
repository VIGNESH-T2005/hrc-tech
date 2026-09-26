import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center"
    >
      <div className="gradient-brand mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg shadow-purple-900/15">
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      {action}
    </motion.div>
  );
}