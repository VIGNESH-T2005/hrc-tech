import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function StudentDashboard() {
  const [courses, setCourses] = useState(null);

  useEffect(() => { api.get('/student/courses').then(({ data }) => setCourses(data)); }, []);

  if (!courses) return <p className="p-8">Loading…</p>;
  if (courses.length === 0) return <p className="p-8 text-slate-500">You haven't enrolled in any courses yet. <Link to="/courses" className="underline">Browse courses</Link>.</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">My Courses</h1>
      <div className="space-y-4">
        {courses.map(c => {
          const pct = c.lessonCount === 0 ? 0 : Math.round((c.completedLessons / c.lessonCount) * 100);
          return (
            <Link key={c.courseId} to={`/learn/${c.courseId}`} className="block rounded-lg border bg-white p-4 hover:shadow-md">
              <div className="flex justify-between">
                <h2 className="font-semibold">{c.title}</h2>
                <span className="text-sm text-slate-500">{c.completedLessons}/{c.lessonCount} lessons</span>
              </div>
              <div className="mt-2 h-2 rounded bg-slate-100">
                <div className="h-2 rounded bg-[var(--brand-teal)]" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}