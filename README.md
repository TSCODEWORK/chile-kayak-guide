# Chile Whitewater Kayak Guide

[![Status](https://img.shields.io/badge/Status-Production_Ready-0ea5e9.svg)](https://github.com/TSCODEWORK/chile-kayak-guide)
[![Partner](https://img.shields.io/badge/Partner-Pucon_Kayak_Retreat_(PKR)-f59e0b.svg)](https://puconkayakretreat.com)
[![Telemetry](https://img.shields.io/badge/Telemetry-ChileWaterLevels.com-10b981.svg)](https://chilewaterlevels.com)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-Ready-f38020.svg?logo=cloudflare)](https://pages.cloudflare.com)

A field atlas of whitewater kayaking in Chile: 44 runs across 7 regions, drawn on real administrative boundaries of the country.

Pucón Kayak Retreat (PKR) is a credited partner. The notes in this guide are neutral field beta for trip planning. They are not quotations.

---

## ⚡ Architecture & Cloudflare Readiness

The codebase is built on an extensible, modular architecture designed for instant local development and enterprise edge deployment on **Cloudflare Pages**:

- **Build Engine**: [Vite](https://vitejs.dev/) with tree-shaking, automated CSS bundling, and sub-50ms incremental builds.
- **Cloudflare Edge Headers (`public/_headers`)**: Pre-configured with HSTS, CSP, X-Frame-Options, immutable static asset caching (1 year), and `stale-while-revalidate` for lightning-fast edge delivery (matching ChileWaterLevels).
- **SPA Deep Linking (`public/_redirects`)**: Edge redirects ensuring direct URLs (e.g. `/#/river/trancura-upper`) resolve instantly.
- **Serverless Edge Functions (`functions/api/`)**:
  - `GET /api/rivers`: Serverless edge endpoint supporting filtering by `?region=`, `?class=`, and `?search=`.
  - `GET /api/health`: Uptime monitoring endpoint.
- **Automated CI/CD**:
  - GitHub Actions runs full schema validation (740+ assertions) on every commit.
  - Ready for automatic push-to-deploy to Cloudflare Pages via `wrangler.toml`.

---

## 🌊 Key Features

- **Map of Chile**:
  - The homepage is a geographically accurate map built from Natural Earth admin-1 boundaries (mainland Chile; Rapa Nui and Juan Fernández are left off the frame so the country can be tall).
  - Hover, focus, or scroll a kayaking region to see its name, run count, grade mix, and season.
  - Choosing a region flies the map in and draws that region's runs as lines and pins. Runs and regions have shareable URLs (`/region/…`, `/river/…`) that survive refresh on Cloudflare Pages.
  - Keyboard: tab to a region, then arrow up or down the country.

- **Guide beta**:
  - Each run keeps its existing flow range, grade, rapids, hazards, and access notes.
  - Tips are labeled **Guide beta** and **Pro tip**.
  - Pucón Kayak Retreat remains a credited partner, with live gauges linked from ChileWaterLevels.

- **Live Flow Telemetry & Unit Switcher**:
  - Full support for both Metric (`m³/s`) and Imperial (`cfs`) flow units with instantaneous global toggle.
  - Direct integration badges and links to **ChileWaterLevels.com** for rivers with real-time DGA telemetry (Trancura, Fuy, Futaleufú, Baker, Maipo, Puelo).

- **Comprehensive Regional Coverage (44 Rivers)**:
  1. **Central Chile** (Santiago & Valparaíso · Región V & RM): *Maipo, Yeso, Colorado, Aconcagua*
  2. **O'Higgins & Maule** (Región VI & VII): *Río Claro 22 Teacups, Cachapoal, Tinguiririca, Melado, Achibueno, Maule*
  3. **Biobío & Ñuble** (Región VIII & XVI): *Alto Bío Bío (El Nacimiento), Ñuble, Diguillín, Queuco, Laja*
  4. **Araucanía / Pucón** (Región IX · PKR Home Base): *Upper Trancura, Lower Trancura, Upper Palguín, Lower Palguín, Puesco, Liucura, Maichín, Nevados, Turbio, Cautín, Malleco, Truful-Truful*
  5. **Los Ríos / Seven Lakes** (Región XIV): *Upper Fuy, Lower Fuy, San Pedro, Enco, Reyehueico, Gol-Gol*
  6. **Los Lagos & Northern Patagonia** (Región X): *Futaleufú Bridge to Bridge, Terminator, Petrohué, Cochamó, Puelo, Espolón, Palena*
  7. **Aysén & Southern Patagonia** (Región XI): *Upper Baker & El Saltón, Lower Baker, Simpson, Figueroa, Pascua*

- **Instant Search & Filters**:
  - Global modal search with `⌘K` or `Ctrl+K`.
  - Filter rivers within regions by difficulty: Class III, Class IV, Class V.

---

## 🛠️ Developer Guide

### Prerequisites
- Node.js >= 18
- npm >= 9

### Quick Start

```bash
# Clone the repository
git clone https://github.com/TSCODEWORK/chile-kayak-guide.git
cd chile-kayak-guide

# Install dependencies
npm install

# Start local development server with hot-module reload (HMR)
npm run dev

# Run data integrity & schema validation tests
npm test

# Build production bundle for Cloudflare Pages
npm run build

# Preview production build locally
npm run preview
```

---

## ☁️ Deploying to Cloudflare Pages

### Option 1: Automatic via Cloudflare Dashboard (Recommended)
1. In Cloudflare Dashboard, navigate to **Compute (Workers) > Workers & Pages > Create application > Pages**.
2. Connect your GitHub account and select repository `TSCODEWORK/chile-kayak-guide`.
3. Set the build settings:
   - **Framework preset**: None / Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**. Cloudflare will build and deploy the site across its global edge network.

### Option 2: Deploying via Wrangler CLI
```bash
# Build the production bundle
npm run build

# Deploy directly using Wrangler
npx wrangler pages deploy dist --project-name=chile-kayak-guide
```

---

## 📁 Project Directory Structure

```
chile-kayak-guide/
├── index.html                  # Main SPA entry point
├── package.json                # Project dependencies, scripts & metadata
├── vite.config.js              # Vite bundler configuration
├── wrangler.toml               # Cloudflare Pages / Workers configuration
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI test & Cloudflare deploy action
│       └── pages.yml           # GitHub Pages deployment action
├── functions/                  # Cloudflare Serverless Edge Functions
│   └── api/
│       ├── health.js           # GET /api/health edge endpoint
│       └── rivers.js           # GET /api/rivers edge API endpoint
├── public/                     # Static files copied to build output
│   ├── _headers                # Cloudflare caching & security headers
│   ├── _redirects              # Cloudflare SPA fallback redirects
│   ├── favicon.svg             # Vector brand icon
│   ├── manifest.webmanifest    # PWA configuration
│   └── rivers.json             # Portable JSON database
├── src/                        # Modular source code
│   ├── main.js                 # Router, state controller, search
│   ├── components/
│   │   └── Map.js              # Interactive Chile SVG map component
│   ├── data/
│   │   └── rivers-data.js      # Typed river catalog (44 runs, 7 regions)
│   └── styles/
│       └── style.css           # Glassmorphic dark theme & animations
└── tests/
    └── data-integrity.test.js  # Automated schema & data validation
```

---

## 🤝 Credits & Partners

- **Partner**: [Pucón Kayak Retreat (PKR)](https://puconkayakretreat.com)
- **Coastline**: Natural Earth 1:10m cultural vectors (public domain)
- **Live Streamflow Data**: [ChileWaterLevels.com](https://chilewaterlevels.com) & Dirección General de Aguas (DGA Chile)
- **River History & Exploration**: Dedicated to the pioneers of Chilean whitewater and indigenous river guardians.
