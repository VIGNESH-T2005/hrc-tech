import { useEffect, useState } from 'react';
import { useContentAccess } from '../hooks/useContentAccess';
import StudentWatermark from './StudentWatermark';

export default function SecurePdfViewer({ lessonId, onPageView }) {
  const { url, error } = useContentAccess(lessonId);
  const [reportedOnce, setReportedOnce] = useState(false);

  useEffect(() => {
    // A plain <iframe> can't report real page numbers without a JS PDF renderer (e.g. pdf.js),
    // which is a reasonable next iteration. For now, viewing marks the lesson progressed,
    // and the backend's own page-count check still gates real completion.
    if (url && !reportedOnce) { onPageView?.(1); setReportedOnce(true); }
  }, [url, reportedOnce, onPageView]);

  if (error) return <p className="rounded bg-red-50 p-4 text-red-600">{error}</p>;
  if (!url) return <div className="h-[600px] animate-pulse rounded bg-slate-200" />;

  return (
    <div className="relative overflow-hidden rounded border" onContextMenu={(e) => e.preventDefault()}>
      <iframe src={`${url}#toolbar=0`} title="Lesson PDF" className="h-[600px] w-full" />
      <StudentWatermark />
    </div>
  );
}