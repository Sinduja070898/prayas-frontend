# API list — data shown on UI comes from these endpoints

When the backend is running (e.g. `npm start` in `backend/` with proxy from frontend), the UI uses these REST APIs. If a request fails, the app falls back to local mock data where applicable.

## Auth — `/api/auth`
| Method | Path        | Used for                    |
|--------|-------------|-----------------------------|
| POST   | `/register` | (Optional) backend register |
| POST   | `/login`    | (Optional) backend login    |
| GET    | `/me`       | (Optional) current user     |

## Applications — `/api/applications`
| Method | Path          | Used for                          |
|--------|---------------|-----------------------------------|
| POST   | `/`           | Candidate: submit application     |
| GET    | `/me`         | Candidate: my application + status|
| GET    | `/`           | Admin: all applications list      |
| GET    | `/:id`        | Admin: single application detail  |
| PUT    | `/:id/status` | Admin: update status (shortlist/reject) |

## Questions — `/api/questions`
| Method | Path     | Used for                              |
|--------|----------|---------------------------------------|
| GET    | `/`      | Candidate: questions (no correctIndex)|
| GET    | `/admin` | Admin: all questions (with answers)   |
| POST   | `/`      | Admin: create question                |
| PUT    | `/:id`   | Admin: update question                |
| DELETE | `/:id`   | Admin: delete question               |

## Assessments — `/api/assessments`
| Method | Path      | Used for                          |
|--------|-----------|-----------------------------------|
| POST   | `/start`  | Candidate: start (get questions)  |
| POST   | `/submit` | Candidate: submit answers         |
| GET    | `/me`     | Candidate: my result              |
| GET    | `/`       | Admin: all results                |
| GET    | `/export` | Admin: download CSV               |

## Flow summary
- **Candidate**: Login → Dashboard (GET /me, GET /applications/me, GET /assessments/me) → Apply (POST /applications) → Assessment (POST /assessments/start, POST /assessments/submit) → Confirmation (GET /assessments/me).
- **Admin**: Login → Dashboard (GET /applications, GET /assessments) → Candidate detail (GET /applications/:id) → Status (PUT /applications/:id/status) → Questions (GET/POST/PUT/DELETE /questions) → Results (GET /assessments, GET /assessments/export).
