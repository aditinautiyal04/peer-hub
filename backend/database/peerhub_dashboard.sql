/* =====================================================================
   PEER-HUB: DASHBOARD QUERIES
   These are the same numbers the Dashboard cards show.
   Run in MySQL Workbench. Select a block and press Ctrl+Enter,
   or run everything with Ctrl+Shift+Enter.
   ===================================================================== */
USE peerhub;


/* ---------------------------------------------------------------------
   A. ADMIN DASHBOARD (9 cards, platform-wide totals)
   --------------------------------------------------------------------- */

-- A1. One row, one column per card (this is what the API returns)
SELECT
  (SELECT COUNT(*) FROM users)                                       AS totalUsers,
  (SELECT COUNT(*) FROM users WHERE role = 'student')                AS students,
  (SELECT COUNT(*) FROM users WHERE role = 'alumni')                 AS alumni,
  (SELECT COUNT(*) FROM users WHERE role = 'alumni' AND is_verified = 0) AS pendingAlumni,
  (SELECT COUNT(*) FROM projects)                                    AS totalProjects,
  (SELECT COUNT(*) FROM projects WHERE status = 'completed')         AS completedProjects,
  (SELECT COUNT(*) FROM mentorship_requests WHERE status = 'pending') AS pendingMentorship,
  (SELECT COUNT(*) FROM reviews)                                     AS studentReviews,
  (SELECT COUNT(*) FROM messages)                                    AS totalMessages;

-- A2. The same 9 numbers as a list, with the card labels
SELECT 'Total users' AS card, COUNT(*) AS value FROM users
UNION ALL SELECT 'Students',                     COUNT(*) FROM users WHERE role = 'student'
UNION ALL SELECT 'Alumni',                       COUNT(*) FROM users WHERE role = 'alumni'
UNION ALL SELECT 'Pending alumni verification',  COUNT(*) FROM users WHERE role = 'alumni' AND is_verified = 0
UNION ALL SELECT 'Total projects',               COUNT(*) FROM projects
UNION ALL SELECT 'Completed projects',           COUNT(*) FROM projects WHERE status = 'completed'
UNION ALL SELECT 'Pending mentorship',           COUNT(*) FROM mentorship_requests WHERE status = 'pending'
UNION ALL SELECT 'Student reviews',              COUNT(*) FROM reviews
UNION ALL SELECT 'Total messages',               COUNT(*) FROM messages;


/* ---------------------------------------------------------------------
   B. STUDENT DASHBOARD (6 cards, personal numbers)
   Step 1: pick the user. Find ids with:  SELECT id, name, role FROM users;
   --------------------------------------------------------------------- */
SELECT id, name, role FROM users;

SET @uid = 2;   -- <-- change this to a student's id

SELECT
  -- projects I am a member of (owner counts too)
  (SELECT COUNT(*) FROM project_members WHERE user_id = @uid)       AS myProjects,

  -- of those, how many are completed
  (SELECT COUNT(*) FROM project_members m
     JOIN projects p ON p.id = m.project_id
    WHERE m.user_id = @uid AND p.status = 'completed')              AS completedProjects,

  -- mentorship requests I sent that are still waiting
  (SELECT COUNT(*) FROM mentorship_requests
    WHERE student_id = @uid AND status = 'pending')                 AS pendingMentorship,

  -- reviews teammates wrote about me
  (SELECT COUNT(*) FROM reviews WHERE reviewee_id = @uid)           AS studentReviews,

  -- verified, active alumni on the platform
  (SELECT COUNT(*) FROM users
    WHERE role = 'alumni' AND is_verified = 1 AND is_active = 1)    AS verifiedAlumni,

  -- messages I have sent
  (SELECT COUNT(*) FROM messages WHERE sender_id = @uid)            AS myMessages;


/* ---------------------------------------------------------------------
   C. ALUMNI DASHBOARD (6 cards)
   Same as the student query, except pendingMentorship counts requests
   RECEIVED (alumni_id) instead of sent (student_id).
   --------------------------------------------------------------------- */
SET @uid = 3;   -- <-- change this to an alumni's id

SELECT
  (SELECT COUNT(*) FROM project_members WHERE user_id = @uid)       AS myProjects,
  (SELECT COUNT(*) FROM project_members m
     JOIN projects p ON p.id = m.project_id
    WHERE m.user_id = @uid AND p.status = 'completed')              AS completedProjects,
  (SELECT COUNT(*) FROM mentorship_requests
    WHERE alumni_id = @uid AND status = 'pending')                  AS pendingMentorship,
  (SELECT COUNT(*) FROM reviews WHERE reviewee_id = @uid)           AS studentReviews,
  (SELECT COUNT(*) FROM users
    WHERE role = 'alumni' AND is_verified = 1 AND is_active = 1)    AS verifiedAlumni,
  (SELECT COUNT(*) FROM messages WHERE sender_id = @uid)            AS myMessages;


/* ---------------------------------------------------------------------
   D. LISTS BEHIND THE DASHBOARD
   --------------------------------------------------------------------- */

-- D1. "My projects" section (use @uid from above)
SELECT p.id, p.title, p.status, m.role AS my_role
FROM projects p
JOIN project_members m ON m.project_id = p.id
WHERE m.user_id = @uid
ORDER BY p.created_at DESC;

-- D2. Alumni waiting for admin verification
SELECT id, name, email, created_at
FROM users
WHERE role = 'alumni' AND is_verified = 0;
