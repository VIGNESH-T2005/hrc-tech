import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [courses, setCourses] = useState(null);

  useEffect(() => { api.get('/admin/courses').then(({ data }) => setCourses(data)); }, []);
  if (!courses) return <p className="p-8">Loading…</p>;

  const published = courses.filter(c => c.isPublished).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        <Stat label="Total courses" value={courses.length} />
        <Stat label="Published" value={published} />
        <Stat label="Drafts" value={courses.length - published} />
      </div>
      <Link to="/admin/courses" className="rounded bg-[var(--brand-purple)] px-4 py-2 text-white">Manage Courses</Link>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="rounded border bg-white p-4"><p className="text-2xl font-bold">{value}</p><p className="text-xs text-slate-500">{label}</p></div>;
}