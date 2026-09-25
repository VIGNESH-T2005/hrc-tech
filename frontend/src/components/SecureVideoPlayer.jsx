import { useEffect, useRef } from 'react';
import { useContentAccess } from '../hooks/useContentAccess';
import StudentWatermark from './StudentWatermark';

export default function SecureVideoPlayer({ lessonId, resumeAt = 0, onProgress }) {
  const { url, error } = useContentAccess(lessonId);
  const videoRef = useRef(null);
  const resumedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      if (!resumedRef.current && resumeAt > 0) {
        video.currentTime = resumeAt;
        resumedRef.current = true;
      }
    };
    const onTimeUpdate = () => onProgress?.(Math.floor(video.currentTime));
    const onVisibility = () => { if (document.hidden) video.pause(); };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTimeUpdate);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTimeUpdate);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [resumeAt, onProgress]);

  if (error) return <p className="rounded bg-red-50 p-4 text-red-600">{error}</p>;
  if (!url) return <div className="aspect-video animate-pulse rounded bg-slate-200" />;

  return (
    <div className="relative overflow-hidden rounded bg-black" onContextMenu={(e) => e.preventDefault()}>
      <video
        ref={videoRef}
        src={url}
        controls
        controlsList="nodownload"
        className="aspect-video w-full"
      />
      <StudentWatermark />
    </div>
  );
}