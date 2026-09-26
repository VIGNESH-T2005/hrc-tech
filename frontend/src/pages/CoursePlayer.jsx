import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import SecurePdfViewer from '../components/SecurePdfViewer';

export default function CoursePlayer() {
  const { courseId } = useParams();
  const [progress, setProgress] = useState(null);
  const [course, setCourse] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const activeIdRef = useRef(null);
  activeIdRef.current = activeId;

  const load = useCallback(() => {
    api.get(`/student/courses/${courseId}/progress`).then(({ data }) => {
      setProgress(data);
      setActiveId((cur) => cur ?? data.lessons[0]?.lessonId ?? null);
    });
  }, [courseId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get(`/courses/${courseId}`).then(({ data }) => setCourse(data)); }, [courseId]);

  const active = progress?.lessons.find(l => l.lessonId === activeId);

  // Periodic save while playing — throttled, not debounced, so it actually fires during continuous playback.
  const reportVideoProgress = useCallback(
    throttle((seconds) => {
      api.post(`/student/lessons/${activeIdRef.current}/progress`, { positionSeconds: seconds }).then(load);
    }, 4000),
    [load]
  );

  // Un-throttled — fires the instant the student pauses or finishes the video, which is
  // what actually needs to land immediately for completion to register.
  const reportVideoMilestone = useCallback((seconds) => {
    api.post(`/student/lessons/${activeIdRef.current}/progress`, { positionSeconds: seconds }).then(load);
  }, [load]);

  const reportPdfProgress = (page) => {
    api.post(`/student/lessons/${activeId}/progress`, { pdfPageReached: page }).then(load);
  };

  if (!progress || !course) return <p className="p-8 text-center text-slate-400">Loading…</p>;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="mb-4 text-xl font-bold text-slate-100">{course.title}</h1>
        {active?.contentType === 'Video' && (
          <SecureVideoPlayer
            key={activeId}
            lessonId={activeId}
            resumeAt={active.lastPositionSeconds ?? 0}
            onProgress={reportVideoProgress}
            onMilestone={reportVideoMilestone}
          />
        )}
        {active?.contentType === 'Pdf' && (
          <SecurePdfViewer lessonId={activeId} onPageView={reportPdfProgress} />
        )}
      </div>

      <aside className="surface card-shadow h-fit rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-100">Lessons</p>
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
            {progress.completedLessons}/{progress.totalLessons}
          </span>
        </div>
        <ul className="space-y-1.5">
          {progress.lessons.map((l) => (
            <li key={l.lessonId}>
              <button
                onClick={() => setActiveId(l.lessonId)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  l.lessonId === activeId ? 'gradient-gold text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  l.isCompleted ? 'bg-emerald-400 text-slate-950' : l.lessonId === activeId ? 'bg-black/20' : 'bg-slate-700 text-slate-400'
                }`}>
                  {l.isCompleted ? '✓' : l.order}
                </span>
                <span className="truncate">{l.title}</span>
              </button>
            </li>
          ))}
        </ul>

        {progress.hasQuiz && (
          progress.quizUnlocked ? (
            <Link to={`/learn/${courseId}/quiz`} className="mt-5 block rounded-xl bg-amber-400 px-3 py-2.5 text-center text-sm font-semibold text-slate-950 shadow-md transition hover:bg-amber-300">
              {progress.quizPassed ? 'Review Quiz (Passed)' : 'Take the Quiz'}
            </Link>
          ) : (
            <p className="mt-5 rounded-xl bg-slate-800/60 px-3 py-2.5 text-center text-xs text-slate-500">
              Complete all lessons to unlock the quiz
            </p>
          )
        )}

        {progress.courseCompleted && (
          <p className="mt-3 rounded-xl bg-emerald-950/40 px-3 py-2.5 text-center text-sm font-semibold text-emerald-400">
            🎉 Course Completed
          </p>
        )}
      </aside>
    </div>
  );
}

// Fires immediately on first call, then at most once every `ms` while calls keep coming,
// and always fires once more with the final value once calls stop (trailing edge).
function throttle(fn, ms) {
  let last = 0;
  let timer;
  return (...args) => {
    const now = Date.now();
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      last = now;
      fn(...args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => { last = Date.now(); fn(...args); }, remaining);
    }
  };
}