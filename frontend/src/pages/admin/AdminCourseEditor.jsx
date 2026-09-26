import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';
import QuizEditor from '../../components/admin/QuizEditor';

export default function AdminCourseEditor() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState('');
  const [newLesson, setNewLesson] = useState({ title: '', contentType: 'Video' });
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbInputRef = useRef(null);

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
    await api.post(`/admin/lessons/${lessonId}/upload`, fd);   // no manual Content-Type header
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

  const changeThumbnail = async (file) => {
    if (!file) return;
    setThumbUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/admin/courses/${id}/thumbnail`, fd);   // no manual Content-Type header
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setThumbUploading(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  if (!course) return <p className="p-8 text-center text-slate-400">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-100">{course.title}</h1>
        <button onClick={togglePublish}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            course.isPublished ? 'bg-red-950/50 text-red-400 hover:bg-red-950' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
          }`}>
          {course.isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">{error}</p>}

      {/* Thumbnail */}
      <div className="surface card-shadow mb-8 flex flex-col items-start gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
          {course.thumbnailUrl
            ? <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            : <ImageIcon size={24} className="text-slate-600" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-100">Course thumbnail</p>
          <p className="mt-0.5 text-xs text-slate-500">JPEG or PNG, shown on the course grid and details page.</p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-amber-400 transition hover:border-amber-500">
            {thumbUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {thumbUploading ? 'Uploading…' : course.thumbnailUrl ? 'Change thumbnail' : 'Upload thumbnail'}
            <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png" className="hidden"
              onChange={e => changeThumbnail(e.target.files[0])} />
          </label>
        </div>
      </div>

      {/* Lessons */}
      <h2 className="mb-3 font-semibold text-slate-100">Lessons</h2>
      <ul className="mb-4 space-y-2">
        {lessons.map((l, i) => (
          <motion.li key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="surface card-shadow rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">{l.order}. {l.title} <span className="text-xs font-normal text-slate-500">({l.contentType})</span></span>
              <StatusBadge status={l.processingStatus} />
            </div>
            {l.processingStage && <p className="mt-1 text-xs text-amber-400">{l.processingStage}…</p>}
            {l.processingError && <p className="mt-1 text-xs text-red-400">{l.processingError}</p>}
            {(l.processingStatus === 'NoContent' || l.processingStatus === 'Failed') && (
              <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-amber-500 hover:text-amber-400">
                <Upload size={13} /> Choose {l.contentType === 'Video' ? 'video' : 'PDF'} file
                <input type="file" className="hidden" onChange={e => e.target.files[0] && upload(l.id, e.target.files[0])} />
              </label>
            )}
          </motion.li>
        ))}
      </ul>

      <form onSubmit={addLesson} className="surface card-shadow mb-8 flex flex-wrap gap-2 rounded-2xl p-4">
        <input required placeholder="Lesson title"
          className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
          value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} />
        <select className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-slate-100"
          value={newLesson.contentType} onChange={e => setNewLesson({ ...newLesson, contentType: e.target.value })}>
          <option value="Video">Video</option>
          <option value="Pdf">PDF</option>
        </select>
        <button className="rounded-xl bg-amber-400 px-5 font-semibold text-slate-950 transition hover:bg-amber-300">Add</button>
      </form>

      <QuizEditor courseId={id} />
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    NoContent: 'bg-slate-800 text-slate-400',
    Queued: 'bg-amber-950/50 text-amber-400',
    Processing: 'bg-amber-950/50 text-amber-400',
    Ready: 'bg-emerald-950/50 text-emerald-400',
    Failed: 'bg-red-950/50 text-red-400',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] ?? ''}`}>{status}</span>;
}