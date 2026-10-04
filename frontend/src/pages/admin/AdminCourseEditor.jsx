import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, Loader2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';
import QuizEditor from '../../components/admin/QuizEditor';
import GlowBackground from '../../components/GlowBackground';

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
    await api.post(`/admin/lessons/${lessonId}/upload`, fd);
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
      await api.post(`/admin/courses/${id}/thumbnail`, fd);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setThumbUploading(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  const removeLesson = async (lessonId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setError('');
    try {
      await api.delete(`/admin/lessons/${lessonId}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!course) return <p className="p-8 text-center text-neutral-400">Loading…</p>;

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-12">
      <GlowBackground />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-white">{course.title}</h1>
        <button onClick={togglePublish}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${course.isPublished ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200'}`}>
          {course.isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </motion.div>
      {error && <p className="mb-4 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-neutral-300">{error}</p>}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="surface card-shadow mb-8 flex flex-col items-start gap-4 rounded-2xl p-5 transition hover:border-white/20 sm:flex-row sm:items-center">
        <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-800">
          {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={24} className="text-neutral-600" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Course thumbnail</p>
          <p className="mt-0.5 text-xs text-neutral-500">JPEG or PNG, shown on the course grid and details page.</p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 transition hover:border-white hover:text-white">
            {thumbUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {thumbUploading ? 'Uploading…' : course.thumbnailUrl ? 'Change thumbnail' : 'Upload thumbnail'}
            <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={e => changeThumbnail(e.target.files[0])} />
          </label>
        </div>
      </motion.div>

      <h2 className="mb-3 font-semibold text-white">Lessons</h2>
      <ul className="mb-4 space-y-2">
        {lessons.map((l, i) => (
          <motion.li key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="surface card-shadow rounded-xl p-4 transition hover:border-white/20">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-200">{l.order}. {l.title} <span className="text-xs font-normal text-neutral-500">({l.contentType})</span></span>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={l.processingStatus} />
                <button onClick={() => removeLesson(l.id, l.title)} title="Delete lesson" className="rounded-full p-1.5 text-neutral-500 transition hover:bg-neutral-800 hover:text-white">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {l.processingStage && <p className="mt-1 text-xs text-neutral-400">{l.processingStage}…</p>}
            {l.processingError && <p className="mt-1 text-xs text-neutral-400">{l.processingError}</p>}
            {(l.processingStatus === 'NoContent' || l.processingStatus === 'Failed') && (
              <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-400 transition hover:border-white hover:text-white">
                <Upload size={13} /> Choose {l.contentType === 'Video' ? 'video' : 'PDF'} file
                <input type="file" className="hidden" onChange={e => e.target.files[0] && upload(l.id, e.target.files[0])} />
              </label>
            )}
          </motion.li>
        ))}
      </ul>

      <motion.form onSubmit={addLesson} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface card-shadow mb-8 flex flex-wrap gap-2 rounded-2xl p-4">
        <input required placeholder="Lesson title" className="flex-1 rounded-xl border border-neutral-700 bg-black px-3.5 py-2 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white"
          value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} />
        <select className="rounded-xl border border-neutral-700 bg-black px-3 py-2 text-sm text-white" value={newLesson.contentType} onChange={e => setNewLesson({ ...newLesson, contentType: e.target.value })}>
          <option value="Video">Video</option>
          <option value="Pdf">PDF</option>
        </select>
        <button className="rounded-xl bg-white px-5 font-semibold text-black transition hover:-translate-y-0.5 hover:bg-neutral-200">Add</button>
      </motion.form>

      <QuizEditor courseId={id} />
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    NoContent: 'bg-neutral-800 text-neutral-400',
    Queued: 'bg-neutral-800 text-neutral-300',
    Processing: 'bg-neutral-800 text-neutral-300',
    Ready: 'bg-white text-black',
    Failed: 'bg-neutral-900 text-neutral-400',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] ?? ''}`}>{status}</span>;
}