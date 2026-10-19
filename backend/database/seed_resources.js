require('dotenv').config();
const db = require('../src/config/db');

const resources = [
  ['Developer Roadmaps (roadmap.sh)', 'https://roadmap.sh', 'Step-by-step learning paths for frontend, backend, DevOps, and more.'],
  ['freeCodeCamp', 'https://www.freecodecamp.org', 'Free hands-on courses and projects covering web development, data and more.'],
  ['MDN Web Docs', 'https://developer.mozilla.org', 'The go-to reference for HTML, CSS and JavaScript.'],
  ['React Documentation', 'https://react.dev/learn', 'Official, interactive guide to learning React.'],
  ['Pro Git Book', 'https://git-scm.com/book/en/v2', 'Free book on Git: branching, collaboration and workflows for team projects.'],
  ['LeetCode', 'https://leetcode.com', 'Practice data structures and algorithm problems for coding interviews.'],
  ['Tech Interview Handbook', 'https://www.techinterviewhandbook.org', 'Placement guidance: resume tips, interview prep and negotiation.'],
  ['GitHub Student Developer Pack', 'https://education.github.com/pack', 'Free tools and credits for students to build and host projects.'],
];

(async () => {
  const [[admin]] = await db.query('SELECT id FROM users WHERE email=?', [process.env.ADMIN_EMAIL || 'admin@peerhub.com']);
  if (!admin) throw new Error('Admin user not found. Run npm run seed first.');
  let added = 0;
  for (const [title, url, description] of resources) {
    const [ex] = await db.query('SELECT id FROM resources WHERE project_id IS NULL AND url=?', [url]);
    if (ex.length) continue;
    await db.query('INSERT INTO resources(user_id,project_id,title,url,description) VALUES(?,NULL,?,?,?)', [admin.id, title, url, description]);
    added++;
  }
  console.log(`Added ${added} shared resources (${resources.length - added} already existed).`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
