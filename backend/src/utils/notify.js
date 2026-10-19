const db = require('../config/db');
const { emitTo } = require('../socket');
module.exports = async (userId, message) => {
  const [r] = await db.query('INSERT INTO notifications(user_id,message) VALUES(?,?)', [userId, message]);
  emitTo(userId, 'notification', { id: r.insertId, message, is_read: 0, created_at: new Date() });
};
