/* =====================================================================
   PEER-HUB DATABASE: SIMPLE, EXPLAINED VERSION
   How to run: open in MySQL Workbench, then press Ctrl+Shift+Enter
   (this runs the WHOLE file; plain Ctrl+Enter runs only one line).

   The file has 4 steps:
     STEP 1  Create the database
     STEP 2  Create the tables (where data is stored)
     STEP 3  Count everything (totals for the dashboard)
     STEP 4  Look at the details (who, what, when)
   ===================================================================== */


/* ---------------------------------------------------------------------
   STEP 1: CREATE THE DATABASE
   A database is the folder that holds all the tables.
   IF NOT EXISTS means: do nothing if it is already there.
   USE means: all the commands below work inside this database.
   --------------------------------------------------------------------- */
CREATE DATABASE IF NOT EXISTS peerhub;
USE peerhub;


/* ---------------------------------------------------------------------
   STEP 2: CREATE THE TABLES
   A table is like a spreadsheet: columns are the headings, rows are
   the records. PRIMARY KEY = a unique id for each row.
   FOREIGN KEY = a link to a row in another table.
   --------------------------------------------------------------------- */

-- USERS: everyone who can log in (students, alumni, admins)
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,           -- unique number for each user
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,             -- no two users share an email
  password_hash VARCHAR(255) NOT NULL,                    -- scrambled (bcrypt) password, never plain text
  role          ENUM('student','alumni','admin') NOT NULL DEFAULT 'student',
  is_verified   TINYINT(1) NOT NULL DEFAULT 0,            -- 1 = approved (alumni need admin approval)
  is_active     TINYINT(1) NOT NULL DEFAULT 1,            -- 0 = admin switched the account off
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROFILES: extra details about each user (one row per user)
CREATE TABLE IF NOT EXISTS profiles (
  user_id      INT PRIMARY KEY,                           -- same number as users.id
  headline     VARCHAR(150),
  bio          TEXT,
  skills       TEXT,                                      -- e.g. "react, node, sql"
  interests    TEXT,
  availability VARCHAR(100),
  branch       VARCHAR(100),
  year         VARCHAR(20),
  company      VARCHAR(120),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE   -- delete the user = delete the profile
);

-- PROJECTS: ideas that students create and teams work on
CREATE TABLE IF NOT EXISTS projects (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  owner_id        INT NOT NULL,                           -- the user who created it
  title           VARCHAR(150) NOT NULL,
  description     TEXT,
  required_skills TEXT,                                   -- used for skill matching
  max_members     INT DEFAULT 5,
  status          ENUM('open','in_progress','completed') DEFAULT 'open',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PROJECT_MEMBERS: who is on which team (links users to projects)
CREATE TABLE IF NOT EXISTS project_members (
  project_id INT,
  user_id    INT,
  role       VARCHAR(20) DEFAULT 'member',                -- 'owner' or 'member'
  PRIMARY KEY (project_id, user_id),                      -- a person can join a project only once
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- APPLICATIONS: requests to join a project
CREATE TABLE IF NOT EXISTS applications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id    INT NOT NULL,
  message    TEXT,
  status     ENUM('pending','accepted','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_app (project_id, user_id),                -- one application per person per project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- MESSAGES: chat. project_id filled = team chat; receiver_id filled = private chat
CREATE TABLE IF NOT EXISTS messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT NULL,
  sender_id   INT NOT NULL,
  receiver_id INT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- RESOURCES: shared links. project_id empty = shared with the whole campus
CREATE TABLE IF NOT EXISTS resources (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,                               -- who shared it
  project_id  INT NULL,
  title       VARCHAR(150) NOT NULL,
  url         VARCHAR(500) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NOTIFICATIONS: alerts shown in the bell / Alerts page
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,                                -- who receives it
  message    VARCHAR(300) NOT NULL,
  is_read    TINYINT(1) DEFAULT 0,                        -- 0 = unread, 1 = read
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- REVIEWS: teammates rate each other (1 to 5 stars) after a project ends
CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT NOT NULL,
  reviewer_id INT NOT NULL,                               -- who wrote it
  reviewee_id INT NOT NULL,                               -- who was rated
  rating      TINYINT NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review (project_id, reviewer_id, reviewee_id),  -- one review per teammate per project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- MENTORSHIP_REQUESTS: a student asks an alumni to be their mentor
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  alumni_id  INT NOT NULL,
  message    TEXT,
  status     ENUM('pending','accepted','declined') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mentor (student_id, alumni_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (alumni_id)  REFERENCES users(id) ON DELETE CASCADE
);


/* ---------------------------------------------------------------------
   STEP 3: COUNT EVERYTHING
   COUNT(*) = "how many rows?".
   WHERE    = "only count rows that match this condition".
   UNION ALL stacks many small queries into one result table, so you get
   one list: left column = what was counted, right column = the number.
   --------------------------------------------------------------------- */
SELECT 'Total users' AS item, COUNT(*) AS total FROM users                           -- everyone
UNION ALL SELECT 'Students',             COUNT(*) FROM users WHERE role = 'student'  -- only students
UNION ALL SELECT 'Alumni',               COUNT(*) FROM users WHERE role = 'alumni'
UNION ALL SELECT 'Unverified alumni',    COUNT(*) FROM users WHERE role = 'alumni' AND is_verified = 0  -- waiting for admin
UNION ALL SELECT 'Projects',             COUNT(*) FROM projects
UNION ALL SELECT 'Open projects',        COUNT(*) FROM projects WHERE status = 'open'
UNION ALL SELECT 'Completed projects',   COUNT(*) FROM projects WHERE status = 'completed'
UNION ALL SELECT 'Team members',         COUNT(*) FROM project_members
UNION ALL SELECT 'Pending applications', COUNT(*) FROM applications WHERE status = 'pending'
UNION ALL SELECT 'Messages',             COUNT(*) FROM messages
UNION ALL SELECT 'Resources',            COUNT(*) FROM resources
UNION ALL SELECT 'Unread alerts',        COUNT(*) FROM notifications WHERE is_read = 0
UNION ALL SELECT 'Reviews',              COUNT(*) FROM reviews
UNION ALL SELECT 'Mentorship requests',  COUNT(*) FROM mentorship_requests;


/* ---------------------------------------------------------------------
   STEP 4: LOOK AT THE DETAILS
   JOIN = combine two tables using the link between them, so we can show
   names instead of id numbers.
   ORDER BY = sort.   LIMIT = show only the first few rows.
   --------------------------------------------------------------------- */

-- 4a. All users and their status
SELECT id, name, email, role, is_verified, is_active FROM users;

-- 4b. Projects with the owner's name and how many people are on the team
--     LEFT JOIN keeps projects even if nobody has joined yet.
--     GROUP BY + COUNT = count the members of each project separately.
SELECT p.id, p.title, p.status, u.name AS owner, COUNT(m.user_id) AS members
FROM projects p
JOIN users u ON u.id = p.owner_id
LEFT JOIN project_members m ON m.project_id = p.id
GROUP BY p.id, p.title, p.status, u.name
ORDER BY p.created_at DESC;                 -- newest first

-- 4c. Applications that still need an answer from the project owner
SELECT a.id, p.title AS project, u.name AS applicant, a.message
FROM applications a
JOIN projects p ON p.id = a.project_id
JOIN users u    ON u.id = a.user_id
WHERE a.status = 'pending';

-- 4d. Best-rated people (AVG = average of the star ratings)
SELECT u.name, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(*) AS reviews
FROM reviews r
JOIN users u ON u.id = r.reviewee_id
GROUP BY u.id, u.name
ORDER BY avg_rating DESC, reviews DESC;

-- 4e. Mentorship requests with both names (the users table is used twice,
--     once for the student "s" and once for the alumni "a")
SELECT s.name AS student, a.name AS alumni, r.status, r.created_at
FROM mentorship_requests r
JOIN users s ON s.id = r.student_id
JOIN users a ON a.id = r.alumni_id
ORDER BY r.created_at DESC;

-- 4f. The 20 most recent team chat messages
SELECT m.created_at, p.title AS project, u.name AS sender, m.body
FROM messages m
JOIN users u    ON u.id = m.sender_id
JOIN projects p ON p.id = m.project_id
ORDER BY m.id DESC
LIMIT 20;


/* ---------------------------------------------------------------------
   AFTER RUNNING THIS FILE
   The admin login cannot be created in plain SQL because passwords are
   stored as bcrypt hashes. In PowerShell, inside the backend folder, run:
       npm run seed
   That creates admin@peerhub.com / Admin@123.
   --------------------------------------------------------------------- */
