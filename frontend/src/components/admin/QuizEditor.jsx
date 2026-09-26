import { useEffect, useState } from 'react';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';

const blankOption = () => ({ optionText: '', isCorrect: false });
const blankQuestion = () => ({ questionText: '', options: [blankOption(), blankOption()] });

export default function QuizEditor({ courseId }) {
  const [quiz, setQuiz] = useState({ title: '', passingScore: 70, questions: [blankQuestion()] });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/admin/courses/${courseId}/quiz`).then(({ data }) => setQuiz(data)).catch(() => {});
  }, [courseId]);

  const save = async () => {
    setError(''); setSaved(false);
    try {
      await api.put(`/admin/courses/${courseId}/quiz`, quiz);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const updateQuestion = (qi, patch) => {
    const questions = [...quiz.questions];
    questions[qi] = { ...questions[qi], ...patch };
    setQuiz({ ...quiz, questions });
  };
  const updateOption = (qi, oi, patch) => {
    const questions = [...quiz.questions];
    const options = [...questions[qi].options];
    options[oi] = { ...options[oi], ...patch };
    questions[qi] = { ...questions[qi], options };
    setQuiz({ ...quiz, questions });
  };
  const setCorrect = (qi, oi) => {
    const questions = [...quiz.questions];
    questions[qi] = { ...questions[qi], options: questions[qi].options.map((o, i) => ({ ...o, isCorrect: i === oi })) };
    setQuiz({ ...quiz, questions });
  };

  return (
    <div className="rounded border bg-white p-4">
      <h2 className="mb-3 font-semibold">Quiz</h2>
      <input placeholder="Quiz title" className="mb-2 w-full rounded border px-3 py-1.5"
        value={quiz.title} onChange={e => setQuiz({ ...quiz, title: e.target.value })} />
      <label className="mb-4 block text-sm">
        Passing score (%)
        <input type="number" min={1} max={100} className="ml-2 w-20 rounded border px-2 py-1"
          value={quiz.passingScore} onChange={e => setQuiz({ ...quiz, passingScore: Number(e.target.value) })} />
      </label>

      {quiz.questions.map((q, qi) => (
        <div key={qi} className="mb-3 rounded border p-3">
          <input placeholder={`Question ${qi + 1}`} className="mb-2 w-full rounded border px-2 py-1"
            value={q.questionText} onChange={e => updateQuestion(qi, { questionText: e.target.value })} />
          {q.options.map((o, oi) => (
            <div key={oi} className="mb-1 flex items-center gap-2">
              <input type="radio" name={`correct-${qi}`} checked={o.isCorrect} onChange={() => setCorrect(qi, oi)} />
              <input placeholder={`Option ${oi + 1}`} className="flex-1 rounded border px-2 py-1 text-sm"
                value={o.optionText} onChange={e => updateOption(qi, oi, { optionText: e.target.value })} />
            </div>
          ))}
          <button type="button" className="mt-1 text-xs text-[var(--brand-purple)]"
            onClick={() => updateQuestion(qi, { options: [...q.options, blankOption()] })}>
            + Add option
          </button>
        </div>
      ))}
      <button type="button" className="mb-3 text-sm text-[var(--brand-purple)]"
        onClick={() => setQuiz({ ...quiz, questions: [...quiz.questions, blankQuestion()] })}>
        + Add question
      </button>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="mb-2 text-sm text-[var(--brand-teal)]">Saved.</p>}
      <button onClick={save} className="block rounded bg-[var(--brand-orange)] px-4 py-2 text-white">Save Quiz</button>
    </div>
  );
}