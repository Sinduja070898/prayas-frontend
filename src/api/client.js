const BASE =
  typeof process.env.REACT_APP_API_URL !== 'undefined'
    ? process.env.REACT_APP_API_URL
    : process.env.NODE_ENV === 'development'
      ? 'http://localhost:5001'
      : '';

function getToken() {
  return localStorage.getItem('prayas_token');
}

function headers(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (includeAuth && token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function handleRes(r) {
  if (r.status === 204) return null;
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.error || data.message || `Request failed ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return data;
}

export async function apiLogin(email, password, role = 'candidate') {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.error || data.message || 'Login failed');
    err.status = r.status;
    throw err;
  }
  return data;
}

export async function apiRegister(name, email, password) {
  const r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: headers(false),
    body: JSON.stringify({ name, email, password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.error || data.message || 'Registration failed');
    err.status = r.status;
    throw err;
  }
  return data;
}

export async function apiApplicationsMe() {
  const r = await fetch(`${BASE}/api/applications/me`, { headers: headers() });
  if (r.status === 404) return null;
  return handleRes(r);
}

export async function apiSubmitApplication(body) {
  const r = await fetch(`${BASE}/api/applications`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handleRes(r);
}

export async function apiApplicationsList(params = {}) {
  const q = new URLSearchParams(params).toString();
  const r = await fetch(`${BASE}/api/applications${q ? `?${q}` : ''}`, { headers: headers() });
  return handleRes(r);
}

export async function apiApplicationById(id) {
  const r = await fetch(`${BASE}/api/applications/${id}`, { headers: headers() });
  if (r.status === 404) return null;
  return handleRes(r);
}

export async function apiUpdateApplicationStatus(id, status) {
  const r = await fetch(`${BASE}/api/applications/${id}/status`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ status }),
  });
  return handleRes(r);
}

export async function apiQuestions() {
  const r = await fetch(`${BASE}/api/questions`, { headers: headers() });
  return handleRes(r);
}

export async function apiQuestionsAdmin() {
  const r = await fetch(`${BASE}/api/questions/admin`, { headers: headers() });
  return handleRes(r);
}

export async function apiCreateQuestion(body) {
  const r = await fetch(`${BASE}/api/questions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handleRes(r);
}

export async function apiUpdateQuestion(id, body) {
  const r = await fetch(`${BASE}/api/questions/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handleRes(r);
}

export async function apiDeleteQuestion(id) {
  const r = await fetch(`${BASE}/api/questions/${id}`, { method: 'DELETE', headers: headers() });
  if (r.status === 204) return;
  return handleRes(r);
}

export async function apiAssessmentsStart() {
  const r = await fetch(`${BASE}/api/assessments/start`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({}),
  });
  return handleRes(r);
}

export async function apiAssessmentsSubmit(body) {
  const r = await fetch(`${BASE}/api/assessments/submit`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handleRes(r);
}

export async function apiAssessmentsMe() {
  const r = await fetch(`${BASE}/api/assessments/me`, { headers: headers() });
  if (r.status === 404) return null;
  return handleRes(r);
}

export async function apiAssessmentsList() {
  const r = await fetch(`${BASE}/api/assessments`, { headers: headers() });
  return handleRes(r);
}

export async function apiAssessmentsExport() {
  const token = getToken();
  const r = await fetch(`${BASE}/api/assessments/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) throw new Error('Export failed');
  return r.blob();
}
