const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth, role, verified } = require('../middleware/auth');
const notify = require('../utils/notify');
router.use(auth);

router.get('/', ah(async (req, res) => {
  const [rows] = await db.query(
    `SELECT h.id,h.title,h.description,DATE_FORMAT(h.event_date,'%Y-%m-%d') event_date,h.mode,h.location,h.link,h.organizer_id,
       u.name organizer, (h.event_date < CURDATE()) past,
       (SELECT COUNT(*) FROM hackathon_participants p WHERE p.hackathon_id=h.id) participant_count,
       EXISTS(SELECT 1 FROM hackathon_participants p WHERE p.hackathon_id=h.id AND p.user_id=?) joined
     FROM hackathons h JOIN users u ON u.id=h.organizer_id ORDER BY past, h.event_date`, [req.user.id]);
  res.json(rows.map((r) => ({ ...r, past: !!r.past, joined: !!r.joined })));
}));

router.post('/', role('admin', 'alumni'), verified, ah(async (req, res) => {
  const { title, description, event_date, mode, location, link } = req.body;
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(event_date || '')) return res.status(400).json({ error: 'Title and a date are required' });
  if (link && !/^https?:\/\//i.test(link)) return res.status(400).json({ error: 'Link must start with http:// or https://' });
  const [r] = await db.query('INSERT INTO hackathons(organizer_id,title,description,event_date,mode,location,link) VALUES(?,?,?,?,?,?,?)',
    [req.user.id, title, description || '', event_date, ['online', 'offline', 'hybrid'].includes(mode) ? mode : 'online', location || null, link || null]);
  res.status(201).json({ id: r.insertId });
}));

router.get('/:id', ah(async (req, res) => {
  const [participants] = await db.query(
    `SELECT u.id,u.name,pr.skills,p.title project FROM hackathon_participants hp
     JOIN users u ON u.id=hp.user_id LEFT JOIN profiles pr ON pr.user_id=u.id
     LEFT JOIN projects p ON p.id=hp.project_id WHERE hp.hackathon_id=? ORDER BY hp.joined_at`, [req.params.id]);
  res.json({ participants });
}));

router.post('/:id/join', role('student'), ah(async (req, res) => {
  const [[h]] = await db.query('SELECT *,(event_date < CURDATE()) past FROM hackathons WHERE id=?', [req.params.id]);
  if (!h) return res.status(404).json({ error: 'Not found' });
  if (h.past) return res.status(400).json({ error: 'This hackathon has ended' });
  const pid = req.body.project_id || null;
  if (pid) {
    const [m] = await db.query('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?', [pid, req.user.id]);
    if (!m.length) return res.status(403).json({ error: 'You are not a member of that team' });
  }
  try { await db.query('INSERT INTO hackathon_participants(hackathon_id,user_id,project_id) VALUES(?,?,?)', [h.id, req.user.id, pid]); }
  catch { return res.status(409).json({ error: 'Already registered' }); }
  await notify(h.organizer_id, `${req.user.name} registered for "${h.title}"`);
  res.status(201).json({ ok: true });
}));

router.delete('/:id/join', ah(async (req, res) => {
  await db.query('DELETE FROM hackathon_participants WHERE hackathon_id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

router.delete('/:id', ah(async (req, res) => {
  const [r] = await db.query('DELETE FROM hackathons WHERE id=? AND (organizer_id=? OR ?)', [req.params.id, req.user.id, req.user.role === 'admin']);
  res.json({ deleted: r.affectedRows });
}));
module.exports = router;
