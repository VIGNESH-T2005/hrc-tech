import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import SecurePdfViewer from '../components/SecurePdfViewer';

export default function CoursePlayer() {
  const { courseId } = useParams();
  const [progress, setProgress] = useState(null);
  const [course, setCourse] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const load = useCallback(() => {
    api.get(`/student/courses/${courseId}/progress`).then(({ data }) => {
      setProgress(data);
      setActiveId((cur) => cur ?? data.lessons[0]?.lessonId ?? null);
    });
  }, [courseId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get(`/courses/${courseId}`).then(({ data }) => setCourse(data)); }, [courseId]);

  const active = progress?.lessons.find(l => l.lessonId === activeId);

  const reportVideoProgress = useCallback(
    debounce((seconds) => {
      api.post(`/student/lessons/${activeId}/progress`, { positionSeconds: seconds }).then(load);
    }, 4000),
    [activeId]
  );
  const reportPdfProgress = (page) => {
    api.post(`/student/lessons/${activeId}/progress`, { pdfPageReached: page }).then(load);
  };

  if (!progress || !course) return <p className="p-8">Loading…</p>;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="mb-4 text-xl font-bold">{course.title}</h1>
        {active?.contentType === 'Video' && (
          <SecureVideoPlayer lessonId={activeId} onProgress={reportVideoProgress} />
        )}
        {active?.contentType === 'Pdf' && (
          <SecurePdfViewer lessonId={activeId} onPageView={reportPdfProgress} />
        )}
      </div>

            <aside className="card-shadow h-fit rounded-2xl border border-slate-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">Lessons</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {progress.completedLessons}/{progress.totalLessons}
          </span>
        </div>
        <ul className="space-y-1.5">
          {progress.lessons.map((l) => (
            <li key={l.lessonId}>
              <button
                onClick={() => setActiveId(l.lessonId)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  l.lessonId === activeId ? 'gradient-brand text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  l.isCompleted ? 'bg-emerald-400 text-white' : l.lessonId === activeId ? 'bg-white/25' : 'bg-slate-200 text-slate-500'
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
            <Link to={`/learn/${courseId}/quiz`} className="mt-5 block rounded-xl bg-[var(--brand-orange)] px-3 py-2.5 text-center text-sm font-semibold text-white shadow-md transition hover:opacity-90">
              {progress.quizPassed ? 'Review Quiz (Passed)' : 'Take the Quiz'}
            </Link>
          ) : (
            <p className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 text-center text-xs text-slate-400">
              Complete all lessons to unlock the quiz
            </p>
          )
        )}

        {progress.courseCompleted && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-sm font-semibold text-emerald-700">
            🎉 Course Completed
          </p>
        )}
      </aside>
    </div>
  );
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}