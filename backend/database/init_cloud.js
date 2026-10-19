// Sets up an online MySQL database: creates the tables and the admin account.
// Add --demo to also load the sample data.   Usage: node database/init_cloud.js --demo
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// online databases already exist, so drop CREATE DATABASE / USE lines
const sql = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8')
  .replace(/^\s*CREATE DATABASE.*$/gim, '').replace(/^\s*USE\s+\w+;\s*$/gim, '');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });
  await c.query(sql('schema.sql'));
  console.log('Tables ready');

  const email = process.env.ADMIN_EMAIL || 'admin@peerhub.com';
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
  await c.query("INSERT INTO users(name,email,password_hash,role,is_verified) VALUES('Admin',?,?,'admin',1) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)", [email, hash]);
  await c.query('INSERT IGNORE INTO profiles(user_id) SELECT id FROM users WHERE email=?', [email]);
  console.log('Admin ready:', email);

  if (process.argv.includes('--demo')) {
    await c.query(sql('peerhub_sample_data.sql'));
    await c.query(sql('hackathons.sql'));
    console.log('Demo data loaded (password for demo users: Password@123)');
  }
  await c.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
