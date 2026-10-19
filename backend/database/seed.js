require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
(async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@peerhub.com';
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
  const [r] = await db.query(
    "INSERT INTO users(name,email,password_hash,role,is_verified) VALUES('Admin',?,?,'admin',1) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)", [email, hash]);
  await db.query('INSERT IGNORE INTO profiles(user_id) SELECT id FROM users WHERE email=?', [email]);
  console.log('Admin ready:', email);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
