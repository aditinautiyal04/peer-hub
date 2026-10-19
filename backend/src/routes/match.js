const router = require('express').Router();
const db = require('../config/db');
const ah = require('../utils/ah');
const { auth } = require('../middleware/auth');
const { overlap, mentions } = require('../utils/match');
router.use(auth);

const myProfile = async (id) => (await db.query('SELECT * FROM profiles WHERE user_id=?', [id]))[0][0] || {};

// projects ranked for the logged-in user: skills 70, interests 20, availability 10
router.get('/projects', ah(async (req, res) => {
  const me = await myProfile(req.user.id);
  const [rows] = await db.query(
    `SELECT p.*,u.name owner_name FROM projects p JOIN users u ON u.id=p.owner_id
     WHERE p.status<>'completed' AND p.id NOT IN (SELECT project_id FROM project_members WHERE user_id=?)`, [req.user.id]);
  const scored = rows.map((p) => ({ ...p,
    score: Math.round(overlap(me.skills, p.required_skills) * 70 + mentions(me.interests, p.title + ' ' + p.description) * 20 + (me.availability ? 10 : 0)) }));
  res.json(scored.sort((a, b) => b.score - a.score).slice(0, 20));
}));

// students ranked for one of my projects
router.get('/teammates/:projectId', ah(async (req, res) => {
  const [[p]] = await db.query('SELECT * FROM projects WHERE id=? AND owner_id=?', [req.params.projectId, req.user.id]);
  if (!p) return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await db.query(
    `SELECT u.id,u.name,pr.skills,pr.interests,pr.availability FROM users u LEFT JOIN profiles pr ON pr.user_id=u.id
     WHERE u.role='student' AND u.is_active=1 AND u.id NOT IN (SELECT user_id FROM project_members WHERE project_id=?)`, [p.id]);
  const scored = rows.map((s) => ({ ...s,
    score: Math.round(overlap(s.skills, p.required_skills) * 70 + mentions(s.interests, p.title + ' ' + p.description) * 20 + (s.availability ? 10 : 0)) }));
  res.json(scored.sort((a, b) => b.score - a.score).slice(0, 15));
}));

// verified alumni ranked for the student
router.get('/mentors', ah(async (req, res) => {
  const me = await myProfile(req.user.id);
  const [rows] = await db.query(
    `SELECT u.id,u.name,pr.headline,pr.company,pr.skills,pr.interests FROM users u LEFT JOIN profiles pr ON pr.user_id=u.id
     WHERE u.role='alumni' AND u.is_verified=1 AND u.is_active=1`);
  const mine = (me.skills || '') + ',' + (me.interests || '');
  const scored = rows.map((a) => ({ ...a, score: Math.round(overlap(mine, (a.skills || '') + ',' + (a.interests || '')) * 100) }));
  res.json(scored.sort((a, b) => b.score - a.score));
}));
module.exports = router;
