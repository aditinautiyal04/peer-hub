const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const db = require('./config/db');
let io;

const isMember = async (pid, uid) =>
  (await db.query('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?', [pid, uid]))[0].length > 0;

exports.init = (server, origin) => {
  io = new Server(server, { cors: { origin } });
  io.use(async (s, next) => {
    try {
      s.user = jwt.verify(s.handshake.auth.token, process.env.JWT_SECRET);
      const [[u]] = await db.query('SELECT is_active FROM users WHERE id=?', [s.user.id]);
      if (!u || !u.is_active) throw new Error('inactive');
      next();
    } catch { next(new Error('auth')); }
  });
  io.on('connection', async (s) => {
    const me = s.user.id;
    s.join('user:' + me);
    const [rows] = await db.query('SELECT project_id FROM project_members WHERE user_id=?', [me]);
    rows.forEach((r) => s.join('project:' + r.project_id));

    s.on('project_message', async ({ projectId, body }) => {
      if (!body?.trim() || !(await isMember(projectId, me))) return;
      const [r] = await db.query('INSERT INTO messages(project_id,sender_id,body) VALUES(?,?,?)', [projectId, me, body.trim()]);
      io.to('project:' + projectId).emit('project_message',
        { id: r.insertId, project_id: +projectId, sender_id: me, sender_name: s.user.name, body: body.trim(), created_at: new Date() });
    });

    s.on('direct_message', async ({ to, body }) => {
      if (!body?.trim() || !to) return;
      const [r] = await db.query('INSERT INTO messages(sender_id,receiver_id,body) VALUES(?,?,?)', [me, to, body.trim()]);
      io.to('user:' + to).to('user:' + me).emit('direct_message',
        { id: r.insertId, sender_id: me, receiver_id: +to, sender_name: s.user.name, body: body.trim(), created_at: new Date() });
    });
  });
};
exports.emitTo = (uid, ev, data) => io && io.to('user:' + uid).emit(ev, data);
exports.joinProject = (uid, pid) => io && io.in('user:' + uid).socketsJoin('project:' + pid);
exports.leaveProject = (uid, pid) => io && io.in('user:' + uid).socketsLeave('project:' + pid);
