# Campus Placement Portal (MERN Stack)

A comprehensive, production-grade Campus Placement Portal built with the **MERN stack** (MongoDB, Express 5, React 19, Node.js, Vite). The platform connects students, recruiting companies, and Training & Placement Officers (TPO) to streamline campus recruitment workflows, job applications, resume management, and placement analytics.

---

## 🌟 Key Features

### 1. Multi-Role Authentication & Access Control
- **Roles**: `student`, `company`, `tpo`.
- Secure JWT-based authentication stored in `localStorage` with automated authorization headers.
- Automatic logout and session cleanup on token expiration without interrupting unrelated operations.
- Input validation via `express-validator` and password hashing with `bcryptjs`.
- Sensitive endpoint rate limiting (30 requests / 15 minutes) on login and registration.

### 2. Student Portal
- **Profile Management**: Personal details, department, batch, CGPA, backlogs, and skills.
- **Resume Upload**: Direct, secure PDF resume uploads to **Cloudinary** with file-type validation (PDF only, max 5MB).
- **Eligibility-Filtered Jobs**: Live filtering based on minimum CGPA, eligible departments, batch, active backlogs, and deadlines.
- **1-Click Application**: Instant job applications with real-time eligibility verification and duplicate application prevention.
- **Application Tracking**: Live status tracker (`applied` → `shortlisted` → `interview` → `selected` / `rejected`).

### 3. Company Portal
- **Company Registration**: Automatic company profile creation with initial `pending` approval status.
- **Job Posting**: Detailed job creation with title, description, package (LPA), location, job type (`full-time`, `internship`), deadlines, and criteria.
- **Applicant Review**: Review applicant profiles, view resumes via secure Cloudinary links.
- **Workflow Transitions**: Validated state machine for applicants (`applied` → `shortlisted` → `interview` → `selected` / `rejected`).

### 4. Training & Placement Officer (TPO) Portal
- **Company Approvals**: Review and approve/reject registering recruiters before they can post jobs.
- **Real-Time Analytics Dashboard**:
  - Summary metrics: total students, placed students, placement percentage, total offers, average and highest packages (LPA), open jobs.
  - Department-wise placement performance (CSE, IT, ECE, MECH, etc.).
  - Application funnel breakdown.
  - Salary package distribution buckets (Below 4 LPA, 4-7 LPA, 7-10 LPA, 10+ LPA).
  - Top recruiting companies by offer count.
  - Batch filtering.

### 5. In-App Notification System
- **Real-Time Updates**: 30-second polling bell with unread badge counter.
- **Automated Event Triggers**:
  - Companies notified when a student applies for a job.
  - Students notified when application status changes.
  - Companies notified upon TPO approval or rejection.
- **Idempotency**: Duplicate applications, invalid transitions, and repeated approvals never produce duplicate notifications.
- **Persistence & Maintenance**: High-performance compound indexes and MongoDB 90-day TTL auto-cleanup (`expireAfterSeconds: 7776000`).

### 6. Security & Production Hardening
- **Helmet**: Essential HTTP security headers enabled.
- **Restricted CORS**: Origin-restricted access configured via environment variables.
- **Rate Limiting**: Protects against credential brute-forcing.
- **Centralized Error Handling**: JSON-formatted errors and 404 responses.
- **Health Check**: Dedicated `/api/health` monitoring endpoint.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router 7, Axios, Lucide Icons, Modern CSS.
- **Backend**: Node.js, Express 5, Mongoose 9, Multer, Cloudinary SDK.
- **Security**: JWT, BcryptJS, Helmet, Express-Rate-Limit, Express-Validator, CORS.
- **Database**: MongoDB (Local or MongoDB Atlas).

---

## 📁 Project Structure

```text
placement-portal/
├── client/                     # Frontend React (Vite)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AnalyticsDashboard.jsx
│   │   │   ├── CompanyApprovals.jsx
│   │   │   ├── JobApplicants.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ResumeUpload.jsx
│   │   │   └── StudentProfileForm.jsx
│   │   ├── context/            # React AuthContext
│   │   ├── pages/              # Role dashboards & auth views
│   │   │   ├── CompanyDashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── TPODashboard.jsx
│   │   ├── services/           # Axios API instance with interceptors
│   │   ├── App.jsx             # Route definitions
│   │   └── index.css           # Global typography & UI styling
│   ├── .env.example            # Frontend environment template
│   └── vercel.json             # Vercel SPA routing rewrite
│
├── server/                     # Backend API (Express & Node)
│   ├── config/                 # MongoDB database connection
│   ├── controllers/            # Route business logic
│   │   ├── adminController.js
│   │   ├── applicationController.js
│   │   ├── authController.js
│   │   ├── companyController.js
│   │   ├── jobController.js
│   │   ├── notificationController.js
│   │   └── studentController.js
│   ├── middleware/             # Auth & upload middleware
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/                 # Mongoose schemas
│   │   ├── Application.js
│   │   ├── Company.js
│   │   ├── Job.js
│   │   ├── Notification.js
│   │   ├── StudentProfile.js
│   │   └── User.js
│   ├── routes/                 # Express API routes
│   ├── seed/                   # TPO creation script
│   │   └── createTPO.js
│   ├── utils/                  # Eligibility & notification helpers
│   ├── .env.example            # Backend environment template
│   └── server.js               # Express application entrypoint
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or free MongoDB Atlas cluster
- **Cloudinary Account**: Free Cloudinary account for resume PDF storage

---

### 2. Backend Setup

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   **Required `.env` fields:**
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/placement_portal
   JWT_SECRET=your_super_secret_jwt_key
   CLIENT_URL=http://localhost:5173,http://localhost:5174
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   TPO_EMAIL=tpo@college.com
   TPO_PASSWORD=tpo12345
   TPO_NAME=Placement Officer
   ```

4. Create the initial TPO administrator account:
   ```bash
   node seed/createTPO.js
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend server runs at `http://localhost:5000`.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure it points to your backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173` (or the port indicated in your console).

---

## 📡 API Endpoints Reference

### Health
- `GET /api/health` — System uptime and status

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student or company user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/auth/me` — Retrieve current authenticated user

### Students (`/api/students`)
- `GET /api/students/profile` — Get logged-in student profile
- `POST /api/students/profile` — Create / update profile
- `POST /api/students/resume` — Upload resume PDF to Cloudinary

### Companies (`/api/companies`)
- `GET /api/companies/profile` — Get company profile
- `PUT /api/companies/profile` — Update company profile

### Jobs (`/api/jobs`)
- `GET /api/jobs` — Get all active jobs (students only receive eligible jobs)
- `POST /api/jobs` — Create new job posting (approved companies only)
- `GET /api/jobs/my` — Get jobs posted by logged-in company

### Applications (`/api/applications`)
- `POST /api/applications` — Apply to a job (student only)
- `GET /api/applications/my` — Get student's applications
- `GET /api/applications/job/:jobId` — Get applicants for a company's job
- `PATCH /api/applications/:id/status` — Update application status (`shortlisted`, `interview`, `selected`, `rejected`)

### Admin / TPO (`/api/admin`)
- `GET /api/admin/companies` — List pending/approved companies
- `PATCH /api/admin/companies/:id/status` — Approve or reject company
- `GET /api/admin/analytics` — Placement analytics with optional `?batch=2026`

### Notifications (`/api/notifications`)
- `GET /api/notifications` — Fetch recent notifications and unread count
- `PATCH /api/notifications/:id/read` — Mark notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read

---

## 🌐 Production Deployment Guide

### A. MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, add `0.0.0.0/0` (or your hosting IP).
3. Under **Database Access**, create a database user and password.
4. Copy the connection string (format: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/placement_portal?retryWrites=true&w=majority`).

### B. Backend Deployment (Render)
1. Push your repository to GitHub.
2. In Render, select **New Web Service** and connect your repository.
3. Set **Root Directory** to `server`.
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add Environment Variables:
   - `NODE_ENV=production`
   - `MONGO_URI=<your-atlas-uri>`
   - `JWT_SECRET=<strong-random-key>`
   - `CLIENT_URL=https://your-frontend.vercel.app`
   - `CLOUDINARY_CLOUD_NAME=<your-cloud-name>`
   - `CLOUDINARY_API_KEY=<your-api-key>`
   - `CLOUDINARY_API_SECRET=<your-api-secret>`
   - `TPO_EMAIL=tpo@college.com`
   - `TPO_PASSWORD=<strong-tpo-password>`

### C. Frontend Deployment (Vercel)
1. In Vercel, click **Add New Project** and import your repository.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL=https://your-render-backend.onrender.com/api`
7. Deploy. The included `vercel.json` ensures all client-side routes redirect correctly to `index.html`.
