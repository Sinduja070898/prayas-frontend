# Assessment Platform – Frontend

React UI for the Assessment Platform. The backend is a separate project/repo’; set REACT_APP_API_URL to your backend URL when needed.

```bash
npm install
npm start
```

Runs at http://localhost:3000. In development the app calls the backend at `http://localhost:5001` by default; set `REACT_APP_API_URL` in `.env` to override.

## Overview of the application

The web application allows:

- **Candidates** to apply for a program.
- **Admin** to shortlist candidates.
- **Shortlisted candidates** to take a timed assessment.
- **Admin** to view results.

---

## Feature breakdown

| Candidate features | Admin features |
|--------------------|----------------|
| 1. Register & Login | 1. View list of candidates |
| 2. Submit application form (all fields as per attached form) | 2. Update candidate status |
| 3. Dashboard showing current application status: **Registered**, **Application Submitted**, **Shortlisted / Not Shortlisted**, **Assessment Pending**, **Assessment Submitted** | 3. Shortlist candidates |
| 4. If shortlisted: (a) Receive assessment link, (b) Attempt 30-minute MCQ test, (c) Auto-submit on timer completion, (d) Only one attempt allowed | 4. Create & manage MCQ questions |
| 5. After submission, show confirmation message | 5. View assessment results |
| | 6. Download results as CSV |

---

## Technical requirements (alignment)

| Requirement | Status (this UI) |
|-------------|------------------|
| **MERN stack** | **React** implemented; MongoDB, Express, Node can be added as a separate backend. |
| **Role-based authorization (Admin / Candidate)** | Implemented: protected routes and role checks; admin vs candidate flows and nav. |
| **Clean folder structure** | Yes (see below). |
| **RESTful APIs** | Backend TBD; UI uses mock store; ready to plug in APIs. |
| **MongoDB schema design** | Backend TBD. |
| **Basic validation** | Client-side validation on all forms (email, required fields, file type, word count, etc.). |
| **README with setup instructions** | This file. |
| **JWT authentication** | Auth flow and token handling implemented (mock JWT in `localStorage`); ready for real JWT from backend. |

---

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm start
   ```

   The app opens at [http://localhost:3000](http://localhost:3000).

3. **Build for production**

   ```bash
   npm run build
   ```

---

## Folder structure

```
src/
├── components/           # Shared UI
│   ├── Layout.js          # Header, nav (role-based), logout
│   ├── Layout.css
│   └── ProtectedRoute.js  # Role-based route guard
├── context/
│   └── AuthContext.js     # Auth state, login/register (mock JWT), role
├── pages/
│   ├── Home.js            # Landing; Candidate vs Admin entry
│   ├── Login.js, Register.js
│   ├── ApplicationForm.js # Full application form (all required fields)
│   ├── CandidateDashboard.js  # Status + assessment link when shortlisted
│   ├── Assessment.js      # 30-min MCQ, timer, auto-submit, one attempt
│   ├── AssessmentConfirmation.js
│   ├── AdminLogin.js, AdminRegister.js
│   ├── AdminCandidates.js # List, update status, shortlist
│   ├── AdminQuestions.js  # Create, edit, delete MCQs
│   └── AdminResults.js   # View results, download CSV
├── utils/
│   ├── constants.js       # States, categories, status labels
│   ├── validation.js      # Form validation helpers
│   └── mockStore.js       # Mock data (candidates, applications, MCQs, results)
├── App.js                 # Routes, AuthProvider, ProtectedRoute
└── index.js, index.css
```

---

## How to use (no backend)

- **Candidates:** From home, use **Register** then **Login**. Submit the application form; dashboard shows status. When status is **Shortlisted** or **Assessment Pending**, the **assessment link** appears on the dashboard; one 30-minute attempt, auto-submit when time ends; then confirmation.
- **Admin:** From home, use **Register as Admin** (once), then **Admin Login**. Use **Candidates** to view list, update status, and shortlist; **MCQ Questions** to create/edit/delete questions; **Results** to view and download CSV.

---

## Adding a backend (MERN)

- Replace `AuthContext` login/register with REST APIs and store the returned **JWT**.
- Replace `mockStore.js` usage with API calls for candidates, applications, questions, and results.
- Keep the same UI and route structure; only the data layer and auth calls change.

---

## Browser support

Same as Create React App defaults (see `browserslist` in `package.json`).
