import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { apiApplicationById, apiUpdateApplicationStatus, apiAssessmentsList } from '../api/client';
import { getApplications, updateApplicationStatus, getResultByCandidateId } from '../utils/mockStore';
import { APPLICATION_STATUS } from '../utils/constants';
import '../styles/AdminCandidateDetail.css';

export default function AdminCandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [result, setResult] = useState(null);
  const [useApi, setUseApi] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const app = await apiApplicationById(id);
        if (!cancelled && app) {
          setApplication(app);
          setUseApi(true);
          try {
            const assRes = await apiAssessmentsList();
            const myResult = (assRes.assessments || []).find((a) => String(a.candidateId) === String(app.userId));
            if (!cancelled) setResult(myResult || null);
          } catch (_) { }
        }
      } catch (_) {
        if (!cancelled) {
          setUseApi(false);
          const apps = getApplications();
          const app = apps.find((a) => a.id === id || a.candidateId === id);
          setApplication(app || null);
          setResult(app ? getResultByCandidateId(app.candidateId) : null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const formData = application?.formData || {};
  const status = application?.status || APPLICATION_STATUS.REGISTERED;
  const candidateName = formData.fullName || formData.email || '—';
  const candidateEmail = formData.email || '—';
  const appId = application?.id || id;

  const handleShortlist = async () => {
    if (useApi) {
      try {
        await apiUpdateApplicationStatus(appId, APPLICATION_STATUS.SHORTLISTED);
        const app = await apiApplicationById(id);
        if (app) setApplication(app);
        navigate('/admin');
      } catch (_) {
        updateApplicationStatus(application?.candidateId || id, APPLICATION_STATUS.SHORTLISTED);
        navigate('/admin');
      }
    } else {
      updateApplicationStatus(application?.candidateId || id, APPLICATION_STATUS.SHORTLISTED);
      navigate('/admin');
    }
  };

  const handleReject = async () => {
    if (useApi) {
      try {
        await apiUpdateApplicationStatus(appId, APPLICATION_STATUS.NOT_SHORTLISTED);
        navigate('/admin');
      } catch (_) {
        updateApplicationStatus(application?.candidateId || id, APPLICATION_STATUS.NOT_SHORTLISTED);
        navigate('/admin');
      }
    } else {
      updateApplicationStatus(application?.candidateId || id, APPLICATION_STATUS.NOT_SHORTLISTED);
      navigate('/admin');
    }
  };

  const displayStatus = status === APPLICATION_STATUS.APPLICATION_SUBMITTED || status === 'Application Submitted' || status === APPLICATION_STATUS.REGISTERED || status === 'Registered'
    ? 'Pending Review'
    : status === APPLICATION_STATUS.ASSESSMENT_SUBMITTED || status === 'Assessment Submitted'
      ? 'Assessed'
      : status;

  if (loading) {
    return (
      <AdminLayout activeStep={3} title="Candidate Detail">
        <p>Loading…</p>
      </AdminLayout>
    );
  }

  if (!application) {
    return (
      <AdminLayout activeStep={3} title="Candidate Detail">
        <p>Application not found.</p>
        <Link to="/admin">← Back to Candidates</Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeStep={3} title="Candidate Detail" subtitle="Full application view + status controls.">
      <div className="admin-candidate-detail">
        <div className="admin-url-bar">
          <div className="admin-url-dots"><span className="red" /><span className="yellow" /><span className="green" /></div>
          <span>prayas.in/admin/candidates/{id}</span>
        </div>
        <Link to="/admin" className="back-to-candidates">← Back to Candidates</Link>
        <div className="detail-grid">
          <div className="detail-main card">
            <div className="detail-profile">
              <h2 className="detail-name">{candidateName}</h2>
              <span className={`detail-status-badge ${status === APPLICATION_STATUS.APPLICATION_SUBMITTED || status === 'Application Submitted' || status === APPLICATION_STATUS.REGISTERED || status === 'Registered' ? 'pending' : status === APPLICATION_STATUS.NOT_SHORTLISTED || status === 'Not Shortlisted' ? 'rejected' : 'shortlisted'}`}>
                {displayStatus}
              </span>
            </div>
            <p className="detail-contact">{candidateEmail}</p>
            {formData.contactNumber && <p className="detail-contact">+91 {formData.contactNumber}</p>}
            <hr className="detail-hr" />
            <div className="detail-section">
              <strong>Personal</strong>
              <p>Home State: {formData.homeState || '—'}, Current Residence: {formData.currentStateOfResidence || '—'}, Category: {formData.category || '—'}</p>
            </div>
            <div className="detail-section">
              <strong>Education</strong>
              <p>Qualification: {formData.highestQualification || '—'}, Currently Enrolled: {formData.currentlyEnrolled ? 'Yes' : 'No'}, Punjabi: {formData.punjabiProficiency || '—'}</p>
            </div>
            <div className="detail-section">
              <strong>Commitment</strong>
              <p>5hrs/day: {formData.commitmentHours === 'yes' ? '✓ Yes' : 'No'}, Laptop: {formData.laptopAccess === 'yes' ? '✓ Yes' : 'No'}, Field work: {formData.onFieldWork === 'yes' ? '✓ Yes' : 'No'}, INC: {formData.willingnessINC === 'yes' ? '✓ Yes' : 'No'}</p>
            </div>
            {formData.interestStateElections && (
              <div className="detail-section">
                <strong>Why interested</strong>
                <p>{formData.interestStateElections}</p>
              </div>
            )}
          </div>
          <div className="detail-sidebar">
            <div className="detail-card card">
              <h4>RESUME</h4>
              <p className="resume-file">{formData.resumeFileName || '—'}</p>
              <span className="resume-open">Open</span>
            </div>
            <div className="detail-card card detail-actions">
              <h4>ACTIONS</h4>
              {(status === APPLICATION_STATUS.APPLICATION_SUBMITTED || status === 'Application Submitted' || status === APPLICATION_STATUS.REGISTERED || status === 'Registered') && (
                <>
                  <button type="button" className="btn btn-shortlist" onClick={handleShortlist}>✓ Shortlist Candidate</button>
                  <button type="button" className="btn btn-reject" onClick={handleReject}>✗ Reject Candidate</button>
                </>
              )}
            </div>
            <div className="detail-card card">
              <h4>APPLICATION INFO</h4>
              <p>Submitted: {application?.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '—'}</p>
              <p>App ID: #{application?.id || '—'}</p>
              <p>Assessment: {result ? 'Done' : 'Not started'}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
