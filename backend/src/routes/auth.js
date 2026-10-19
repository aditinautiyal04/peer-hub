const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth } = require('../middleware/auth');
const notify = require('../utils/notify');
const limit = require('../middleware/rateLimit');

const sign = (u) => jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, is_verified: !!u.is_verified });

router.post('/register', limit(10), ah(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Name, email and a 6+ char password are required' });
  if (!['student', 'alumni'].includes(role)) return res.status(400).json({ error: 'Role must be student or alumni' });
  const [ex] = await db.query('SELECT id FROM users WHERE email=?', [email]);
  if (ex.length) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const verified = role === 'student' ? 1 : 0; // alumni need admin verification
  const [r] = await db.query('INSERT INTO users(name,email,password_hash,role,is_verified) VALUES(?,?,?,?,?)', [name, email, hash, role, verified]);
  await db.query('INSERT INTO profiles(user_id) VALUES(?)', [r.insertId]);
  if (role === 'alumni') {
    const [admins] = await db.query("SELECT id FROM users WHERE role='admin'");
    for (const a of admins) await notify(a.id, `New alumni "${name}" is waiting for verification`);
  }
  const user = { id: r.insertId, name, email, role, is_verified: verified };
  res.status(201).json({ token: sign(user), user: pub(user) });
}));

router.post('/login', limit(20), ah(async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || '', u.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
  if (!u.is_active) return res.status(403).json({ error: 'Account deactivated by admin' });
  res.json({ token: sign(u), user: pub(u) });
}));

router.get('/me', auth, ah(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(pub(rows[0]));
}));

router.put('/password', auth, ah(async (req, res) => {
  const { current, next } = req.body;
  if (!next || next.length < 6) return res.status(400).json({ error: 'New password must be 6+ characters' });
  const [[u]] = await db.query('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
  if (!(await bcrypt.compare(current || '', u.password_hash))) return res.status(400).json({ error: 'Current password is wrong' });
  await db.query('UPDATE users SET password_hash=? WHERE id=?', [await bcrypt.hash(next, 10), req.user.id]);
  res.json({ ok: true });
}));

module.exports = router;
