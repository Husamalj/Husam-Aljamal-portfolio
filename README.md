# Portfolio + Admin CMS

**Live site:** https://husam-portfolio-production.up.railway.app/

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

## Deploy (Railway)

This app is deployed on [Railway](https://railway.com) (free trial, no credit card required to start).

1. Push this folder to a GitHub repo.
2. `railway init` to create a project, then `railway up` to deploy the current directory.
3. Set environment variables: `ADMIN_PASSWORD`, `SESSION_SECRET`, `NODE_ENV=production`.
4. Add a volume mounted at `/app/data` — this is where `app.db` and `uploads/` both live, so
   content and photos survive restarts and redeploys.
5. `railway domain` to generate a public URL.

**Note on the free trial:** Railway's trial gives $5 credit for 30 days, after which the account
drops to the Free plan (~$1/month credit — not enough for an always-on service). At that point
you'll need to add a payment method to stay on the paid Hobby plan, or redeploy elsewhere.
