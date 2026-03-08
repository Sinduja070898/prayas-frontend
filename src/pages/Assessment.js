import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CandidateLayout from '../components/CandidateLayout';
import { apiApplicationsMe, apiAssessmentsStart, apiAssessmentsSubmit } from '../api/client';
import { getMcqQuestions, getApplicationByCandidateId } from '../utils/mockStore';
import { hasAttemptedAssessment, saveAssessmentResult } from '../utils/mockStore';
import { updateApplicationStatus } from '../utils/mockStore';
import { APPLICATION_STATUS } from '../utils/constants';
import '../styles/Assessment.css';

const TOTAL_MINUTES = 30;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Assessment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [apiEligible, setApiEligible] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applicationFromApi, setApplicationFromApi] = useState(null);
  const application = applicationFromApi ?? getApplicationByCandidateId(user?.id);
  const status = application?.status;
  const isShortlisted = status === APPLICATION_STATUS.SHORTLISTED || status === APPLICATION_STATUS.ASSESSMENT_PENDING || status === 'Shortlisted' || status === 'Assessment Pending';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const app = await apiApplicationsMe();
        if (!cancelled && app) setApplicationFromApi(app);
      } catch (_) {
        if (!cancelled) setApplicationFromApi(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiAssessmentsStart();
        if (!cancelled) {
          const qList = (res.questions || []).map((q) => ({ id: q.id, question: q.text, options: q.options || [] }));
          setQuestions(qList);
          setApiEligible(true);
        }
      } catch (err) {
        if (!cancelled) {
          setApiEligible(false);
          if (err.message && err.message.includes('already')) setAttempted(true);
          else setQuestions(getMcqQuestions().map((q) => ({ id: q.id, question: q.question, options: q.options || [] })));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          if (!attempted) setAttempted(hasAttemptedAssessment(user?.id));
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on user id; attempted is set inside effect
  }, [user?.id]);

  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_MINUTES * 60);
  const [submitted, setSubmitted] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (questions.length > 0 && answers.length !== questions.length) setAnswers(Array(questions.length).fill(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only init answers when question set changes, not when answers change
  }, [questions.length]);

  const submitAssessment = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    const timeTakenSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      await apiAssessmentsSubmit({ answers, timeTakenSeconds });
    } catch (_) { }
    saveAssessmentResult(user.id, user.name, answers, questions, timeTakenSeconds);
    updateApplicationStatus(user.id, APPLICATION_STATUS.ASSESSMENT_SUBMITTED);
    navigate('/assessment/confirmation', { replace: true });
  }, [user?.id, user?.name, answers, questions, submitted, navigate]);

  useEffect(() => {
    if (attempted || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [attempted, questions.length, submitAssessment]);

  const handleOptionSelect = (qIndex, optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  };

  const answeredCount = answers.filter((a) => a !== null).length;
  const remainingCount = questions.length - answeredCount;

  const layoutContent = (content) => (
    <CandidateLayout activeStep={4} title="MCQ Assessment" subtitle="Timed test • 30 min • auto-submit">
      <div className="candidate-url-bar">
        <div className="candidate-url-dots"><span className="red" /><span className="yellow" /><span className="green" /></div>
        <span>prayas.in/assessment</span>
      </div>
      {content}
    </CandidateLayout>
  );

  if (loading) {
    return layoutContent(<div className="assessment-blocked card"><p>Loading…</p></div>);
  }

  const notEligible = questions.length === 0 || (apiEligible === false && !isShortlisted);
  const serverMissingApplication = applicationFromApi === null && !loading;
  if (notEligible && !attempted) {
    return layoutContent(
      <div className="assessment-blocked card">
        <h3>Assessment not available</h3>
        <p>Only shortlisted candidates can take the assessment. Complete your application and wait for shortlisting.</p>
        {serverMissingApplication && (
          <p className="assessment-blocked-hint">
            Can’t find your application. <Link to="/application">Submit again</Link> and ask admin to shortlist you.
          </p>
        )}
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Dashboard</Link>
      </div>
    );
  }

  if (attempted) {
    return layoutContent(
      <div className="assessment-blocked card">
        <h3>Assessment already attempted</h3>
        <p>You can only attempt this assessment once. Your submission has been recorded.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return layoutContent(
      <div className="assessment-blocked card">
        <h3>No questions available</h3>
        <p>The admin has not added any MCQ questions yet. Please try again later.</p>
      </div>
    );
  }

  if (submitted) {
    return layoutContent(<div className="assessment-submitting card">Submitting...</div>);
  }

  const q = questions[currentIndex];
  const optionLabels = ['A', 'B', 'C', 'D'];
  const qText = q.question || q.text;
  const qOptions = q.options || [];

  return (
    <CandidateLayout activeStep={4} title="MCQ Assessment" subtitle="Timed test • 30 min • auto-submit">
      <div className="candidate-url-bar">
        <div className="candidate-url-dots"><span className="red" /><span className="yellow" /><span className="green" /></div>
        <span>prayas.in/assessment</span>
      </div>
      <div className="assessment-page">
        <div className="assessment-top card">
          <h2 className="assessment-title">Prayas — Fellowship Assessment</h2>
          <div className="assessment-top-right">
            <span className="assessment-progress-text">Question {currentIndex + 1} of {questions.length}</span>
            <div className={`timer-pill ${timeLeft <= 300 ? 'pulse' : ''}`} data-urgent={timeLeft <= 300}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        <div className="assessment-body">
          <div className="assessment-main">
            <div className="assessment-question card">
              <p className="question-label">QUESTION {String(currentIndex + 1).padStart(2, '0')} / {questions.length}</p>
              <h4 className="question-text">{qText}</h4>
              <ul className="options-list">
                {qOptions.map((opt, idx) => (
                  <li key={idx}>
                    <label className={answers[currentIndex] === idx ? 'selected' : ''}>
                      <input
                        type="radio"
                        name={`q-${currentIndex}`}
                        checked={answers[currentIndex] === idx}
                        onChange={() => handleOptionSelect(currentIndex, idx)}
                      />
                      <span className="option-label">{optionLabels[idx] || String(idx + 1)}.</span>
                      <span className="option-text">{opt}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="assessment-nav">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  ← Previous
                </button>
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setCurrentIndex((i) => i + 1)}
                  >
                    Next →
                  </button>
                ) : (
                  <button type="button" className="btn btn-success" onClick={submitAssessment}>
                    Submit Test
                  </button>
                )}
              </div>
              <p className="assessment-summary">{answeredCount} answered • {remainingCount} remaining</p>
            </div>
            <p className="assessment-auto-warn">▲ Test auto-submits when timer ends</p>
          </div>
          <aside className="assessment-sidebar card">
            <h4 className="sidebar-title">QUESTION MAP</h4>
            <div className="question-map">
              {questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`map-btn ${i === currentIndex ? 'current' : ''} ${answers[i] !== null ? 'answered' : ''}`}
                  onClick={() => setCurrentIndex(i)}
                  title={`Question ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-submit-test" onClick={submitAssessment}>
              Submit Test
            </button>
          </aside>
        </div>
      </div>
    </CandidateLayout>
  );
}
