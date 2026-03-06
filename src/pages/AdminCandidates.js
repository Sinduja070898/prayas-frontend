import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { apiApplicationsList, apiAssessmentsList, apiUpdateApplicationStatus } from '../api/client';
import { getCandidates, getApplications, getAssessmentResults, updateApplicationStatus } from '../utils/mockStore';
import { APPLICATION_STATUS } from '../utils/constants';
import '../styles/AdminCandidates.css';

const FILTER_ALL = 'all';
const FILTER_PENDING = 'pending';
const FILTER_SHORTLISTED = 'shortlisted';
const FILTER_REJECTED = 'rejected';

function getFilterStatus(status) {
  if (status === APPLICATION_STATUS.APPLICATION_SUBMITTED || status === 'Application Submitted' || status === APPLICATION_STATUS.REGISTERED || status === 'Registered') return FILTER_PENDING;
  if (status === APPLICATION_STATUS.SHORTLISTED || status === 'Shortlisted' || status === APPLICATION_STATUS.ASSESSMENT_PENDING || status === 'Assessment Pending' || status === APPLICATION_STATUS.ASSESSMENT_SUBMITTED || status === 'Assessment Submitted') return FILTER_SHORTLISTED;
  if (status === APPLICATION_STATUS.NOT_SHORTLISTED || status === 'Not Shortlisted') return FILTER_REJECTED;
  return FILTER_PENDING;
}

function getDisplayStatus(status) {
  if (status === APPLICATION_STATUS.ASSESSMENT_SUBMITTED || status === 'Assessment Submitted') return 'Assessed';
  if (status === APPLICATION_STATUS.APPLICATION_SUBMITTED || status === 'Application Submitted' || status === APPLICATION_STATUS.REGISTERED || status === 'Registered') return 'Pending';
  if (status === APPLICATION_STATUS.SHORTLISTED || status === 'Shortlisted' || status === APPLICATION_STATUS.ASSESSMENT_PENDING || status === 'Assessment Pending') return 'Shortlisted';
  if (status === APPLICATION_STATUS.NOT_SHORTLISTED || status === 'Not Shortlisted') return 'Rejected';
  return status;
}

function downloadCsv(list) {
  const headers = ['#', 'Name', 'Email', 'State', 'Qualification', 'Submitted', 'Status'];
  const rows = list.map((r, i) => [
    i + 1,
    r.name,
    r.email,
    r.state || '—',
    r.qualification || '—',
    r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—',
    getDisplayStatus(r.status),
  ]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `candidates-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AdminCandidates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter') || FILTER_ALL;
  const [applications, setApplications] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState(urlFilter);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [appRes, assRes] = await Promise.all([apiApplicationsList(), apiAssessmentsList()]);
        if (!cancelled) {
          setApplications(appRes.applications || []);
          setAssessments(assRes.assessments || []);
          setUseApi(true);
        }
      } catch (_) {
        if (!cancelled) {
          setUseApi(false);
          setApplications(getApplications());
          setAssessments(getAssessmentResults());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setFilter(urlFilter);
  }, [urlFilter]);

  const list = useMemo(() => {
    if (useApi) {
      return (applications || []).map((app) => {
        const formData = app.formData || {};
        const status = app.status || 'Registered';
        return {
          id: app.id,
          userId: app.userId,
          name: formData.fullName || formData.email || '—',
          email: formData.email || '—',
          application: app,
          status,
          filterStatus: getFilterStatus(status),
          state: formData.currentStateOfResidence || formData.homeState || '—',
          qualification: formData.highestQualification || '—',
          submittedAt: app.submittedAt,
        };
      });
    }
    const candidates = getCandidates();
    const apps = getApplications();
    return candidates.map((c) => {
      const app = apps.find((a) => a.candidateId === c.id);
      const status = app?.status || APPLICATION_STATUS.REGISTERED;
      const formData = app?.formData || {};
      return {
        id: c.id,
        name: c.name || c.email,
        email: c.email,
        application: app,
        status,
        filterStatus: getFilterStatus(status),
        state: formData.currentStateOfResidence || formData.homeState || '—',
        qualification: formData.highestQualification || '—',
        submittedAt: app?.submittedAt,
      };
    });
  }, [useApi, applications]);

  const assessedCount = useApi ? assessments.length : getAssessmentResults().length;
  const countPending = list.filter((r) => r.filterStatus === FILTER_PENDING).length;
  const countShortlisted = list.filter((r) => r.filterStatus === FILTER_SHORTLISTED).length;
  const countRejected = list.filter((r) => r.filterStatus === FILTER_REJECTED).length;

  const filteredByTab = filter === FILTER_ALL ? list : list.filter((r) => r.filterStatus === filter);
  const filtered = useMemo(() => {
    if (!search.trim()) return filteredByTab;
    const q = search.trim().toLowerCase();
    return filteredByTab.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.state || '').toLowerCase().includes(q)
    );
  }, [filteredByTab, search]);

  const handleFilterChange = (f) => {
    setFilter(f);
    setSearchParams(f === FILTER_ALL ? {} : { filter: f });
  };

  const handleStatusChange = async (appId, candidateId, newStatus) => {
    setUpdating(appId || candidateId);
    if (useApi) {
      try {
        await apiUpdateApplicationStatus(appId, newStatus);
        const [appRes] = await Promise.all([apiApplicationsList()]);
        setApplications(appRes.applications || []);
      } catch (_) {
        updateApplicationStatus(candidateId, newStatus);
      }
    } else {
      updateApplicationStatus(candidateId, newStatus);
      setApplications(getApplications());
    }
    setUpdating(null);
  };

  return (
    <AdminLayout activeStep={2} title="Admin Dashboard" subtitle="Overview + candidate list with actions.">
      <div className="admin-dashboard">
        <div className="admin-url-bar">
          <div className="admin-url-dots">
            <span className="red" /><span className="yellow" /><span className="green" />
          </div>
          <span>prayas.in/admin/dashboard</span>
        </div>
        {loading && <p className="admin-loading">Loading…</p>}
        <div className="admin-summary-cards">
          <div className="summary-card summary-total">
            <span className="summary-value">{list.length}</span>
            <span className="summary-label">TOTAL APPLICANTS</span>
            <span className="summary-note">{useApi ? 'From API' : 'Local'}</span>
          </div>
          <div className="summary-card summary-pending">
            <span className="summary-value">{countPending}</span>
            <span className="summary-label">PENDING REVIEW</span>
            <span className="summary-note">Awaiting decision</span>
          </div>
          <div className="summary-card summary-shortlisted">
            <span className="summary-value">{countShortlisted}</span>
            <span className="summary-label">SHORTLISTED</span>
            <span className="summary-note">{assessedCount} assessed</span>
          </div>
          <div className="summary-card summary-assessed">
            <span className="summary-value">{assessedCount}</span>
            <span className="summary-label">ASSESSMENTS DONE</span>
            <span className="summary-note">{Math.max(0, countShortlisted - assessedCount)} pending</span>
          </div>
        </div>
        <div className="admin-candidates-toolbar card">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, state, ema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-tabs">
            <button type="button" className={`filter-tab ${filter === FILTER_ALL ? 'active' : ''}`} onClick={() => handleFilterChange(FILTER_ALL)}>All ({list.length})</button>
            <button type="button" className={`filter-tab pending ${filter === FILTER_PENDING ? 'active' : ''}`} onClick={() => handleFilterChange(FILTER_PENDING)}>Pending ({countPending})</button>
            <button type="button" className={`filter-tab shortlisted ${filter === FILTER_SHORTLISTED ? 'active' : ''}`} onClick={() => handleFilterChange(FILTER_SHORTLISTED)}>Shortlisted ({countShortlisted})</button>
            <button type="button" className={`filter-tab rejected ${filter === FILTER_REJECTED ? 'active' : ''}`} onClick={() => handleFilterChange(FILTER_REJECTED)}>Rejected ({countRejected})</button>
          </div>
          <button type="button" className="btn btn-export-csv" onClick={() => downloadCsv(filtered)} disabled={filtered.length === 0}>↓ Export CSV</button>
        </div>
        <div className="table-wrap card">
          <table className="candidates-table">
            <thead>
              <tr>
                <th>#</th>
                <th>NAME</th>
                <th>STATE</th>
                <th>QUALIFICATION</th>
                <th>SUBMITTED</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}>{loading ? 'Loading…' : 'No candidates match.'}</td></tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <Link to={`/admin/candidates/${row.id}`} className="candidate-name-link">
                        <span className="candidate-name">{row.name}</span>
                        <span className="candidate-email">{row.email}</span>
                      </Link>
                    </td>
                    <td>{row.state}</td>
                    <td>{row.qualification}</td>
                    <td>{row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`status-dot status-${getDisplayStatus(row.status).toLowerCase()}`} />
                      {getDisplayStatus(row.status)}
                    </td>
                    <td>
                      {(row.status === APPLICATION_STATUS.APPLICATION_SUBMITTED || row.status === 'Application Submitted') && (
                        <>
                          <button type="button" className="btn btn-success btn-sm" disabled={updating === row.id} onClick={() => handleStatusChange(row.id, row.userId, APPLICATION_STATUS.SHORTLISTED)}>Shortlist</button>
                          <button type="button" className="btn btn-danger btn-sm" disabled={updating === row.id} onClick={() => handleStatusChange(row.id, row.userId, APPLICATION_STATUS.NOT_SHORTLISTED)}>Reject</button>
                        </>
                      )}
                      {(row.status === APPLICATION_STATUS.SHORTLISTED || row.status === 'Shortlisted') && (
                        <button type="button" className="btn btn-secondary btn-sm" disabled={updating === row.id} onClick={() => handleStatusChange(row.id, row.userId, APPLICATION_STATUS.ASSESSMENT_PENDING)}>Mark Assessment Pending</button>
                      )}
                      {(row.status === APPLICATION_STATUS.ASSESSMENT_PENDING || row.status === 'Assessment Pending') && <span className="muted-sm">Waiting</span>}
                      {(row.status === APPLICATION_STATUS.ASSESSMENT_SUBMITTED || row.status === 'Assessment Submitted') && <span className="muted-sm">Completed</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
