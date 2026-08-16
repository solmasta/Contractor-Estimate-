# Contractor Estimate

A job estimate builder for contractors: labor pricing (hours x rate), materials, markup, tax,
job categories/tracking, and AI-assisted photo estimates. Built with React + Vite on the
frontend and a small Express backend that keeps your Anthropic API key server-side.

## Setup

```bash
npm install
export ANTHROPIC_API_KEY=your-api-key-here   # optional, only needed for AI Photo Estimate
```

See `.env.example` for the required environment variable.

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
