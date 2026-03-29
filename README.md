# Easy Jobs 🚀

**AI-powered job matching that simplifies your job search.**  
Upload your profile, set preferences, and let us find the best-matched jobs from across the web.

🌐 **Live Demo:** [easy-jobs-five.vercel.app](https://easy-jobs-five.vercel.app)

---

## Features

- 🔍 **Real Job Listings** — Searches the web via JSearch API for verified, up-to-date postings
- 🎯 **Match Scoring** — Weighted AI score based on your skills, location, salary, experience & job type
- 🔖 **Save & Track** — Bookmark jobs and track your application status in one dashboard
- 📋 **My Applications** — View applied jobs with status tracking (Applied, Interview, Offer, Rejected)
- 👤 **Profile Management** — Skills, education, experience, preferences, and bio
- 🔐 **Authentication** — Secure sign up/login via Clerk

---

## Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React + Vite | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| framer-motion | Animations |
| Clerk | Authentication |
| TanStack Query | Data fetching |
| React Router | Navigation |
| shadcn/ui | UI components |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | API server |
| MongoDB Atlas | Database |
| Mongoose | ODM |
| Clerk (Express) | Auth middleware |
| JSearch API | Job data (via RapidAPI) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Clerk account
- RapidAPI account (JSearch API)

### Frontend Setup

```bash
cd easyjobs
npm install
```

Create `.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

### Backend Setup

```bash
cd easyjobs/backend
npm install
```

Create `backend/.env`:
```env
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
JSEARCH_API_KEY=your_jsearch_rapidapi_key
PORT=5000
```

```bash
npm run dev
```

---

## Deployment

Both frontend and backend are deployed separately on **Vercel**.

### Backend (deploy first)
- Root directory: `easyjobs/backend`
- Entry point: `server.js`
- Set env vars: `MONGODB_URI`, `CLERK_SECRET_KEY`, `JSEARCH_API_KEY`, `FRONTEND_URL`

### Frontend
- Root directory: `easyjobs`
- Framework: Vite (auto-detected)
- Set env vars: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL` (backend URL + `/api`)

---

## Project Structure

```
easyjobs/
├── src/
│   ├── components/
│   │   └── landing/        # Landing page sections
│   ├── pages/              # Dashboard, Profile, Auth, etc.
│   └── lib/api/            # API client
├── backend/
│   ├── routes/             # jobs.js, profile.js
│   ├── models/             # Profile.js (Mongoose)
│   └── server.js           # Express server
└── public/                 # Static assets
```

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk public key |
| `VITE_API_URL` | Frontend | Backend API base URL |
| `CLERK_SECRET_KEY` | Backend | Clerk secret key |
| `MONGODB_URI` | Backend | MongoDB connection string |
| `JSEARCH_API_KEY` | Backend | RapidAPI JSearch key |
| `FRONTEND_URL` | Backend | Frontend URL (for CORS) |

---

## License

MIT
