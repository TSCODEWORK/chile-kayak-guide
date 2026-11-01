// Chile Kayak Guide - Core Application Entry Point
// Built for fast edge deployment to Cloudflare Pages
// Modeled in look and simplicity after Chilewaterlevels.com
// Curated with David Hughes (Pucon Kayak Retreat / PKR)

import './styles/style.css';
import { REGIONS, RIVERS, getRegionById, getRiverById, getRiversByRegion } from './data/rivers-data.js';
import { initChileMap } from './components/Map.js';

export class ChileKayakApp {
  constructor() {
    this.unit = localStorage.getItem('ckg.unit') || 'cms'; // 'cms' (m³/s) or 'cfs'
    this.currentView = null;
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.mapInstance = null;

    this.mainEl = document.getElementById('app-view');
    this.unitCmsBtn = document.getElementById('unit-cms');
    this.unitCfsBtn = document.getElementById('unit-cfs');
    this.searchTriggerBtn = document.getElementById('search-trigger');
    this.searchModal = document.getElementById('search-modal-overlay');
    this.searchInput = document.getElementById('search-modal-input');
    this.searchResults = document.getElementById('search-modal-results');
    this.searchCloseBtn = document.getElementById('search-modal-close');
    this.aboutModal = document.getElementById('about-modal-overlay');
    this.aboutTriggerBtn = document.getElementById('about-trigger');
    this.aboutCloseBtn = document.getElementById('about-modal-close');

    this.init();
  }

  init() {
    this.updateUnitUI();
    this.bindEvents();
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  bindEvents() {
    // Unit Toggles (CMS vs CFS)
    this.unitCmsBtn?.addEventListener('click', () => this.setUnit('cms'));
    this.unitCfsBtn?.addEventListener('click', () => this.setUnit('cfs'));

    // Search Modal
    this.searchTriggerBtn?.addEventListener('click', () => this.openSearchModal());
    this.searchCloseBtn?.addEventListener('click', () => this.closeSearchModal());
    this.searchModal?.addEventListener('click', (e) => {
      if (e.target === this.searchModal) this.closeSearchModal();
    });

    // Keyboard shortcut Cmd+K / Ctrl+K
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.openSearchModal();
      }
      if (e.key === 'Escape') {
        this.closeSearchModal();
        this.closeAboutModal();
      }
    });

    this.searchInput?.addEventListener('input', (e) => this.handleSearchInput(e.target.value));

    // About PKR Modal
    this.aboutTriggerBtn?.addEventListener('click', () => this.openAboutModal());
    this.aboutCloseBtn?.addEventListener('click', () => this.closeAboutModal());
    this.aboutModal?.addEventListener('click', (e) => {
      if (e.target === this.aboutModal) this.closeAboutModal();
    });
  }

  setUnit(newUnit) {
    if (this.unit === newUnit) return;
    this.unit = newUnit;
    localStorage.setItem('ckg.unit', newUnit);
    this.updateUnitUI();
    this.refreshCurrentView();
  }

  updateUnitUI() {
    if (this.unitCmsBtn && this.unitCfsBtn) {
      if (this.unit === 'cms') {
        this.unitCmsBtn.classList.add('active');
        this.unitCfsBtn.classList.remove('active');
      } else {
        this.unitCfsBtn.classList.add('active');
        this.unitCmsBtn.classList.remove('active');
      }
    }
  }

  formatFlow(flowObj) {
    if (!flowObj) return 'Visual Gauge';
    if (this.unit === 'cms') {
      return `${flowObj.minCms} – ${flowObj.maxCms} m³/s`;
    } else {
      return `${flowObj.minCfs.toLocaleString()} – ${flowObj.maxCfs.toLocaleString()} cfs`;
    }
  }

  handleRoute() {
    const hash = window.location.hash || '#/';
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (hash === '#/' || hash === '') {
      this.renderHome();
    } else if (hash.startsWith('#/region/')) {
      const regionId = hash.replace('#/region/', '').trim();
      this.renderRegion(regionId);
    } else if (hash.startsWith('#/river/')) {
      const riverId = hash.replace('#/river/', '').trim();
      this.renderRiver(riverId);
    } else if (hash === '#/about') {
      this.openAboutModal();
    } else {
      this.renderHome();
    }
  }

  refreshCurrentView() {
    const hash = window.location.hash || '#/';
    if (hash.startsWith('#/region/')) {
      const regionId = hash.replace('#/region/', '').trim();
      this.renderRegion(regionId, false);
    } else if (hash.startsWith('#/river/')) {
      const riverId = hash.replace('#/river/', '').trim();
      this.renderRiver(riverId, false);
    }
  }

  // -------------------------------------------------------------
  // HOME VIEW: Interactive Chile Map + Region Cards
  // -------------------------------------------------------------
  renderHome() {
    this.currentView = 'home';
    const totalRivers = RIVERS.length;
    const totalRegions = REGIONS.length;

    this.mainEl.innerHTML = `
      <section class="hero">
        <div class="hero-pill">
          <span class="dot"></span>
          <span>Curated with David Hughes · Pucón Kayak Retreat (PKR)</span>
        </div>
        <h2>Whitewater Kayaking <span>Chile</span></h2>
        <p>A definitive guide to Chile's greatest rivers, steep volcanic drop-pools, and monumental Patagonian volume. Explore by region below.</p>
      </section>

      <div class="home-layout">
        <!-- Interactive Map of Chile (ChileWaterLevels style) -->
        <aside class="map-panel">
          <div class="panel-header">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
              <span>Chile Whitewater Map</span>
            </h3>
            <span class="badge-count">${totalRegions} Regions</span>
          </div>

          <div class="map-wrapper" id="chile-map-container">
            <!-- SVG Map dynamically rendered here -->
          </div>

          <!-- Dynamic Hover HUD / Region Summary -->
          <div class="map-hud" id="map-hud-box">
            <!-- Updated on mouseover -->
          </div>
          <div class="map-hint">Hover or tap any region above to view metrics &amp; rivers</div>
        </aside>

        <!-- Region Tiles Grid -->
        <main class="region-tiles-wrapper">
          <div class="section-title-row">
            <h3>Explore by Region</h3>
            <span class="sub-hint">${totalRivers} Total Curated Runs</span>
          </div>

          <div class="region-grid">
            ${REGIONS.map(reg => this.renderRegionTile(reg)).join('')}
          </div>
        </main>
      </div>

      <!-- Live Flow Partner Section -->
      <section style="margin-top:40px;padding:24px;background:rgba(10,28,44,0.6);border:1px solid var(--border);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:42px;height:42px;border-radius:50%;background:rgba(79,209,232,0.15);border:1px solid var(--aqua);display:flex;align-items:center;justify-content:center;color:var(--aqua);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          </div>
          <div>
            <b style="font-size:15px;color:#fff;">Live Gauge Integration with ChileWaterLevels.com</b>
            <p style="font-size:12.5px;color:var(--muted);margin-top:2px;">Real-time DGA telemetry for the Futaleufú, Trancura, Fuy, Maipo, Puelo, and Baker.</p>
          </div>
        </div>
        <a href="https://chilewaterlevels.com" target="_blank" rel="noopener" class="unit-btn active" style="padding:8px 18px;display:inline-flex;align-items:center;gap:6px;font-size:13px;">
          <span>Visit ChileWaterLevels.com</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </section>
    `;

    // Initialize Interactive SVG Map
    const mapContainer = document.getElementById('chile-map-container');
    const hudBox = document.getElementById('map-hud-box');
    this.mapInstance = initChileMap({
      containerEl: mapContainer,
      hudEl: hudBox,
      onRegionSelect: (regId) => {
        window.location.hash = `#/region/${regId}`;
      },
      onRiverSelect: (riverId) => {
        window.location.hash = `#/river/${riverId}`;
      }
    });

    // Region tile hover effects linked to map
    document.querySelectorAll('.region-tile').forEach(tile => {
      const regId = tile.getAttribute('data-region');
      tile.addEventListener('mouseenter', () => {
        if (this.mapInstance) this.mapInstance.highlightRegion(regId);
      });
      tile.addEventListener('mouseleave', () => {
        if (this.mapInstance) this.mapInstance.clearHighlight();
      });
    });
  }

  renderRegionTile(reg) {
    const isPkr = reg.id === 'araucania';
    return `
      <a class="region-tile" href="#/region/${reg.id}" data-region="${reg.id}" style="--c1:${reg.color};--glow:${reg.glow};">
        <div class="tile-head">
          <div class="tile-icon-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 18h20M2 14c4-4 8 2 12-2s8 2 8 2M2 10c4-4 8 2 12-2s8 2 8 2"/></svg>
          </div>
          <div class="tile-badge-group">
            <span class="tile-river-count">${reg.riversCount} Rivers</span>
            ${isPkr ? `<span class="tile-pkr-tag">PKR Home Base</span>` : ''}
          </div>
        </div>

        <div class="tile-body">
          <h4>${reg.name}</h4>
          <div class="tile-sub">${reg.sub}</div>
          <p class="tile-tagline">${reg.tagline}</p>
        </div>

        <div class="tile-footer">
          <span class="tile-season">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${reg.season}</span>
          </span>
          <span class="tile-arrow">View Rivers &rarr;</span>
        </div>
      </a>
    `;
  }

  // -------------------------------------------------------------
  // REGION RIVERS VIEW (#/region/:id)
  // -------------------------------------------------------------
  renderRegion(regionId, scrollToTop = true) {
    this.currentView = 'region';
    const reg = getRegionById(regionId);
    if (!reg) {
      this.renderHome();
      return;
    }

    const allRivers = getRiversByRegion(regionId);
    let filteredRivers = allRivers;

    // Apply active class filter
    if (this.activeFilter === 'class3') {
      filteredRivers = filteredRivers.filter(r => r.classNumber === 3);
    } else if (this.activeFilter === 'class4') {
      filteredRivers = filteredRivers.filter(r => r.classNumber === 4);
    } else if (this.activeFilter === 'class5') {
      filteredRivers = filteredRivers.filter(r => r.classNumber === 5);
    }

    // Apply inline search query if any
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      filteredRivers = filteredRivers.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.section.toLowerCase().includes(q) ||
        r.character.toLowerCase().includes(q)
      );
    }

    this.mainEl.innerHTML = `
      <div class="region-view">
        <nav class="breadcrumbs">
          <a href="#/">Chile Whitewater</a>
          <span class="sep">/</span>
          <span class="current">${reg.name}</span>
        </nav>

        <div class="region-hero-card" style="--reg-color:${reg.color};">
          <div class="reg-hero-top">
            <div class="reg-hero-titles">
              <h2>${reg.name}</h2>
              <div class="reg-sub">${reg.sub}</div>
            </div>
            <div class="reg-stats-pills">
              <span class="stat-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                <span>${allRivers.length} Guided Runs</span>
              </span>
              <span class="stat-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>${reg.season}</span>
              </span>
            </div>
          </div>

          <p class="reg-overview-text">${reg.overview}</p>

          <div class="david-voice-box">
            <div class="david-avatar">DH</div>
            <div>
              <b>David Hughes · PKR Field Beta:</b>
              <p style="margin-top:2px;">"${reg.tagline}. Take time to understand the local river geology and seasonal runoff cycles before charging hard."</p>
            </div>
          </div>
        </div>

        <!-- Filter Toolbar -->
        <div class="filter-toolbar">
          <div class="filter-pills">
            <button class="filter-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">All Difficulties (${allRivers.length})</button>
            <button class="filter-btn ${this.activeFilter === 'class3' ? 'active' : ''}" data-filter="class3">Class III (${allRivers.filter(r=>r.classNumber===3).length})</button>
            <button class="filter-btn ${this.activeFilter === 'class4' ? 'active' : ''}" data-filter="class4">Class IV (${allRivers.filter(r=>r.classNumber===4).length})</button>
            <button class="filter-btn ${this.activeFilter === 'class5' ? 'active' : ''}" data-filter="class5">Class V (${allRivers.filter(r=>r.classNumber===5).length})</button>
          </div>

          <div class="search-input-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="search-field" id="region-filter-input" placeholder="Filter rivers in ${reg.name}…" value="${this.searchQuery}">
          </div>
        </div>

        <!-- Rivers Grid -->
        <div class="rivers-grid">
          ${filteredRivers.length ? filteredRivers.map(r => this.renderRiverCard(r)).join('') : `
            <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border);">
              No rivers found matching your filter criteria. Try clearing the search or filter.
            </div>
          `}
        </div>
      </div>
    `;

    // Bind Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeFilter = e.currentTarget.getAttribute('data-filter');
        this.renderRegion(regionId, false);
      });
    });

    const filterInput = document.getElementById('region-filter-input');
    filterInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderRegion(regionId, false);
    });
  }

  renderRiverCard(river) {
    const classBadgeCls = river.classNumber === 3 ? 'c3' : river.classNumber === 4 ? 'c4' : 'c5';
    const flowFormatted = this.formatFlow(river.optimalFlow);

    return `
      <a class="river-card" href="#/river/${river.id}">
        <div class="river-card-header">
          <div class="river-card-titles">
            <h4>${river.name}</h4>
            <div class="section-label">${river.section}</div>
          </div>
          <span class="class-badge ${classBadgeCls}">Class ${river.grade}</span>
        </div>

        <span class="river-char-tag">${river.character}</span>

        <div class="river-metrics-row">
          <div class="metric-cell">
            <span class="metric-label">Optimal Flow</span>
            <span class="metric-value">${flowFormatted}</span>
          </div>
          <div class="metric-cell">
            <span class="metric-label">Length</span>
            <span class="metric-value">${river.lengthKm} km</span>
          </div>
          <div class="metric-cell">
            <span class="metric-label">Gradient</span>
            <span class="metric-value">${river.gradient.split('(')[0]}</span>
          </div>
        </div>

        <p class="river-card-snippet">${river.davidBeta}</p>

        <div class="river-card-foot">
          ${river.gaugeInfo?.hasLiveChileWaterLevelsLink ? `
            <span class="live-cwl-pill">
              <span class="dot" style="width:6px;height:6px;border-radius:50%;background:var(--emerald);display:inline-block;"></span>
              <span>Live on ChileWaterLevels</span>
            </span>
          ` : `
            <span style="font-size:11.5px;color:var(--dim);">Season: ${river.season.split('(')[0]}</span>
          `}
          <span class="card-view-btn">Detailed Beta &rarr;</span>
        </div>
      </a>
    `;
  }

  // -------------------------------------------------------------
  // RIVER BETA VIEW (#/river/:id)
  // -------------------------------------------------------------
  renderRiver(riverId, scrollToTop = true) {
    this.currentView = 'river';
    const river = getRiverById(riverId);
    if (!river) {
      this.renderHome();
      return;
    }

    const reg = getRegionById(river.regionId);
    const classBadgeCls = river.classNumber === 3 ? 'c3' : river.classNumber === 4 ? 'c4' : 'c5';
    const flowFormatted = this.formatFlow(river.optimalFlow);

    this.mainEl.innerHTML = `
      <div class="river-detail-view">
        <a class="back-btn" href="#/region/${river.regionId}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span>Back to ${reg.name} Rivers</span>
        </a>

        <!-- Hero Card -->
        <div class="detail-hero">
          <div class="detail-hero-header">
            <div class="detail-titles">
              <h2>${river.name}</h2>
              <div class="detail-section">${river.section}</div>
            </div>
            <span class="class-badge ${classBadgeCls}" style="font-size:14px;padding:6px 14px;">Class ${river.grade}</span>
          </div>

          <div class="detail-badges-row">
            <span class="stat-pill" style="color:var(--aqua);background:rgba(79,209,232,0.1);border-color:rgba(79,209,232,0.3);">
              ${river.character}
            </span>
            <span class="stat-pill">
              📍 ${river.regionName}
            </span>
            <span class="stat-pill">
              📅 ${river.season}
            </span>
          </div>

          <div class="detail-metrics-grid">
            <div class="detail-metric-box">
              <span class="label">Optimal Flow (${this.unit.toUpperCase()})</span>
              <span class="val">${flowFormatted}</span>
              <span class="note">${river.optimalFlow.notes}</span>
            </div>
            <div class="detail-metric-box">
              <span class="label">Distance &amp; Time</span>
              <span class="val">${river.lengthKm} km · ${river.durationHours}</span>
              <span class="note">Paddling pace</span>
            </div>
            <div class="detail-metric-box">
              <span class="label">Average Gradient</span>
              <span class="val">${river.gradient}</span>
              <span class="note">Elevation loss</span>
            </div>
          </div>

          <!-- Live ChileWaterLevels Integration Box -->
          ${river.gaugeInfo?.hasLiveChileWaterLevelsLink ? `
            <div class="live-cwl-box">
              <div class="cwl-left">
                <div class="cwl-pulse-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div class="cwl-text">
                  <b>Live DGA Telemetry Available</b>
                  <span>Tracked live on ChileWaterLevels.com · ${river.gaugeInfo.name}</span>
                </div>
              </div>
              <a href="${river.gaugeInfo.chileWaterLevelsUrl}" target="_blank" rel="noopener" class="cwl-action-btn">
                <span>View Live Gauge</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          ` : ''}
        </div>

        <!-- The David Hughes / PKR Field Beta -->
        <section class="detail-block">
          <div class="detail-block-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <h3>David Hughes Beta &amp; River Psychology</h3>
          </div>
          <p class="beta-prose">${river.davidBeta}</p>

          <div class="pkr-coach-callout">
            <div class="coach-icon">DH</div>
            <div class="coach-content">
              <b>David's Golden Rule for this Run:</b>
              <p>"${river.pkrProTip}"</p>
            </div>
          </div>
        </section>

        <!-- Key Rapids & Lines -->
        <section class="detail-block">
          <div class="detail-block-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <h3>Key Rapids &amp; Scouting Lines</h3>
          </div>
          <div class="rapids-list">
            ${river.keyRapids.map(rap => `
              <div class="rapid-item">
                <div class="rapid-item-header">
                  <h4>${rap.name}</h4>
                  <span class="class-badge ${rap.grade.includes('V') ? 'c5' : rap.grade.includes('IV') ? 'c4' : 'c3'}">${rap.grade}</span>
                </div>
                <p class="rapid-line-beta">${rap.description}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Hazards & Safety Protocol -->
        <section class="detail-block">
          <div class="detail-block-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <h3 style="color:#fda4af;">Hazards &amp; Safety Protocol</h3>
          </div>
          <div class="hazards-list">
            ${river.hazards.map(haz => `
              <div class="hazard-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>${haz}</span>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Put-In & Take-Out Logistics -->
        <section class="detail-block">
          <div class="detail-block-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <h3>Access &amp; Driving Logistics</h3>
          </div>
          <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:14px;">${river.logistics}</p>

          <div class="logistics-grid">
            <div class="access-box">
              <div class="access-box-title">
                <span class="access-tag">Put-In Point</span>
                <span style="font-size:11px;color:var(--dim);font-family:var(--font-mono);">${river.putIn.lat.toFixed(4)}, ${river.putIn.lng.toFixed(4)}</span>
              </div>
              <h4>${river.putIn.name}</h4>
              <p class="access-beta-text">${river.putIn.accessBeta}</p>
              <a href="https://www.google.com/maps/search/?api=1&query=${river.putIn.lat},${river.putIn.lng}" target="_blank" rel="noopener" class="coords-link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Open in Google Maps &rarr;</span>
              </a>
            </div>

            <div class="access-box">
              <div class="access-box-title">
                <span class="access-tag">Take-Out Point</span>
                <span style="font-size:11px;color:var(--dim);font-family:var(--font-mono);">${river.takeOut.lat.toFixed(4)}, ${river.takeOut.lng.toFixed(4)}</span>
              </div>
              <h4>${river.takeOut.name}</h4>
              <p class="access-beta-text">${river.takeOut.accessBeta}</p>
              <a href="https://www.google.com/maps/search/?api=1&query=${river.takeOut.lat},${river.takeOut.lng}" target="_blank" rel="noopener" class="coords-link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Open in Google Maps &rarr;</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // QUICK SEARCH MODAL (Cmd+K)
  // -------------------------------------------------------------
  openSearchModal() {
    if (!this.searchModal) return;
    this.searchModal.classList.add('open');
    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchInput.focus();
    }
    this.renderSearchResults('');
  }

  closeSearchModal() {
    this.searchModal?.classList.remove('open');
  }

  handleSearchInput(query) {
    this.renderSearchResults(query.trim().toLowerCase());
  }

  renderSearchResults(q) {
    if (!this.searchResults) return;

    let matches = RIVERS;
    if (q) {
      matches = RIVERS.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.section.toLowerCase().includes(q) ||
        r.regionName.toLowerCase().includes(q) ||
        r.character.toLowerCase().includes(q)
      );
    }

    if (!matches.length) {
      this.searchResults.innerHTML = `
        <div style="padding:24px;text-align:center;color:var(--muted);font-size:13px;">
          No rivers found matching "${q}".
        </div>
      `;
      return;
    }

    this.searchResults.innerHTML = matches.slice(0, 10).map(r => `
      <a class="search-result-item" href="#/river/${r.id}" onclick="document.getElementById('search-modal-overlay').classList.remove('open')">
        <div class="s-item-main">
          <b>${r.name}</b>
          <span>${r.section} · ${r.regionName}</span>
        </div>
        <span class="class-badge ${r.classNumber === 3 ? 'c3' : r.classNumber === 4 ? 'c4' : 'c5'}">Class ${r.grade}</span>
      </a>
    `).join('');
  }

  // -------------------------------------------------------------
  // ABOUT PKR MODAL
  // -------------------------------------------------------------
  openAboutModal() {
    this.aboutModal?.classList.add('open');
  }

  closeAboutModal() {
    this.aboutModal?.classList.remove('open');
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ChileKayakApp();
});
