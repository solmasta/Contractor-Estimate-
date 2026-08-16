# Contractor Estimate

A job estimate builder for contractors: labor pricing (hours x rate), materials, markup, tax, and AI-assisted photo estimates.

## Basic use (no AI)

Open `index.html` directly in a browser. Labor/material line items, totals, print/PDF export, and autosave all work with no setup.

## AI Photo Estimate

Upload photos of a job site and have Claude suggest labor and material line items. This feature needs a small local server so your Anthropic API key stays server-side.

```bash
npm install
export ANTHROPIC_API_KEY=your-api-key-here
npm start
```

Then open http://localhost:3000.

See `.env.example` for the required environment variable.
