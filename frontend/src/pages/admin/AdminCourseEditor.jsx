import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';
import QuizEditor from '../../components/admin/QuizEditor';

export default function AdminCourseEditor() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState('');
  const [newLesson, setNewLesson] = useState({ title: '', contentType: 'Video' });

  const load = () => {
    api.get(`/admin/courses/${id}`).then(({ data }) => setCourse(data));
    api.get(`/admin/courses/${id}/lessons`).then(({ data }) => setLessons(data));
  };
  useEffect(() => { load(); }, [id]);

  const addLesson = async (e) => {
    e.preventDefault();
    await api.post(`/admin/courses/${id}/lessons`, newLesson);
    setNewLesson({ title: '', contentType: 'Video' });
    load();
  };

  const upload = async (lessonId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    await api.post(`/admin/lessons/${lessonId}/upload`, fd);   // no Content-Type header — the browser adds the boundary itself
    load();
    pollStatus(lessonId);
  };

  const pollStatus = (lessonId) => {
    const t = setInterval(async () => {
      const { data } = await api.get(`/admin/lessons/${lessonId}/status`);
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, processingStatus: data.status, processingStage: data.stage, processingError: data.error } : l));
      if (data.status === 'Ready' || data.status === 'Failed') clearInterval(t);
    }, 3000);
  };

  const togglePublish = async () => {
    setError('');
    try {
      await api.post(`/admin/courses/${id}/${course.isPublished ? 'unpublish' : 'publish'}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!course) return <p className="p-8">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <button onClick={togglePublish} className={`rounded px-4 py-2 text-white ${course.isPublished ? 'bg-red-600' : 'bg-[var(--brand-teal)]'}`}>
          {course.isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <h2 className="mb-2 font-semibold">Lessons</h2>
      <ul className="mb-4 space-y-2">
        {lessons.map(l => (
            <li key={l.id} className="card-shadow rounded-xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-800">{l.order}. {l.title} <span className="text-xs font-normal text-slate-400">({l.contentType})</span></span>
              <StatusBadge status={l.processingStatus} />
            </div>
            {l.processingStage && <p className="mt-1 text-xs text-[var(--brand-purple)]">{l.processingStage}…</p>}
            {l.processingError && <p className="mt-1 text-xs text-red-600">{l.processingError}</p>}
            {(l.processingStatus === 'NoContent' || l.processingStatus === 'Failed') && (
              <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-[var(--brand-purple)] hover:text-[var(--brand-purple)]">
                📤 Choose {l.contentType === 'Video' ? 'video' : 'PDF'} file
                <input type="file" className="hidden" onChange={e => e.target.files[0] && upload(l.id, e.target.files[0])} />
              </label>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={addLesson} className="mb-8 flex gap-2 rounded border bg-white p-3">
        <input required placeholder="Lesson title" className="flex-1 rounded border px-3 py-1.5" value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} />
        <select className="rounded border px-2" value={newLesson.contentType} onChange={e => setNewLesson({ ...newLesson, contentType: e.target.value })}>
          <option value="Video">Video</option>
          <option value="Pdf">PDF</option>
        </select>
        <button className="rounded bg-[var(--brand-purple)] px-4 text-white">Add</button>
      </form>

      <QuizEditor courseId={id} />
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    NoContent: 'bg-slate-100 text-slate-500',
    Queued: 'bg-amber-100 text-amber-700',
    Processing: 'bg-amber-100 text-amber-700',
    Ready: 'bg-emerald-100 text-emerald-700',
    Failed: 'bg-red-100 text-red-700',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] ?? ''}`}>{status}</span>;
}