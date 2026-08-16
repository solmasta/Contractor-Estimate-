# Contractor Estimate

A job estimate builder for contractors: labor pricing (hours x rate), materials, markup, tax,
job categories/tracking, and AI-assisted photo estimates. Built with React + Vite on the
frontend and a small Express backend that keeps your Anthropic API key server-side.

## Setup

```bash
npm install
export ANTHROPIC_API_KEY=your-anthropic-api-key-here   # optional, only needed for AI Photo Estimate
```

See `.env.example` for the required environment variable.

## Deploy to Vercel (permanent link, no manual start-up)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/solmasta/Contractor-Estimate-)

1. Click the button above (or **Add New → Project** on vercel.com and import this repo). Vercel
   auto-detects the Vite frontend and picks up `api/estimate-photo.js` as a serverless function.
2. Before the first deploy (or in **Project Settings → Environment Variables** afterward), add
   `ANTHROPIC_API_KEY` with your Anthropic API key.
3. Deploy. You get a permanent `*.vercel.app` URL — no starting anything each time, and it
   redeploys automatically on every push to `main`.

**Two real constraints of Vercel's free (Hobby) tier, specific to the AI Photo Estimate feature:**
- **Request body cap of ~4.5MB.** Several full-resolution phone photos as base64 can exceed this
  — you'll get an error uploading more than one or two, or a large one. Keep photos few/small
  when using the hosted version, or downscale before uploading.
- **60-second function timeout.** Photo analysis with multiple material price lookups can
  occasionally run long; `api/estimate-photo.js` requests the Hobby-tier maximum (60s) via
  `export const config = { maxDuration: 60 }`, but a very search-heavy request could still time
  out. Codespaces/self-hosted (below) have no such limit.

The rest of the app (labor/materials, totals, job tracking, print) has no such constraints —
it's all client-side.

## Deploy to Cloudflare Pages (alternative permanent link)

1. On the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, and pick
   this repo.
2. Build settings: **Build command** `npm run build`, **Build output directory** `dist`
   (`wrangler.toml` already declares this and enables the `nodejs_compat` flag `functions/api/estimate-photo.js` needs).
3. Add `ANTHROPIC_API_KEY` as an environment variable/secret in the Pages project settings.
4. Deploy. You get a permanent `*.pages.dev` URL, auto-redeployed on every push to `main`.

Cloudflare's Workers runtime (which Pages Functions run on) bills by **CPU time actually used**,
not wall-clock time — and this endpoint spends almost all of its time waiting on Anthropic's API
(vision + web search), not computing. That's a better fit for this workload than Vercel's
wall-clock timeout, and Cloudflare's request body limits are also more generous, so multi-photo
uploads are less likely to hit a hard cap. That said, **I haven't been able to actually deploy
and test this myself** (no Cloudflare account access from here) — I've verified the Anthropic SDK
has no direct Node-only dependencies in the code path this app uses, but you should do one real
test upload after deploying to confirm before relying on it.

## Run in GitHub Codespaces (quickest way to see it live)

1. On GitHub, click **Code → Codespaces → Create codespace on main**.
2. Wait for it to finish setting up — it runs `npm install`, builds the app, and starts the
   server automatically.
3. A **"Open in Browser"** notification (or the **Ports** tab) gives you a live, shareable URL
   for port 3000.

To enable AI Photo Estimate inside the Codespace, add your key as a secret **before** creating
the codespace: repo **Settings → Secrets and variables → Codespaces → New repository secret**,
named `ANTHROPIC_API_KEY`. Without it, everything else still works — you'll just see a warning
in the server log and AI Photo Estimate requests will fail.

If you edit code inside the Codespace, either re-run `npm run build` and restart `npm start`,
or use `npm run dev` instead (see below) for hot reload — just forward port 5173 too.

## Development

Runs the Vite dev server (with hot reload) alongside the Express API backend:

```bash
npm run dev
```

Open http://localhost:5173 — API requests to `/api/*` are proxied to the Express server on port 3000.

## Production

```bash
npm run build   # builds the React app into dist/
npm start        # serves dist/ + the API from a single Express server
```

Open http://localhost:3000.

## Features

- Labor and material line items with live totals, markup, and tax
- Job categories (Plumbing, Roofing, Remodel, etc., or custom) and a "My Jobs" panel to save,
  filter, reopen, and delete individual jobs — everything autosaves to your browser
- AI Photo Estimate: upload job-site photos and get suggested labor/material line items, with
  material prices looked up live from Home Depot and Menards (requires the API key above)
- Print / Save PDF export
