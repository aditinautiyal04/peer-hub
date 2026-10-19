const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth, role, verified } = require('../middleware/auth');
const notify = require('../utils/notify');
router.use(auth);

router.post('/', role('student'), ah(async (req, res) => {
  const [[a]] = await db.query("SELECT id FROM users WHERE id=? AND role='alumni' AND is_verified=1", [req.body.alumni_id]);
  if (!a) return res.status(404).json({ error: 'Verified alumni not found' });
  try { await db.query('INSERT INTO mentorship_requests(student_id,alumni_id,message) VALUES(?,?,?)', [req.user.id, a.id, req.body.message || '']); }
  catch { return res.status(409).json({ error: 'Request already sent' }); }
  await notify(a.id, `${req.user.name} requested your mentorship`);
  res.status(201).json({ ok: true });
}));

router.get('/mine', ah(async (req, res) => {
  const isStudent = req.user.role === 'student';
  const [rows] = await db.query(
    `SELECT r.*,u.name other_name,u.id other_id FROM mentorship_requests r
     JOIN users u ON u.id=${isStudent ? 'r.alumni_id' : 'r.student_id'}
     WHERE ${isStudent ? 'r.student_id' : 'r.alumni_id'}=? ORDER BY r.id DESC`, [req.user.id]);
  res.json(rows);
}));

router.put('/:id', role('alumni'), verified, ah(async (req, res) => {
  if (!['accepted', 'declined'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
  const [[r]] = await db.query('SELECT * FROM mentorship_requests WHERE id=? AND alumni_id=?', [req.params.id, req.user.id]);
  if (!r) return res.status(404).json({ error: 'Not found' });
  await db.query('UPDATE mentorship_requests SET status=? WHERE id=?', [req.body.status, r.id]);
  await notify(r.student_id, `${req.user.name} ${req.body.status} your mentorship request`);
  res.json({ ok: true });
}));
module.exports = router;
