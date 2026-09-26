import { useEffect, useRef } from 'react';
import { useContentAccess } from '../hooks/useContentAccess';
import StudentWatermark from './StudentWatermark';

// onProgress: called periodically while playing (parent should throttle this).
// onMilestone: called immediately, un-throttled, on pause and on end — this is what
// actually guarantees a lesson gets marked complete right when the student finishes it.
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
    const onEnded = () => onMilestone?.(Math.floor(video.duration || video.currentTime));
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

  if (error) return <p className="rounded-xl bg-red-950/40 p-4 text-sm text-red-400">{error}</p>;
  if (!url) return <div className="aspect-video animate-pulse rounded-xl bg-slate-800" />;

  return (
    <div className="relative overflow-hidden rounded-xl bg-black" onContextMenu={(e) => e.preventDefault()}>
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