import './styles/style.css';
import { REGIONS, RIVERS, getRegionById, getRiverById, getRiversByRegion } from './data/rivers-data.js';
import { createChileMap } from './components/Map.js';
import { joinBase, parseLocation, toPath } from './router.js';
import { flowStatus } from './levels.js';

const base = () => window.__APP_BASE__ || '/';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

function gradeCounts(rivers) {
  const counts = { 3: 0, 4: 0, 5: 0 };
  for (const river of rivers) counts[river.classNumber] += 1;
  return counts;
}

function mixText(rivers) {
  const counts = gradeCounts(rivers);
  return `III ${counts[3]} · IV ${counts[4]} · V ${counts[5]}`;
}

function gradeChip(classNumber, label) {
  const tone = classNumber === 3 ? 'grade-3' : classNumber === 4 ? 'grade-4' : 'grade-5';
  return `<span class="grade-chip ${tone}">${esc(label)}</span>`;
}

function rapidTone(grade) {
  if (String(grade).includes('V')) return 'grade-5';
  if (String(grade).includes('IV')) return 'grade-4';
  return 'grade-3';
}

class ChileKayakApp {
  constructor() {
    this.unit = storageGet('ckg.unit') === 'cfs' ? 'cfs' : 'cms';
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.view = 'home';
    this.currentId = null;
    this.hotRegion = undefined;
    this.lastPointer = 'mouse';
    this.regionForFilter = null;
    this.routeKey = '';
    this.map = null;
    this.locator = null;
    this.searchActive = -1;
    this.levels = {};

    this.mainEl = document.getElementById('app-view');
    this.panelEl = document.getElementById('panel');
    this.unitCmsBtn = document.getElementById('unit-cms');
    this.unitCfsBtn = document.getElementById('unit-cfs');
    this.searchTriggerBtn = document.getElementById('search-trigger');
    this.searchModal = document.getElementById('search-modal-overlay');
    this.searchDialog = document.getElementById('search-dialog');
    this.searchInput = document.getElementById('search-modal-input');
    this.searchResults = document.getElementById('search-modal-results');
    this.searchCloseBtn = document.getElementById('search-modal-close');
    this.aboutModal = document.getElementById('about-modal-overlay');
    this.aboutDialog = document.getElementById('about-dialog');
    this.aboutTriggerBtn = document.getElementById('about-trigger');
    this.aboutCloseBtn = document.getElementById('about-modal-close');
    this.mapBack = document.getElementById('map-back');
    this.hud = document.getElementById('map-hud');
    this.kbd = document.querySelector('.kbd');

    this.init();
  }

  init() {
    const home = joinBase(base(), '/');
    document.querySelector('.brand')?.setAttribute('href', home);
    this.mapBack?.setAttribute('href', home);
    if (this.kbd) this.kbd.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';
    this.updateUnitUI();
    this.bindEvents();
    const mapRoot = document.getElementById('chile-map');
    this.map = createChileMap(mapRoot, { interactive: true });
    this.map.onHot((id) => {
      if (this.view === 'home') this.setHotRegion(id);
    });

    const initial = this.readRoute();
    if (location.hash.startsWith('#/')) {
      history.replaceState({}, '', joinBase(base(), toPath(initial)));
    }
    window.addEventListener('popstate', () => this.handleRoute(true));
    this.handleRoute(true);
    this.loadLevels();
  }

  bindEvents() {
    this.unitCmsBtn?.addEventListener('click', () => this.setUnit('cms'));
    this.unitCfsBtn?.addEventListener('click', () => this.setUnit('cfs'));
    this.searchTriggerBtn?.addEventListener('click', () => this.openSearchModal());
    this.searchCloseBtn?.addEventListener('click', () => this.closeSearchModal());
    this.searchModal?.addEventListener('click', (event) => {
      if (event.target === this.searchModal) this.closeSearchModal();
    });
    this.aboutTriggerBtn?.addEventListener('click', () => this.openAboutModal());
    this.aboutCloseBtn?.addEventListener('click', () => this.closeAboutModal());
    this.aboutModal?.addEventListener('click', (event) => {
      if (event.target === this.aboutModal) this.closeAboutModal();
    });

    document.addEventListener('pointerdown', (event) => {
      this.lastPointer = event.pointerType || 'mouse';
    }, true);

    document.addEventListener('click', (event) => this.onDocumentClick(event));

    window.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (this.searchModal?.classList.contains('open')) this.closeSearchModal();
        else this.openSearchModal();
      }
      if (event.key === 'Escape') {
        if (this.searchModal?.classList.contains('open')) this.closeSearchModal();
        else if (this.aboutModal?.classList.contains('open')) this.closeAboutModal();
      }
    });

    this.searchInput?.addEventListener('input', () => {
      this.searchActive = -1;
      this.renderSearchResults(this.searchInput.value);
    });
    this.searchInput?.addEventListener('keydown', (event) => this.onSearchKeydown(event));

    window.addEventListener('scroll', () => {
      if (this.scrollFrame) return;
      this.scrollFrame = requestAnimationFrame(() => {
        this.scrollFrame = 0;
        this.onScrollSpy();
      });
    }, { passive: true });
  }

  onDocumentClick(event) {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    if (link.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    let url;
    try { url = new URL(link.href, location.origin); } catch { return; }
    if (url.origin !== location.origin) return;
    const route = parseLocation({ pathname: url.pathname, hash: url.hash, base: base() });
    const internal = route.name !== 'home' || this.isHomePath(url.pathname);
    if (!internal) return;
    const inMap = link.closest('#chile-map');
    if (this.lastPointer === 'touch' && inMap && this.view === 'home' && route.name === 'region' && this.hotRegion !== route.id) {
      event.preventDefault();
      this.setHotRegion(route.id);
      return;
    }
    event.preventDefault();
    this.closeSearchModal();
    this.closeAboutModal();
    this.go(route);
  }

  isHomePath(pathname) {
    const root = joinBase(base(), '/');
    const trim = root.endsWith('/') && root !== '/' ? root.slice(0, -1) : root;
    return pathname === root || pathname === trim || pathname === `${trim}/`;
  }

  readRoute() {
    return parseLocation({ pathname: location.pathname, hash: location.hash, base: base() });
  }

  go(route) {
    const url = joinBase(base(), toPath(route));
    if (url !== location.pathname || location.hash) history.pushState({}, '', url);
    this.handleRoute(true);
  }

  handleRoute(animateMap) {
    const route = this.readRoute();
    const key = `${route.name}:${route.id || ''}`;
    const changed = key !== this.routeKey;
    this.routeKey = key;
    if (route.name === 'region') {
      if (this.regionForFilter !== route.id) {
        this.activeFilter = 'all';
        this.searchQuery = '';
        this.regionForFilter = route.id;
      }
    } else {
      this.regionForFilter = null;
    }

    document.body.classList.remove('view-home', 'view-region', 'view-river');
    document.body.classList.add(`view-${route.name}`);
    this.locator?.destroy();
    this.locator = null;

    if (route.name === 'region') this.renderRegion(route.id, changed);
    else if (route.name === 'river') this.renderRiver(route.id);
    else this.renderHome();

    this.syncMap(route, animateMap && changed);
    if (route.name === 'region') this.map?.setRiverFilter((river) => this.riverMatches(river));
    this.updateTitle(route);
    if (changed) {
      const behavior = reduceMotion() ? 'auto' : 'instant';
      this.panelEl?.scrollTo({ top: 0, behavior });
      window.scrollTo({ top: 0, behavior });
    }
    this.onScrollSpy();
  }

  syncMap(route, animate) {
    if (!this.map) return;
    if (route.name === 'home') {
      this.map.showCountry({ animate });
      if (this.mapBack) this.mapBack.hidden = true;
      return;
    }
    if (route.name === 'region') {
      const rivers = getRiversByRegion(route.id);
      this.map.showRegion(route.id, rivers, { animate });
      this.map.setRiverFilter((river) => this.riverMatches(river));
      if (this.mapBack) this.mapBack.hidden = false;
      return;
    }
    if (this.mapBack) this.mapBack.hidden = true;
  }

  updateTitle(route) {
    if (route.name === 'region') {
      const region = getRegionById(route.id);
      document.title = region ? `${region.name} · Chile Whitewater Kayak Guide` : 'Chile Whitewater Kayak Guide';
    } else if (route.name === 'river') {
      const river = getRiverById(route.id);
      document.title = river ? `${river.name} · Chile Whitewater Kayak Guide` : 'Chile Whitewater Kayak Guide';
    } else {
      document.title = 'Chile Whitewater Kayak Guide';
    }
  }

  setUnit(unit) {
    if (this.unit === unit) return;
    this.unit = unit;
    storageSet('ckg.unit', unit);
    this.updateUnitUI();
    if (this.view === 'region' && this.currentId) this.paintRegionResults(getRegionById(this.currentId));
    else if (this.view === 'river' && this.currentId) {
      const scroll = this.panelEl?.scrollTop || 0;
      this.renderRiver(this.currentId);
      if (this.panelEl) this.panelEl.scrollTop = scroll;
    }
  }

  updateUnitUI() {
    const cms = this.unit === 'cms';
    this.unitCmsBtn?.classList.toggle('is-on', cms);
    this.unitCfsBtn?.classList.toggle('is-on', !cms);
    this.unitCmsBtn?.setAttribute('aria-pressed', cms ? 'true' : 'false');
    this.unitCfsBtn?.setAttribute('aria-pressed', cms ? 'false' : 'true');
  }

  formatFlow(flow) {
    if (!flow) return 'Visual gauge';
    if (this.unit === 'cms') return `${flow.minCms}–${flow.maxCms} m³/s`;
    return `${Number(flow.minCfs).toLocaleString()}–${Number(flow.maxCfs).toLocaleString()} cfs`;
  }

  riverMatches(river) {
    if (this.activeFilter === 'class3' && river.classNumber !== 3) return false;
    if (this.activeFilter === 'class4' && river.classNumber !== 4) return false;
    if (this.activeFilter === 'class5' && river.classNumber !== 5) return false;
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return true;
    return river.name.toLowerCase().includes(query)
      || river.section.toLowerCase().includes(query)
      || river.character.toLowerCase().includes(query);
  }

  setHotRegion(id) {
    if (id === this.hotRegion) return;
    this.hotRegion = id;
    this.map?.setHot(id);
    const card = document.getElementById('focus-card');
    if (card) card.innerHTML = this.focusCardHTML(id);
    if (this.hud && document.body.classList.contains('view-home')) {
      this.hud.innerHTML = this.hudHTML(id);
    }
    document.querySelectorAll('[data-region-row]').forEach((row) => {
      row.classList.toggle('is-hot', !!id && row.dataset.regionRow === id);
    });
  }

  focusCardHTML(id) {
    if (!id) {
      return `
        <p class="eyebrow">On the map</p>
        <h3>Trace the cordillera.</h3>
        <p>Hover a region, or scroll the country. The run count, grade mix, and season show up before you drop in.</p>
      `;
    }
    const region = getRegionById(id);
    if (!region) return '';
    const rivers = getRiversByRegion(id);
    const counts = gradeCounts(rivers);
    return `
      <p class="eyebrow">${esc(region.sub)}</p>
      <h3>${esc(region.name)}</h3>
      <p class="focus-tagline">${esc(region.tagline)}</p>
      <dl class="focus-stats">
        <div><dt>Runs</dt><dd>${rivers.length}</dd></div>
        <div><dt>III</dt><dd>${counts[3]}</dd></div>
        <div><dt>IV</dt><dd>${counts[4]}</dd></div>
        <div><dt>V</dt><dd>${counts[5]}</dd></div>
        <div><dt>Season</dt><dd>${esc(region.season)}</dd></div>
      </dl>
      <a class="btn btn-primary" href="${esc(joinBase(base(), `/region/${encodeURIComponent(region.id)}`))}">Drop into ${esc(region.name)}</a>
    `;
  }

  hudHTML(id) {
    if (!id) {
      return `
        <p class="hud-kicker">Chile</p>
        <p class="hud-title">${RIVERS.length} runs · ${REGIONS.length} regions</p>
        <p class="hud-meta">North is the desert. South is the ice.</p>
      `;
    }
    const region = getRegionById(id);
    if (!region) return '';
    const rivers = getRiversByRegion(id);
    return `
      <p class="hud-kicker">${esc(region.name)}</p>
      <p class="hud-title">${rivers.length} runs · ${esc(mixText(rivers))}</p>
      <p class="hud-meta">${esc(region.season)}</p>
    `;
  }

  renderHome() {
    this.view = 'home';
    this.currentId = null;
    this.mainEl.innerHTML = `
      <div class="view-enter">
        <header class="home-lead">
          <p class="eyebrow">Chile Whitewater Kayak Guide</p>
          <h2>The <em>long</em> country.</h2>
          <p class="lede">${RIVERS.length} runs on the real map of Chile. Where a Chile Water Levels gauge is the run, the live reading is on the card.</p>
        </header>
        <section id="focus-card" class="focus-card"></section>
        <section class="region-index" aria-label="Kayaking regions">
          <div class="section-row">
            <h3>Regions</h3>
            <span>${RIVERS.length} runs</span>
          </div>
          ${REGIONS.map((region) => this.regionRow(region)).join('')}
        </section>
      </div>
    `;
    this.hotRegion = undefined;
    this.setHotRegion(null);
    this.mainEl.querySelectorAll('[data-region-row]').forEach((row) => {
      row.addEventListener('pointerover', (event) => {
        if (event.pointerType === 'touch') return;
        this.setHotRegion(row.dataset.regionRow);
      });
      row.addEventListener('focus', () => this.setHotRegion(row.dataset.regionRow));
    });
  }

  regionRow(region) {
    const rivers = getRiversByRegion(region.id);
    return `
      <a class="region-row" data-region-row="${esc(region.id)}" href="${esc(joinBase(base(), `/region/${encodeURIComponent(region.id)}`))}" style="--reg:${esc(region.color)}">
        <span class="swatch" aria-hidden="true"></span>
        <span class="region-copy">
          <strong>${esc(region.name)}</strong>
          <em>${esc(region.sub)}</em>
        </span>
        <span class="region-meta">
          <b>${rivers.length}</b>
          <span>${esc(region.season)}</span>
        </span>
      </a>
    `;
  }

  renderRegion(regionId, full) {
    const region = getRegionById(regionId);
    if (!region) {
      this.renderMissing();
      return;
    }
    this.view = 'region';
    this.currentId = regionId;
    const needsShell = full || !this.mainEl.querySelector('#river-grid');
    if (needsShell) {
      const rivers = getRiversByRegion(regionId);
      const counts = gradeCounts(rivers);
      this.mainEl.innerHTML = `
        <div class="view-enter">
          <p class="crumbs">
            <a href="${esc(joinBase(base(), '/'))}">All of Chile</a>
            <span aria-hidden="true">/</span>
            <span>${esc(region.name)}</span>
          </p>
          <header class="region-head">
            <p class="eyebrow">${esc(region.sub)}</p>
            <h2>${esc(region.name)}</h2>
            <p class="lede">${esc(region.overview)}</p>
            <dl class="stat-band">
              <div><dt>Runs</dt><dd>${rivers.length}</dd></div>
              <div><dt>Class III</dt><dd>${counts[3]}</dd></div>
              <div><dt>Class IV</dt><dd>${counts[4]}</dd></div>
              <div><dt>Class V</dt><dd>${counts[5]}</dd></div>
              <div><dt>Season</dt><dd>${esc(region.season)}</dd></div>
            </dl>
            <p class="field-note"><span>Field note</span> ${esc(region.tagline)}</p>
            ${region.id === 'araucania' ? '<p class="partner-chip">Partner waters · Pucón Kayak Retreat</p>' : ''}
          </header>
          <div class="toolbar">
            <div class="filters" role="group" aria-label="Filter by difficulty">
              <button type="button" class="filter-btn" data-filter="all">All <span data-count="all"></span></button>
              <button type="button" class="filter-btn" data-filter="class3">III <span data-count="class3"></span></button>
              <button type="button" class="filter-btn" data-filter="class4">IV <span data-count="class4"></span></button>
              <button type="button" class="filter-btn" data-filter="class5">V <span data-count="class5"></span></button>
            </div>
            <label class="filter-search">
              <span class="visually-hidden">Filter rivers in ${esc(region.name)}</span>
              <input id="region-filter-input" type="search" placeholder="Filter this region" value="${esc(this.searchQuery)}" autocomplete="off">
            </label>
          </div>
          <div id="river-grid" class="river-grid"></div>
        </div>
      `;
      this.mainEl.querySelectorAll('.filter-btn').forEach((button) => {
        button.addEventListener('click', () => {
          this.activeFilter = button.dataset.filter;
          this.paintRegionResults(region);
        });
      });
      this.mainEl.querySelector('#region-filter-input')?.addEventListener('input', (event) => {
        this.searchQuery = event.target.value;
        this.paintRegionResults(region);
      });
    }
    this.paintRegionResults(region);
  }

  paintRegionResults(region) {
    if (!region) return;
    const all = getRiversByRegion(region.id);
    const counts = gradeCounts(all);
    const shown = all.filter((river) => this.riverMatches(river));
    const grid = document.getElementById('river-grid');
    if (!grid) return;
    const countFor = {
      all: all.length,
      class3: counts[3],
      class4: counts[4],
      class5: counts[5]
    };
    this.mainEl.querySelectorAll('.filter-btn').forEach((button) => {
      const on = button.dataset.filter === this.activeFilter;
      button.classList.toggle('is-on', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      const slot = button.querySelector('[data-count]');
      if (slot) slot.textContent = String(countFor[button.dataset.filter] ?? '');
    });
    grid.innerHTML = shown.length
      ? shown.map((river, index) => this.riverCard(river, index)).join('')
      : `<p class="empty-state">No runs match that filter. Clear it to see the whole region.</p>`;
    grid.querySelectorAll('[data-river-card]').forEach((card) => {
      const id = card.dataset.riverCard;
      card.addEventListener('pointerover', (event) => {
        if (event.pointerType === 'touch') return;
        this.map?.emphasizeRiver(id);
      });
      card.addEventListener('pointerleave', () => this.map?.emphasizeRiver(null));
      card.addEventListener('focus', () => this.map?.emphasizeRiver(id));
      card.addEventListener('blur', () => this.map?.emphasizeRiver(null));
    });
    this.map?.setRiverFilter((river) => this.riverMatches(river));
  }

  async loadLevels() {
    const root = window.__APP_BASE__ || '/';
    const url = `${root.endsWith('/') ? root : `${root}/`}api/levels`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      this.levels = Object.fromEntries((data.readings || []).map((reading) => [reading.runId, reading]));
      if (this.view === 'region' && this.currentId) this.paintRegionResults(getRegionById(this.currentId));
      else if (this.view === 'river' && this.currentId) {
        const scroll = this.panelEl?.scrollTop || 0;
        this.renderRiver(this.currentId);
        if (this.panelEl) this.panelEl.scrollTop = scroll;
      }
    } catch {
      /* live feed is optional */
    }
  }

  formatReading(reading) {
    if (reading.kind === 'level') return `${Number(reading.value).toFixed(2)} m`;
    const cms = Number(reading.value);
    if (this.unit === 'cfs') return `${Math.round(cms * 35.3146667).toLocaleString()} cfs`;
    return `${cms >= 100 ? Math.round(cms) : cms} m³/s`;
  }

  ageLabel(minutes) {
    if (minutes == null) return '';
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.round(minutes / 60)} h ago`;
  }

  cwlMark() {
    return `<svg class="cwl-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0e5a7a"/><path d="M5 13c3-3 5-3 8 0s5 3 8 0 4-2 6-1" fill="none" stroke="#9be7f5" stroke-width="2.2" stroke-linecap="round"/><path d="M5 19c3-3 5-3 8 0s5 3 8 0 4-2 6-1" fill="none" stroke="#4fd1e8" stroke-width="2.2" stroke-linecap="round" opacity=".75"/><path d="M5 25c3-3 5-3 8 0s5 3 8 0 4-2 6-1" fill="none" stroke="#2dd4bf" stroke-width="2.2" stroke-linecap="round" opacity=".45"/></svg>`;
  }

  levelBlock(river, linked) {
    const runId = river?.id;
    const reading = this.levels?.[runId];
    if (!reading) return '';
    const badges = [];
    if (reading.basis === 'estimated') badges.push('Estimated');
    if (reading.basis === 'derived') badges.push('Derived');
    if (reading.basis === 'experimental') badges.push('Experimental');
    if (reading.stale) badges.push(`Stale · ${this.ageLabel(reading.ageMinutes)}`);
    const trend = reading.trend === 'rising' ? 'Rising' : reading.trend === 'falling' ? 'Falling' : reading.trend === 'steady' ? 'Steady' : '';
    const when = reading.stale ? '' : this.ageLabel(reading.ageMinutes);
    const stick = reading.gaugeApprox != null ? ` · gauge ≈ ${reading.gaugeApprox}` : '';
    const status = reading.kind === 'flow' ? flowStatus(Number(reading.value), river?.optimalFlow) : null;
    const statusLabel = status === 'low' ? 'Too low' : status === 'high' ? 'High' : status === 'in' ? 'In range' : '';
    const tag = linked ? 'a' : 'div';
    const attrs = linked ? ` href="${esc(reading.href)}" target="_blank" rel="noopener noreferrer"` : '';
    return `<${tag} class="level-chip"${attrs}>
      ${this.cwlMark()}
      <span>
        ${statusLabel ? `<span class="flow-status is-${status}">${statusLabel}</span>` : ''}
        <b>${esc(this.formatReading(reading))}</b>
        <small>${esc(reading.stationName)}${trend ? ` · ${esc(trend)}` : ''}${when ? ` · ${esc(when)}` : ''}${esc(stick)}</small>
        <small>Chile Water Levels · ${esc(reading.credit)}</small>
        ${badges.length ? `<span class="level-badges">${badges.map((badge) => `<span class="level-badge${badge.startsWith('Stale') ? ' stale' : ''}">${esc(badge)}</span>`).join('')}</span>` : ''}
      </span>
      ${reading.stale ? '' : '<i class="level-live" aria-hidden="true"></i>'}
    </${tag}>`;
  }

  riverCard(river, index) {
    const level = this.levelBlock(river, false);
    return `
      <a class="river-card" data-river-card="${esc(river.id)}" href="${esc(joinBase(base(), `/river/${encodeURIComponent(river.id)}`))}" style="--i:${Math.min(index, 8)}">
        <div class="card-top">
          <div>
            <h3>${esc(river.name)}</h3>
            <p>${esc(river.section)}</p>
          </div>
          ${gradeChip(river.classNumber, river.grade)}
        </div>
        ${level || `<p class="glance">${esc(this.formatFlow(river.optimalFlow))} optimal</p>`}
        <p class="card-foot"><span>${esc(String(river.season).split('(')[0].trim())}</span><span>Open run</span></p>
      </a>
    `;
  }

  renderRiver(riverId) {
    const river = getRiverById(riverId);
    if (!river) {
      this.renderMissing();
      return;
    }
    this.view = 'river';
    this.currentId = riverId;
    const region = getRegionById(river.regionId);
    const home = esc(joinBase(base(), '/'));
    const regionHref = esc(joinBase(base(), `/region/${encodeURIComponent(river.regionId)}`));
    const levelsLink = river.gaugeInfo?.chileWaterLevelsUrl
      ? `<p><a href="${esc(river.gaugeInfo.chileWaterLevelsUrl)}" target="_blank" rel="noopener noreferrer">Chile Water Levels</a></p>`
      : '';
    this.mainEl.innerHTML = `
      <article class="river-page view-enter">
        <p class="crumbs">
          <a href="${home}">All of Chile</a>
          <span aria-hidden="true">/</span>
          <a href="${regionHref}">${esc(region?.name || river.regionName)}</a>
        </p>
        <header class="river-hero">
          <p class="eyebrow">${esc(river.regionName)}</p>
          <div class="hero-line">
            <h2>${esc(river.name)}</h2>
            ${gradeChip(river.classNumber, river.grade)}
          </div>
          <p class="section-name">${esc(river.section)}</p>
        </header>
        ${this.levelBlock(river, true)}
        <p class="glance">${esc(this.formatFlow(river.optimalFlow))} optimal · ${esc(river.lengthKm)} km · ${esc(String(river.season).split('(')[0].trim())}</p>
        <div id="run-map" class="run-map" role="img" aria-label="Map showing the put-in and take-out of ${esc(river.name)}"></div>
        <p class="map-legend"><span><i class="legend-put"></i> Put-in</span><span><i class="legend-take"></i> Take-out</span></p>
        <details class="dive">
          <summary>
            <span>Dive deeper</span>
            <span class="dive-meta">Guide beta · ${river.keyRapids.length} rapids · hazards · access</span>
          </summary>
          <section class="prose-block">
            <h3>Guide beta</h3>
            <p>${esc(river.davidBeta)}</p>
          </section>
          <aside class="pro-tip">
            <p class="eyebrow">Pro tip</p>
            <p>${esc(river.pkrProTip)}</p>
          </aside>
          <section class="prose-block">
            <h3>Flow notes</h3>
            <p>${esc(river.optimalFlow?.notes || '')}</p>
            <p>${esc(river.gradient)} · ${esc(river.durationHours)}</p>
            ${levelsLink}
          </section>
          <section class="prose-block">
            <h3>Rapids</h3>
            <ol class="rapid-list">
              ${river.keyRapids.map((rapid) => `
                <li>
                  <div class="rapid-top">
                    <h4>${esc(rapid.name)}</h4>
                    <span class="grade-chip ${rapidTone(rapid.grade)}">${esc(rapid.grade)}</span>
                  </div>
                  <p>${esc(rapid.description)}</p>
                </li>
              `).join('')}
            </ol>
          </section>
          <section class="prose-block">
            <h3>Hazards</h3>
            <ul class="hazard-list">
              ${river.hazards.map((hazard) => `<li>${esc(hazard)}</li>`).join('')}
            </ul>
          </section>
          <section class="prose-block">
            <h3>Access</h3>
            <p>${esc(river.logistics)}</p>
            <div class="access-grid">
              ${this.accessCard('Put-in', river.putIn)}
              ${this.accessCard('Take-out', river.takeOut)}
            </div>
          </section>
        </details>
      </article>
    `;
    const slot = document.getElementById('run-map');
    if (slot) {
      this.locator = createChileMap(slot, { interactive: false });
      this.locator.showRun(river, { animate: !reduceMotion() });
    }
  }

  accessCard(label, point) {
    const maps = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
    return `
      <article class="access-card">
        <p class="eyebrow">${esc(label)}</p>
        <h4>${esc(point.name)}</h4>
        <p class="coords">${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}</p>
        <p>${esc(point.accessBeta)}</p>
        <a href="${esc(maps)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
      </article>
    `;
  }

  renderMissing() {
    this.view = 'missing';
    this.currentId = null;
    this.mainEl.innerHTML = `
      <div class="missing view-enter">
        <p class="eyebrow">Off the map</p>
        <h2>That page isn’t in the guide.</h2>
        <p>The link doesn’t match a region or a run.</p>
        <a class="btn btn-primary" href="${esc(joinBase(base(), '/'))}">Back to all of Chile</a>
      </div>
    `;
    document.body.classList.remove('view-home', 'view-region', 'view-river');
    document.body.classList.add('view-river');
  }

  onScrollSpy() {
    const stage = document.getElementById('map-stage');
    if (stage) {
      document.body.classList.toggle('hud-docked', stage.getBoundingClientRect().bottom < 110);
    }
    if (this.view !== 'home' || window.innerWidth >= 900) return;
    const hit = this.map?.regionAtScreenY(window.innerHeight * 0.42);
    if (hit) this.setHotRegion(hit);
  }

  openSearchModal() {
    if (!this.searchModal) return;
    this.searchModal.classList.add('open');
    this.searchModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    this.setInert(true);
    this.searchActive = -1;
    if (this.searchInput) {
      this.searchInput.value = '';
      this.renderSearchResults('');
      this.searchInput.focus();
    }
  }

  closeSearchModal() {
    if (!this.searchModal?.classList.contains('open')) return;
    this.searchModal.classList.remove('open');
    this.searchModal.setAttribute('aria-hidden', 'true');
    if (!this.aboutModal?.classList.contains('open')) {
      document.body.classList.remove('modal-open');
      this.setInert(false);
    }
    this.searchTriggerBtn?.focus();
  }

  openAboutModal() {
    if (!this.aboutModal) return;
    this.aboutModal.classList.add('open');
    this.aboutModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    this.setInert(true);
    this.aboutCloseBtn?.focus();
  }

  closeAboutModal() {
    if (!this.aboutModal?.classList.contains('open')) return;
    this.aboutModal.classList.remove('open');
    this.aboutModal.setAttribute('aria-hidden', 'true');
    if (!this.searchModal?.classList.contains('open')) {
      document.body.classList.remove('modal-open');
      this.setInert(false);
    }
    this.aboutTriggerBtn?.focus();
  }

  setInert(on) {
    document.querySelector('.top-nav')?.toggleAttribute('inert', on);
    document.getElementById('atlas')?.toggleAttribute('inert', on);
  }

  onSearchKeydown(event) {
    const items = [...(this.searchResults?.querySelectorAll('a') || [])];
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.searchActive = Math.min(items.length - 1, this.searchActive + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.searchActive = Math.max(0, this.searchActive - 1);
    } else if (event.key === 'Enter' && this.searchActive >= 0 && items[this.searchActive]) {
      event.preventDefault();
      items[this.searchActive].click();
      return;
    } else {
      return;
    }
    items.forEach((item, index) => item.classList.toggle('is-active', index === this.searchActive));
    items[this.searchActive]?.scrollIntoView({ block: 'nearest' });
  }

  renderSearchResults(raw) {
    if (!this.searchResults) return;
    const query = raw.trim().toLowerCase();
    const regions = query
      ? REGIONS.filter((region) => region.name.toLowerCase().includes(query) || region.sub.toLowerCase().includes(query))
      : [];
    let rivers = RIVERS;
    if (query) {
      rivers = RIVERS.filter((river) =>
        river.name.toLowerCase().includes(query)
        || river.section.toLowerCase().includes(query)
        || river.regionName.toLowerCase().includes(query)
        || river.character.toLowerCase().includes(query)
      );
    }
    if (!regions.length && !rivers.length) {
      this.searchResults.innerHTML = `<p class="search-empty">No runs match “${esc(query)}”.</p>`;
      return;
    }
    const regionHtml = regions.map((region) => `
      <a class="search-hit" href="${esc(joinBase(base(), `/region/${encodeURIComponent(region.id)}`))}">
        <span><strong>${esc(region.name)}</strong><em>${esc(region.sub)}</em></span>
        <span class="search-kind">Region</span>
      </a>
    `).join('');
    const riverHtml = rivers.slice(0, 12).map((river) => `
      <a class="search-hit" href="${esc(joinBase(base(), `/river/${encodeURIComponent(river.id)}`))}">
        <span><strong>${esc(river.name)}</strong><em>${esc(river.section)} · ${esc(river.regionName)}</em></span>
        ${gradeChip(river.classNumber, river.grade.split('(')[0].trim())}
      </a>
    `).join('');
    const hint = query ? '' : `<p class="search-hint">${RIVERS.length} runs. Try a river, a town, or a region.</p>`;
    this.searchResults.innerHTML = `${hint}${regionHtml}${riverHtml}`;
  }
}

const app = new ChileKayakApp();
window.app = app;
