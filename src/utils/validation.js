export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim());
}

export function validatePassword(password) {
  return password && password.length >= 6;
}

export function validateRequired(value) {
  return value != null && String(value).trim().length > 0;
}

export function validatePhone(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 10;
}

export function validateApplicationForm(data) {
  const errors = {};
  if (!validateRequired(data.fullName)) errors.fullName = 'Full name is required';
  if (!validateEmail(data.email)) errors.email = 'Valid email is required';
  if (!validatePhone(data.contactNumber)) errors.contactNumber = 'Valid contact number is required';
  if (!validateRequired(data.homeState)) errors.homeState = 'Home state is required';
  if (data.homeState === 'Punjab' && !validateRequired(data.assemblyConstituency)) {
    errors.assemblyConstituency = 'Assembly constituency is required when Home State is Punjab';
  }
  if (!validateRequired(data.currentStateOfResidence)) {
    errors.currentStateOfResidence = 'Current state of residence is required';
  }
  if (!validateRequired(data.highestQualification)) {
    errors.highestQualification = 'Highest educational qualification is required';
  }
  if (data.currentlyEnrolled === true) {
    if (!validateRequired(data.currentYearOfStudy)) errors.currentYearOfStudy = 'Current year of study is required';
    if (!validateRequired(data.collegeName)) errors.collegeName = 'College name is required';
  }
  if (!validateRequired(data.academicDiscipline)) {
    errors.academicDiscipline = 'Academic discipline / field of study is required';
  }
  if (!data.resumeFile && !data.resumeFileName) {
    errors.resume = 'Resume (PDF) upload is required';
  }
  if (data.commitmentHours == null || data.commitmentHours === '') {
    errors.commitmentHours = 'Please select an option';
  }
  if (data.laptopAccess == null || data.laptopAccess === '') {
    errors.laptopAccess = 'Please select an option';
  }
  if (data.onFieldWork == null || data.onFieldWork === '') {
    errors.onFieldWork = 'Please select an option';
  }
  if (data.willingnessINC == null || data.willingnessINC === '') {
    errors.willingnessINC = 'Please select an option';
  }
  if (!validateRequired(data.punjabiProficiency)) {
    errors.punjabiProficiency = 'Please select Punjabi proficiency';
  }
  if (!validateRequired(data.interestStateElections)) {
    errors.interestStateElections = 'Please describe your interest (max 100 words)';
  } else {
    const words = data.interestStateElections.trim().split(/\s+/).filter(Boolean).length;
    if (words > 100) errors.interestStateElections = `Maximum 100 words (currently ${words})`;
  }
  return errors;
}

export function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}
