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

      <aside className="rounded border bg-white p-4">
        <p className="mb-3 text-sm font-semibold">{progress.completedLessons}/{progress.totalLessons} lessons complete</p>
        <ul className="space-y-1">
          {progress.lessons.map((l) => (
            <li key={l.lessonId}>
              <button
                onClick={() => setActiveId(l.lessonId)}
                className={`w-full rounded px-2 py-1.5 text-left text-sm ${l.lessonId === activeId ? 'bg-[var(--brand-teal)] text-white' : 'hover:bg-slate-100'}`}
              >
                {l.isCompleted ? '✅' : '▶'} {l.order}. {l.title}
              </button>
            </li>
          ))}
        </ul>

        {progress.hasQuiz && (
          progress.quizUnlocked ? (
            <Link to={`/learn/${courseId}/quiz`} className="mt-4 block rounded bg-[var(--brand-orange)] px-3 py-2 text-center text-sm text-white">
              {progress.quizPassed ? 'Review Quiz (Passed)' : 'Take the Quiz'}
            </Link>
          ) : (
            <p className="mt-4 rounded bg-slate-100 px-3 py-2 text-center text-xs text-slate-500">
              Complete all lessons to unlock the quiz
            </p>
          )
        )}

        {progress.courseCompleted && (
          <p className="mt-3 text-center text-sm font-semibold text-[var(--brand-teal)]">🎉 Course Completed</p>
        )}
      </aside>
    </div>
  );
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}