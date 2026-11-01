# Chile Whitewater Kayaking Guide

[![Live Demo](https://img.shields.io/badge/Status-Live-0ea5e9.svg)](https://github.com/TSCODEWORK/chile-kayak-guide)
[![Partner](https://img.shields.io/badge/Partner-Pucon_Kayak_Retreat_(PKR)-f59e0b.svg)](https://puconkayakretreat.com)
[![Telemetry](https://img.shields.io/badge/Telemetry-ChileWaterLevels.com-10b981.svg)](https://chilewaterlevels.com)

A high-performance, minimalist whitewater kayaking guide to the rivers of Chile, modeled after the look, speed, and simplicity of **Chilewaterlevels.com**.

Curated in collaboration with **David Hughes** (founder of **Pucón Kayak Retreat**), this guide provides authentic, no-nonsense expedition beta, optimal flow ranges, rapid breakdowns, hazards, and GPS access coordinates for 44 whitewater runs across Chile's premier paddling regions.

---

## 🌊 Key Features

- **Interactive Map of Chile (ChileWaterLevels Aesthetic)**:
  - Responsive SVG vector map of Chile divided into 7 distinct whitewater kayaking regions.
  - Hover over any region to illuminate it with glowing neon strokes and view real-time metrics (river counts, class breakdown, top classics, season).
  - Click any region or hotspot pin to dive directly into regional rivers and detailed guides.
  - Two-way synchronized hover between the map and regional summary cards.

- **David Hughes & PKR Tone of Voice**:
  - Authoritative, safety-first paddling beta written from decades of coaching and leading expeditions in Chile.
  - Tactical advice on volcanic basalt ledges, steep drop-pools, boof angles, and eddy discipline.
  - "David's Golden Rule" pro-tips for every section.
  - Deep respect for ancestral Mapuche & Pehuenche lands and river conservation.

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

## 🚀 Getting Started

This is a zero-dependency static web application that runs directly in any modern browser.

### Run Locally

```bash
# Clone the repository
git clone https://github.com/TSCODEWORK/chile-kayak-guide.git
cd chile-kayak-guide

# Start any static local server (e.g. Python)
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your web browser.

---

## 📁 Project Structure

```
├── index.html              # Main application shell
├── favicon.svg             # SVG vector logo
├── manifest.webmanifest    # PWA web manifest
├── css/
│   └── style.css           # Glassmorphic dark styling & animations
├── js/
│   ├── app.js              # Hash router, state controller, search
│   └── map.js              # Interactive Chile SVG map component
├── data/
│   ├── rivers-data.js      # Core ES module database (44 rivers, 7 regions)
│   └── rivers.json         # Portable JSON database
└── README.md
```

---

## 🤝 Credits & Partners

- **David Hughes & Team Buena Onda**: [Pucón Kayak Retreat (PKR)](https://puconkayakretreat.com)
- **Live Streamflow Data**: [ChileWaterLevels.com](https://chilewaterlevels.com) & Dirección General de Aguas (DGA Chile)
- **River History & Exploration**: Dedicated to the pioneers of Chilean whitewater and indigenous river guardians.
