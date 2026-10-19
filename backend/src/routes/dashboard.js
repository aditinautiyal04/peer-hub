const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth } = require('../middleware/auth');
router.use(auth);

// Numbers for the dashboard cards. Admins see platform totals; everyone else sees their own.
router.get('/stats', ah(async (req, res) => {
  const { id, role } = req.user;

  if (role === 'admin') {
    const [[s]] = await db.query(`SELECT
      (SELECT COUNT(*) FROM users)                                              AS totalUsers,
      (SELECT COUNT(*) FROM users WHERE role='student')                         AS students,
      (SELECT COUNT(*) FROM users WHERE role='alumni')                          AS alumni,
      (SELECT COUNT(*) FROM users WHERE role='alumni' AND is_verified=0)        AS pendingAlumni,
      (SELECT COUNT(*) FROM projects)                                           AS totalProjects,
      (SELECT COUNT(*) FROM projects WHERE status='completed')                  AS completedProjects,
      (SELECT COUNT(*) FROM mentorship_requests WHERE status='pending')         AS pendingMentorship,
      (SELECT COUNT(*) FROM reviews)                                            AS studentReviews,
      (SELECT COUNT(*) FROM messages)                                           AS totalMessages`);
    return res.json(s);
  }

  // students: requests they sent; alumni: requests they received
  const mentorCol = role === 'alumni' ? 'alumni_id' : 'student_id';
  const [[s]] = await db.query(`SELECT
      (SELECT COUNT(*) FROM project_members WHERE user_id=?)                    AS myProjects,
      (SELECT COUNT(*) FROM project_members m JOIN projects p ON p.id=m.project_id
         WHERE m.user_id=? AND p.status='completed')                            AS completedProjects,
      (SELECT COUNT(*) FROM mentorship_requests WHERE ${mentorCol}=? AND status='pending') AS pendingMentorship,
      (SELECT COUNT(*) FROM reviews WHERE reviewee_id=?)                        AS studentReviews,
      (SELECT COUNT(*) FROM users WHERE role='alumni' AND is_verified=1 AND is_active=1) AS verifiedAlumni,
      (SELECT COUNT(*) FROM messages WHERE sender_id=?)                         AS myMessages`,
    [id, id, id, id, id]);
  res.json(s);
}));

module.exports = router;
