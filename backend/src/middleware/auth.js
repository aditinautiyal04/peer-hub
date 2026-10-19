const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Checks the token AND re-reads the user from the database on every request,
// so a deactivated account or a changed role takes effect immediately.
exports.auth = async (req, res, next) => {
  try {
    const d = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET);
    const [[u]] = await db.query('SELECT id,name,role,is_verified,is_active FROM users WHERE id=?', [d.id]);
    if (!u || !u.is_active) return res.status(401).json({ error: 'Account unavailable' });
    req.user = { id: u.id, name: u.name, role: u.role, is_verified: !!u.is_verified };
    next();
  } catch { res.status(401).json({ error: 'Not authenticated' }); }
};
exports.role = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Forbidden' });
// alumni must be verified by an admin before they can create or guide
exports.verified = (req, res, next) =>
  req.user.role !== 'alumni' || req.user.is_verified ? next() : res.status(403).json({ error: 'Your alumni account is awaiting admin verification' });
