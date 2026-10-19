const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth } = require('../middleware/auth');
router.use(auth);

router.get('/', ah(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50', [req.user.id]);
  res.json(rows);
}));
router.get('/unread-count', ah(async (req, res) => {
  const [[r]] = await db.query('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND is_read=0', [req.user.id]);
  res.json({ count: r.c });
}));
router.put('/read-all', ah(async (req, res) => {
  await db.query('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
  res.json({ ok: true });
}));
module.exports = router;
