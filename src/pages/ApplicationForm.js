import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CandidateLayout from '../components/CandidateLayout';
import {
  INDIAN_STATES,
  PUNJAB_ASSEMBLY_CONSTITUENCIES,
  CATEGORY_OPTIONS,
  PUNJABI_PROFICIENCY_OPTIONS,
  EDUCATION_OPTIONS,
} from '../utils/constants';
import { validateApplicationForm, wordCount } from '../utils/validation';
import { apiApplicationsMe, apiSubmitApplication } from '../api/client';
import { saveApplication, getApplicationByCandidateId } from '../utils/mockStore';
import '../styles/ApplicationForm.css';

const INITIAL = {
  fullName: '',
  email: '',
  contactNumber: '',
  homeState: '',
  assemblyConstituency: '',
  currentStateOfResidence: '',
  category: '',
  highestQualification: '',
  currentlyEnrolled: null,
  currentYearOfStudy: '',
  collegeName: '',
  academicDiscipline: '',
  resumeFile: null,
  resumeFileName: '',
  commitmentHours: '',
  laptopAccess: '',
  onFieldWork: '',
  willingnessINC: '',
  punjabiProficiency: '',
  interestStateElections: '',
};

const STEP_LABELS = ['Personal Information', 'Education & Location', 'Commitments & Documents'];

// Which step each field belongs to (so we can jump to first error)
const FIELD_STEP = {
  fullName: 1, email: 1, contactNumber: 1,
  homeState: 2, assemblyConstituency: 2, currentStateOfResidence: 2, category: 2,
  highestQualification: 2, currentlyEnrolled: 2, currentYearOfStudy: 2, collegeName: 2, academicDiscipline: 2,
  resume: 3, resumeFileName: 3, commitmentHours: 3, laptopAccess: 3, onFieldWork: 3,
  willingnessINC: 3, punjabiProficiency: 3, interestStateElections: 3,
};

export default function ApplicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => ({ ...INITIAL, email: user?.email || '', fullName: user?.name || '' }));
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const app = await apiApplicationsMe();
        if (!cancelled && app?.formData) setForm((prev) => ({ ...INITIAL, ...prev, ...app.formData }));
      } catch (_) {
        if (!cancelled) {
          const existing = getApplicationByCandidateId(user?.id);
          if (existing?.formData) setForm((prev) => ({ ...INITIAL, ...prev, ...existing.formData }));
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const showAssemblyConstituency = form.homeState === 'Punjab';
  const words = wordCount(form.interestStateElections);
  const progressPct = Math.round((step / 3) * 100);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    setSubmitError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, resume: 'Only PDF files are allowed' }));
      return;
    }
    setForm((prev) => ({ ...prev, resumeFile: file, resumeFileName: file.name }));
    setErrors((prev) => ({ ...prev, resume: null }));
    setSubmitError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const err = validateApplicationForm(form);
    setErrors(err);
    if (Object.keys(err).length > 0) {
      const firstKey = Object.keys(err)[0];
      const stepForError = FIELD_STEP[firstKey] || 1;
      setStep(stepForError);
      return;
    }
    if (!user?.id) {
      setSubmitError('Please log in again and try again.');
      return;
    }
    setSubmitting(true);
    const formData = { ...form };
    delete formData.resumeFile;
    const payload = { ...formData, resumeFileName: form.resumeFileName };
    try {
      await apiSubmitApplication(payload);
      setSubmitted(true);
      saveApplication(user.id, payload);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (_) {
      saveApplication(user.id, payload);
      setSubmitted(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const goPrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  if (submitted) {
    return (
      <CandidateLayout activeStep={2} title="Application Form" subtitle="Multi-step form with all 17 fields.">
        <div className="candidate-url-bar">
          <div className="candidate-url-dots"><span className="red" /><span className="yellow" /><span className="green" /></div>
          <span>prayas.in/apply</span>
        </div>
        <div className="confirmation-box card">
          <h3>Application submitted successfully</h3>
          <p>You will be redirected to your dashboard shortly.</p>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout activeStep={2} title="Application Form" subtitle="Multi-step form with all 17 fields.">
      <div className="application-form-wrap">
        <div className="candidate-url-bar">
          <div className="candidate-url-dots"><span className="red" /><span className="yellow" /><span className="green" /></div>
          <span>prayas.in/apply</span>
        </div>
        <div className="application-progress card">
          <div className="application-progress-bar">
            <div className="application-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="application-progress-text">Step {step} of 3 – {STEP_LABELS[step - 1]} · {progressPct}% complete</p>
        </div>
        <div className="application-form card">
          {Object.keys(errors).length > 0 && (
            <div className="form-errors-banner" role="alert">
              Please fix the errors below and try again.
            </div>
          )}
          {submitError && (
            <div className="form-errors-banner form-submit-error" role="alert">
              {submitError}
            </div>
          )}
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); goNext(); }}>
            {step === 1 && (
              <section className="form-section">
                <h3>PERSONAL INFORMATION</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      id="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="Arjun Singh"
                    />
                    {errors.fullName && <div className="form-error">{errors.fullName}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@example.com"
                    />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number *</label>
                  <input
                    id="contactNumber"
                    type="tel"
                    value={form.contactNumber}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                  {errors.contactNumber && <div className="form-error">{errors.contactNumber}</div>}
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="form-section">
                <h3>LOCATION</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="homeState">Home State *</label>
                    <select
                      id="homeState"
                      value={form.homeState}
                      onChange={(e) => {
                        handleChange('homeState', e.target.value);
                        if (e.target.value !== 'Punjab') handleChange('assemblyConstituency', '');
                      }}
                    >
                      <option value="">Select</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.homeState && <div className="form-error">{errors.homeState}</div>}
                  </div>
                  {showAssemblyConstituency && (
                    <div className="form-group">
                      <label htmlFor="assemblyConstituency">Assembly Constituency *</label>
                      <select
                        id="assemblyConstituency"
                        value={form.assemblyConstituency}
                        onChange={(e) => handleChange('assemblyConstituency', e.target.value)}
                      >
                        <option value="">Select</option>
                        {PUNJAB_ASSEMBLY_CONSTITUENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {errors.assemblyConstituency && <div className="form-error">{errors.assemblyConstituency}</div>}
                    </div>
                  )}
                </div>
                {showAssemblyConstituency && (
                  <p className="form-hint">◆ Constituency dropdown appears only when Punjab is selected.</p>
                )}
                <div className="form-group">
                  <label htmlFor="currentStateOfResidence">Current State of Residence *</label>
                  <select
                    id="currentStateOfResidence"
                    value={form.currentStateOfResidence}
                    onChange={(e) => handleChange('currentStateOfResidence', e.target.value)}
                  >
                    <option value="">Select</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.currentStateOfResidence && <div className="form-error">{errors.currentStateOfResidence}</div>}
                </div>
                <div className="form-group">
                  <label>Category (optional)</label>
                  <div className="radio-group">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <label key={opt.value}>
                        <input
                          type="radio"
                          name="category"
                          value={opt.value}
                          checked={form.category === opt.value}
                          onChange={(e) => handleChange('category', e.target.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <h3>EDUCATION</h3>
                <div className="form-group">
                  <label htmlFor="highestQualification">Highest Qualification *</label>
                  <select
                    id="highestQualification"
                    value={form.highestQualification}
                    onChange={(e) => handleChange('highestQualification', e.target.value)}
                  >
                    <option value="">Select</option>
                    {EDUCATION_OPTIONS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  {errors.highestQualification && <div className="form-error">{errors.highestQualification}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="academicDiscipline">Field of Study *</label>
                  <input
                    id="academicDiscipline"
                    type="text"
                    value={form.academicDiscipline}
                    onChange={(e) => handleChange('academicDiscipline', e.target.value)}
                    placeholder="Computer Science"
                  />
                  {errors.academicDiscipline && <div className="form-error">{errors.academicDiscipline}</div>}
                </div>
                <div className="form-group">
                  <label>If currently enrolled in college</label>
                  <div className="radio-group">
                    <label>
                      <input type="radio" name="enrolled" checked={form.currentlyEnrolled === true} onChange={() => handleChange('currentlyEnrolled', true)} /> Yes
                    </label>
                    <label>
                      <input type="radio" name="enrolled" checked={form.currentlyEnrolled === false} onChange={() => handleChange('currentlyEnrolled', false)} /> No / NA
                    </label>
                  </div>
                </div>
                {form.currentlyEnrolled === true && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="currentYearOfStudy">Current Year of Study *</label>
                      <input id="currentYearOfStudy" type="text" value={form.currentYearOfStudy} onChange={(e) => handleChange('currentYearOfStudy', e.target.value)} placeholder="e.g. 2nd Year" />
                      {errors.currentYearOfStudy && <div className="form-error">{errors.currentYearOfStudy}</div>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="collegeName">College Name *</label>
                      <input id="collegeName" type="text" value={form.collegeName} onChange={(e) => handleChange('collegeName', e.target.value)} placeholder="College name" />
                      {errors.collegeName && <div className="form-error">{errors.collegeName}</div>}
                    </div>
                  </div>
                )}
              </section>
            )}

            {step === 3 && (
              <section className="form-section">
                <h3>COMMITMENTS</h3>
                <div className="form-group">
                  <label>Can you commit 5+ hrs/day? *</label>
                  <div className="radio-group option-buttons">
                    <label className={form.commitmentHours === 'yes' ? 'selected' : ''}>
                      <input type="radio" name="commitment" value="yes" checked={form.commitmentHours === 'yes'} onChange={(e) => handleChange('commitmentHours', e.target.value)} /> Yes
                    </label>
                    <label className={form.commitmentHours === 'no' ? 'selected' : ''}>
                      <input type="radio" name="commitment" value="no" checked={form.commitmentHours === 'no'} onChange={(e) => handleChange('commitmentHours', e.target.value)} /> No
                    </label>
                  </div>
                  {errors.commitmentHours && <div className="form-error">{errors.commitmentHours}</div>}
                </div>
                <div className="form-group">
                  <label>Punjabi Proficiency *</label>
                  <div className="radio-group option-buttons">
                    {PUNJABI_PROFICIENCY_OPTIONS.map((opt) => (
                      <label key={opt.value} className={form.punjabiProficiency === opt.value ? 'selected' : ''}>
                        <input type="radio" name="punjabi" value={opt.value} checked={form.punjabiProficiency === opt.value} onChange={(e) => handleChange('punjabiProficiency', e.target.value)} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {errors.punjabiProficiency && <div className="form-error">{errors.punjabiProficiency}</div>}
                </div>
                <div className="form-group">
                  <label>Laptop with video conferencing? *</label>
                  <div className="radio-group">
                    <label><input type="radio" name="laptop" value="yes" checked={form.laptopAccess === 'yes'} onChange={(e) => handleChange('laptopAccess', e.target.value)} /> Yes</label>
                    <label><input type="radio" name="laptop" value="no" checked={form.laptopAccess === 'no'} onChange={(e) => handleChange('laptopAccess', e.target.value)} /> No</label>
                  </div>
                  {errors.laptopAccess && <div className="form-error">{errors.laptopAccess}</div>}
                </div>
                <div className="form-group">
                  <label>Open to on-field work? *</label>
                  <div className="radio-group">
                    <label><input type="radio" name="onField" value="yes" checked={form.onFieldWork === 'yes'} onChange={(e) => handleChange('onFieldWork', e.target.value)} /> Yes</label>
                    <label><input type="radio" name="onField" value="no" checked={form.onFieldWork === 'no'} onChange={(e) => handleChange('onFieldWork', e.target.value)} /> No</label>
                  </div>
                  {errors.onFieldWork && <div className="form-error">{errors.onFieldWork}</div>}
                </div>
                <div className="form-group">
                  <label>Willing to work with INC? *</label>
                  <div className="radio-group">
                    <label><input type="radio" name="inc" value="yes" checked={form.willingnessINC === 'yes'} onChange={(e) => handleChange('willingnessINC', e.target.value)} /> Yes</label>
                    <label><input type="radio" name="inc" value="no" checked={form.willingnessINC === 'no'} onChange={(e) => handleChange('willingnessINC', e.target.value)} /> No</label>
                  </div>
                  {errors.willingnessINC && <div className="form-error">{errors.willingnessINC}</div>}
                </div>
                <h3>STATEMENT & DOCUMENTS</h3>
                <div className="form-group">
                  <label htmlFor="interestStateElections">Why are you interested in state-level elections? (max 100 words) *</label>
                  <textarea
                    id="interestStateElections"
                    value={form.interestStateElections}
                    onChange={(e) => handleChange('interestStateElections', e.target.value)}
                    placeholder="I am passionate about grassroots democratic participation..."
                    maxLength={600}
                  />
                  <div className={`word-count ${words > 100 ? 'error' : words > 80 ? 'warning' : ''}`}>{words}/100 words</div>
                  {errors.interestStateElections && <div className="form-error">{errors.interestStateElections}</div>}
                </div>
                <div className="form-group">
                  <label>Upload Resume (PDF only) *</label>
                  <div className="file-upload-zone">
                    <input id="resume" type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="file-upload-input" />
                    <span className="file-upload-text">{form.resumeFileName || 'Click to upload or drag & drop'}</span>
                    <span className="file-upload-spec">PDF Max 5MB</span>
                  </div>
                  {errors.resume && <div className="form-error">{errors.resume}</div>}
                </div>
              </section>
            )}

            <div className="form-actions form-step-actions">
              {step > 1 ? (
                <button type="button" className="btn btn-secondary" onClick={goPrev}>← Previous</button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <button type="submit" className="btn btn-primary">Next →</button>
              ) : (
                <button type="submit" className="btn btn-primary btn-submit-apply" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Application →'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </CandidateLayout>
  );
}
