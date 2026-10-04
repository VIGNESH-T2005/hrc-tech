import { useEffect, useState } from 'react';
import { useContentAccess } from '../hooks/useContentAccess';
import StudentWatermark from './StudentWatermark';

export default function SecurePdfViewer({ lessonId, onPageView }) {
  const { url, error } = useContentAccess(lessonId);
  const [reportedOnce, setReportedOnce] = useState(false);

  useEffect(() => {
    if (url && !reportedOnce) { onPageView?.(1); setReportedOnce(true); }
  }, [url, reportedOnce, onPageView]);

  if (error) return <p className="rounded-xl bg-neutral-900 p-4 text-sm text-neutral-300">{error}</p>;
  if (!url) return <div className="h-[600px] animate-pulse rounded-xl bg-neutral-800" />;

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-800" onContextMenu={(e) => e.preventDefault()}>
      <iframe src={`${url}#toolbar=0`} title="Lesson PDF" className="h-[600px] w-full" />
      <StudentWatermark />
    </div>
  );
}