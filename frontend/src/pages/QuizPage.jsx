import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { errorMessage } from '../services/errors';
import GlowBackground from '../components/GlowBackground';

export default function QuizPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/student/courses/${courseId}/quiz`).then(({ data }) => setQuiz(data))
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

  if (error && !quiz) {
    return <div className="relative flex min-h-[60vh] items-center justify-center px-4"><GlowBackground /><p className="text-neutral-300">{error}</p></div>;
  }
  if (!quiz) {
    return (
      <div className="relative flex min-h-[60vh] items-center justify-center">
        <GlowBackground />
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="h-8 w-8 rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered = quiz.questions.every(q => answers[q.id]);
  const progressPct = Math.round((answeredCount / quiz.questions.length) * 100);

  return (
    <div className="relative mx-auto min-h-[calc(100vh-64px)] max-w-2xl px-4 py-12">
      <GlowBackground />
      <AnimatePresence mode="wait">
        {result ? (
          <ResultScreen key="result" result={result} onRetry={() => { setResult(null); setAnswers({}); }} onBack={() => navigate(`/learn/${courseId}`)} />
        ) : (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
                <span className="rounded-full bg-neutral-800/70 px-3 py-1 text-xs font-semibold text-neutral-400">{answeredCount}/{quiz.questions.length} answered</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.35 }} className="h-full rounded-full bg-white" />
              </div>
            </motion.div>

            {quiz.questions.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i, duration: 0.4 }}
                className="surface card-shadow mb-4 rounded-2xl p-5 transition hover:border-white/20">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">{i + 1}</span>
                  <p className="pt-0.5 font-medium text-white">{q.questionText}</p>
                </div>
                <div className="ml-10 space-y-2">
                  {q.options.map(o => {
                    const selected = answers[q.id] === o.id;
                    return (
                      <motion.label key={o.id} whileHover={{ x: 3 }}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition ${selected ? 'border-white bg-white/10 text-white' : 'border-neutral-800 text-neutral-300 hover:border-neutral-600'}`}>
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${selected ? 'border-white' : 'border-neutral-600'}`}>
                          {selected && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                        <input type="radio" name={q.id} checked={selected} onChange={() => setAnswers({ ...answers, [q.id]: o.id })} className="hidden" />
                        {o.optionText}
                      </motion.label>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {error && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-3 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-neutral-300">{error}</motion.p>}

            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * quiz.questions.length }}
              disabled={!allAnswered || submitting} onClick={submit} whileHover={allAnswered ? { scale: 1.015 } : {}} whileTap={allAnswered ? { scale: 0.985 } : {}}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-semibold text-black shadow-md transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40">
              {submitting ? 'Submitting…' : allAnswered ? 'Submit Quiz' : `Answer all questions to submit (${answeredCount}/${quiz.questions.length})`}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultScreen({ result, onRetry, onBack }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }}
      className="surface card-shadow flex flex-col items-center rounded-2xl px-8 py-14 text-center">
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900">
        {result.passed ? <CheckCircle2 size={40} className="text-white" /> : <XCircle size={40} className="text-neutral-400" />}
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold text-white">
        {result.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
      </motion.h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 flex items-center gap-8">
        <div><p className="text-3xl font-extrabold text-white"><CountUpNumber to={result.score} />%</p><p className="mt-1 text-xs text-neutral-500">Your score</p></div>
        <div className="h-10 w-px bg-neutral-800" />
        <div><p className="text-3xl font-extrabold text-neutral-500">{result.passingScore}%</p><p className="mt-1 text-xs text-neutral-500">Needed to pass</p></div>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-sm text-neutral-500">
        {result.correctCount} of {result.totalQuestions} answers correct
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 flex gap-3">
        {!result.passed && (
          <button onClick={onRetry} className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-md transition hover:bg-neutral-200">
            <RotateCcw size={15} /> Retry
          </button>
        )}
        <button onClick={onBack} className="flex items-center gap-2 rounded-full border border-neutral-700 px-5 py-2.5 text-sm text-neutral-300 transition hover:border-white">
          <ArrowLeft size={15} /> Back to course
        </button>
      </motion.div>
    </motion.div>
  );
}

function CountUpNumber({ to }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let frame;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.floor(progress * to));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to]);
  return value;
}