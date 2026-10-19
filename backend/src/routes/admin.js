const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth, role } = require('../middleware/auth');
const notify = require('../utils/notify');
router.use(auth, role('admin'));

router.get('/stats', ah(async (req, res) => {
  const [[s]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM users WHERE role='student') students,
      (SELECT COUNT(*) FROM users WHERE role='alumni') alumni,
      (SELECT COUNT(*) FROM users WHERE role='alumni' AND is_verified=0) pending_alumni,
      (SELECT COUNT(*) FROM projects) projects,
      (SELECT COUNT(*) FROM messages) messages,
      (SELECT COUNT(*) FROM mentorship_requests) mentorships,
      (SELECT COUNT(*) FROM reviews) reviews`);
  res.json(s);
}));

router.get('/users', ah(async (req, res) => {
  const [rows] = await db.query('SELECT id,name,email,role,is_verified,is_active,created_at FROM users ORDER BY id DESC');
  res.json(rows);
}));

router.put('/users/:id/verify', ah(async (req, res) => {
  await db.query('UPDATE users SET is_verified=1 WHERE id=?', [req.params.id]);
  await notify(req.params.id, 'Your account has been verified by an admin');
  res.json({ ok: true });
}));

router.put('/users/:id/active', ah(async (req, res) => {
  if (+req.params.id === req.user.id) return res.status(400).json({ error: "Can't deactivate yourself" });
  await db.query('UPDATE users SET is_active=? WHERE id=?', [req.body.active ? 1 : 0, req.params.id]);
  res.json({ ok: true });
}));

router.delete('/projects/:id', ah(async (req, res) => {
  await db.query('DELETE FROM projects WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}));
module.exports = router;
