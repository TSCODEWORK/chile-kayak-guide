import './styles/style.css';
import { REGIONS, RIVERS, getRegionById, getRiverById, getRiversByRegion } from './data/rivers-data.js';
import { OPERATORS, operatorsIn } from './data/operators.js';
import { createChileMap } from './components/Map.js';
import { joinBase, parseLocation, stripBase, toPath } from './router.js';
import { flowStatus } from './levels.js';
import { field, t as translate } from './i18n/index.js';

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
    this.levelsOffline = false;
    this.lang = document.documentElement.lang === 'es' ? 'es' : 'en';
    this.installEvent = null;
    this.withRegion = 'all';

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
    this.preferLanguage();
    if (this.kbd) this.kbd.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';
    this.updateUnitUI();
    this.applyThemeButton();
    this.bindEvents();
    this.initInstall();
    this.registerWorker();
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
    document.getElementById('langBtn')?.addEventListener('click', () => {
      this.setLanguage(this.lang === 'es' ? 'en' : 'es');
    });
    document.getElementById('themeBtn')?.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      this.applyTheme(next, true);
    });
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (event) => {
      if (storageGet('ckg.theme')) return;
      this.applyTheme(event.matches ? 'light' : 'dark', false);
    });
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
        const sheet = document.getElementById('installSheet');
        if (this.searchModal?.classList.contains('open')) this.closeSearchModal();
        else if (this.aboutModal?.classList.contains('open')) this.closeAboutModal();
        else if (sheet && !sheet.hidden) this.closeInstallSheet();
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
    const bare = stripBase(url.pathname, base());
    const internal = route.name !== 'home' || bare === '/' || bare === '/es';
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

    this.lang = route.lang === 'es' ? 'es' : 'en';
    document.documentElement.lang = this.lang;
    this.applyChrome();
    document.body.classList.remove('view-home', 'view-region', 'view-river', 'view-with');
    document.body.classList.add(`view-${route.name === 'missing' ? 'river' : route.name}`);
    this.locator?.destroy();
    this.locator = null;

    if (route.name === 'region') this.renderRegion(route.id, changed);
    else if (route.name === 'river') this.renderRiver(route.id);
    else if (route.name === 'with') this.renderWith();
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
    const title = this.t('docTitle');
    if (route.name === 'region') {
      const region = getRegionById(route.id);
      document.title = region ? `${region.name} · ${title}` : title;
    } else if (route.name === 'river') {
      const river = getRiverById(route.id);
      document.title = river ? `${river.name} · ${title}` : title;
    } else if (route.name === 'with') {
      document.title = `${this.t('withTitle')} · ${title}`;
    } else {
      document.title = title;
    }
  }

  t(key, vars) {
    return translate(this.lang, key, vars);
  }

  copy(group, id, name, index) {
    return field(this.lang, group, id, name, index);
  }

  path(name, id) {
    return joinBase(base(), toPath({ name, id, lang: this.lang }));
  }

  preferLanguage() {
    const route = this.readRoute();
    if (route.lang === 'es') {
      this.lang = 'es';
      return;
    }
    if (route.name !== 'home' || location.hash.startsWith('#/')) {
      this.lang = 'en';
      return;
    }
    const stored = storageGet('ckg.lang');
    const prefer = stored === 'es' || stored === 'en'
      ? stored
      : ((navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en');
    this.lang = prefer;
    document.documentElement.lang = prefer;
    if (!stored) storageSet('ckg.lang', prefer);
    if (prefer === 'es') history.replaceState({}, '', this.path('home'));
  }

  setLanguage(lang) {
    const next = lang === 'es' ? 'es' : 'en';
    storageSet('ckg.lang', next);
    this.lang = next;
    const route = this.readRoute();
    const url = joinBase(base(), toPath({ ...route, lang: next }));
    if (url !== location.pathname) history.pushState({}, '', url);
    this.handleRoute(false);
  }

  applyTheme(theme, persist) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    if (persist) storageSet('ckg.theme', next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#f6f3ea' : '#06141f');
    this.applyThemeButton();
  }

  applyThemeButton() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const button = document.getElementById('themeBtn');
    button?.setAttribute('aria-label', this.t(light ? 'themeToDark' : 'themeToLight'));
    button?.classList.toggle('is-light', light);
  }

  applyChrome() {
    const home = this.path('home');
    document.querySelector('.brand')?.setAttribute('href', home);
    this.mapBack?.setAttribute('href', home);
    const text = (id, key) => {
      const node = document.getElementById(id);
      if (node) node.textContent = this.t(key);
    };
    text('skip-link', 'skip');
    text('brand-line-1', 'brand1');
    text('brand-line-2', 'brand2');
    text('map-caption', 'mapCaption');
    text('foot-partner', 'footPartner');
    text('foot-cwl', 'footCwl');
    text('foot-note', 'footNote');
    text('about-title', 'aboutTitle');
    text('search-title', 'searchTitle');
    const withLink = document.getElementById('with-link');
    if (withLink) {
      withLink.href = this.path('with');
      const long = withLink.querySelector('.with-long');
      const short = withLink.querySelector('.with-short');
      if (long) long.textContent = this.t('with');
      if (short) short.textContent = this.t('withShort');
    }
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
      langBtn.textContent = this.t('langCode');
      langBtn.setAttribute('aria-label', this.t('langAria'));
    }
    document.querySelector('.unit-toggle')?.setAttribute('aria-label', this.t('unitAria'));
    document.querySelector('.search-label') && (document.querySelector('.search-label').textContent = this.t('search'));
    document.querySelector('.about-label') && (document.querySelector('.about-label').textContent = this.t('about'));
    document.getElementById('map-stage')?.setAttribute('aria-label', this.t('mapAria'));
    if (this.mapBack) this.mapBack.textContent = this.t('allChile');
    const searchInput = document.getElementById('search-modal-input');
    if (searchInput) {
      searchInput.placeholder = this.t('searchPlaceholder');
      searchInput.setAttribute('aria-label', this.t('searchLabel'));
    }
    document.getElementById('search-modal-close')?.setAttribute('aria-label', this.t('closeSearch'));
    document.getElementById('about-modal-close')?.setAttribute('aria-label', this.t('closeAbout'));
    document.getElementById('search-trigger')?.setAttribute('aria-label', this.t('search'));
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.setAttribute('aria-label', this.t('installAria'));
      const long = installBtn.querySelector('.ib-long');
      const short = installBtn.querySelector('.ib-short');
      if (long) long.textContent = this.t('installBtn');
      if (short) short.textContent = this.t('installShort');
    }
    document.getElementById('installClose') && (document.getElementById('installClose').textContent = this.t('installClose'));
    document.getElementById('installDismiss') && (document.getElementById('installDismiss').textContent = this.t('installDismiss'));
    const about = document.getElementById('about-body');
    if (about) {
      about.innerHTML = `
        <p>${esc(this.t('aboutP1'))}</p>
        <h3>${esc(this.t('aboutH2'))}</h3>
        <p>${esc(this.t('aboutP2'))}</p>
        <h3>${esc(this.t('aboutH3'))}</h3>
        <p>${esc(this.t('aboutP3'))}</p>
        <h3>${esc(this.t('aboutH4'))}</h3>
        <p>${esc(this.t('aboutP4'))}</p>
      `;
    }
    this.applyThemeButton();
  }

  registerWorker() {
    if (!('serviceWorker' in navigator)) return;
    const url = new URL('sw.js', document.baseURI);
    navigator.serviceWorker.register(url).catch(() => {});
  }

  initInstall() {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const button = document.getElementById('installBtn');
    const show = () => {
      if (!button) return;
      button.hidden = standalone || storageGet('ckg.installHide') === '1';
    };
    show();
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installEvent = event;
      show();
    });
    window.addEventListener('appinstalled', () => {
      this.installEvent = null;
      if (button) button.hidden = true;
      this.closeInstallSheet();
    });
    button?.addEventListener('click', () => this.onInstall());
    document.getElementById('installClose')?.addEventListener('click', () => this.closeInstallSheet());
    document.getElementById('installDismiss')?.addEventListener('click', () => {
      storageSet('ckg.installHide', '1');
      if (button) button.hidden = true;
      this.closeInstallSheet();
    });
    document.getElementById('installSheet')?.addEventListener('click', (event) => {
      if (event.target.id === 'installSheet') this.closeInstallSheet();
    });
  }

  closeInstallSheet() {
    const sheet = document.getElementById('installSheet');
    if (sheet) sheet.hidden = true;
  }

  async onInstall() {
    if (this.installEvent) {
      this.installEvent.prompt();
      const choice = await this.installEvent.userChoice.catch(() => ({}));
      this.installEvent = null;
      if (choice.outcome === 'accepted') return;
    }
    this.openInstallSheet();
  }

  openInstallSheet() {
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const safari = ios && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    const mobile = ios || /Android|Mobi/i.test(navigator.userAgent);
    const share = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>';
    const steps = ios
      ? [`${share} ${esc(this.t('installIos1'))}`, esc(this.t('installIos2')), esc(this.t('installIos3'))]
      : mobile
        ? [esc(this.t('installAnd1')), esc(this.t('installAnd2'))]
        : [esc(this.t('installDesk'))];
    const body = document.getElementById('installBody');
    if (body) {
      body.innerHTML = `
        <div class="sheet-head">
          <img src="./favicon.svg" alt="" width="48" height="48">
          <div>
            <h2 id="installTitle">${esc(this.t('installTitle'))}</h2>
            <p>${esc(this.t('installWhy'))}</p>
          </div>
        </div>
        ${ios && !safari ? `<p class="sheet-note">${esc(this.t('installIosSafari'))}</p>` : ''}
        <ol class="steps">${steps.map((step) => `<li>${step}</li>`).join('')}</ol>
      `;
    }
    const sheet = document.getElementById('installSheet');
    if (sheet) sheet.hidden = false;
    document.getElementById('installClose')?.focus();
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
    if (!flow) return this.t('visualGauge');
    if (this.unit === 'cms') return `${flow.minCms}–${flow.maxCms} m³/s`;
    return `${Number(flow.minCfs).toLocaleString()}–${Number(flow.maxCfs).toLocaleString()} cfs`;
  }

  riverMatches(river) {
    if (this.activeFilter === 'class3' && river.classNumber !== 3) return false;
    if (this.activeFilter === 'class4' && river.classNumber !== 4) return false;
    if (this.activeFilter === 'class5' && river.classNumber !== 5) return false;
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return true;
    const hay = [
      river.name,
      river.section,
      river.character,
      this.copy('rivers', river.id, 'section'),
      this.copy('rivers', river.id, 'character')
    ].join(' ').toLowerCase();
    return hay.includes(query);
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
        <p class="eyebrow">${esc(this.t('onTheMap'))}</p>
        <h3>${esc(this.t('trace'))}</h3>
        <p>${esc(this.t('traceBody'))}</p>
      `;
    }
    const region = getRegionById(id);
    if (!region) return '';
    const rivers = getRiversByRegion(id);
    const counts = gradeCounts(rivers);
    return `
      <p class="eyebrow">${esc(this.copy('regions', region.id, 'sub'))}</p>
      <h3>${esc(region.name)}</h3>
      <p class="focus-tagline">${esc(this.copy('regions', region.id, 'tagline'))}</p>
      <dl class="focus-stats">
        <div><dt>${esc(this.t('runs'))}</dt><dd>${rivers.length}</dd></div>
        <div><dt>III</dt><dd>${counts[3]}</dd></div>
        <div><dt>IV</dt><dd>${counts[4]}</dd></div>
        <div><dt>V</dt><dd>${counts[5]}</dd></div>
        <div><dt>${esc(this.t('season'))}</dt><dd>${esc(this.copy('regions', region.id, 'season'))}</dd></div>
      </dl>
      <a class="btn btn-primary" href="${esc(this.path('region', region.id))}">${esc(this.t('dropInto', { name: region.name }))}</a>
    `;
  }

  hudHTML(id) {
    if (!id) {
      return `
        <p class="hud-kicker">${esc(this.t('chile'))}</p>
        <p class="hud-title">${esc(this.t('runsRegions', { runs: RIVERS.length, regions: REGIONS.length }))}</p>
        <p class="hud-meta">${esc(this.t('northSouth'))}</p>
      `;
    }
    const region = getRegionById(id);
    if (!region) return '';
    const rivers = getRiversByRegion(id);
    return `
      <p class="hud-kicker">${esc(region.name)}</p>
      <p class="hud-title">${esc(this.t('runsMix', { n: rivers.length, mix: mixText(rivers) }))}</p>
      <p class="hud-meta">${esc(this.copy('regions', region.id, 'season'))}</p>
    `;
  }

  renderHome() {
    this.view = 'home';
    this.currentId = null;
    this.mainEl.innerHTML = `
      <div class="view-enter">
        <header class="home-lead">
          <p class="eyebrow">${esc(this.t('homeEyebrow'))}</p>
          <h2>${esc(this.t('homeTitleBefore'))}<em>${esc(this.t('homeTitleEm'))}</em>${esc(this.t('homeTitleAfter'))}</h2>
          <p class="lede">${esc(this.t('homeLede', { n: RIVERS.length }))}</p>
        </header>
        <section id="focus-card" class="focus-card"></section>
        <section class="region-index" aria-label="${esc(this.t('regions'))}">
          <div class="section-row">
            <h3>${esc(this.t('regions'))}</h3>
            <span>${esc(this.t('runsCount', { n: RIVERS.length }))}</span>
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
      <a class="region-row" data-region-row="${esc(region.id)}" href="${esc(this.path('region', region.id))}" style="--reg:${esc(region.color)}">
        <span class="swatch" aria-hidden="true"></span>
        <span class="region-copy">
          <strong>${esc(region.name)}</strong>
          <em>${esc(this.copy('regions', region.id, 'sub'))}</em>
        </span>
        <span class="region-meta">
          <b>${rivers.length}</b>
          <span>${esc(this.copy('regions', region.id, 'season'))}</span>
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
            <a href="${esc(this.path('home'))}">${esc(this.t('allChile'))}</a>
            <span aria-hidden="true">/</span>
            <span>${esc(region.name)}</span>
          </p>
          <header class="region-head">
            <p class="eyebrow">${esc(this.copy('regions', region.id, 'sub'))}</p>
            <h2>${esc(region.name)}</h2>
            <p class="lede">${esc(this.copy('regions', region.id, 'overview'))}</p>
            <dl class="stat-band">
              <div><dt>${esc(this.t('runs'))}</dt><dd>${rivers.length}</dd></div>
              <div><dt>${esc(this.t('classIII'))}</dt><dd>${counts[3]}</dd></div>
              <div><dt>${esc(this.t('classIV'))}</dt><dd>${counts[4]}</dd></div>
              <div><dt>${esc(this.t('classV'))}</dt><dd>${counts[5]}</dd></div>
              <div><dt>${esc(this.t('season'))}</dt><dd>${esc(this.copy('regions', region.id, 'season'))}</dd></div>
            </dl>
            <p class="field-note"><span>${esc(this.t('fieldNote'))}</span> ${esc(this.copy('regions', region.id, 'tagline'))}</p>
            ${region.id === 'araucania' ? `<p class="partner-chip">${esc(this.t('partnerWaters'))}</p>` : ''}
            ${this.regionOperators(region.id)}
          </header>
          <div class="toolbar">
            <div class="filters" role="group" aria-label="${esc(this.t('filterAria'))}">
              <button type="button" class="filter-btn" data-filter="all">${esc(this.t('all'))} <span data-count="all"></span></button>
              <button type="button" class="filter-btn" data-filter="class3">III <span data-count="class3"></span></button>
              <button type="button" class="filter-btn" data-filter="class4">IV <span data-count="class4"></span></button>
              <button type="button" class="filter-btn" data-filter="class5">V <span data-count="class5"></span></button>
            </div>
            <label class="filter-search">
              <span class="visually-hidden">${esc(this.t('filterRegion', { name: region.name }))}</span>
              <input id="region-filter-input" type="search" placeholder="${esc(this.t('filterPlaceholder'))}" value="${esc(this.searchQuery)}" autocomplete="off">
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
      : `<p class="empty-state">${esc(this.t('noMatch'))}</p>`;
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
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('levels');
      const data = await res.json();
      const readings = data.readings || [];
      this.levelsOffline = false;
      this.levels = Object.fromEntries(readings.map((reading) => [reading.runId, reading]));
      storageSet('ckg.levels', JSON.stringify({ savedAt: Date.now(), readings }));
      this.repaintLevels();
    } catch {
      this.useSavedLevels();
    }
  }

  useSavedLevels() {
    let saved = null;
    try { saved = JSON.parse(storageGet('ckg.levels') || 'null'); } catch { saved = null; }
    if (!saved?.readings?.length) return;
    const now = Date.now();
    this.levelsOffline = true;
    this.levels = Object.fromEntries(saved.readings.map((reading) => {
      const time = Date.parse(reading.time || '');
      const ageMinutes = Number.isFinite(time) ? Math.max(0, Math.round((now - time) / 60000)) : reading.ageMinutes;
      return [reading.runId, { ...reading, ageMinutes, saved: true }];
    }));
    this.repaintLevels();
  }

  repaintLevels() {
    if (this.view === 'region' && this.currentId) this.paintRegionResults(getRegionById(this.currentId));
    else if (this.view === 'river' && this.currentId) {
      const scroll = this.panelEl?.scrollTop || 0;
      this.renderRiver(this.currentId);
      if (this.panelEl) this.panelEl.scrollTop = scroll;
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
    if (minutes < 1) return this.t('justNow');
    if (minutes < 60) return this.t('minAgo', { n: minutes });
    return this.t('hrAgo', { n: Math.round(minutes / 60) });
  }

  cwlMark() {
    return `<svg class="cwl-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0e5a7a"/><path d="M5 13c3-3 5-3 8 0s5 3 8 0 4-2 6-1" fill="none" stroke="#9be7f5" stroke-width="2.2" stroke-linecap="round"/><path d="M5 19c3-3 5-3 8 0s5 3 8 0 4-2 6-1" fill="none" stroke="#4fd1e8" stroke-width="2.2" stroke-linecap="round" opacity=".75"/><path d="M5 25c3-3 5-3 8 0s5 3 8 0 4-2 6-1" fill="none" stroke="#2dd4bf" stroke-width="2.2" stroke-linecap="round" opacity=".45"/></svg>`;
  }

  levelBlock(river, linked) {
    const runId = river?.id;
    const reading = this.levels?.[runId];
    if (!reading) return '';
    const badges = [];
    if (reading.basis === 'estimated') badges.push(this.t('estimated'));
    if (reading.basis === 'derived') badges.push(this.t('derived'));
    if (reading.basis === 'experimental') badges.push(this.t('experimental'));
    const age = this.ageLabel(reading.ageMinutes);
    if (reading.saved) badges.push(`${this.t('lastReading')} · ${age}`);
    else if (reading.stale) badges.push(`${this.t('stale')} · ${age}`);
    const trend = reading.trend === 'rising' ? this.t('rising') : reading.trend === 'falling' ? this.t('falling') : reading.trend === 'steady' ? this.t('steady') : '';
    const when = reading.saved || reading.stale ? '' : age;
    const stick = reading.gaugeApprox != null ? ` · ${this.t('gaugeApprox', { n: reading.gaugeApprox })}` : '';
    const status = reading.kind === 'flow' ? flowStatus(Number(reading.value), river?.optimalFlow) : null;
    const statusLabel = status === 'low' ? this.t('tooLow') : status === 'high' ? this.t('high') : status === 'in' ? this.t('inRange') : '';
    const tag = linked ? 'a' : 'div';
    const attrs = linked ? ` href="${esc(reading.href)}" target="_blank" rel="noopener noreferrer"` : '';
    return `<${tag} class="level-chip"${attrs}>
      ${this.cwlMark()}
      <span>
        ${statusLabel ? `<span class="flow-status is-${status}">${statusLabel}</span>` : ''}
        <b>${esc(this.formatReading(reading))}</b>
        <small>${esc(reading.stationName)}${trend ? ` · ${esc(trend)}` : ''}${when ? ` · ${esc(when)}` : ''}${esc(stick)}</small>
        <small>${esc(this.t('cwlCredit'))} · ${esc(reading.credit)}</small>
        ${badges.length ? `<span class="level-badges">${badges.map((badge) => `<span class="level-badge${badge.startsWith(this.t('stale')) || badge.startsWith(this.t('lastReading')) ? ' stale' : ''}">${esc(badge)}</span>`).join('')}</span>` : ''}
      </span>
      ${reading.saved || reading.stale ? '' : '<i class="level-live" aria-hidden="true"></i>'}
    </${tag}>`;
  }

  riverCard(river, index) {
    const level = this.levelBlock(river, false);
    return `
      <a class="river-card" data-river-card="${esc(river.id)}" href="${esc(this.path('river', river.id))}" style="--i:${Math.min(index, 8)}">
        <div class="card-top">
          <div>
            <h3>${esc(river.name)}</h3>
            <p>${esc(this.copy('rivers', river.id, 'section'))}</p>
          </div>
          ${gradeChip(river.classNumber, this.copy('rivers', river.id, 'grade'))}
        </div>
        ${level || `<p class="glance">${esc(this.formatFlow(river.optimalFlow))} ${esc(this.t('optimal'))}</p>`}
        <p class="card-foot"><span>${esc(this.copy('rivers', river.id, 'season'))}</span><span>${esc(this.t('openRun'))}</span></p>
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
    const home = esc(this.path('home'));
    const regionHref = esc(this.path('region', river.regionId));
    const levelsLink = river.gaugeInfo?.chileWaterLevelsUrl
      ? `<p><a href="${esc(river.gaugeInfo.chileWaterLevelsUrl)}" target="_blank" rel="noopener noreferrer">Chile Water Levels</a></p>`
      : '';
    this.mainEl.innerHTML = `
      <article class="river-page view-enter">
        <p class="crumbs">
          <a href="${home}">${esc(this.t('allChile'))}</a>
          <span aria-hidden="true">/</span>
          <a href="${regionHref}">${esc(region?.name || river.regionName)}</a>
        </p>
        <header class="river-hero">
          <p class="eyebrow">${esc(river.regionName)}</p>
          <div class="hero-line">
            <h2>${esc(river.name)}</h2>
            ${gradeChip(river.classNumber, this.copy('rivers', river.id, 'grade'))}
          </div>
          <p class="section-name">${esc(this.copy('rivers', river.id, 'section'))}</p>
        </header>
        ${this.levelBlock(river, true)}
        <p class="glance">${esc(this.formatFlow(river.optimalFlow))} ${esc(this.t('optimal'))} · ${esc(river.lengthKm)} km · ${esc(this.copy('rivers', river.id, 'season'))}</p>
        <div id="run-map" class="run-map" role="img" aria-label="${esc(this.t('runMapAria', { name: river.name }))}"></div>
        <p class="map-legend"><span><i class="legend-put"></i> ${esc(this.t('putLegend'))}</span><span><i class="legend-take"></i> ${esc(this.t('takeLegend'))}</span></p>
        <details class="dive">
          <summary>
            <span>${esc(this.t('dive'))}</span>
            <span class="dive-meta">${esc(this.t('diveMeta', { n: river.keyRapids.length }))}</span>
          </summary>
          <section class="prose-block">
            <h3>${esc(this.t('guideBeta'))}</h3>
            <p>${esc(this.copy('rivers', river.id, 'beta'))}</p>
          </section>
          <aside class="pro-tip">
            <p class="eyebrow">${esc(this.t('proTip'))}</p>
            <p>${esc(this.copy('rivers', river.id, 'tip'))}</p>
          </aside>
          <section class="prose-block">
            <h3>${esc(this.t('flowNotes'))}</h3>
            <p>${esc(this.copy('rivers', river.id, 'flow'))}</p>
            <p>${esc(river.gradient)} · ${esc(river.durationHours)}</p>
            ${levelsLink}
          </section>
          <section class="prose-block">
            <h3>${esc(this.t('rapids'))}</h3>
            <ol class="rapid-list">
              ${river.keyRapids.map((rapid, index) => `
                <li>
                  <div class="rapid-top">
                    <h4>${esc(rapid.name)}</h4>
                    <span class="grade-chip ${rapidTone(rapid.grade)}">${esc(rapid.grade)}</span>
                  </div>
                  <p>${esc(this.copy('rivers', river.id, 'rapids', index))}</p>
                </li>
              `).join('')}
            </ol>
          </section>
          <section class="prose-block">
            <h3>${esc(this.t('hazards'))}</h3>
            <ul class="hazard-list">
              ${river.hazards.map((hazard, index) => `<li>${esc(this.copy('rivers', river.id, 'hazards', index) || hazard)}</li>`).join('')}
            </ul>
          </section>
          <section class="prose-block">
            <h3>${esc(this.t('access'))}</h3>
            <p>${esc(this.copy('rivers', river.id, 'logistics'))}</p>
            <div class="access-grid">
              ${this.accessCard(this.t('putIn'), river.putIn, this.copy('rivers', river.id, 'putIn'))}
              ${this.accessCard(this.t('takeOut'), river.takeOut, this.copy('rivers', river.id, 'takeOut'))}
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

  accessCard(label, point, note) {
    const maps = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
    return `
      <article class="access-card">
        <p class="eyebrow">${esc(label)}</p>
        <h4>${esc(point.name)}</h4>
        <p class="coords">${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}</p>
        <p>${esc(note || point.accessBeta)}</p>
        <a href="${esc(maps)}" target="_blank" rel="noopener noreferrer">${esc(this.t('maps'))}</a>
      </article>
    `;
  }

  regionOperators(regionId) {
    const list = operatorsIn(regionId);
    if (!list.length) return '';
    const links = list.map((operator) => {
      const name = this.t(`ops.${operator.id}.name`);
      return `<a href="${esc(this.path('with'))}#${esc(operator.id)}">${esc(name)}</a>`;
    }).join(' · ');
    return `<p class="region-ops"><span>${esc(this.t('withHere'))}</span> ${links}</p>`;
  }

  renderWith() {
    this.view = 'with';
    this.currentId = null;
    const regions = REGIONS.filter((region) => operatorsIn(region.id).length);
    const shown = OPERATORS.filter((operator) => this.withRegion === 'all' || operator.regions.includes(this.withRegion));
    const hash = location.hash.replace('#', '');
    this.mainEl.innerHTML = `
      <div class="view-enter with-page">
        <p class="crumbs">
          <a href="${esc(this.path('home'))}">${esc(this.t('allChile'))}</a>
          <span aria-hidden="true">/</span>
          <span>${esc(this.t('withTitle'))}</span>
        </p>
        <header class="region-head">
          <p class="eyebrow">${esc(this.t('withEyebrow'))}</p>
          <h2>${esc(this.t('withTitle'))}</h2>
          <p class="lede">${esc(this.t('withLede'))}</p>
        </header>
        <div class="chips" role="group" aria-label="${esc(this.t('withFilter'))}">
          <button type="button" class="filter-btn ${this.withRegion === 'all' ? 'is-on' : ''}" data-with="all">${esc(this.t('withAll'))}</button>
          ${regions.map((region) => `<button type="button" class="filter-btn ${this.withRegion === region.id ? 'is-on' : ''}" data-with="${esc(region.id)}">${esc(region.name)}</button>`).join('')}
        </div>
        <div class="op-list">
          ${shown.length ? shown.map((operator) => this.operatorCard(operator, hash === operator.id)).join('') : `<p class="empty-state">${esc(this.t('withEmpty'))}</p>`}
        </div>
      </div>
    `;
    this.mainEl.querySelectorAll('[data-with]').forEach((button) => {
      button.addEventListener('click', () => {
        this.withRegion = button.dataset.with;
        this.renderWith();
      });
    });
  }

  operatorCard(operator, forceOpen) {
    const name = this.t(`ops.${operator.id}.name`);
    const open = operator.featured || forceOpen ? ' open' : '';
    return `
      <details class="op-card ${operator.featured ? 'is-featured' : ''}" id="${esc(operator.id)}"${open}>
        <summary>
          <p class="op-kicker">${operator.featured ? esc(this.t('withFeatured')) : esc(this.t('withEyebrow'))}</p>
          <h3>${esc(name)}</h3>
          <p class="op-where">${esc(this.t(`ops.${operator.id}.where`))}</p>
        </summary>
        <div class="op-body">
          <p><strong>${esc(this.t('withOffers'))}.</strong> ${esc(this.t(`ops.${operator.id}.offers`))}</p>
          <p><strong>${esc(this.t('withWhere'))}.</strong> ${esc(this.t(`ops.${operator.id}.detail`))}</p>
          <p><a href="${esc(operator.url)}" target="_blank" rel="noopener noreferrer">${esc(this.t('withSite'))}</a></p>
        </div>
      </details>
    `;
  }

  renderMissing() {
    this.view = 'missing';
    this.currentId = null;
    this.mainEl.innerHTML = `
      <div class="missing view-enter">
        <p class="eyebrow">${esc(this.t('offMap'))}</p>
        <h2>${esc(this.t('missingTitle'))}</h2>
        <p>${esc(this.t('missingBody'))}</p>
        <a class="btn btn-primary" href="${esc(this.path('home'))}">${esc(this.t('backChile'))}</a>
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
      ? REGIONS.filter((region) => {
        const hay = [region.name, region.sub, this.copy('regions', region.id, 'sub'), this.copy('regions', region.id, 'tagline')].join(' ').toLowerCase();
        return hay.includes(query);
      })
      : [];
    let rivers = RIVERS;
    if (query) {
      rivers = RIVERS.filter((river) => {
        const hay = [
          river.name,
          river.section,
          river.regionName,
          river.character,
          this.copy('rivers', river.id, 'section'),
          this.copy('rivers', river.id, 'character')
        ].join(' ').toLowerCase();
        return hay.includes(query);
      });
    }
    if (!regions.length && !rivers.length) {
      this.searchResults.innerHTML = `<p class="search-empty">${esc(this.t('searchEmpty', { q: query }))}</p>`;
      return;
    }
    const regionHtml = regions.map((region) => `
      <a class="search-hit" href="${esc(this.path('region', region.id))}">
        <span><strong>${esc(region.name)}</strong><em>${esc(this.copy('regions', region.id, 'sub'))}</em></span>
        <span class="search-kind">${esc(this.t('searchKind'))}</span>
      </a>
    `).join('');
    const riverHtml = rivers.slice(0, 12).map((river) => `
      <a class="search-hit" href="${esc(this.path('river', river.id))}">
        <span><strong>${esc(river.name)}</strong><em>${esc(this.copy('rivers', river.id, 'section'))} · ${esc(river.regionName)}</em></span>
        ${gradeChip(river.classNumber, this.copy('rivers', river.id, 'grade').split('(')[0].trim())}
      </a>
    `).join('');
    const hint = query ? '' : `<p class="search-hint">${esc(this.t('searchHint', { n: RIVERS.length }))}</p>`;
    this.searchResults.innerHTML = `${hint}${regionHtml}${riverHtml}`;
  }
}

const app = new ChileKayakApp();
window.app = app;
