const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth, role, verified } = require('../middleware/auth');
const notify = require('../utils/notify');
const { joinProject, leaveProject } = require('../socket');
router.use(auth);

const memberOf = async (pid, uid) => (await db.query('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?', [pid, uid]))[0].length > 0;
const getOwned = async (pid, uid) => (await db.query('SELECT * FROM projects WHERE id=? AND owner_id=?', [pid, uid]))[0][0];

router.get('/', ah(async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const [rows] = await db.query(
    `SELECT p.*,u.name owner_name,(SELECT COUNT(*) FROM project_members m WHERE m.project_id=p.id) member_count
     FROM projects p JOIN users u ON u.id=p.owner_id
     WHERE p.title LIKE ? OR p.required_skills LIKE ? ORDER BY p.created_at DESC`, [q, q]);
  res.json(rows);
}));

router.get('/mine', ah(async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*,m.role my_role FROM projects p JOIN project_members m ON m.project_id=p.id
     WHERE m.user_id=? ORDER BY p.created_at DESC`, [req.user.id]);
  res.json(rows);
}));

router.post('/', role('student', 'alumni'), verified, ah(async (req, res) => {
  const { title, description, required_skills, max_members } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const [r] = await db.query('INSERT INTO projects(owner_id,title,description,required_skills,max_members) VALUES(?,?,?,?,?)',
    [req.user.id, title, description || '', required_skills || '', max_members || 5]);
  await db.query("INSERT INTO project_members(project_id,user_id,role) VALUES(?,?,'owner')", [r.insertId, req.user.id]);
  joinProject(req.user.id, r.insertId);
  res.status(201).json({ id: r.insertId });
}));

router.get('/:id', ah(async (req, res) => {
  const [[p]] = await db.query('SELECT p.*,u.name owner_name FROM projects p JOIN users u ON u.id=p.owner_id WHERE p.id=?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const [members] = await db.query(
    `SELECT u.id,u.name,u.role user_role,m.role,pr.skills FROM project_members m JOIN users u ON u.id=m.user_id
     LEFT JOIN profiles pr ON pr.user_id=u.id WHERE m.project_id=?`, [p.id]);
  const isOwner = p.owner_id === req.user.id;
  const [[myApp]] = await db.query('SELECT status FROM applications WHERE project_id=? AND user_id=?', [p.id, req.user.id]);
  let applications = [];
  if (isOwner) [applications] = await db.query(
    `SELECT a.*,u.name,pr.skills FROM applications a JOIN users u ON u.id=a.user_id
     LEFT JOIN profiles pr ON pr.user_id=u.id WHERE a.project_id=? AND a.status='pending'`, [p.id]);
  res.json({ ...p, members, isOwner, isMember: members.some((m) => m.id === req.user.id), myApplication: myApp?.status || null, applications });
}));

router.post('/:id/apply', role('student'), ah(async (req, res) => {
  const [[p]] = await db.query('SELECT * FROM projects WHERE id=?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (p.status === 'completed') return res.status(400).json({ error: 'Project is completed' });
  if (await memberOf(p.id, req.user.id)) return res.status(400).json({ error: 'Already a member' });
  try { await db.query('INSERT INTO applications(project_id,user_id,message) VALUES(?,?,?)', [p.id, req.user.id, req.body.message || '']); }
  catch { return res.status(409).json({ error: 'Already applied' }); }
  await notify(p.owner_id, `${req.user.name} applied to "${p.title}"`);
  res.status(201).json({ ok: true });
}));

router.put('/applications/:appId', ah(async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const [[a]] = await db.query('SELECT a.*,p.owner_id,p.title,p.max_members FROM applications a JOIN projects p ON p.id=a.project_id WHERE a.id=?', [req.params.appId]);
  if (!a || a.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (status === 'accepted') {
    const [[{ c }]] = await db.query('SELECT COUNT(*) c FROM project_members WHERE project_id=?', [a.project_id]);
    if (c >= a.max_members) return res.status(400).json({ error: 'Team is full' });
    await db.query("INSERT IGNORE INTO project_members(project_id,user_id,role) VALUES(?,?,'member')", [a.project_id, a.user_id]);
    await db.query("UPDATE projects SET status='in_progress' WHERE id=? AND status='open'", [a.project_id]);
    joinProject(a.user_id, a.project_id);
  }
  await db.query('UPDATE applications SET status=? WHERE id=?', [status, a.id]);
  await notify(a.user_id, `Your application to "${a.title}" was ${status}`);
  res.json({ ok: true });
}));

router.post('/:id/invite', ah(async (req, res) => {
  const p = await getOwned(req.params.id, req.user.id);
  if (!p) return res.status(403).json({ error: 'Forbidden' });
  await notify(req.body.userId, `${req.user.name} invited you to join "${p.title}"`);
  res.json({ ok: true });
}));

router.delete('/:id/members/:userId', ah(async (req, res) => {
  const p = await getOwned(req.params.id, req.user.id);
  if (!p || +req.params.userId === req.user.id) return res.status(403).json({ error: 'Forbidden' });
  await db.query('DELETE FROM project_members WHERE project_id=? AND user_id=?', [p.id, req.params.userId]);
  leaveProject(+req.params.userId, p.id);
  await notify(req.params.userId, `You were removed from "${p.title}"`);
  res.json({ ok: true });
}));

router.put('/:id/status', ah(async (req, res) => {
  const p = await getOwned(req.params.id, req.user.id);
  if (!p || !['open', 'in_progress', 'completed'].includes(req.body.status)) return res.status(403).json({ error: 'Forbidden' });
  await db.query('UPDATE projects SET status=? WHERE id=?', [req.body.status, p.id]);
  if (req.body.status === 'completed') {
    const [ms] = await db.query('SELECT user_id FROM project_members WHERE project_id=?', [p.id]);
    for (const m of ms) await notify(m.user_id, `"${p.title}" is complete — please review your teammates`);
  }
  res.json({ ok: true });
}));

module.exports = router;
