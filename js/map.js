// Chile Kayak Guide - Interactive Chile Map Component
// Modeled in simplicity, glowing elegance, and tactile speed after Chilewaterlevels.com

import { REGIONS, RIVERS, getRegionById } from '../data/rivers-data.js';

export const MAP_CONFIG = [
  {
    id: 'central',
    name: 'Central Chile',
    short: 'Central / Santiago',
    color: '#e0773c',
    glow: 'rgba(224, 119, 60, 0.45)',
    d: 'M 132,45 C 130,68 128,88 125,118 L 185,130 C 188,105 190,75 192,50 Z',
    labelX: 202,
    labelY: 90,
    pins: [
      { id: 'rio-aconcagua', name: 'Aconcagua', x: 148, y: 68 },
      { id: 'rio-maipo', name: 'Maipo', x: 142, y: 104 },
      { id: 'rio-yeso', name: 'Yeso', x: 168, y: 114 }
    ]
  },
  {
    id: 'maule',
    name: "O'Higgins & Maule",
    short: 'Maule / 22 Tazas',
    color: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.4)',
    d: 'M 125,118 C 122,148 118,178 112,218 L 180,228 C 182,195 185,160 185,130 Z',
    labelX: 198,
    labelY: 172,
    pins: [
      { id: 'rio-cachapoal-upper', name: 'Cachapoal', x: 145, y: 138 },
      { id: 'rio-claro-22-teacups', name: '22 Teacups', x: 152, y: 185 },
      { id: 'rio-achibueno', name: 'Achibueno', x: 140, y: 212 }
    ]
  },
  {
    id: 'biobio',
    name: 'Biobío & Ñuble',
    short: 'Bío Bío / Ñuble',
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.4)',
    d: 'M 112,218 C 104,248 98,280 92,318 L 172,328 C 175,295 178,260 180,228 Z',
    labelX: 190,
    labelY: 270,
    pins: [
      { id: 'rio-nuble', name: 'Ñuble', x: 145, y: 242 },
      { id: 'rio-biobio-el-nacimiento', name: 'Alto Bío Bío', x: 156, y: 305 },
      { id: 'rio-queuco', name: 'Queuco', x: 140, y: 288 }
    ]
  },
  {
    id: 'araucania',
    name: 'Araucanía (Pucón)',
    short: 'Pucón / PKR Home',
    color: '#5ad6ef',
    glow: 'rgba(90, 214, 239, 0.55)',
    highlight: true,
    d: 'M 92,318 C 90,348 88,380 85,422 L 170,432 C 170,395 171,360 172,328 Z',
    labelX: 188,
    labelY: 375,
    pins: [
      { id: 'trancura-upper', name: 'Trancura', x: 136, y: 366 },
      { id: 'palguin-upper', name: 'Palguín', x: 146, y: 378 },
      { id: 'rio-puesco', name: 'Puesco', x: 158, y: 392 },
      { id: 'rio-liucura', name: 'Liucura', x: 132, y: 352 }
    ]
  },
  {
    id: 'los-rios',
    name: 'Los Ríos (Panguipulli)',
    short: 'Los Ríos / Fuy',
    color: '#34d399',
    glow: 'rgba(52, 211, 153, 0.45)',
    d: 'M 85,422 C 82,452 78,485 75,518 L 165,528 C 167,495 168,460 170,432 Z',
    labelX: 182,
    labelY: 475,
    pins: [
      { id: 'river-fuy-upper', name: 'Río Fuy', x: 144, y: 456 },
      { id: 'rio-san-pedro', name: 'San Pedro', x: 112, y: 476 },
      { id: 'rio-enco', name: 'Enco', x: 132, y: 466 }
    ]
  },
  {
    id: 'los-lagos',
    name: 'Los Lagos & Futaleufú',
    short: 'Lagos / Futaleufú',
    color: '#2dd4bf',
    glow: 'rgba(45, 212, 191, 0.5)',
    d: 'M 75,518 C 65,555 56,595 60,648 L 158,655 C 160,610 162,565 165,528 Z',
    labelX: 176,
    labelY: 585,
    pins: [
      { id: 'rio-petrohue-upper', name: 'Petrohué', x: 114, y: 540 },
      { id: 'rio-cochamo', name: 'Cochamó', x: 126, y: 558 },
      { id: 'rio-futaleufu-bridge-to-bridge', name: 'Futaleufú', x: 146, y: 624 },
      { id: 'rio-puelo', name: 'Puelo', x: 134, y: 575 }
    ]
  },
  {
    id: 'aysen',
    name: 'Aysén & Patagonia',
    short: 'Aysén / Baker',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.5)',
    d: 'M 60,648 C 50,688 45,740 50,815 L 145,820 C 148,765 152,710 158,655 Z',
    labelX: 165,
    labelY: 735,
    pins: [
      { id: 'rio-figueroa', name: 'Figueroa', x: 130, y: 672 },
      { id: 'rio-simpson', name: 'Simpson', x: 116, y: 702 },
      { id: 'rio-baker-upper', name: 'Río Baker', x: 120, y: 766 },
      { id: 'rio-pascua', name: 'Pascua', x: 96, y: 796 }
    ]
  }
];

export function initChileMap({ containerEl, hudEl, onRegionSelect, onRiverSelect }) {
  if (!containerEl) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  
  // Construct the SVG DOM
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 290 850');
  svg.setAttribute('class', 'chile-svg-map');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Interactive Map of Whitewater Kayaking Regions in Chile');

  // Definitions for gradients & glow filters
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `
    <linearGradient id="map-bg-line" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4fd1e8" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#2dd4bf" stop-opacity="0.02"/>
    </linearGradient>
    <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  `;
  svg.appendChild(defs);

  // Background Pacific Ocean label
  const oceanText = document.createElementNS(svgNS, 'text');
  oceanText.setAttribute('x', '22');
  oceanText.setAttribute('y', '380');
  oceanText.setAttribute('fill', 'rgba(143, 176, 196, 0.18)');
  oceanText.setAttribute('font-size', '10');
  oceanText.setAttribute('font-weight', '700');
  oceanText.setAttribute('letter-spacing', '0.2em');
  oceanText.setAttribute('transform', 'rotate(-90 22 380)');
  oceanText.textContent = 'PACIFIC OCEAN · OCÉANO PACÍFICO';
  svg.appendChild(oceanText);

  // Andes spine label
  const andesText = document.createElementNS(svgNS, 'text');
  andesText.setAttribute('x', '248');
  andesText.setAttribute('y', '320');
  andesText.setAttribute('fill', 'rgba(143, 176, 196, 0.18)');
  andesText.setAttribute('font-size', '10');
  andesText.setAttribute('font-weight', '700');
  andesText.setAttribute('letter-spacing', '0.2em');
  andesText.setAttribute('transform', 'rotate(90 248 320)');
  andesText.textContent = 'ANDES CORDILLERA · ARGENTINA';
  svg.appendChild(andesText);

  // Group for Regions
  const regionsGroup = document.createElementNS(svgNS, 'g');
  regionsGroup.setAttribute('id', 'map-regions-layer');

  // Group for Labels & Pins
  const pinsGroup = document.createElementNS(svgNS, 'g');
  pinsGroup.setAttribute('id', 'map-pins-layer');

  MAP_CONFIG.forEach(cfg => {
    const regData = getRegionById(cfg.id);
    const riverCount = regData ? regData.riversCount : cfg.pins.length;

    // Region Path
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', cfg.d);
    path.setAttribute('id', `svg-region-${cfg.id}`);
    path.setAttribute('class', `map-region ${cfg.highlight ? 'highlight-pkr' : ''}`);
    path.setAttribute('data-region', cfg.id);
    path.style.setProperty('--reg-color', cfg.color);
    path.style.setProperty('--reg-glow', cfg.glow);

    // Interactive Hover & Click events
    path.addEventListener('mouseenter', () => {
      setRegionActive(cfg.id);
    });

    path.addEventListener('mouseleave', () => {
      clearRegionActive();
    });

    path.addEventListener('click', () => {
      if (onRegionSelect) onRegionSelect(cfg.id);
    });

    regionsGroup.appendChild(path);

    // Leader line to region label
    const leader = document.createElementNS(svgNS, 'line');
    leader.setAttribute('x1', cfg.labelX - 15);
    leader.setAttribute('y1', cfg.labelY - 3);
    leader.setAttribute('x2', cfg.labelX - 5);
    leader.setAttribute('y2', cfg.labelY - 3);
    leader.setAttribute('stroke', cfg.color);
    leader.setAttribute('stroke-width', '1');
    leader.setAttribute('opacity', '0.45');
    pinsGroup.appendChild(leader);

    // Region Label on side
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', cfg.labelX);
    label.setAttribute('y', cfg.labelY);
    label.setAttribute('fill', '#e9f4fb');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-weight', '600');
    label.setAttribute('class', 'map-label-txt');
    label.style.cursor = 'pointer';
    label.textContent = cfg.short;
    label.addEventListener('click', () => {
      if (onRegionSelect) onRegionSelect(cfg.id);
    });
    label.addEventListener('mouseenter', () => setRegionActive(cfg.id));
    label.addEventListener('mouseleave', () => clearRegionActive());
    pinsGroup.appendChild(label);

    // River hotspot pins
    cfg.pins.forEach(pin => {
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', pin.x);
      circle.setAttribute('cy', pin.y);
      circle.setAttribute('r', '3.5');
      circle.setAttribute('class', 'map-river-pin');
      circle.setAttribute('data-river', pin.id);
      circle.setAttribute('data-name', pin.name);

      circle.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        setRegionActive(cfg.id, pin);
      });

      circle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onRiverSelect) onRiverSelect(pin.id);
      });

      pinsGroup.appendChild(circle);
    });
  });

  svg.appendChild(regionsGroup);
  svg.appendChild(pinsGroup);

  containerEl.innerHTML = '';
  containerEl.appendChild(svg);

  // Default initial HUD state (show Araucania / PKR as hero default)
  updateHUD('araucania');

  function setRegionActive(regionId, specificRiverPin = null) {
    // Highlight SVG region path
    document.querySelectorAll('.map-region').forEach(p => {
      if (p.getAttribute('data-region') === regionId) {
        p.classList.add('active-region');
      } else {
        p.classList.remove('active-region');
      }
    });

    // Highlight corresponding tile if in view
    document.querySelectorAll('.region-tile').forEach(t => {
      if (t.getAttribute('data-region') === regionId) {
        t.style.borderColor = 'rgba(79, 209, 232, 0.45)';
        t.style.transform = 'translateY(-2px)';
      } else {
        t.style.borderColor = '';
        t.style.transform = '';
      }
    });

    updateHUD(regionId, specificRiverPin);
  }

  function clearRegionActive() {
    document.querySelectorAll('.map-region').forEach(p => p.classList.remove('active-region'));
    document.querySelectorAll('.region-tile').forEach(t => {
      t.style.borderColor = '';
      t.style.transform = '';
    });
    // Keep HUD on last hovered or reset to Araucanía
    updateHUD('araucania');
  }

  function updateHUD(regionId, riverPin = null) {
    if (!hudEl) return;
    const reg = getRegionById(regionId);
    if (!reg) return;

    hudEl.classList.add('has-focus');
    hudEl.style.setProperty('--hud-color', reg.color);
    hudEl.style.setProperty('--hud-glow', reg.glow);

    // List top 3 rivers for this region
    const regionRivers = RIVERS.filter(r => r.regionId === regionId);
    const topRivers = regionRivers.slice(0, 4).map(r => r.name).join(' · ');

    let riverCallout = '';
    if (riverPin) {
      riverCallout = `<div style="color:var(--aqua);font-size:12px;font-weight:700;margin-bottom:4px;">📍 Pin: ${riverPin.name} (Click to open guide)</div>`;
    }

    hudEl.innerHTML = `
      <div class="hud-top">
        <span class="hud-title" style="color:${reg.color};font-weight:800">${reg.name}</span>
        <span class="hud-count">${reg.riversCount} Rivers · Class III–V+</span>
      </div>
      ${riverCallout}
      <div class="hud-rivers"><b>Featured:</b> ${topRivers}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
        <span style="font-size:11.5px;color:var(--muted)">📅 Season: ${reg.season}</span>
        <a class="hud-action" href="#/region/${reg.id}" style="color:${reg.color}">Explore Rivers →</a>
      </div>
    `;
  }

  return {
    highlightRegion: setRegionActive,
    clearHighlight: clearRegionActive
  };
}
