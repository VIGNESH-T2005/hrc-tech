import { useEffect, useState } from 'react';
import { Plus, Save, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { errorMessage } from '../../services/errors';

const blankOption = () => ({ optionText: '', isCorrect: false });
const blankQuestion = () => ({ questionText: '', options: [blankOption(), blankOption()] });

export default function QuizEditor({ courseId }) {
  const [quiz, setQuiz] = useState({ title: '', passingScore: 70, questions: [blankQuestion()] });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/admin/courses/${courseId}/quiz`).then(({ data }) => setQuiz(data)).catch(() => {});
  }, [courseId]);

  const save = async () => {
    setError(''); setSaved(false); setSaving(true);
    try {
      await api.put(`/admin/courses/${courseId}/quiz`, quiz);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
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
    <div className="surface card-shadow rounded-2xl p-5">
      <h2 className="mb-4 font-semibold text-slate-100">Quiz</h2>
      <input placeholder="Quiz title"
        className="mb-3 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
        value={quiz.title} onChange={e => setQuiz({ ...quiz, title: e.target.value })} />
      <label className="mb-5 block text-sm text-slate-400">
        Passing score (%)
        <input type="number" min={1} max={100}
          className="ml-2 w-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-slate-100"
          value={quiz.passingScore} onChange={e => setQuiz({ ...quiz, passingScore: Number(e.target.value) })} />
      </label>

      {quiz.questions.map((q, qi) => (
        <div key={qi} className="mb-3 rounded-xl border border-[var(--border-subtle)] p-4">
          <input placeholder={`Question ${qi + 1}`}
            className="mb-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
            value={q.questionText} onChange={e => updateQuestion(qi, { questionText: e.target.value })} />
          {q.options.map((o, oi) => (
            <div key={oi} className="mb-1.5 flex items-center gap-2">
              <input type="radio" name={`correct-${qi}`} checked={o.isCorrect} onChange={() => setCorrect(qi, oi)}
                className="accent-amber-400" />
              <input placeholder={`Option ${oi + 1}`}
                className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
                value={o.optionText} onChange={e => updateOption(qi, oi, { optionText: e.target.value })} />
            </div>
          ))}
          <button type="button" className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-400"
            onClick={() => updateQuestion(qi, { options: [...q.options, blankOption()] })}>
            <Plus size={12} /> Add option
          </button>
        </div>
      ))}
      <button type="button" className="mb-4 flex items-center gap-1 text-sm font-medium text-amber-400"
        onClick={() => setQuiz({ ...quiz, questions: [...quiz.questions, blankQuestion()] })}>
        <Plus size={14} /> Add question
      </button>

      {error && <p className="mb-3 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">{error}</p>}
      {saved && <p className="mb-3 flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle2 size={14} /> Saved.</p>}
      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60">
        <Save size={15} /> {saving ? 'Saving…' : 'Save Quiz'}
      </button>
    </div>
  );
}