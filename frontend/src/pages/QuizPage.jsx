import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { errorMessage } from '../services/errors';

export default function QuizPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/student/courses/${courseId}/quiz`)
      .then(({ data }) => setQuiz(data))
      .catch(err => setError(errorMessage(err, 'This quiz is not available yet.')));
  }, [courseId]);

  const submit = async () => {
    setSubmitting(true); setError('');
    const payload = { answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })) };
    try {
      const { data } = await api.post(`/student/courses/${courseId}/quiz/submit`, payload);
      setResult(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !quiz) return <p className="p-8 text-red-600">{error}</p>;
  if (!quiz) return <p className="p-8">Loading…</p>;

  if (result) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className={`text-2xl font-bold ${result.passed ? 'text-[var(--brand-teal)]' : 'text-red-600'}`}>
          {result.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
        </h1>
        <p className="mt-2 text-slate-600">Score: {result.score}% (needed {result.passingScore}%)</p>
        <p className="text-sm text-slate-400">{result.correctCount}/{result.totalQuestions} correct</p>
        <div className="mt-6 flex justify-center gap-3">
          {!result.passed && (
            <button onClick={() => { setResult(null); setAnswers({}); }} className="rounded bg-[var(--brand-teal)] px-4 py-2 text-white">
              Retry
            </button>
          )}
          <button onClick={() => navigate(`/learn/${courseId}`)} className="rounded border px-4 py-2">Back to course</button>
        </div>
      </div>
    );
  }

  const allAnswered = quiz.questions.every(q => answers[q.id]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">{quiz.title}</h1>
      {quiz.questions.map((q, i) => (
        <div key={q.id} className="mb-6 rounded border bg-white p-4">
          <p className="mb-3 font-medium">{i + 1}. {q.questionText}</p>
          <div className="space-y-2">
            {q.options.map(o => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input type="radio" name={q.id} checked={answers[q.id] === o.id}
                  onChange={() => setAnswers({ ...answers, [q.id]: o.id })} />
                {o.optionText}
              </label>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button disabled={!allAnswered || submitting} onClick={submit}
        className="rounded bg-[var(--brand-teal)] px-6 py-2 text-white disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Submit Quiz'}
      </button>
    </div>
  );
}