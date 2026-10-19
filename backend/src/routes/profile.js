const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth } = require('../middleware/auth');
router.use(auth);

const FIELDS = ['headline', 'bio', 'skills', 'interests', 'availability', 'branch', 'year', 'company'];
const getProfile = async (id) => {
  const [rows] = await db.query(
    `SELECT u.id,u.name,u.email,u.role,u.is_verified,p.*,
      (SELECT ROUND(AVG(rating),1) FROM reviews WHERE reviewee_id=u.id) avg_rating,
      (SELECT COUNT(*) FROM reviews WHERE reviewee_id=u.id) review_count
     FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=?`, [id]);
  return rows[0];
};

router.get('/me', ah(async (req, res) => res.json(await getProfile(req.user.id))));
router.put('/me', ah(async (req, res) => {
  const vals = FIELDS.map((f) => req.body[f] ?? null);
  await db.query(
    `INSERT INTO profiles(user_id,${FIELDS.join(',')}) VALUES(?,${FIELDS.map(() => '?').join(',')})
     ON DUPLICATE KEY UPDATE ${FIELDS.map((f) => `${f}=VALUES(${f})`).join(',')}`, [req.user.id, ...vals]);
  res.json(await getProfile(req.user.id));
}));
router.get('/:id', ah(async (req, res) => {
  const p = await getProfile(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  delete p.email;
  res.json(p);
}));
module.exports = router;
