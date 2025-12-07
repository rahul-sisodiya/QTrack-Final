# QTrack – Technology & Implementation Overview

This document explains the complete stack used to build QTrack, including modules, libraries, dependencies, environment variables, local development, and deployment steps.

## Project Structure

- Root
  - `client/` – React (Vite) frontend
  - `server/` – Node/Express backend (API), MongoDB via Mongoose
  - `server/api/index.js` – Serverless handler for Vercel (`/api/*`)
  - `server/vercel.json` – Vercel routing config for API

## Frontend (client)

- Framework: React (SPA)
- Dev bundler: Vite (rolldown-vite@7.1.14)
- Router: `react-router-dom`
- Realtime (client-side only): `socket.io-client` (note: serverless hosting won’t support sockets)
- Styling: plain CSS with small utility classes
- State: lightweight `AuthContext` for auth/session

### Client Dependencies

- `react` `^19.1.1`
- `react-dom` `^19.1.1`
- `react-router-dom` `^7.9.4`
- `socket.io-client` `^4.8.1`

Dev Dependencies:

- `@vitejs/plugin-react` `^5.0.4`
- `vite` `npm:rolldown-vite@7.1.14`
- `eslint` and related plugins (optional for linting)

### Client Configuration

- `.env` (or Vercel Project Env Vars):
  - `VITE_API_URL` – base URL of the backend API
    - Local: `http://localhost:4002`
    - Vercel: `https://<your-server-project>.vercel.app`

### Client Code Highlights

- `src/context/AuthContext.jsx`
  - Handles login/register calls to backend, stores `token` and `user` in storage
  - Applies theme preferences via `/api/patient/preferences`
- `src/lib/api.js`
  - `API_URL` from `VITE_API_URL`
  - `apiFetch` wrapper adds JSON headers, auth token, and error normalization
  - Organized endpoints: `auth`, `doctor`, `patient`, `admin`, `chat`, `ai`
- `src/pages/auth/Login.jsx`, `Register.jsx`
  - Forms posting to `/api/auth/login` and `/api/auth/register`
  - UI surfaces precise server error messages
- `src/pages/patient/AI.jsx`
  - Chat UI that calls `/api/ai/ask`, `/api/ai/sessions`, `/api/ai/sessions/:id/messages`

## Backend (server)

- Runtime: Node.js (recommended: v20 LTS for production)
- Framework: Express
- Database: MongoDB Atlas via Mongoose
- Auth: JWT (`jsonwebtoken`) + `bcryptjs` for password hashing
- CORS: `cors` with allowed origin(s)
- Config: `dotenv` for env management
- AI: Google Generative AI via `@google/generative-ai`
- Sockets: `socket.io` (works locally; not supported on Vercel serverless)

### Server Dependencies

- `express` `^4.19.2`
- `mongoose` `^7.8.0`
- `cors` `^2.8.5`
- `dotenv` `^16.4.5`
- `bcryptjs` `^2.4.3`
- `jsonwebtoken` `^9.0.2`
- `socket.io` `^4.8.1`
- `@google/generative-ai` `^0.24.1`
- `serverless-http` `^3.2.0` (present; serverless handler uses direct import instead)

### Server Configuration (.env)

- `PORT` – local port (e.g., `4002`) – not used on Vercel serverless
- `MONGO_URI` – Atlas connection string; include a database (e.g., `/qtrack`)
- `MONGO_DB` – optional explicit db name (e.g., `qtrack`)
- `JWT_SECRET` – strong secret for signing tokens
- `ALLOWED_ORIGINS` – comma-separated allowed origins (e.g., `http://localhost:5174,https://<client>.vercel.app`)
- `GEMINI_API_KEY` – Gemini API key
- `GEMINI_MODEL` – e.g., `gemini-1.5-flash` or `gemini-2.0-flash`
- `GEMINI_API_VERSION` – `v1`

### Server Code Highlights

- `server/index.js`
  - Creates HTTP server, initializes Socket.IO (local only), attaches `io` to requests
- `server/app.js`
  - Loads env, configures CORS
  - `connectDB()` (Mongoose) with detailed logging
  - Health route: `/api/health`
  - Auth routes: `/api/auth/register`, `/api/auth/login`
  - Patient, Doctor, Admin routes: appointments, profiles, dashboards
  - Queue routes: join, status, serve, cancel, defer
  - Records routes: upload/list/delete
  - Chat routes: rooms, messages (doctor-patient chat)
  - AI routes: `/api/ai/ask`, `/api/ai/sessions`, `/api/ai/sessions/:id/messages`
- `server/routes/ai.js`
  - Validates patient via JWT or `patientId`
  - Persists sessions and messages (`AIChatSession`, `AIMessage`)
  - Calls Gemini model with persona “Q”
- `server/db.js`
  - Validates `MONGO_URI`, connects with `serverSelectionTimeoutMS` and optional `dbName`

### Data Models

- `User` – name, email (unique), passwordHash, role (`doctor|patient|admin`)
- `Doctor` – `userId`, specialization, clinicAddress, phone, availability
- `Patient` – `userId`, age, phone
- `Appointment` – doctorId, patientId, date, time, status, notes
- `ChatRoom` – doctorId, patientId
- `Message` – roomId, senderRole (`doctor|patient`), text
- `Queue` – doctorId, patientId, status, position
- `HealthRecord` – patientId, date, type, doctorName, fileUrl, notes
- `AIChatSession` – patientId, title, lastUsedAt
- `AIMessage` – sessionId, role (`user|ai`), text

## Environment Setup (Local)

1. Create `server/.env`:
   - `PORT=4002`
   - `MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/qtrack?retryWrites=true&w=majority&appName=<app>`
   - `MONGO_DB=qtrack`
   - `JWT_SECRET=<your-secret>`
   - `ALLOWED_ORIGINS=http://localhost:5174`
   - `GEMINI_API_KEY=<key>`
   - `GEMINI_MODEL=gemini-1.5-flash`
   - `GEMINI_API_VERSION=v1`
2. Create `client/.env`:
   - `VITE_API_URL=http://localhost:4002`
3. Install deps:
   - In `server/`: `npm install`
   - In `client/`: `npm install`
4. Seed demo data (optional):
   - Start backend, then POST to `/api/seed` OR run `node server/seed.js`
5. Run:
   - Backend: `cd server && npm run dev`
   - Frontend: `cd client && npm run dev` (default on `5174`)

## API Endpoints (Selected)

- Auth
  - `POST /api/auth/register` – create user (doctor/patient/admin)
  - `POST /api/auth/login` – returns `{ token, user }`
- Patient
  - `GET /api/patient/me` – patientId via token or `userId`
  - `POST /api/patient/appointments` – create appointment
- Doctor
  - `GET /api/doctor/dashboard/:doctorId` – summary
  - `GET /api/doctor/appointments` – list (uses JWT if provided)
- Queue
  - `POST /api/queue/join` – add patient to queue
  - `GET /api/queue/status/:queueId`
- Records
  - `POST /api/records/upload`, `GET /api/records/patient/:patientId`, `DELETE /api/records/:id`
- Chat
  - `POST /api/chat/room`, `GET /api/chat/rooms/*`, `POST /api/chat/messages`
- AI (requires patient auth)
  - `POST /api/ai/ask` – returns `{ reply, sessionId }`
  - `GET /api/ai/sessions` – list sessions
  - `GET /api/ai/sessions/:id/messages` – session messages

## Deployment (Vercel)

Deploy backend and frontend as separate Vercel projects:

### Backend (server)

- Project Root: `server`
- Vercel detects `server/api/index.js` and `server/vercel.json` for `/api/*`
- Set Env Vars on Vercel:
  - `MONGO_URI`, `MONGO_DB`, `JWT_SECRET`, `GEMINI_*`, `ALLOWED_ORIGINS=https://<your-client>.vercel.app`
- Verify:
  - `GET https://<server>.vercel.app/api/health` → `{ status: "ok" }`
  - Seed (optional): `POST https://<server>.vercel.app/api/seed`

### Frontend (client)

- Project Root: `client`
- Env Vars:
  - `VITE_API_URL=https://<server>.vercel.app`
- After deploy, test auth and navigations:
  - Register/login → `/<role>/dashboard`
  - Patient AI page → asks via `/api/ai/ask`

### Notes

- Socket.IO is not supported on serverless platforms (sessions are ephemeral). For realtime features, deploy backend on a persistent host (Render/Fly/EC2) and point `VITE_API_URL` to it.
- Ensure Atlas network access allows Vercel egress IPs or set appropriate IP rules.

## Operational Tips

- CORS:
  - `ALLOWED_ORIGINS` must include your client origin (local and prod). Multiple origins can be comma-separated.
- Auth:
  - Tokens signed with `JWT_SECRET`; patient/doctor routes rely on `Authorization: Bearer <token>`.
- Errors:
  - Client `apiFetch` surfaces backend `message` for usability.
- AI:
  - Requires `GEMINI_API_KEY`. The persona is “Q”, providing general health info (no medical advice).

## How This Was Built

1. Planned a simple, modular Express API with MongoDB schemas for users, appointments, chat, queues, and AI.
2. Implemented auth first (register/login) with secure hashing and tokens.
3. Added patient and doctor flows (appointments, dashboards, records).
4. Implemented chat (rooms/messages) and queues with minimal emit hooks (future realtime).
5. Built the React app with pages for auth, dashboards, patient tools, and Q (AI).
6. Integrated AI using Gemini SDK with a safe, helpful persona.
7. Optimized DX: clear errors, CORS config, seed scripts, and environment guides.
8. Prepared Vercel serverless handler and rewrites for `/api/*` deployment.