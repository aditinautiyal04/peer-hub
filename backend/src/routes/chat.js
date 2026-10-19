const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth } = require('../middleware/auth');
router.use(auth);

router.get('/project/:id', ah(async (req, res) => {
  const [m] = await db.query('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!m.length) return res.status(403).json({ error: 'Members only' });
  const [rows] = await db.query(
    'SELECT m.*,u.name sender_name FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.project_id=? ORDER BY m.id DESC LIMIT 100', [req.params.id]);
  res.json(rows.reverse());
}));

router.get('/direct/:userId', ah(async (req, res) => {
  const me = req.user.id, other = req.params.userId;
  const [rows] = await db.query(
    `SELECT m.*,u.name sender_name FROM messages m JOIN users u ON u.id=m.sender_id
     WHERE m.project_id IS NULL AND ((m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?))
     ORDER BY m.id DESC LIMIT 100`, [me, other, other, me]);
  res.json(rows.reverse());
}));
module.exports = router;
