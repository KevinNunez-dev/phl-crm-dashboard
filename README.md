# Pulse Analytics Dashboard

A production-ready, single-HTML analytics dashboard for SEO, Traffic, and Marketing metrics.

## Folder Structure

```
dashboard-project/
├── index.html          ← Main dashboard page (entry point)
├── README.md           ← This file
└── assets/
    ├── style.css       ← All design tokens, layout, components
    └── app.js          ← Charts, data, interactivity
```

## Features

- **6 KPI Cards** with animated counters and sparklines
- **Sessions & Traffic line chart** (30-day daily breakdown)
- **Traffic Sources donut chart** (channel mix)
- **Top Pages table** with CTR, clicks, impressions, position, trend
- **Keyword Rankings** with position and MoM change
- **Light / Dark mode** toggle (respects system preference)
- **Collapsible sidebar** navigation
- **Fully responsive** — mobile, tablet, desktop

## Libraries Used (CDN, no npm needed)

| Library | Version | Purpose |
|---|---|---|
| Chart.js | latest | Line, donut, sparkline charts |
| Lucide Icons | latest | Sidebar & UI icons |
| Google Fonts (Inter + JetBrains Mono) | — | Typography |

## How to Upload to GitHub

1. Create a new repo on GitHub (or use an existing one)
2. Upload the entire `dashboard-project/` folder
3. Enable **GitHub Pages** → Settings → Pages → Deploy from branch `main`, folder `/root` or `/docs`
4. Or use the repo as a static site via any CDN (Netlify, Vercel, Cloudflare Pages)

## Customization

- **Edit KPI data** → `assets/app.js` → `data-count` attributes in `index.html` or the `pages[]` / `keywords[]` arrays
- **Change colors** → `assets/style.css` → `:root` and `[data-theme="dark"]` CSS variables
- **Add pages** → Duplicate the `<main class="page-content">` block and link via the sidebar nav items
