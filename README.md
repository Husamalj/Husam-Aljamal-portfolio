# Portfolio + Admin CMS

The whole site (`views/site-template.html`) is rendered server-side from a SQLite database
(`data/app.db`), so every section is editable from a password-protected admin panel at `/admin`:

- **Inbox** — messages sent through the contact box on the site
- **Profile & Links** — name, tagline, objective/about text, email, phone, location, languages, LinkedIn, GitHub
- **Photo** — upload a new profile photo, replaces it site-wide instantly
- **Experience** — add / edit / delete job entries with bullet points
- **Projects** — add / edit / delete project cards with tech-stack chips
- **Skills** — edit the three skill categories (comma-separated lists)
- **Education** — add / edit / delete degrees/certifications
- **Achievements** — add / edit / delete achievement lines

## Run locally

```bash
npm install
cp .env.example .env
# edit .env: set ADMIN_PASSWORD and SESSION_SECRET
npm start
```

Visit `http://localhost:3000` for the site, `http://localhost:3000/admin` to edit anything.

## Deploy (Render)

1. Push this folder to a GitHub repo.
2. On [render.com](https://render.com) → New → Web Service → connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables in the Render dashboard:
   - `ADMIN_PASSWORD` — your admin password
   - `SESSION_SECRET` — any long random string
   - `NODE_ENV=production`
5. Deploy. Your site is live at the Render URL; `/admin` is where you edit everything.

**Note on storage:** `data/app.db` (all your content + messages) and `public/uploads/` (your
photo) live on Render's local disk, which persists across restarts but is wiped on redeploy.
For a portfolio you edit occasionally this is usually fine — just re-enter anything you changed
after a redeploy. If you want it to survive redeploys automatically, add a Render persistent disk
mounted at `/opt/render/project/src/data` (and one for `public/uploads`), or move content storage
to a hosted database later.
