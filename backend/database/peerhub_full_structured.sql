/* =====================================================================
   PEER-HUB: COMPLETE DATABASE SCRIPT (structured)
   Run the WHOLE file in MySQL Workbench with Ctrl+Shift+Enter.
   Safe to run again: tables use IF NOT EXISTS and demo data is replaced.

   CONTENTS
     PART 1  Database and 12 tables
     PART 2  Demo users, projects, teams, chats, reviews, mentorship
     PART 3  Demo hackathons and registrations
     PART 4  Checks: totals and quick reports

   Demo logins: aarav@peerhub.demo, neha@peerhub.demo, and so on.
   Password for every demo user: Password@123
   (the admin account comes from "npm run seed", not from this file)
   ===================================================================== */


/* #####################################################################
   PART 1: DATABASE AND TABLES
   ##################################################################### */
CREATE DATABASE IF NOT EXISTS peerhub;
USE peerhub;

/* People */
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

/* Projects and teams */
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

/* Communication and sharing */
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

/* Feedback and mentoring */
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

/* Hackathons */
-- HACKATHONS: events posted by admins and verified alumni
CREATE TABLE IF NOT EXISTS hackathons (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  organizer_id INT NOT NULL,                                -- admin or verified alumni who posted it
  title        VARCHAR(150) NOT NULL,
  description  TEXT,
  event_date   DATE NOT NULL,
  mode         ENUM('online','offline','hybrid') DEFAULT 'online',
  location     VARCHAR(150),
  link         VARCHAR(500),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);
-- HACKATHON_PARTICIPANTS: which students registered, and the team they entered with
CREATE TABLE IF NOT EXISTS hackathon_participants (
  hackathon_id INT,
  user_id      INT,
  project_id   INT NULL,                                    -- optional: the team they enter with
  joined_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (hackathon_id, user_id),
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (project_id)   REFERENCES projects(id)   ON DELETE SET NULL
);


/* #####################################################################
   PART 2: DEMO DATA  (12 users, 13 projects, teams, chats, reviews)
   ##################################################################### */
USE peerhub;

-- Workbench blocks DELETE on non-key conditions unless safe mode is off
SET SQL_SAFE_UPDATES = 0;
DELETE FROM users WHERE email LIKE '%@peerhub.demo';
SET SQL_SAFE_UPDATES = 1;

SET @pw := '$2b$10$eIJYknfpAboI0wVGZVKph.fSyu2L.IzyDqu16hDN4y8NDqDn26bvC';

-- ---------- 1. USERS ----------
INSERT INTO users (name, email, password_hash, role, is_verified, is_active) VALUES
('Aarav Sharma', 'aarav@peerhub.demo', @pw, 'student', 1, 1),
('Priya Nair', 'priya@peerhub.demo', @pw, 'student', 1, 1),
('Rohan Mehta', 'rohan@peerhub.demo', @pw, 'student', 1, 1),
('Ananya Iyer', 'ananya@peerhub.demo', @pw, 'student', 1, 1),
('Kabir Singh', 'kabir@peerhub.demo', @pw, 'student', 1, 1),
('Meera Joshi', 'meera@peerhub.demo', @pw, 'student', 1, 1),
('Vikram Rao', 'vikram@peerhub.demo', @pw, 'student', 1, 1),
('Sneha Patel', 'sneha@peerhub.demo', @pw, 'student', 1, 1),
('Neha Kapoor', 'neha@peerhub.demo', @pw, 'alumni', 1, 1),
('Rahul Verma', 'rahul@peerhub.demo', @pw, 'alumni', 1, 1),
('Ishita Bansal', 'ishita@peerhub.demo', @pw, 'alumni', 1, 1),
('Aditya Khanna', 'aditya@peerhub.demo', @pw, 'alumni', 0, 1);

-- Keep each user's id in a variable so the rest of the script can use names
SET @aarav := (SELECT id FROM users WHERE email = 'aarav@peerhub.demo');
SET @priya := (SELECT id FROM users WHERE email = 'priya@peerhub.demo');
SET @rohan := (SELECT id FROM users WHERE email = 'rohan@peerhub.demo');
SET @ananya := (SELECT id FROM users WHERE email = 'ananya@peerhub.demo');
SET @kabir := (SELECT id FROM users WHERE email = 'kabir@peerhub.demo');
SET @meera := (SELECT id FROM users WHERE email = 'meera@peerhub.demo');
SET @vikram := (SELECT id FROM users WHERE email = 'vikram@peerhub.demo');
SET @sneha := (SELECT id FROM users WHERE email = 'sneha@peerhub.demo');
SET @neha := (SELECT id FROM users WHERE email = 'neha@peerhub.demo');
SET @rahul := (SELECT id FROM users WHERE email = 'rahul@peerhub.demo');
SET @ishita := (SELECT id FROM users WHERE email = 'ishita@peerhub.demo');
SET @aditya := (SELECT id FROM users WHERE email = 'aditya@peerhub.demo');

-- ---------- 2. PROFILES ----------
INSERT INTO profiles (user_id, headline, bio, skills, interests, availability, branch, year, company) VALUES
(@aarav, 'Full-stack developer in the making', 'Third-year student who loves building web apps with friends.', 'react, node, mysql, javascript', 'web development, hackathons', 'Weekends, 10 hrs/week', 'Computer Science', '3rd', NULL),
(@priya, 'Frontend and UI enthusiast', 'I enjoy turning designs into clean interfaces.', 'react, css, figma, javascript', 'design, startups', 'Evenings, 8 hrs/week', 'Information Technology', '3rd', NULL),
(@rohan, 'Backend and databases', 'Likes APIs, SQL and making things fast.', 'node, express, mysql, sql', 'databases, backend, placements', 'Weekdays after 5 pm', 'Computer Science', '4th', NULL),
(@ananya, 'Machine learning learner', 'Exploring NLP and building small AI tools.', 'python, nlp, pandas, flask', 'machine learning, ai, research', 'Weekends, 12 hrs/week', 'Data Science', '3rd', NULL),
(@kabir, 'Real-time apps and hackathons', 'Always up for a hackathon weekend.', 'node, socket.io, react, mongodb', 'hackathons, real-time apps, gaming', 'Flexible', 'Computer Science', '2nd', NULL),
(@meera, 'UI/UX designer who codes', 'Designs in Figma and ships in React.', 'figma, design, react, css', 'ui design, product, accessibility', 'Evenings, 6 hrs/week', 'Information Technology', '3rd', NULL),
(@vikram, 'Python and cloud basics', 'Automating boring things with scripts.', 'python, docker, flask, sql', 'cloud, devops, automation', 'Weekends', 'Electronics', '4th', NULL),
(@sneha, 'Aspiring product engineer', 'Learning to build products end to end.', 'javascript, react, mysql, design', 'product, startups, web development', 'Weekdays, 6 hrs/week', 'Computer Science', '2nd', NULL),
(@neha, 'Senior Software Engineer', 'Happy to mentor on full-stack, system design and interviews.', 'node, react, system design, mysql', 'web development, mentoring, interviews', 'Saturday mornings', 'Computer Science', 'Alumni 2016', 'TechNova'),
(@rahul, 'Backend Lead', 'Mentoring students on backend, databases and placements.', 'node, sql, docker, python', 'databases, backend, placements', 'Sunday evenings', 'Information Technology', 'Alumni 2014', 'CloudCraft'),
(@ishita, 'Data Scientist', 'Guiding students into data and machine learning careers.', 'python, nlp, pandas, machine learning', 'machine learning, ai, research', 'Weekday evenings', 'Data Science', 'Alumni 2018', 'DataBridge'),
(@aditya, 'Product Designer', 'Newly registered alumni waiting for verification.', 'figma, design, ux research', 'design, product', 'Flexible', 'Information Technology', 'Alumni 2020', 'Pixel Labs');

-- ---------- 3. PROJECTS (the last number sets how many days ago it was created) ----------
INSERT INTO projects (owner_id, title, description, required_skills, max_members, status, created_at) VALUES
(@aarav, 'Campus Event Planner', 'A web app where clubs publish events, collect RSVPs and share updates with students.', 'react, node, mysql', 5, 'in_progress', NOW() - INTERVAL 20 DAY),
(@priya, 'Study Buddy Matcher', 'Match students into study groups by subject, schedule and learning style.', 'python, flask, sql', 4, 'open', NOW() - INTERVAL 15 DAY),
(@rohan, 'Placement Prep Tracker', 'Track coding problems, mock interviews and application status in one place.', 'react, node, mysql', 4, 'completed', NOW() - INTERVAL 60 DAY),
(@ananya, 'AI Notes Summarizer', 'Turns long lecture notes into short summaries and key points using NLP.', 'python, nlp, react', 5, 'in_progress', NOW() - INTERVAL 12 DAY),
(@kabir, 'Hackathon Team Finder', 'Find teammates for hackathons by skill, with live chat to plan quickly.', 'node, react, socket.io', 6, 'open', NOW() - INTERVAL 6 DAY),
(@meera, 'Alumni Connect App', 'A clean mobile-first directory where students discover and message alumni.', 'design, figma, react', 4, 'completed', NOW() - INTERVAL 75 DAY),
(@vikram, 'Smart Attendance Tracker', 'Mark class attendance by scanning a QR code and see simple reports for every subject.', 'python, flask, sql', 4, 'open', NOW() - INTERVAL 9 DAY),
(@sneha, 'Campus Marketplace', 'Students buy, sell and swap books and gadgets with listings, search and seller chat.', 'react, node, mysql', 5, 'in_progress', NOW() - INTERVAL 25 DAY),
(@priya, 'Mock Interview Scheduler', 'Book mock interviews with alumni volunteers and get feedback after each session.', 'react, node, socket.io', 4, 'in_progress', NOW() - INTERVAL 18 DAY),
(@aarav, 'Open Source Contribution Club', 'A student group that picks open source projects, files issues and sends pull requests together.', 'javascript, git, react', 5, 'completed', NOW() - INTERVAL 90 DAY),
(@neha, 'Career Roadmap Portal', 'Maps skills and milestones from first year to placement, with mentor tips for each step.', 'react, node, mysql', 6, 'in_progress', NOW() - INTERVAL 30 DAY),
(@ananya, 'Resume Analyzer', 'Scores a resume against a job description and suggests clear improvements.', 'python, nlp, flask', 4, 'completed', NOW() - INTERVAL 110 DAY),
(@meera, 'Campus Lost and Found', 'A photo board for lost items with claim requests and status updates.', 'react, node, mysql', 4, 'open', NOW() - INTERVAL 4 DAY);
SET @p1 := (SELECT id FROM projects WHERE owner_id = @aarav AND title = 'Campus Event Planner');
SET @p2 := (SELECT id FROM projects WHERE owner_id = @priya AND title = 'Study Buddy Matcher');
SET @p3 := (SELECT id FROM projects WHERE owner_id = @rohan AND title = 'Placement Prep Tracker');
SET @p4 := (SELECT id FROM projects WHERE owner_id = @ananya AND title = 'AI Notes Summarizer');
SET @p5 := (SELECT id FROM projects WHERE owner_id = @kabir AND title = 'Hackathon Team Finder');
SET @p6 := (SELECT id FROM projects WHERE owner_id = @meera AND title = 'Alumni Connect App');
SET @p7 := (SELECT id FROM projects WHERE owner_id = @vikram AND title = 'Smart Attendance Tracker');
SET @p8 := (SELECT id FROM projects WHERE owner_id = @sneha AND title = 'Campus Marketplace');
SET @p9 := (SELECT id FROM projects WHERE owner_id = @priya AND title = 'Mock Interview Scheduler');
SET @p10 := (SELECT id FROM projects WHERE owner_id = @aarav AND title = 'Open Source Contribution Club');
SET @p11 := (SELECT id FROM projects WHERE owner_id = @neha AND title = 'Career Roadmap Portal');
SET @p12 := (SELECT id FROM projects WHERE owner_id = @ananya AND title = 'Resume Analyzer');
SET @p13 := (SELECT id FROM projects WHERE owner_id = @meera AND title = 'Campus Lost and Found');

-- ---------- 4. TEAM MEMBERS ----------
INSERT INTO project_members (project_id, user_id, role) VALUES
(@p1, @aarav, 'owner'),
(@p1, @priya, 'member'),
(@p1, @rohan, 'member'),
(@p2, @priya, 'owner'),
(@p2, @ananya, 'member'),
(@p3, @rohan, 'owner'),
(@p3, @kabir, 'member'),
(@p3, @meera, 'member'),
(@p4, @ananya, 'owner'),
(@p4, @vikram, 'member'),
(@p4, @aarav, 'member'),
(@p5, @kabir, 'owner'),
(@p6, @meera, 'owner'),
(@p6, @sneha, 'member'),
(@p6, @vikram, 'member'),
(@p7, @vikram, 'owner'),
(@p8, @sneha, 'owner'),
(@p8, @kabir, 'member'),
(@p8, @rohan, 'member'),
(@p9, @priya, 'owner'),
(@p9, @kabir, 'member'),
(@p9, @meera, 'member'),
(@p10, @aarav, 'owner'),
(@p10, @rohan, 'member'),
(@p10, @ananya, 'member'),
(@p10, @sneha, 'member'),
(@p11, @neha, 'owner'),
(@p11, @aarav, 'member'),
(@p11, @ananya, 'member'),
(@p11, @vikram, 'member'),
(@p12, @ananya, 'owner'),
(@p12, @vikram, 'member'),
(@p12, @rohan, 'member'),
(@p13, @meera, 'owner'),
(@p13, @sneha, 'member');

-- ---------- 5. APPLICATIONS (accepted, pending and rejected) ----------
INSERT INTO applications (project_id, user_id, message, status) VALUES
(@p1, @priya, 'Hi! I have built several React forms and would love to own the RSVP flow.', 'accepted'),
(@p1, @rohan, 'I can design the MySQL schema and the events API.', 'accepted'),
(@p1, @sneha, 'I am learning React and would like to help with testing and small UI tasks.', 'pending'),
(@p2, @ananya, 'I can build the matching logic in Python.', 'accepted'),
(@p2, @kabir, 'Interested in the real-time study room idea.', 'rejected'),
(@p3, @kabir, 'I can add live notifications to the tracker.', 'accepted'),
(@p3, @meera, 'I will design the dashboard and keep the UI consistent.', 'accepted'),
(@p4, @vikram, 'I have worked with Python text processing and can prototype the pipeline.', 'accepted'),
(@p4, @aarav, 'I can build the React upload page.', 'accepted'),
(@p5, @priya, 'I can design and build the team profile cards.', 'pending'),
(@p5, @vikram, 'I can set up the backend deployment with Docker.', 'pending'),
(@p6, @sneha, 'I enjoy UI work and can help build the directory pages.', 'accepted'),
(@p6, @vikram, 'I can handle search and filtering.', 'accepted'),
(@p7, @ananya, 'I can help with the reports and charts.', 'pending'),
(@p7, @kabir, 'I can build the QR scanning screen.', 'pending'),
(@p7, @priya, 'I would like to design the attendance dashboard.', 'rejected'),
(@p8, @kabir, 'I can add real-time buyer and seller chat.', 'accepted'),
(@p8, @rohan, 'I can build the listings API and image upload.', 'accepted'),
(@p8, @vikram, 'I can help with deployment and testing.', 'pending'),
(@p9, @kabir, 'I can add live availability updates with sockets.', 'accepted'),
(@p9, @meera, 'I will design the booking flow in Figma.', 'accepted'),
(@p9, @sneha, 'I can help build the confirmation pages.', 'pending'),
(@p10, @rohan, 'I want to learn Git workflows by contributing.', 'accepted'),
(@p10, @ananya, 'I can improve documentation and write tests.', 'accepted'),
(@p10, @sneha, 'New to open source and eager to learn.', 'accepted'),
(@p11, @aarav, 'I can build the roadmap timeline in React.', 'accepted'),
(@p11, @ananya, 'I can curate the skills and learning content.', 'accepted'),
(@p11, @vikram, 'I can handle the API and deployment.', 'accepted'),
(@p11, @priya, 'I can design the milestone cards.', 'pending'),
(@p11, @rohan, 'I can help model the data in MySQL.', 'pending'),
(@p12, @vikram, 'I can build the scoring pipeline.', 'accepted'),
(@p12, @rohan, 'I can build the API for uploads and results.', 'accepted'),
(@p12, @kabir, 'I would like to help with the frontend.', 'rejected'),
(@p13, @sneha, 'I can build the claim request flow.', 'accepted'),
(@p13, @priya, 'I can help with the photo upload design.', 'pending');

-- ---------- 6. MESSAGES (project_id filled = team chat, receiver_id filled = private mentor chat) ----------
INSERT INTO messages (project_id, sender_id, receiver_id, body, created_at) VALUES
(@p1, @aarav, NULL, 'Welcome team! I created the repo and the Trello board.', NOW() - INTERVAL 4300 MINUTE),
(@p1, @priya, NULL, 'Thanks! I will start on the RSVP form today.', NOW() - INTERVAL 4290 MINUTE),
(@p1, @rohan, NULL, 'I can take the backend API for events and the MySQL schema.', NOW() - INTERVAL 4280 MINUTE),
(@p1, @aarav, NULL, 'Perfect. Rohan on the API, Priya on the forms, I will do the calendar view.', NOW() - INTERVAL 4270 MINUTE),
(@p1, @priya, NULL, 'RSVP form is pushed to the dev branch. Can someone review it?', NOW() - INTERVAL 1500 MINUTE),
(@p1, @rohan, NULL, 'Reviewing now. Looks good, just one small fix for the email field.', NOW() - INTERVAL 1490 MINUTE),
(@p1, @aarav, NULL, 'Let us sync at 5 pm about the calendar view.', NOW() - INTERVAL 200 MINUTE),
(@p1, @priya, NULL, 'Works for me!', NOW() - INTERVAL 195 MINUTE),
(@p4, @ananya, NULL, 'Kickoff! The goal is to turn lecture notes into 5 key points.', NOW() - INTERVAL 3000 MINUTE),
(@p4, @vikram, NULL, 'I will prototype the summarization pipeline in Python this week.', NOW() - INTERVAL 2990 MINUTE),
(@p4, @aarav, NULL, 'I can build the React upload page. Do we accept PDF or only text?', NOW() - INTERVAL 2980 MINUTE),
(@p4, @ananya, NULL, 'Start with plain text and add PDF later.', NOW() - INTERVAL 2970 MINUTE),
(@p4, @vikram, NULL, 'Prototype works on short notes. Long documents need chunking.', NOW() - INTERVAL 600 MINUTE),
(@p3, @rohan, NULL, 'Final demo went great, thanks everyone!', NOW() - INTERVAL 20000 MINUTE),
(@p3, @kabir, NULL, 'Great teamwork. Posting reviews now.', NOW() - INTERVAL 19990 MINUTE),
(@p3, @meera, NULL, 'Loved building the dashboard UI with you both.', NOW() - INTERVAL 19980 MINUTE),
(@p6, @meera, NULL, 'The alumni directory is live. Thank you both!', NOW() - INTERVAL 30000 MINUTE),
(@p6, @sneha, NULL, 'Search feels fast. Proud of this one.', NOW() - INTERVAL 29990 MINUTE),
(NULL, @aarav, @neha, 'Hi Neha, thank you for accepting my mentorship request!', NOW() - INTERVAL 2500 MINUTE),
(NULL, @neha, @aarav, 'Happy to help. What are you focusing on this semester?', NOW() - INTERVAL 2490 MINUTE),
(NULL, @aarav, @neha, 'Full-stack projects and preparing for placements.', NOW() - INTERVAL 2480 MINUTE),
(NULL, @neha, @aarav, 'Great. Let us start with your resume and a walkthrough of your best project.', NOW() - INTERVAL 2470 MINUTE),
(NULL, @rohan, @rahul, 'Hello sir, could we discuss SQL optimization in our first session?', NOW() - INTERVAL 5000 MINUTE),
(NULL, @rahul, @rohan, 'Sure. Send me your slowest query and we will go through it together.', NOW() - INTERVAL 4990 MINUTE),
(NULL, @ananya, @ishita, 'Hi Ishita, I would love advice on a first NLP project.', NOW() - INTERVAL 3600 MINUTE),
(NULL, @ishita, @ananya, 'Nice. Start with text summarization, it ties well with your notes project.', NOW() - INTERVAL 3590 MINUTE),
(@p1, @rohan, NULL, 'Events API is deployed on the dev server.', NOW() - INTERVAL 150 MINUTE),
(@p1, @aarav, NULL, 'Great work. Demo to the club heads on Friday.', NOW() - INTERVAL 140 MINUTE),
(@p4, @aarav, NULL, 'Upload page now accepts text files up to 2 MB.', NOW() - INTERVAL 420 MINUTE),
(@p4, @ananya, NULL, 'Nice! I will test it with real lecture notes.', NOW() - INTERVAL 410 MINUTE),
(@p2, @priya, NULL, 'Welcome Ananya! Let us define the matching rules first.', NOW() - INTERVAL 3400 MINUTE),
(@p2, @ananya, NULL, 'I think subject plus availability should carry the most weight.', NOW() - INTERVAL 3390 MINUTE),
(@p2, @priya, NULL, 'Agreed. I will draft the schema tonight.', NOW() - INTERVAL 3380 MINUTE),
(@p2, @ananya, NULL, 'Matching script v1 is ready for testing.', NOW() - INTERVAL 800 MINUTE),
(@p5, @kabir, NULL, 'Looking for teammates who know React and design. Apply if you are interested!', NOW() - INTERVAL 700 MINUTE),
(@p7, @vikram, NULL, 'Idea: scan a QR code in class to mark attendance. Who wants to join?', NOW() - INTERVAL 500 MINUTE),
(@p8, @sneha, NULL, 'Marketplace kickoff! Listings, search and seller chat are the three core features.', NOW() - INTERVAL 2200 MINUTE),
(@p8, @kabir, NULL, 'I will wire up real-time chat between buyer and seller.', NOW() - INTERVAL 2190 MINUTE),
(@p8, @rohan, NULL, 'I will set up the listings table and image upload.', NOW() - INTERVAL 2180 MINUTE),
(@p8, @sneha, NULL, 'Search page is merged. Please pull the latest changes.', NOW() - INTERVAL 900 MINUTE),
(@p8, @kabir, NULL, 'Chat works locally. It needs testing with two users.', NOW() - INTERVAL 400 MINUTE),
(@p8, @rohan, NULL, 'I can test it tonight.', NOW() - INTERVAL 390 MINUTE),
(@p9, @priya, NULL, 'Goal: let students book mock interviews with alumni volunteers.', NOW() - INTERVAL 1800 MINUTE),
(@p9, @meera, NULL, 'I sketched the booking flow in Figma, sharing the link now.', NOW() - INTERVAL 1790 MINUTE),
(@p9, @kabir, NULL, 'Nice. I will add live availability updates with sockets.', NOW() - INTERVAL 1780 MINUTE),
(@p9, @priya, NULL, 'Calendar component is done. Next up is confirmation emails.', NOW() - INTERVAL 300 MINUTE),
(@p10, @aarav, NULL, 'We just merged our fiftieth pull request. Thank you all!', NOW() - INTERVAL 60000 MINUTE),
(@p10, @rohan, NULL, 'Best part was getting a maintainer to review our first patch.', NOW() - INTERVAL 59990 MINUTE),
(@p10, @ananya, NULL, 'The docs improvements got the most thumbs up.', NOW() - INTERVAL 59980 MINUTE),
(@p10, @sneha, NULL, 'Proud of what we built. Posting reviews now!', NOW() - INTERVAL 59970 MINUTE),
(@p11, @neha, NULL, 'Welcome! This portal will map career paths from first year to placement.', NOW() - INTERVAL 1200 MINUTE),
(@p11, @aarav, NULL, 'I can build the roadmap timeline view in React.', NOW() - INTERVAL 1190 MINUTE),
(@p11, @ananya, NULL, 'I will collect skill data and keep the roadmap content accurate.', NOW() - INTERVAL 1180 MINUTE),
(@p11, @vikram, NULL, 'I will handle the API and deployment.', NOW() - INTERVAL 1170 MINUTE),
(@p11, @neha, NULL, 'Great. Weekly review on Saturday mornings.', NOW() - INTERVAL 1160 MINUTE),
(@p11, @aarav, NULL, 'Timeline view is ready for feedback.', NOW() - INTERVAL 250 MINUTE),
(@p12, @ananya, NULL, 'Resume Analyzer is live. Thanks for the late nights!', NOW() - INTERVAL 45000 MINUTE),
(@p12, @vikram, NULL, 'The scoring pipeline held up well in testing.', NOW() - INTERVAL 44990 MINUTE),
(@p12, @rohan, NULL, 'Happy with the API response times.', NOW() - INTERVAL 44980 MINUTE),
(@p13, @meera, NULL, 'Idea: a campus lost and found board with photos and claim requests.', NOW() - INTERVAL 250 MINUTE),
(@p13, @sneha, NULL, 'I can help with the claim flow.', NOW() - INTERVAL 240 MINUTE),
(NULL, @aarav, @neha, 'Here is my resume. Any feedback?', NOW() - INTERVAL 900 MINUTE),
(NULL, @neha, @aarav, 'Strong projects. Add measurable results to each bullet.', NOW() - INTERVAL 880 MINUTE),
(NULL, @rohan, @rahul, 'Here is the query. It takes about 4 seconds.', NOW() - INTERVAL 4900 MINUTE),
(NULL, @rahul, @rohan, 'Add an index on the join column and avoid SELECT star.', NOW() - INTERVAL 4890 MINUTE),
(NULL, @rohan, @rahul, 'That brought it down to 80 ms. Thank you!', NOW() - INTERVAL 4700 MINUTE),
(NULL, @ananya, @ishita, 'Which dataset would you recommend for summarization?', NOW() - INTERVAL 3500 MINUTE),
(NULL, @ishita, @ananya, 'Try a news summarization dataset. It is a good fit for notes.', NOW() - INTERVAL 3480 MINUTE),
(NULL, @kabir, @neha, 'Hi Neha, could you review my hackathon project plan?', NOW() - INTERVAL 600 MINUTE),
(NULL, @neha, @kabir, 'Of course. Send me the doc and I will comment tonight.', NOW() - INTERVAL 580 MINUTE);

-- ---------- 7. RESOURCES (NULL project = shared with the whole campus) ----------
INSERT INTO resources (user_id, project_id, title, url, description) VALUES
(@neha, NULL, 'Learn Data Structures and Algorithms - GeeksforGeeks', 'https://www.geeksforgeeks.org', 'Topic-wise notes and practice questions, great for placement prep.'),
(@rahul, NULL, 'SQLBolt: Learn SQL with Interactive Lessons', 'https://sqlbolt.com', 'Short hands-on lessons that take you from SELECT to JOINs.'),
(@ishita, NULL, 'Kaggle Learn', 'https://www.kaggle.com/learn', 'Free micro-courses on Python, pandas and machine learning.'),
(@neha, NULL, 'CS50: Introduction to Computer Science', 'https://cs50.harvard.edu/x', 'A free, well-taught foundation course for any branch.'),
(@rahul, NULL, 'Docker: Get Started', 'https://docs.docker.com/get-started/', 'Containers explained from scratch, useful for deploying projects.'),
(@neha, NULL, 'Node.js Learn', 'https://nodejs.org/en/learn', 'Official guides for building and understanding Node apps.'),
(@aditya, NULL, 'Figma Learn', 'https://help.figma.com', 'Tutorials for UI design, prototyping and design systems.'),
(@rahul, NULL, 'Postman Learning Center', 'https://learning.postman.com', 'Test and document your APIs the professional way.'),
(@aarav, @p1, 'Express.js Guide', 'https://expressjs.com', 'Routing and middleware reference for our event API.'),
(@vikram, @p4, 'Hugging Face Course', 'https://huggingface.co/learn', 'Reference for the summarization models we are testing.'),
(@kabir, @p5, 'Socket.IO Docs', 'https://socket.io/docs/v4/', 'Rooms and events, for the live team chat.'),
(@rohan, @p8, 'Multer File Uploads', 'https://github.com/expressjs/multer', 'Middleware we use for listing photos.'),
(@meera, @p9, 'FullCalendar Docs', 'https://fullcalendar.io/docs', 'Calendar component for interview slots.'),
(@neha, @p11, 'Developer Roadmaps', 'https://roadmap.sh', 'Reference paths for the roadmap content.'),
(@vikram, @p12, 'spaCy Usage Guide', 'https://spacy.io/usage', 'NLP toolkit behind the resume scoring.');

-- ---------- 8. NOTIFICATIONS (is_read: 0 = unread, 1 = read) ----------
INSERT INTO notifications (user_id, message, is_read, created_at) VALUES
(@aarav, 'Priya Nair applied to Campus Event Planner', 1, NOW() - INTERVAL 3000 MINUTE),
(@aarav, 'Sneha Patel applied to Campus Event Planner', 0, NOW() - INTERVAL 300 MINUTE),
(@priya, 'Your application to Campus Event Planner was accepted', 1, NOW() - INTERVAL 4400 MINUTE),
(@priya, 'Your mentorship request to Neha Kapoor is pending', 0, NOW() - INTERVAL 100 MINUTE),
(@rohan, 'Placement Prep Tracker is complete. Please review your teammates', 1, NOW() - INTERVAL 20000 MINUTE),
(@rohan, 'Kabir Singh left you a 5-star review', 0, NOW() - INTERVAL 19000 MINUTE),
(@kabir, 'Priya Nair applied to Hackathon Team Finder', 0, NOW() - INTERVAL 500 MINUTE),
(@kabir, 'Vikram Rao applied to Hackathon Team Finder', 0, NOW() - INTERVAL 450 MINUTE),
(@ananya, 'Vikram Rao joined AI Notes Summarizer', 1, NOW() - INTERVAL 3100 MINUTE),
(@meera, 'Alumni Connect App is complete. Please review your teammates', 1, NOW() - INTERVAL 30000 MINUTE),
(@neha, 'Aarav Sharma requested your mentorship', 1, NOW() - INTERVAL 2600 MINUTE),
(@neha, 'Priya Nair requested your mentorship', 0, NOW() - INTERVAL 900 MINUTE),
(@neha, 'Vikram Rao requested your mentorship', 0, NOW() - INTERVAL 800 MINUTE),
(@rahul, 'Kabir Singh requested your mentorship', 0, NOW() - INTERVAL 700 MINUTE),
(@ishita, 'Ananya Iyer requested your mentorship', 1, NOW() - INTERVAL 3700 MINUTE),
(@sneha, 'Your application to Alumni Connect App was accepted', 1, NOW() - INTERVAL 30100 MINUTE),
(@sneha, 'Your application to Campus Lost and Found was accepted', 1, NOW() - INTERVAL 200 MINUTE),
(@sneha, 'Vikram Rao applied to Campus Marketplace', 0, NOW() - INTERVAL 350 MINUTE),
(@vikram, 'Your application to Career Roadmap Portal was accepted', 1, NOW() - INTERVAL 1250 MINUTE),
(@vikram, 'Ananya Iyer applied to Smart Attendance Tracker', 0, NOW() - INTERVAL 420 MINUTE),
(@vikram, 'Kabir Singh applied to Smart Attendance Tracker', 0, NOW() - INTERVAL 410 MINUTE),
(@priya, 'Your application to Smart Attendance Tracker was rejected', 1, NOW() - INTERVAL 480 MINUTE),
(@priya, 'Sneha Patel applied to Mock Interview Scheduler', 0, NOW() - INTERVAL 250 MINUTE),
(@kabir, 'Your application to Campus Marketplace was accepted', 1, NOW() - INTERVAL 2250 MINUTE),
(@kabir, 'Neha Kapoor accepted your mentorship request', 0, NOW() - INTERVAL 590 MINUTE),
(@neha, 'Priya Nair applied to Career Roadmap Portal', 0, NOW() - INTERVAL 200 MINUTE),
(@neha, 'Rohan Mehta applied to Career Roadmap Portal', 0, NOW() - INTERVAL 190 MINUTE),
(@aarav, 'Open Source Contribution Club is complete. Please review your teammates', 1, NOW() - INTERVAL 60100 MINUTE),
(@ananya, 'Resume Analyzer is complete. Please review your teammates', 1, NOW() - INTERVAL 45100 MINUTE),
(@rohan, 'Ananya Iyer left you a 5-star review', 0, NOW() - INTERVAL 45000 MINUTE);

-- ---------- 9. PEER REVIEWS (only for completed projects) ----------
INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment) VALUES
(@p3, @rohan, @kabir, 5, 'Reliable and quick to help. Great teammate.'),
(@p3, @rohan, @meera, 5, 'Brilliant design sense and always on time.'),
(@p3, @kabir, @rohan, 5, 'Clear leader who kept the project on track.'),
(@p3, @kabir, @meera, 4, 'Lovely UI work, a few late nights but worth it.'),
(@p3, @meera, @rohan, 5, 'Strong backend skills and very supportive.'),
(@p3, @meera, @kabir, 4, 'Energetic and great with real-time features.'),
(@p6, @meera, @sneha, 5, 'Picked things up fast and delivered clean pages.'),
(@p6, @meera, @vikram, 4, 'Solid search implementation.'),
(@p6, @sneha, @meera, 5, 'Excellent direction and design feedback.'),
(@p6, @sneha, @vikram, 4, 'Dependable and easy to work with.'),
(@p6, @vikram, @meera, 5, 'Well organized and communicates clearly.'),
(@p6, @vikram, @sneha, 3, 'Good work, could ask questions earlier.'),
(@p10, @aarav, @rohan, 5, 'Reliable and easy to work with.'),
(@p10, @aarav, @ananya, 4, 'Great ideas and clear communication.'),
(@p10, @aarav, @sneha, 5, 'Delivered quality work on time.'),
(@p10, @rohan, @aarav, 4, 'Helpful whenever the team got stuck.'),
(@p10, @rohan, @ananya, 5, 'Strong skills and a positive attitude.'),
(@p10, @rohan, @sneha, 5, 'Reliable and easy to work with.'),
(@p10, @ananya, @aarav, 4, 'Great ideas and clear communication.'),
(@p10, @ananya, @rohan, 3, 'Delivered quality work on time.'),
(@p10, @ananya, @sneha, 5, 'Helpful whenever the team got stuck.'),
(@p10, @sneha, @aarav, 4, 'Strong skills and a positive attitude.'),
(@p10, @sneha, @rohan, 5, 'Reliable and easy to work with.'),
(@p10, @sneha, @ananya, 4, 'Great ideas and clear communication.'),
(@p12, @ananya, @vikram, 5, 'Reliable and easy to work with.'),
(@p12, @ananya, @rohan, 4, 'Great ideas and clear communication.'),
(@p12, @vikram, @ananya, 5, 'Delivered quality work on time.'),
(@p12, @vikram, @rohan, 4, 'Helpful whenever the team got stuck.'),
(@p12, @rohan, @ananya, 5, 'Strong skills and a positive attitude.'),
(@p12, @rohan, @vikram, 5, 'Reliable and easy to work with.');

-- ---------- 10. MENTORSHIP REQUESTS ----------
INSERT INTO mentorship_requests (student_id, alumni_id, message, status) VALUES
(@aarav, @neha, 'I want guidance on full-stack projects and placements.', 'accepted'),
(@priya, @neha, 'Looking for advice on a frontend career path.', 'pending'),
(@vikram, @neha, 'Would like help preparing for system design interviews.', 'pending'),
(@rohan, @rahul, 'I want to learn database optimization and backend design.', 'accepted'),
(@kabir, @rahul, 'Interested in learning how to scale real-time apps.', 'pending'),
(@sneha, @rahul, 'Could you review my project architecture?', 'pending'),
(@ananya, @ishita, 'I want to start my first NLP research project.', 'accepted'),
(@meera, @ishita, 'Curious about moving from design to data roles.', 'declined'),
(@kabir, @neha, 'I want feedback on my hackathon project plan.', 'accepted'),
(@meera, @neha, 'Looking for UX career advice.', 'pending');


/* #####################################################################
   PART 3: DEMO HACKATHONS  (4 events with registrations)
   ##################################################################### */
-- ---------- SAMPLE HACKATHONS (dates are relative to today) ----------
INSERT INTO hackathons (organizer_id, title, description, event_date, mode, location, link)
SELECT u.id, 'Campus Code Sprint 2026', 'A 24-hour build sprint for student teams with mentors on call and prizes for the best project.', CURDATE() + INTERVAL 12 DAY, 'offline', 'Main Auditorium', 'https://devpost.com' FROM users u
WHERE u.email = 'neha@peerhub.demo' AND NOT EXISTS (SELECT 1 FROM hackathons WHERE title = 'Campus Code Sprint 2026');
INSERT INTO hackathons (organizer_id, title, description, event_date, mode, location, link)
SELECT u.id, 'CloudCraft Backend Challenge', 'Design and ship a scalable API in one weekend. Judged on clarity, performance and docs.', CURDATE() + INTERVAL 25 DAY, 'online', NULL, 'https://devfolio.co' FROM users u
WHERE u.email = 'rahul@peerhub.demo' AND NOT EXISTS (SELECT 1 FROM hackathons WHERE title = 'CloudCraft Backend Challenge');
INSERT INTO hackathons (organizer_id, title, description, event_date, mode, location, link)
SELECT u.id, 'DataBridge AI Hack Day', 'Build a small machine learning tool using open datasets and present it in five minutes.', CURDATE() + INTERVAL 40 DAY, 'hybrid', 'Lab 3 and online', NULL FROM users u
WHERE u.email = 'ishita@peerhub.demo' AND NOT EXISTS (SELECT 1 FROM hackathons WHERE title = 'DataBridge AI Hack Day');
INSERT INTO hackathons (organizer_id, title, description, event_date, mode, location, link)
SELECT u.id, 'Peer-Hub Open Innovation Jam', 'Build something that helps students collaborate better. This one has already ended.', CURDATE() + INTERVAL -20 DAY, 'online', NULL, NULL FROM users u
WHERE u.email = 'admin@peerhub.com' AND NOT EXISTS (SELECT 1 FROM hackathons WHERE title = 'Peer-Hub Open Innovation Jam');

-- ---------- SAMPLE REGISTRATIONS ----------
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, (SELECT p.id FROM projects p WHERE p.title = 'Campus Event Planner' LIMIT 1) FROM hackathons h JOIN users u ON u.email = 'aarav@peerhub.demo' WHERE h.title = 'Campus Code Sprint 2026';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, (SELECT p.id FROM projects p WHERE p.title = 'Mock Interview Scheduler' LIMIT 1) FROM hackathons h JOIN users u ON u.email = 'priya@peerhub.demo' WHERE h.title = 'Campus Code Sprint 2026';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, (SELECT p.id FROM projects p WHERE p.title = 'Hackathon Team Finder' LIMIT 1) FROM hackathons h JOIN users u ON u.email = 'kabir@peerhub.demo' WHERE h.title = 'Campus Code Sprint 2026';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, NULL FROM hackathons h JOIN users u ON u.email = 'sneha@peerhub.demo' WHERE h.title = 'Campus Code Sprint 2026';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, (SELECT p.id FROM projects p WHERE p.title = 'Placement Prep Tracker' LIMIT 1) FROM hackathons h JOIN users u ON u.email = 'rohan@peerhub.demo' WHERE h.title = 'CloudCraft Backend Challenge';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, NULL FROM hackathons h JOIN users u ON u.email = 'vikram@peerhub.demo' WHERE h.title = 'CloudCraft Backend Challenge';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, NULL FROM hackathons h JOIN users u ON u.email = 'kabir@peerhub.demo' WHERE h.title = 'CloudCraft Backend Challenge';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, (SELECT p.id FROM projects p WHERE p.title = 'AI Notes Summarizer' LIMIT 1) FROM hackathons h JOIN users u ON u.email = 'ananya@peerhub.demo' WHERE h.title = 'DataBridge AI Hack Day';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, NULL FROM hackathons h JOIN users u ON u.email = 'vikram@peerhub.demo' WHERE h.title = 'DataBridge AI Hack Day';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, (SELECT p.id FROM projects p WHERE p.title = 'Open Source Contribution Club' LIMIT 1) FROM hackathons h JOIN users u ON u.email = 'aarav@peerhub.demo' WHERE h.title = 'Peer-Hub Open Innovation Jam';
INSERT IGNORE INTO hackathon_participants (hackathon_id, user_id, project_id)
SELECT h.id, u.id, (SELECT p.id FROM projects p WHERE p.title = 'Alumni Connect App' LIMIT 1) FROM hackathons h JOIN users u ON u.email = 'meera@peerhub.demo' WHERE h.title = 'Peer-Hub Open Innovation Jam';


/* #####################################################################
   PART 4: CHECKS
   ##################################################################### */

-- 4a. Totals for every table
SELECT 'Users' AS item, COUNT(*) AS total FROM users
UNION ALL SELECT 'Students',                COUNT(*) FROM users WHERE role = 'student'
UNION ALL SELECT 'Alumni',                  COUNT(*) FROM users WHERE role = 'alumni'
UNION ALL SELECT 'Projects',                COUNT(*) FROM projects
UNION ALL SELECT 'Team members',            COUNT(*) FROM project_members
UNION ALL SELECT 'Applications',            COUNT(*) FROM applications
UNION ALL SELECT 'Messages',                COUNT(*) FROM messages
UNION ALL SELECT 'Resources',               COUNT(*) FROM resources
UNION ALL SELECT 'Notifications',           COUNT(*) FROM notifications
UNION ALL SELECT 'Reviews',                 COUNT(*) FROM reviews
UNION ALL SELECT 'Mentorship requests',     COUNT(*) FROM mentorship_requests
UNION ALL SELECT 'Hackathons',              COUNT(*) FROM hackathons
UNION ALL SELECT 'Hackathon registrations', COUNT(*) FROM hackathon_participants;

-- 4b. Users by role
SELECT role, COUNT(*) AS total FROM users GROUP BY role;

-- 4c. Projects with owner and team size
SELECT p.id, p.title, p.status, u.name AS owner, COUNT(m.user_id) AS members
FROM projects p
JOIN users u ON u.id = p.owner_id
LEFT JOIN project_members m ON m.project_id = p.id
GROUP BY p.id, p.title, p.status, u.name
ORDER BY p.created_at DESC;

-- 4d. Mentorship requests with names
SELECT s.name AS student, a.name AS alumni, r.status
FROM mentorship_requests r
JOIN users s ON s.id = r.student_id
JOIN users a ON a.id = r.alumni_id
ORDER BY r.created_at DESC;

-- 4e. Hackathons with registration counts
SELECT h.title, h.event_date, h.mode, COUNT(p.user_id) AS participants
FROM hackathons h
LEFT JOIN hackathon_participants p ON p.hackathon_id = h.id
GROUP BY h.id, h.title, h.event_date, h.mode
ORDER BY h.event_date;
