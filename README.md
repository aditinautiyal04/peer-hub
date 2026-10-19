# PEER-HUB: Student Collaboration Platform

React (Vite) + Node.js/Express + MySQL + Socket.IO. JWT login, bcrypt passwords, three roles (student, alumni, admin).

## Features
Authentication and roles, profiles, skill-based matching, projects and teams, applications, real-time chat (team and private),
resource sharing, notifications, peer reviews, alumni mentorship, hackathons, admin dashboard, change password,
login rate limiting, deactivated users blocked instantly, installable as a phone app.

## Setup (local)
Needs Node.js 18+ and MySQL 8 (or XAMPP).

1. **Database.** In MySQL Workbench open `backend/database/peerhub_full_structured.sql` and press Ctrl+Shift+Enter.
   It creates the database, 12 tables and demo data (12 users, 13 projects, hackathons).
   For tables only, use `backend/database/schema.sql`.
2. **Backend**
   ```
   cd backend
   copy .env.example .env      (set DB_PASSWORD and JWT_SECRET)
   npm install
   npm run seed                (creates admin@peerhub.com / Admin@123)
   npm run dev                 (http://localhost:5000)
   ```
3. **Frontend**
   ```
   cd frontend
   copy .env.example .env
   npm install
   npm run dev                 (http://localhost:5173)
   ```

## Logins
- Admin: admin@peerhub.com / Admin@123
- Demo users (password `Password@123`): aarav@peerhub.demo, priya@peerhub.demo, rohan@peerhub.demo (students),
  neha@peerhub.demo, rahul@peerhub.demo, ishita@peerhub.demo (verified alumni), aditya@peerhub.demo (unverified alumni)

## Run as one website
```
cd frontend && npm run build
cd ../backend && npm run dev     (open http://localhost:5000)
```
The backend serves the built frontend, so one address opens the whole app.

## Put it online (Render + cloud MySQL)
Root `package.json` provides `npm run build` and `npm start`. Set these environment variables on the host:
`DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL=true, JWT_SECRET`.
Create the online tables and admin once with `node backend/database/init_cloud.js --demo` (set the DB variables first).

## Folder structure
```
backend/
  database/   schema.sql, hackathons.sql, peerhub_full_structured.sql, peerhub_sample_data.sql,
              peerhub_dashboard.sql, seed.js, seed_resources.js, init_cloud.js
  src/        server.js, socket.js, config/db.js
              middleware/  auth.js (JWT + roles + verified alumni), rateLimit.js
              routes/      auth, profile, projects, match, chat, resources, notifications,
                           reviews, mentorship, hackathons, dashboard, admin
              utils/       match.js (scoring), notify.js, ah.js
frontend/
  public/     app icons and manifest
  src/        App.jsx, auth.jsx, api.js, socket.js, styles.css
              pages/       Auth, Dashboard, Projects, ProjectDetail, Matches, Mentorship,
                           Hackathons, Resources, Notifications, Profile, Admin
              components/  Chat, ResourceList, Avatar, Empty, Art
```

## Roles
- **Student:** profile, matches, apply to projects, chat, request mentors, review peers, join hackathons
- **Alumni:** mentor (after admin verification), share resources, post hackathons, create projects
- **Admin:** verify alumni, deactivate users, delete projects and hackathons, platform statistics
