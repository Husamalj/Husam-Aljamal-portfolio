require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const db = require('./db');
const { renderSite, escapeHtml } = require('./render');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!ADMIN_PASSWORD || !SESSION_SECRET) {
  console.error('Missing ADMIN_PASSWORD or SESSION_SECRET in environment. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `photo-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  }
});

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 12
  }
}));
app.use(express.static(path.join(__dirname, 'public')));


// ============ Public site ============
app.get('/', (req, res) => {
  const data = {
    profile: db.getProfile(),
    experience: db.listExperience(),
    projects: db.listProjects(),
    skills: db.listSkills(),
    education: db.listEducation(),
    achievements: db.listAchievements()
  };
  res.send(renderSite(data));
});

app.post('/api/contact', (req, res) => {
  const name = (req.body.name || '').trim().slice(0, 120);
  const message = (req.body.message || '').trim();

  if (!message || message.length > 4000) {
    return res.status(400).json({ error: 'Message is empty or too long.' });
  }

  db.insertMessage(name, message);
  res.json({ ok: true });
});

// ============ Admin auth ============
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/admin/login');
}

app.get('/admin/login', (req, res) => {
  const error = req.query.error ? '<p class="err">Incorrect password.</p>' : '';
  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Admin Login</title>
${adminBaseStyles()}
</head>
<body>
  <div class="login-wrap">
    <form method="POST" action="/admin/login" class="panel" style="width:280px;">
      <h1>ADMIN // LOGIN</h1>
      ${error}
      <input type="password" name="password" placeholder="Password" autofocus required>
      <button type="submit" class="btn">Enter</button>
    </form>
  </div>
</body></html>`);
});

app.post('/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect('/admin');
  }
  res.redirect('/admin/login?error=1');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ============ Shared admin chrome ============
function adminBaseStyles() {
  return `<style>
    :root{color-scheme:dark;}
    *{box-sizing:border-box;}
    body{background:#0a0d10;color:#dfe6ea;font-family:'Consolas',monospace;margin:0;}
    .login-wrap{display:flex;align-items:center;justify-content:center;height:100vh;}
    .panel{background:#10151a;border:1px solid #223038;padding:32px;}
    h1{font-size:16px;margin:0 0 20px 0;}
    input, textarea{width:100%;padding:10px;margin-bottom:14px;background:#0a0d10;
      border:1px solid #223038;color:#dfe6ea;box-sizing:border-box;font-family:inherit;font-size:13px;}
    textarea{resize:vertical;}
    label{display:block;font-size:11px;color:#5d6d73;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;}
    .btn{padding:10px 16px;background:#ffb020;border:none;color:#161006;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px;}
    .btn.ghost{background:transparent;border:1px solid #223038;color:#8fa1a8;}
    .btn.danger{background:transparent;border:1px solid #223038;color:#8fa1a8;}
    .btn.danger:hover{border-color:#ff5f56;color:#ff5f56;}
    .btn.ghost:hover{border-color:#ffb020;color:#ffb020;}
    .err{color:#ff5f56;font-size:13px;}
    .ok-msg{color:#34d1c4;font-size:13px;margin-bottom:14px;}
    a{color:#ffb020;}
  </style>`;
}

function adminLayout(title, activeSection, bodyHtml) {
  const nav = [
    ['inbox', '/admin/inbox', 'Inbox'],
    ['profile', '/admin/profile', 'Profile & Links'],
    ['photo', '/admin/photo', 'Photo'],
    ['experience', '/admin/experience', 'Experience'],
    ['projects', '/admin/projects', 'Projects'],
    ['skills', '/admin/skills', 'Skills'],
    ['education', '/admin/education', 'Education'],
    ['achievements', '/admin/achievements', 'Achievements']
  ].map(([key, href, label]) => `<a href="${href}" class="nav-link${key === activeSection ? ' active' : ''}">${label}</a>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${escapeHtml(title)} — Admin</title>
${adminBaseStyles()}
<style>
  .shell{max-width:1000px;margin:0 auto;padding:28px 20px 60px 20px;}
  .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;
    border-bottom:1px solid #223038;padding-bottom:16px;}
  .topbar h1{font-size:18px;margin:0;}
  .topbar h1 span{color:#ffb020;}
  .adminnav{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;}
  .nav-link{font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#8fa1a8;
    border:1px solid #223038;padding:8px 12px;text-decoration:none;}
  .nav-link:hover{color:#ffb020;border-color:#ffb020;}
  .nav-link.active{color:#0a0d10;background:#ffb020;border-color:#ffb020;}
  .card{border:1px solid #223038;background:#10151a;padding:20px 22px;margin-bottom:16px;}
  .card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .actions{display:flex;gap:10px;margin-top:6px;}
  .actions form{margin:0;}
  .hint{color:#5d6d73;font-size:11.5px;margin:-8px 0 14px 0;}
</style>
</head>
<body>
  <div class="shell">
    <div class="topbar">
      <h1>PORTFOLIO <span>// ${escapeHtml(title)}</span></h1>
      <form method="POST" action="/admin/logout" style="margin:0;">
        <button type="submit" class="btn ghost">Log out</button>
      </form>
    </div>
    <div class="adminnav">${nav}</div>
    ${bodyHtml}
  </div>
</body></html>`;
}

// ============ Admin hub ============
app.get('/admin', requireAuth, (req, res) => {
  res.redirect('/admin/inbox');
});

// ============ Inbox ============
app.get('/admin/inbox', requireAuth, (req, res) => {
  const messages = db.listMessages();
  const rows = messages.map(m => `
    <div class="card ${m.read ? '' : ''}" style="${m.read ? '' : 'border-color:#ffb020;'}">
      <div class="card-head">
        <span style="color:#34d1c4;font-weight:700;">${escapeHtml(m.name) || 'Anonymous'}</span>
        <span style="color:#5d6d73;font-size:12px;">${escapeHtml(m.created_at)} UTC</span>
      </div>
      <div style="white-space:pre-wrap;font-size:14px;">${escapeHtml(m.message)}</div>
      <div class="actions">
        ${m.read ? '' : `<form method="POST" action="/admin/messages/${m.id}/read"><button type="submit" class="btn ghost">Mark read</button></form>`}
        <form method="POST" action="/admin/messages/${m.id}/delete" onsubmit="return confirm('Delete this message?');">
          <button type="submit" class="btn danger">Delete</button>
        </form>
      </div>
    </div>
  `).join('') || '<p style="color:#5d6d73;">No messages yet.</p>';

  res.send(adminLayout('Inbox', 'inbox', rows));
});

app.post('/admin/messages/:id/read', requireAuth, (req, res) => {
  db.markRead(req.params.id);
  res.redirect('/admin/inbox');
});
app.post('/admin/messages/:id/delete', requireAuth, (req, res) => {
  db.deleteMessage(req.params.id);
  res.redirect('/admin/inbox');
});

// ============ Profile & links ============
app.get('/admin/profile', requireAuth, (req, res) => {
  const p = db.getProfile();
  const saved = req.query.saved ? '<p class="ok-msg">Saved.</p>' : '';
  const body = `
    ${saved}
    <form method="POST" action="/admin/profile" class="card">
      <div class="row">
        <div><label>Name — line 1</label><input name="name_line1" value="${escapeHtml(p.name_line1)}"></div>
        <div><label>Name — line 2 (accent)</label><input name="name_line2" value="${escapeHtml(p.name_line2)}"></div>
      </div>
      <label>Eyebrow / role tagline</label>
      <input name="eyebrow" value="${escapeHtml(p.eyebrow)}">
      <label>Objective / About paragraph</label>
      <textarea name="objective" rows="5">${escapeHtml(p.objective)}</textarea>
      <div class="row">
        <div><label>Email</label><input name="email" value="${escapeHtml(p.email)}"></div>
        <div><label>Phone</label><input name="phone" value="${escapeHtml(p.phone)}"></div>
      </div>
      <div class="row">
        <div><label>Location</label><input name="location" value="${escapeHtml(p.location)}"></div>
        <div><label>Languages (comma separated)</label><input name="languages" value="${escapeHtml(p.languages)}"></div>
      </div>
      <div class="row">
        <div><label>LinkedIn URL</label><input name="linkedin_url" value="${escapeHtml(p.linkedin_url)}"></div>
        <div><label>LinkedIn label</label><input name="linkedin_label" value="${escapeHtml(p.linkedin_label)}"></div>
      </div>
      <div class="row">
        <div><label>GitHub URL</label><input name="github_url" value="${escapeHtml(p.github_url)}"></div>
        <div><label>GitHub label</label><input name="github_label" value="${escapeHtml(p.github_label)}"></div>
      </div>
      <button type="submit" class="btn">Save changes</button>
    </form>
  `;
  res.send(adminLayout('Profile & Links', 'profile', body));
});

app.post('/admin/profile', requireAuth, (req, res) => {
  const fields = ['name_line1', 'name_line2', 'eyebrow', 'objective', 'email', 'phone',
    'location', 'linkedin_url', 'linkedin_label', 'github_url', 'github_label', 'languages'];
  const data = {};
  for (const f of fields) data[f] = (req.body[f] || '').trim();
  db.updateProfile(data);
  res.redirect('/admin/profile?saved=1');
});

// ============ Photo ============
app.get('/admin/photo', requireAuth, (req, res) => {
  const p = db.getProfile();
  const saved = req.query.saved ? '<p class="ok-msg">Photo updated.</p>' : '';
  const error = req.query.error ? `<p class="err">${escapeHtml(req.query.error)}</p>` : '';
  const body = `
    ${saved}${error}
    <div class="card">
      <label>Current photo</label>
      <img src="${escapeHtml(p.photo_path)}?v=${Date.now()}" style="max-width:220px;display:block;margin-bottom:18px;border:1px solid #223038;">
      <form method="POST" action="/admin/photo" enctype="multipart/form-data">
        <label>Upload new photo (jpg / png / webp)</label>
        <input type="file" name="photo" accept="image/*" required style="padding:10px 0;">
        <button type="submit" class="btn">Upload &amp; replace</button>
      </form>
    </div>
  `;
  res.send(adminLayout('Photo', 'photo', body));
});

app.post('/admin/photo', requireAuth, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.redirect('/admin/photo?error=' + encodeURIComponent(err.message));
    if (!req.file) return res.redirect('/admin/photo?error=No file uploaded.');
    db.updateProfile({ photo_path: '/uploads/' + req.file.filename });
    res.redirect('/admin/photo?saved=1');
  });
});

// ============ Experience ============
app.get('/admin/experience', requireAuth, (req, res) => {
  const items = db.listExperience();
  const cards = items.map(e => `
    <form method="POST" action="/admin/experience/${e.id}" class="card">
      <div class="row">
        <div><label>Role</label><input name="role" value="${escapeHtml(e.role)}"></div>
        <div><label>Organization</label><input name="org" value="${escapeHtml(e.org)}"></div>
      </div>
      <div class="row">
        <div><label>Date range</label><input name="date_range" value="${escapeHtml(e.date_range)}"></div>
        <div><label>Sort order (lower = first)</label><input name="sort_order" type="number" value="${e.sort_order}"></div>
      </div>
      <label>Bullets (one per line)</label>
      <textarea name="bullets" rows="4">${escapeHtml(e.bullets)}</textarea>
      <div class="actions">
        <button type="submit" class="btn">Save</button>
      </div>
    </form>
    <form method="POST" action="/admin/experience/${e.id}/delete" onsubmit="return confirm('Delete this entry?');" style="margin:-8px 0 16px 0;">
      <button type="submit" class="btn danger">Delete entry</button>
    </form>
  `).join('');

  const addForm = `
    <div class="card">
      <div class="card-head"><strong>Add new experience</strong></div>
      <form method="POST" action="/admin/experience">
        <div class="row">
          <div><label>Role</label><input name="role" required></div>
          <div><label>Organization</label><input name="org" required></div>
        </div>
        <div class="row">
          <div><label>Date range</label><input name="date_range" placeholder="Jan 2026 — Present"></div>
          <div><label>Sort order</label><input name="sort_order" type="number" value="0"></div>
        </div>
        <label>Bullets (one per line)</label>
        <textarea name="bullets" rows="4"></textarea>
        <button type="submit" class="btn">Add experience</button>
      </form>
    </div>
  `;

  res.send(adminLayout('Experience', 'experience', cards + addForm));
});

app.post('/admin/experience', requireAuth, (req, res) => {
  db.createExperience({
    role: req.body.role || '', org: req.body.org || '',
    date_range: req.body.date_range || '', bullets: req.body.bullets || '',
    sort_order: parseInt(req.body.sort_order, 10) || 0
  });
  res.redirect('/admin/experience');
});
app.post('/admin/experience/:id', requireAuth, (req, res) => {
  db.updateExperience(req.params.id, {
    role: req.body.role || '', org: req.body.org || '',
    date_range: req.body.date_range || '', bullets: req.body.bullets || '',
    sort_order: parseInt(req.body.sort_order, 10) || 0
  });
  res.redirect('/admin/experience');
});
app.post('/admin/experience/:id/delete', requireAuth, (req, res) => {
  db.deleteExperience(req.params.id);
  res.redirect('/admin/experience');
});

// ============ Projects ============
app.get('/admin/projects', requireAuth, (req, res) => {
  const items = db.listProjects();
  const cards = items.map(p => `
    <form method="POST" action="/admin/projects/${p.id}" class="card">
      <div class="row">
        <div><label>Name</label><input name="name" value="${escapeHtml(p.name)}"></div>
        <div><label>Stack (comma separated)</label><input name="stack" value="${escapeHtml(p.stack)}"></div>
      </div>
      <label>Bullets (one per line)</label>
      <textarea name="bullets" rows="4">${escapeHtml(p.bullets)}</textarea>
      <div class="row">
        <div><label>Badge text</label><input name="badge" value="${escapeHtml(p.badge)}"></div>
        <div><label>Sort order</label><input name="sort_order" type="number" value="${p.sort_order}"></div>
      </div>
      <div class="actions">
        <button type="submit" class="btn">Save</button>
      </div>
    </form>
    <form method="POST" action="/admin/projects/${p.id}/delete" onsubmit="return confirm('Delete this project?');" style="margin:-8px 0 16px 0;">
      <button type="submit" class="btn danger">Delete project</button>
    </form>
  `).join('');

  const addForm = `
    <div class="card">
      <div class="card-head"><strong>Add new project</strong></div>
      <form method="POST" action="/admin/projects">
        <div class="row">
          <div><label>Name</label><input name="name" required></div>
          <div><label>Stack (comma separated)</label><input name="stack"></div>
        </div>
        <label>Bullets (one per line)</label>
        <textarea name="bullets" rows="4"></textarea>
        <div class="row">
          <div><label>Badge text</label><input name="badge"></div>
          <div><label>Sort order</label><input name="sort_order" type="number" value="0"></div>
        </div>
        <button type="submit" class="btn">Add project</button>
      </form>
    </div>
  `;

  res.send(adminLayout('Projects', 'projects', cards + addForm));
});

app.post('/admin/projects', requireAuth, (req, res) => {
  db.createProject({
    name: req.body.name || '', stack: req.body.stack || '',
    bullets: req.body.bullets || '', badge: req.body.badge || '',
    sort_order: parseInt(req.body.sort_order, 10) || 0
  });
  res.redirect('/admin/projects');
});
app.post('/admin/projects/:id', requireAuth, (req, res) => {
  db.updateProject(req.params.id, {
    name: req.body.name || '', stack: req.body.stack || '',
    bullets: req.body.bullets || '', badge: req.body.badge || '',
    sort_order: parseInt(req.body.sort_order, 10) || 0
  });
  res.redirect('/admin/projects');
});
app.post('/admin/projects/:id/delete', requireAuth, (req, res) => {
  db.deleteProject(req.params.id);
  res.redirect('/admin/projects');
});

// ============ Skills ============
app.get('/admin/skills', requireAuth, (req, res) => {
  const skills = db.listSkills();
  const saved = req.query.saved ? '<p class="ok-msg">Saved.</p>' : '';
  const fields = skills.map(s => `
    <label>${escapeHtml(s.category)} (comma separated)</label>
    <textarea name="cat__${escapeHtml(s.category)}" rows="2">${escapeHtml(s.items)}</textarea>
  `).join('');

  const body = `
    ${saved}
    <form method="POST" action="/admin/skills" class="card">
      ${fields}
      <button type="submit" class="btn">Save skills</button>
    </form>
  `;
  res.send(adminLayout('Skills', 'skills', body));
});

app.post('/admin/skills', requireAuth, (req, res) => {
  for (const key of Object.keys(req.body)) {
    if (key.startsWith('cat__')) {
      const category = key.slice(5);
      db.updateSkillCategory(category, req.body[key] || '');
    }
  }
  res.redirect('/admin/skills?saved=1');
});

// ============ Education ============
app.get('/admin/education', requireAuth, (req, res) => {
  const items = db.listEducation();
  const cards = items.map(e => `
    <form method="POST" action="/admin/education/${e.id}" class="card">
      <div class="row">
        <div><label>Degree</label><input name="degree" value="${escapeHtml(e.degree)}"></div>
        <div><label>School</label><input name="school" value="${escapeHtml(e.school)}"></div>
      </div>
      <div class="row">
        <div><label>Date range</label><input name="date_range" value="${escapeHtml(e.date_range)}"></div>
        <div><label>Sort order</label><input name="sort_order" type="number" value="${e.sort_order}"></div>
      </div>
      <label>Extra note (e.g. certification)</label>
      <input name="extra" value="${escapeHtml(e.extra)}">
      <div class="actions">
        <button type="submit" class="btn">Save</button>
      </div>
    </form>
    <form method="POST" action="/admin/education/${e.id}/delete" onsubmit="return confirm('Delete this entry?');" style="margin:-8px 0 16px 0;">
      <button type="submit" class="btn danger">Delete entry</button>
    </form>
  `).join('');

  const addForm = `
    <div class="card">
      <div class="card-head"><strong>Add new education entry</strong></div>
      <form method="POST" action="/admin/education">
        <div class="row">
          <div><label>Degree</label><input name="degree" required></div>
          <div><label>School</label><input name="school" required></div>
        </div>
        <div class="row">
          <div><label>Date range</label><input name="date_range"></div>
          <div><label>Sort order</label><input name="sort_order" type="number" value="0"></div>
        </div>
        <label>Extra note</label>
        <input name="extra">
        <button type="submit" class="btn">Add entry</button>
      </form>
    </div>
  `;

  res.send(adminLayout('Education', 'education', cards + addForm));
});

app.post('/admin/education', requireAuth, (req, res) => {
  db.createEducation({
    degree: req.body.degree || '', school: req.body.school || '',
    date_range: req.body.date_range || '', extra: req.body.extra || '',
    sort_order: parseInt(req.body.sort_order, 10) || 0
  });
  res.redirect('/admin/education');
});
app.post('/admin/education/:id', requireAuth, (req, res) => {
  db.updateEducation(req.params.id, {
    degree: req.body.degree || '', school: req.body.school || '',
    date_range: req.body.date_range || '', extra: req.body.extra || '',
    sort_order: parseInt(req.body.sort_order, 10) || 0
  });
  res.redirect('/admin/education');
});
app.post('/admin/education/:id/delete', requireAuth, (req, res) => {
  db.deleteEducation(req.params.id);
  res.redirect('/admin/education');
});

// ============ Achievements ============
app.get('/admin/achievements', requireAuth, (req, res) => {
  const items = db.listAchievements();
  const cards = items.map(a => `
    <form method="POST" action="/admin/achievements/${a.id}" class="card">
      <label>Achievement text</label>
      <input name="text" value="${escapeHtml(a.text)}">
      <div class="row">
        <div><label>Sort order</label><input name="sort_order" type="number" value="${a.sort_order}"></div>
      </div>
      <div class="actions">
        <button type="submit" class="btn">Save</button>
      </div>
    </form>
    <form method="POST" action="/admin/achievements/${a.id}/delete" onsubmit="return confirm('Delete this achievement?');" style="margin:-8px 0 16px 0;">
      <button type="submit" class="btn danger">Delete</button>
    </form>
  `).join('');

  const addForm = `
    <div class="card">
      <div class="card-head"><strong>Add new achievement</strong></div>
      <form method="POST" action="/admin/achievements">
        <label>Achievement text</label>
        <input name="text" required>
        <label>Sort order</label>
        <input name="sort_order" type="number" value="0">
        <button type="submit" class="btn">Add achievement</button>
      </form>
    </div>
  `;

  res.send(adminLayout('Achievements', 'achievements', cards + addForm));
});

app.post('/admin/achievements', requireAuth, (req, res) => {
  db.createAchievement(req.body.text || '', parseInt(req.body.sort_order, 10) || 0);
  res.redirect('/admin/achievements');
});
app.post('/admin/achievements/:id', requireAuth, (req, res) => {
  db.updateAchievement(req.params.id, req.body.text || '', parseInt(req.body.sort_order, 10) || 0);
  res.redirect('/admin/achievements');
});
app.post('/admin/achievements/:id/delete', requireAuth, (req, res) => {
  db.deleteAchievement(req.params.id);
  res.redirect('/admin/achievements');
});

app.listen(PORT, () => {
  console.log(`Portfolio app running on port ${PORT}`);
});
