const fs = require('fs');
const path = require('path');

const TEMPLATE = fs.readFileSync(path.join(__dirname, 'views', 'site-template.html'), 'utf8');

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitLines(text) {
  return String(text ?? '').split('\n').map(s => s.trim()).filter(Boolean);
}

function splitCsv(text) {
  return String(text ?? '').split(',').map(s => s.trim()).filter(Boolean);
}

function renderExperience(experience) {
  if (!experience.length) return '<p style="color:var(--text-mute)">No experience added yet.</p>';
  return experience.map(e => `
    <div class="exp-item">
      <div class="exp-head">
        <div><span class="exp-role">${escapeHtml(e.role)}</span> — <span class="exp-org">${escapeHtml(e.org)}</span></div>
        <div class="exp-date">${escapeHtml(e.date_range)}</div>
      </div>
      <ul>
        ${splitLines(e.bullets).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

function renderProjects(projects) {
  return projects.map((p, i) => `
    <div class="proj-card">
      <div class="proj-index">${String(i + 1).padStart(2, '0')}</div>
      <h3>${escapeHtml(p.name)}</h3>
      <div class="stack">
        ${splitCsv(p.stack).map(s => `<span class="chip">${escapeHtml(s)}</span>`).join('')}
      </div>
      <ul>
        ${splitLines(p.bullets).map(b => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>
      ${p.badge ? `<div class="proj-badge">${escapeHtml(p.badge)}</div>` : ''}
    </div>
  `).join('');
}

function renderSkills(skills) {
  return skills.map(s => `
    <div class="skill-group">
      <h4>${escapeHtml(s.category)}</h4>
      <div class="skill-chips">
        ${splitCsv(s.items).map(item => `<span>${escapeHtml(item)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderEducation(education) {
  return education.map(e => `
    <div class="edu-item">
      <div class="degree">${escapeHtml(e.degree)}</div>
      <div class="school">${escapeHtml(e.school)}</div>
      <div class="date">${escapeHtml(e.date_range)}</div>
      ${e.extra ? `<div class="extra">${escapeHtml(e.extra)}</div>` : ''}
    </div>
  `).join('');
}

function renderAchievements(achievements) {
  if (!achievements.length) return '<li style="color:var(--text-mute)">No achievements added yet.</li>';
  return achievements.map((a, i) => `
    <li><span class="ico">${String(i + 1).padStart(2, '0')}</span> ${escapeHtml(a.text)}</li>
  `).join('');
}

function renderLanguages(languages) {
  return splitCsv(languages).map(l => `<div class="lang-item">${escapeHtml(l)}</div>`).join('');
}

function renderSite(data) {
  const { profile, experience, projects, skills, education, achievements } = data;

  const nameInitial = (profile.name_line1 || '').charAt(0).toUpperCase() || 'H';
  const nameLast = (profile.name_line2 || '').toUpperCase();

  let html = TEMPLATE;
  const replacements = {
    __NAME_LINE1__: escapeHtml(profile.name_line1),
    __NAME_LINE2__: escapeHtml(profile.name_line2),
    __NAME_INITIAL__: escapeHtml(nameInitial),
    __NAME_LAST__: escapeHtml(nameLast),
    __EYEBROW__: escapeHtml(profile.eyebrow),
    __OBJECTIVE__: escapeHtml(profile.objective),
    __EMAIL__: escapeHtml(profile.email),
    __PHONE__: escapeHtml(profile.phone),
    __PHONE_TEL__: escapeHtml((profile.phone || '').replace(/[^\d+]/g, '')),
    __LOCATION__: escapeHtml(profile.location),
    __LOCATION_UPPER__: escapeHtml((profile.location || '').toUpperCase()),
    __LINKEDIN_URL__: escapeHtml(profile.linkedin_url),
    __LINKEDIN_LABEL__: escapeHtml(profile.linkedin_label),
    __GITHUB_URL__: escapeHtml(profile.github_url),
    __GITHUB_LABEL__: escapeHtml(profile.github_label),
    __LANGUAGES__: escapeHtml(profile.languages),
    __LANGUAGES_HTML__: renderLanguages(profile.languages),
    __PHOTO_SRC__: escapeHtml(profile.photo_path) + '?v=' + Date.now(),
    __EXPERIENCE_HTML__: renderExperience(experience),
    __PROJECTS_HTML__: renderProjects(projects),
    __SKILLS_HTML__: renderSkills(skills),
    __EDUCATION_HTML__: renderEducation(education),
    __ACHIEVEMENTS_HTML__: renderAchievements(achievements),
    __YEAR__: new Date().getFullYear()
  };

  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value);
  }
  return html;
}

module.exports = { renderSite, escapeHtml };
