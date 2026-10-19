const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth, verified } = require('../middleware/auth');
router.use(auth);

router.get('/', ah(async (req, res) => {
  const pid = req.query.project_id;
  if (pid) {
    const [m] = await db.query('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?', [pid, req.user.id]);
    if (!m.length) return res.status(403).json({ error: 'Members only' });
  }
  const [rows] = await db.query(
    `SELECT r.*,u.name author FROM resources r JOIN users u ON u.id=r.user_id
     WHERE ${pid ? 'r.project_id=?' : 'r.project_id IS NULL'} ORDER BY r.id DESC`, pid ? [pid] : []);
  res.json(rows);
}));

router.post('/', verified, ah(async (req, res) => {
  const { title, url, description, project_id } = req.body;
  if (!title || !/^https?:\/\//i.test(url || '')) return res.status(400).json({ error: 'Title and a valid http(s) URL required' });
  if (project_id) {
    const [m] = await db.query('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?', [project_id, req.user.id]);
    if (!m.length) return res.status(403).json({ error: 'Members only' });
  }
  const [r] = await db.query('INSERT INTO resources(user_id,project_id,title,url,description) VALUES(?,?,?,?,?)',
    [req.user.id, project_id || null, title, url, description || '']);
  res.status(201).json({ id: r.insertId });
}));

router.delete('/:id', ah(async (req, res) => {
  const [r] = await db.query('DELETE FROM resources WHERE id=? AND (user_id=? OR ?)', [req.params.id, req.user.id, req.user.role === 'admin']);
  res.json({ deleted: r.affectedRows });
}));
module.exports = router;
