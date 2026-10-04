import { useEffect, useRef } from 'react';
import { useContentAccess } from '../hooks/useContentAccess';
import StudentWatermark from './StudentWatermark';

export default function SecureVideoPlayer({ lessonId, resumeAt = 0, onProgress, onMilestone }) {
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
    const onPause = () => onMilestone?.(Math.floor(video.currentTime));
    const onEnded = () => onMilestone?.(Math.ceil(video.duration || video.currentTime) + 5);
    const onVisibility = () => { if (document.hidden) video.pause(); };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [resumeAt, onProgress, onMilestone]);

  if (error) return <p className="rounded-xl bg-neutral-900 p-4 text-sm text-neutral-300">{error}</p>;
  if (!url) return <div className="aspect-video animate-pulse rounded-xl bg-neutral-800" />;

  return (
    <div className="relative overflow-hidden rounded-xl bg-black" onContextMenu={(e) => e.preventDefault()}>
      <video ref={videoRef} src={url} controls controlsList="nodownload" className="aspect-video w-full" />
      <StudentWatermark />
    </div>
  );
}