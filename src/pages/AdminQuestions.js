import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { apiQuestionsAdmin, apiCreateQuestion, apiUpdateQuestion, apiDeleteQuestion } from '../api/client';
import { getMcqQuestions, addMcqQuestion, updateMcqQuestion, deleteMcqQuestion } from '../utils/mockStore';
import '../styles/AdminQuestions.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function normalizeQuestion(q) {
  return { id: q.id, question: q.text || q.question, options: q.options || [], correctIndex: q.correctIndex ?? 0 };
}

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [useApi, setUseApi] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });

  const refresh = async () => {
    if (useApi) {
      try {
        const res = await apiQuestionsAdmin();
        setQuestions((res.questions || []).map(normalizeQuestion));
      } catch (_) {
        setUseApi(false);
        setQuestions(getMcqQuestions().map((q) => ({ ...q, question: q.question || q.text })));
      }
    } else {
      setQuestions(getMcqQuestions().map((q) => ({ ...q, question: q.question || q.text })));
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiQuestionsAdmin();
        if (!cancelled) {
          setQuestions((res.questions || []).map(normalizeQuestion));
          setUseApi(true);
        }
      } catch (_) {
        if (!cancelled) {
          setUseApi(false);
          setQuestions(getMcqQuestions().map((q) => ({ ...q, question: q.question || q.text })));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setForm({ question: '', options: ['', '', '', ''], correctIndex: 0 });
    setShowForm(true);
  };

  const handleEdit = (q) => {
    setEditingId(q.id);
    setForm({
      question: q.question,
      options: [...q.options],
      correctIndex: q.correctIndex,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const opts = form.options.filter((o) => o.trim());
    if (!form.question.trim() || opts.length < 2) return;
    const fourOpts = opts.length >= 4 ? opts.slice(0, 4) : [...opts, ...Array(4 - opts.length).fill('')];
    if (useApi) {
      try {
        if (editingId) {
          await apiUpdateQuestion(editingId, { text: form.question.trim(), options: fourOpts, correctIndex: form.correctIndex });
        } else {
          await apiCreateQuestion({ text: form.question.trim(), options: fourOpts, correctIndex: form.correctIndex });
        }
        await refresh();
      } catch (_) {
        if (editingId) updateMcqQuestion(editingId, form.question, fourOpts, form.correctIndex);
        else addMcqQuestion(form.question, fourOpts, form.correctIndex);
        await refresh();
      }
    } else {
      if (editingId) updateMcqQuestion(editingId, form.question, fourOpts, form.correctIndex);
      else addMcqQuestion(form.question, fourOpts, form.correctIndex);
      refresh();
    }
    setShowForm(false);
    setForm({ question: '', options: ['', '', '', ''], correctIndex: 0 });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    if (useApi) {
      try {
        await apiDeleteQuestion(id);
        await refresh();
      } catch (_) {
        deleteMcqQuestion(id);
        refresh();
      }
    } else {
      deleteMcqQuestion(id);
      refresh();
    }
    if (editingId === id) setShowForm(false);
  };

  const setOption = (index, value) => {
    setForm((prev) => {
      const opts = [...prev.options];
      opts[index] = value;
      return { ...prev, options: opts };
    });
  };

  const addOption = () => {
    setForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      correctIndex: prev.correctIndex >= index && prev.correctIndex > 0 ? prev.correctIndex - 1 : prev.correctIndex,
    }));
  };

  return (
    <AdminLayout activeStep={4} title="MCQ Manager" subtitle="Create, view and manage assessment questions.">
      <div className="admin-mcq-page">
        <div className="admin-url-bar">
          <div className="admin-url-dots"><span className="red" /><span className="yellow" /><span className="green" /></div>
          <span>prayas.in/admin/questions</span>
        </div>
        {loading && <p className="admin-loading">Loading…</p>}
        <div className="mcq-toolbar">
          <span className="mcq-count">{questions.length} active questions</span>
          <button type="button" className="btn btn-add-question" onClick={handleAdd}>+ Add Question</button>
        </div>
        {showForm && (
          <div className="question-form-card card">
            <h4 className="question-form-title">+ New Question</h4>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Question Text</label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Which amendment lowered the voting age to 18 in India?"
                  required
                />
              </div>
              <div className="form-group">
                <label>Options (select the correct answer)</label>
                {form.options.map((opt, i) => (
                  <div key={i} className={`option-row ${form.correctIndex === i ? 'correct' : ''}`}>
                    <input
                      type="radio"
                      name="correct"
                      checked={form.correctIndex === i}
                      onChange={() => setForm((p) => ({ ...p, correctIndex: i }))}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => setOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeOption(i)} disabled={form.options.length <= 2}>Remove</button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addOption}>+ Add option</button>
              </div>
              <button type="submit" className="btn btn-save-question">Save Question</button>
            </form>
          </div>
        )}
        <ul className="questions-list">
          {questions.map((q, qIdx) => (
            <li key={q.id} className="question-item card">
              <div className="question-item-header">
                <span className="question-id">Q {String(qIdx + 1).padStart(2, '0')}</span>
                <div className="question-item-actions">
                  <button type="button" className="btn btn-edit" onClick={() => handleEdit(q)}>Edit</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>Delete</button>
                </div>
              </div>
              <p className="question-text">{q.question}</p>
              <div className="options-grid">
                {q.options.map((opt, i) => (
                  <span key={i} className={`option-chip ${i === q.correctIndex ? 'correct' : ''}`}>
                    {OPTION_LETTERS[i] || i + 1} {opt} {i === q.correctIndex && '✓'}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
        {questions.length === 0 && !showForm && (
          <div className="empty-msg-block">
            <p className="empty-msg">No questions yet. Click &quot;+ Add Question&quot; to create one.</p>
            {useApi && (
              <p className="empty-msg-hint">Questions are in-memory and clear on server restart.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
