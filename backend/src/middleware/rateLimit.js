// Tiny in-memory limiter: max N requests per IP per route in a time window.
const hits = new Map();
setInterval(() => hits.clear(), 15 * 60 * 1000).unref();
module.exports = (max = 10, windowMs = 15 * 60 * 1000) => (req, res, next) => {
  const key = req.ip + req.path, now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now); hits.set(key, list);
  if (list.length > max) return res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' });
  next();
};
