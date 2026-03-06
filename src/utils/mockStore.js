import { APPLICATION_STATUS } from './constants';

const CANDIDATES_KEY = 'prayas_candidates';
const ADMINS_KEY = 'prayas_admins';
const APPLICATIONS_KEY = 'prayas_applications';
const QUESTIONS_KEY = 'prayas_mcq_questions';
const RESULTS_KEY = 'prayas_assessment_results';

function getJson(key, defaultVal = []) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : defaultVal;
  } catch (_) {
    return defaultVal;
  }
}

function setJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Candidates: { id, email, name, password?, createdAt }
export function getCandidates() {
  return getJson(CANDIDATES_KEY);
}

export function getCandidateByEmail(email) {
  return getCandidates().find((c) => (c.email || '').toLowerCase() === (email || '').toLowerCase());
}

export function addCandidate(candidate) {
  const list = getCandidates();
  const newOne = { ...candidate, id: 'c-' + Date.now(), createdAt: new Date().toISOString() };
  list.push(newOne);
  setJson(CANDIDATES_KEY, list);
  return newOne;
}

// Admins: { id, email, name, createdAt } – only these can login as admin
export function getAdmins() {
  return getJson(ADMINS_KEY);
}

export function addAdmin(admin) {
  const list = getAdmins();
  const newOne = { ...admin, id: 'admin-' + Date.now(), createdAt: new Date().toISOString() };
  list.push(newOne);
  setJson(ADMINS_KEY, list);
  return newOne;
}

export function getAdminByEmail(email) {
  return getAdmins().find((a) => a.email === email);
}

// Applications: { id, candidateId, status, formData, submittedAt }
export function getApplications() {
  return getJson(APPLICATIONS_KEY);
}

export function getApplicationByCandidateId(candidateId) {
  return getApplications().find((a) => a.candidateId === candidateId);
}

export function saveApplication(candidateId, formData) {
  const apps = getApplications();
  const existing = apps.find((a) => a.candidateId === candidateId);
  const payload = {
    candidateId,
    formData: { ...formData },
    status: APPLICATION_STATUS.APPLICATION_SUBMITTED,
    submittedAt: new Date().toISOString(),
  };
  if (existing) {
    Object.assign(existing, payload);
    existing.id = existing.id || 'app-' + Date.now();
    setJson(APPLICATIONS_KEY, apps);
    return existing;
  }
  const newApp = { id: 'app-' + Date.now(), ...payload };
  apps.push(newApp);
  setJson(APPLICATIONS_KEY, apps);
  return newApp;
}

export function updateApplicationStatus(candidateId, status) {
  const apps = getApplications();
  const app = apps.find((a) => a.candidateId === candidateId);
  if (!app) return null;
  app.status = status;
  app.updatedAt = new Date().toISOString();
  setJson(APPLICATIONS_KEY, apps);
  return app;
}

export function getMcqQuestions() {
  return getJson(QUESTIONS_KEY, [
    {
      id: 'q1',
      question: 'What is the capital of India?',
      options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
      correctIndex: 1,
    },
    {
      id: 'q2',
      question: 'Which article of the Constitution abolishes untouchability?',
      options: ['Article 14', 'Article 15', 'Article 17', 'Article 19'],
      correctIndex: 2,
    },
  ]);
}

export function addMcqQuestion(question, options, correctIndex) {
  const list = getMcqQuestions();
  const newQ = {
    id: 'q-' + Date.now(),
    question: question.trim(),
    options: options.map((o) => o.trim()).filter(Boolean),
    correctIndex: parseInt(correctIndex, 10),
  };
  list.push(newQ);
  setJson(QUESTIONS_KEY, list);
  return newQ;
}

export function updateMcqQuestion(id, question, options, correctIndex) {
  const list = getMcqQuestions();
  const idx = list.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    question: question.trim(),
    options: options.map((o) => (typeof o === 'string' ? o : o.text || o).trim()).filter(Boolean),
    correctIndex: parseInt(correctIndex, 10),
  };
  setJson(QUESTIONS_KEY, list);
  return list[idx];
}

export function deleteMcqQuestion(id) {
  const list = getMcqQuestions().filter((q) => q.id !== id);
  setJson(QUESTIONS_KEY, list);
  return true;
}

// Assessment results: { id, candidateId, candidateName, answers, score, total, submittedAt, timeTakenSeconds }
export function getAssessmentResults() {
  return getJson(RESULTS_KEY);
}

export function saveAssessmentResult(candidateId, candidateName, answers, questions, timeTakenSeconds) {
  const list = getAssessmentResults();
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) score++;
  });
  const record = {
    id: 'res-' + Date.now(),
    candidateId,
    candidateName,
    answers: [...answers],
    score,
    total: questions.length,
    submittedAt: new Date().toISOString(),
    timeTakenSeconds: timeTakenSeconds ?? null,
  };
  list.push(record);
  setJson(RESULTS_KEY, list);
  return record;
}

export function getResultByCandidateId(candidateId) {
  return getAssessmentResults().find((r) => r.candidateId === candidateId);
}

export function hasAttemptedAssessment(candidateId) {
  return !!getResultByCandidateId(candidateId);
}
