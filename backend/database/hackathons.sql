/* =====================================================================
   PEER-HUB: HACKATHONS (tables + sample data)
   1) Run this in MySQL Workbench with Ctrl+Shift+Enter (USE peerhub is below).
   2) Safe to run again: tables use IF NOT EXISTS and samples skip duplicates.
   The sample part needs the demo users from peerhub_sample_data.sql;
   without them only the tables are created.
   ===================================================================== */
USE peerhub;

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

SELECT h.title, h.event_date, h.mode, COUNT(p.user_id) AS participants
FROM hackathons h LEFT JOIN hackathon_participants p ON p.hackathon_id = h.id
GROUP BY h.id, h.title, h.event_date, h.mode ORDER BY h.event_date;
