require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { init } = require('./socket');

const app = express();
app.set('trust proxy', 1); // correct client IPs behind Render/Cloudflare
const origin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/match', require('./routes/match'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/hackathons', require('./routes/hackathons'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));

// Serve the built website (frontend/dist) so one address opens the whole app
const path = require('path');
const fs = require('fs');
const dist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|socket\.io).*/, (_, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

const server = http.createServer(app);
init(server, origin);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('PEER-HUB API on http://localhost:' + PORT));
