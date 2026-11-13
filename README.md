# Wilzy Market Activity Prototype (static site)

A standalone copy of the "Wilzy Market Activity Prototype" design, ready for Vercel.

- `/` English screen (index.html)
- `/ar/` Arabic screen (ar/index.html)
- `dc-runtime.js` small runtime that replaces the design canvas engine, so the pages run on any static host.

Data is the snapshot of the Thursday 12 November 2026 session that was in the prototype.

## Deploy with the Vercel CLI
1. Install Node.js, then open a terminal in this folder.
2. Run `npx vercel` and log in when asked. Accept the defaults (no build command, output = this folder).
3. Run `npx vercel --prod` to publish to production.

## Deploy from GitHub
Push this folder to a GitHub repo, then on vercel.com choose Add New › Project › Import the repo.
Framework preset: Other. Build command: none. Output directory: `./`.
