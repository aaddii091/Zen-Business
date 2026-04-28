# Zengarden Homepage

Marketing site and content surface for Zengarden.

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown and rich content support

## Project Structure

The project is organized around page routes, shared components, and content entries:

```text
├── public/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Pages live in `src/pages/` and are exposed as routes based on file name.

Shared UI lives in `src/components/`.

Blog and editorial content live in `src/content/`.

Any static assets, like images, can be placed in the `public/` directory.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run project CLI commands                         |
| `npm run astro -- --help` | Show CLI help                                    |

## Compliance Checker Setup

The `/compliance-score` flow uses server APIs for scoring persistence, email, PDF report generation, and admin export.

### Required environment variables

Add these to `.env.local` (and deployment env):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `SITE_URL`

Optional (admin CSV export endpoint):

- `COMPLIANCE_ADMIN_EXPORT_KEY`

### Database schema

Run the SQL in `supabase/compliance_submissions.sql` against your Supabase database.

### API routes

- `POST /api/compliance/submit`
- `GET /api/compliance/report/:id.pdf`
- `GET /api/admin/compliance/export` (requires `x-admin-key` header or `?key=...`)
