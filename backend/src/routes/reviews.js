const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth } = require('../middleware/auth');
const notify = require('../utils/notify');
router.use(auth);

router.post('/', ah(async (req, res) => {
  const { project_id, reviewee_id, rating, comment } = req.body;
  if (!(rating >= 1 && rating <= 5) || +reviewee_id === req.user.id) return res.status(400).json({ error: 'Rating 1-5 for a teammate required' });
  const [[p]] = await db.query('SELECT * FROM projects WHERE id=?', [project_id]);
  if (!p || p.status !== 'completed') return res.status(400).json({ error: 'Project must be completed' });
  const [m] = await db.query('SELECT user_id FROM project_members WHERE project_id=? AND user_id IN (?,?)', [project_id, req.user.id, reviewee_id]);
  if (m.length !== 2) return res.status(403).json({ error: 'Both users must be project members' });
  try { await db.query('INSERT INTO reviews(project_id,reviewer_id,reviewee_id,rating,comment) VALUES(?,?,?,?,?)', [project_id, req.user.id, reviewee_id, rating, comment || '']); }
  catch { return res.status(409).json({ error: 'Already reviewed' }); }
  await notify(reviewee_id, `${req.user.name} left you a ${rating}-star review`);
  res.status(201).json({ ok: true });
}));

router.get('/project/:id', ah(async (req, res) => {
  const [rows] = await db.query('SELECT reviewee_id FROM reviews WHERE project_id=? AND reviewer_id=?', [req.params.id, req.user.id]);
  res.json(rows.map((r) => r.reviewee_id)); // who I already reviewed
}));

router.get('/user/:id', ah(async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.rating,r.comment,r.created_at,u.name reviewer,p.title project FROM reviews r
     JOIN users u ON u.id=r.reviewer_id JOIN projects p ON p.id=r.project_id WHERE r.reviewee_id=? ORDER BY r.id DESC`, [req.params.id]);
  res.json(rows);
}));
module.exports = router;
