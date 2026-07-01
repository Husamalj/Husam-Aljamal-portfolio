const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data', 'app.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    read INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name_line1 TEXT NOT NULL DEFAULT '',
    name_line2 TEXT NOT NULL DEFAULT '',
    eyebrow TEXT NOT NULL DEFAULT '',
    objective TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    linkedin_url TEXT NOT NULL DEFAULT '',
    linkedin_label TEXT NOT NULL DEFAULT '',
    github_url TEXT NOT NULL DEFAULT '',
    github_label TEXT NOT NULL DEFAULT '',
    languages TEXT NOT NULL DEFAULT '',
    photo_path TEXT NOT NULL DEFAULT '/uploads/photo.jpg'
  );

  CREATE TABLE IF NOT EXISTS experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL DEFAULT '',
    org TEXT NOT NULL DEFAULT '',
    date_range TEXT NOT NULL DEFAULT '',
    bullets TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    stack TEXT NOT NULL DEFAULT '',
    bullets TEXT NOT NULL DEFAULT '',
    badge TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS skills (
    category TEXT PRIMARY KEY,
    items TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    degree TEXT NOT NULL DEFAULT '',
    school TEXT NOT NULL DEFAULT '',
    date_range TEXT NOT NULL DEFAULT '',
    extra TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
`);

const messageCols = db.prepare("PRAGMA table_info(messages)").all().map(c => c.name);
if (!messageCols.includes('name')) {
  db.exec("ALTER TABLE messages ADD COLUMN name TEXT NOT NULL DEFAULT ''");
}

function seedIfEmpty() {
  const hasProfile = db.prepare('SELECT COUNT(*) AS c FROM profile').get().c > 0;
  if (!hasProfile) {
    db.prepare(`INSERT INTO profile
      (id, name_line1, name_line2, eyebrow, objective, email, phone, location,
       linkedin_url, linkedin_label, github_url, github_label, languages, photo_path)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'Husam Mohammad', 'Aljamal',
      'Computer Engineering Student — Robotics & Network Engineer',
      "Driven Computer Engineering student targeting Robotics Engineer and Network Engineer roles, combining a deep enthusiasm for network architectures with expertise in C++, Python, Arduino, and Linux. HU Hackathon runner-up recognized for developing the 'hired-jo' platform.",
      'hosamstudy24@gmail.com', '+962 779 035 695', 'Irbid, Jordan',
      'https://www.linkedin.com/in/husam-aljamal-041911290/', 'husam-aljamal',
      'https://github.com/Husamalj', 'Husamalj',
      'Arabic (Native), English (Intermediate)',
      '/uploads/photo.jpg'
    );
  }

  const hasExperience = db.prepare('SELECT COUNT(*) AS c FROM experience').get().c > 0;
  if (!hasExperience) {
    db.prepare(`INSERT INTO experience (role, org, date_range, bullets, sort_order) VALUES (?, ?, ?, ?, ?)`).run(
      'Robotics Instructor', 'Eureka Tech Academy', 'Jan 2026 — Present',
      [
        'Led instructional sessions for many students across a 12-week robotics curriculum, fostering hands-on project development and technical proficiency.',
        'Designed and implemented engaging lesson plans covering fundamental robotics concepts, electronic components, and programming principles.',
        'Mentored students in the successful design, assembly, and programming of various robotics projects, enhancing their problem-solving and critical thinking skills.'
      ].join('\n'),
      0
    );
  }

  const hasProjects = db.prepare('SELECT COUNT(*) AS c FROM projects').get().c > 0;
  if (!hasProjects) {
    const insertProj = db.prepare(`INSERT INTO projects (name, stack, bullets, badge, sort_order) VALUES (?, ?, ?, ?, ?)`);
    insertProj.run(
      'Hired-jo', 'Claude, Vercel, Supabase, TypeScript',
      [
        'Developed a comprehensive web application for CV creation and job search functionalities, optimizing user experience.',
        'Implemented robust backend logic using Supabase and an intuitive frontend interface with TypeScript, ensuring efficient data processing and display, with deployment on Vercel.',
        'Secured second place at the Hashemite University Hackathon, demonstrating strong innovation and technical execution.'
      ].join('\n'),
      '🏆 2nd Place — HU Hackathon', 0
    );
    insertProj.run(
      'YeetDisk', 'Claude, WebRTC, JavaScript, Kotlin',
      [
        'Engineered a system for seamless interaction between mobile devices and personal computers, facilitating remote control capabilities.',
        'Implemented secure communication protocols and an intuitive user interface using Claude for reliable operation.',
        'Delivered a practical solution for enhanced accessibility, allowing users to control their PC from anywhere.'
      ].join('\n'),
      'Remote PC control, from any device', 1
    );
    insertProj.run(
      'Image Recognizer', 'Python, CV2, CNN, ML',
      [
        'Developed an image recognition model using Python, OpenCV (CV2), and machine learning principles for accurate sign detection.',
        'Implemented a Convolutional Neural Network (CNN) architecture to process and classify image data effectively.',
        "Achieved a full grade in the university class project, validating the model's accuracy and execution."
      ].join('\n'),
      'Full marks — University project', 2
    );
  }

  const hasSkills = db.prepare('SELECT COUNT(*) AS c FROM skills').get().c > 0;
  if (!hasSkills) {
    const insertSkill = db.prepare(`INSERT INTO skills (category, items) VALUES (?, ?)`);
    insertSkill.run('Programming Languages', 'C++, Java, Python, C, HTML, CSS, JavaScript');
    insertSkill.run('Tools & Platforms', 'Docker, Linux, Git, GitHub, Arduino IDE, Vercel, Proteus, KiCad, AutoCAD, SolidWorks, Code::Blocks, Cisco Packet Tracer');
    insertSkill.run('Soft Skills', 'Continuous Learning, Attention to Detail, Reliability, Time Management, Adaptability, Critical Thinking');
  }

  const hasEducation = db.prepare('SELECT COUNT(*) AS c FROM education').get().c > 0;
  if (!hasEducation) {
    db.prepare(`INSERT INTO education (degree, school, date_range, extra, sort_order) VALUES (?, ?, ?, ?, ?)`).run(
      'B.Sc. in Computer Engineering', 'Hashemite University', '2022 — 2026',
      'Certification: CCNA (In Progress)', 0
    );
  }

  const hasAchievements = db.prepare('SELECT COUNT(*) AS c FROM achievements').get().c > 0;
  if (!hasAchievements) {
    const insertAch = db.prepare(`INSERT INTO achievements (text, sort_order) VALUES (?, ?)`);
    insertAch.run('Placed in the Top 32 at the HTU SUMO Robotics Contest.', 0);
    insertAch.run('Achieved 9th place in the Fire-Fighting Robotics Contest with IEEE.', 1);
    insertAch.run("Runner-up, HU Hackathon — 'hired-jo' platform.", 2);
  }
}

seedIfEmpty();

// ---------- Messages ----------
function insertMessage(name, message) {
  return db.prepare('INSERT INTO messages (name, message) VALUES (?, ?)').run(name, message);
}
function listMessages() {
  return db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
}
function markRead(id) {
  db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(id);
}
function deleteMessage(id) {
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
}

// ---------- Profile ----------
function getProfile() {
  return db.prepare('SELECT * FROM profile WHERE id = 1').get();
}
function updateProfile(fields) {
  const cols = Object.keys(fields);
  const set = cols.map(c => `${c} = @${c}`).join(', ');
  db.prepare(`UPDATE profile SET ${set} WHERE id = 1`).run(fields);
}

// ---------- Experience ----------
function listExperience() {
  return db.prepare('SELECT * FROM experience ORDER BY sort_order ASC, id ASC').all();
}
function createExperience(data) {
  db.prepare('INSERT INTO experience (role, org, date_range, bullets, sort_order) VALUES (@role, @org, @date_range, @bullets, @sort_order)').run(data);
}
function updateExperience(id, data) {
  db.prepare('UPDATE experience SET role=@role, org=@org, date_range=@date_range, bullets=@bullets, sort_order=@sort_order WHERE id=@id').run({ ...data, id });
}
function deleteExperience(id) {
  db.prepare('DELETE FROM experience WHERE id = ?').run(id);
}

// ---------- Projects ----------
function listProjects() {
  return db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, id ASC').all();
}
function createProject(data) {
  db.prepare('INSERT INTO projects (name, stack, bullets, badge, sort_order) VALUES (@name, @stack, @bullets, @badge, @sort_order)').run(data);
}
function updateProject(id, data) {
  db.prepare('UPDATE projects SET name=@name, stack=@stack, bullets=@bullets, badge=@badge, sort_order=@sort_order WHERE id=@id').run({ ...data, id });
}
function deleteProject(id) {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// ---------- Skills ----------
function listSkills() {
  return db.prepare('SELECT * FROM skills').all();
}
function updateSkillCategory(category, items) {
  db.prepare('UPDATE skills SET items = ? WHERE category = ?').run(items, category);
}

// ---------- Education ----------
function listEducation() {
  return db.prepare('SELECT * FROM education ORDER BY sort_order ASC, id ASC').all();
}
function createEducation(data) {
  db.prepare('INSERT INTO education (degree, school, date_range, extra, sort_order) VALUES (@degree, @school, @date_range, @extra, @sort_order)').run(data);
}
function updateEducation(id, data) {
  db.prepare('UPDATE education SET degree=@degree, school=@school, date_range=@date_range, extra=@extra, sort_order=@sort_order WHERE id=@id').run({ ...data, id });
}
function deleteEducation(id) {
  db.prepare('DELETE FROM education WHERE id = ?').run(id);
}

// ---------- Achievements ----------
function listAchievements() {
  return db.prepare('SELECT * FROM achievements ORDER BY sort_order ASC, id ASC').all();
}
function createAchievement(text, sort_order) {
  db.prepare('INSERT INTO achievements (text, sort_order) VALUES (?, ?)').run(text, sort_order);
}
function updateAchievement(id, text, sort_order) {
  db.prepare('UPDATE achievements SET text=?, sort_order=? WHERE id=?').run(text, sort_order, id);
}
function deleteAchievement(id) {
  db.prepare('DELETE FROM achievements WHERE id = ?').run(id);
}

module.exports = {
  insertMessage, listMessages, markRead, deleteMessage,
  getProfile, updateProfile,
  listExperience, createExperience, updateExperience, deleteExperience,
  listProjects, createProject, updateProject, deleteProject,
  listSkills, updateSkillCategory,
  listEducation, createEducation, updateEducation, deleteEducation,
  listAchievements, createAchievement, updateAchievement, deleteAchievement
};
