import { CHILE_MAP, projectLonLat } from '../geo.js';
import { REGIONS, getRegionById, getRiversByRegion } from '../data/rivers-data.js';
import { joinBase } from '../router.js';

const NS = 'http://www.w3.org/2000/svg';

function hrefFor(routePath) {
  return joinBase(window.__APP_BASE__ || '/', routePath);
}

function mixCounts(rivers) {
  const counts = { 3: 0, 4: 0, 5: 0 };
  for (const river of rivers) counts[river.classNumber] += 1;
  return counts;
}

function regionLabel(region) {
  const rivers = getRiversByRegion(region.id);
  const mix = mixCounts(rivers);
  return `${region.name}. ${rivers.length} runs. Grade mix class III ${mix[3]}, class IV ${mix[4]}, class V ${mix[5]}. Season ${region.season}.`;
}

export function createChileMap(container, { interactive = true } = {}) {
  container.replaceChildren();

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'chile-svg');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', interactive
    ? 'Map of Chile. Kayaking regions are links. Arrow keys move between them.'
    : 'Locator map of Chile');
  svg.setAttribute('viewBox', `0 0 ${CHILE_MAP.width} ${CHILE_MAP.height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  container.append(svg);

  const byKayak = new Map();
  const context = [];
  for (const admin of CHILE_MAP.admins) {
    if (!admin.kayak) context.push(admin);
    else {
      if (!byKayak.has(admin.kayak)) byKayak.set(admin.kayak, []);
      byKayak.get(admin.kayak).push(admin);
    }
  }

  const land = document.createElementNS(NS, 'g');
  land.setAttribute('class', 'land-group');
  svg.append(graticule(), land);

  for (const admin of context) land.append(adminShape(admin, false));

  const regionLinks = [];
  for (const region of REGIONS) {
    const admins = byKayak.get(region.id);
    if (!admins) continue;
    const group = document.createElementNS(NS, interactive ? 'a' : 'g');
    group.setAttribute('class', 'kayak-region');
    group.dataset.region = region.id;
    group.style.setProperty('--reg', region.color);
    if (interactive) {
      group.setAttribute('href', hrefFor(`/region/${encodeURIComponent(region.id)}`));
      group.setAttribute('aria-label', regionLabel(region));
      regionLinks.push(group);
    }
    for (const admin of admins) {
      group.append(adminShape(admin, true));
    }
    land.append(group);
  }

  const riversLayer = document.createElementNS(NS, 'g');
  riversLayer.setAttribute('class', 'rivers-layer');
  svg.append(riversLayer);

  let view = [0, 0, CHILE_MAP.width, CHILE_MAP.height];
  let desired = view.slice();
  let frame = 0;
  let flying = false;
  let rivers = [];
  let hotHandler = null;

  function applyView() {
    svg.setAttribute('viewBox', view.map((n) => n.toFixed(2)).join(' '));
    scalePins();
  }

  function animateTo(next, animate) {
    cancelAnimationFrame(frame);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = view.slice();
    const to = next.slice();
    if (!animate || reduce) {
      flying = false;
      view = to;
      applyView();
      return;
    }
    flying = true;
    const start = performance.now();
    const duration = 860;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const e = t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
      view = from.map((value, index) => value + (to[index] - value) * e);
      applyView();
      if (t < 1) frame = requestAnimationFrame(step);
      else flying = false;
    };
    frame = requestAnimationFrame(step);
  }

  function commit(box, animate) {
    desired = box;
    animateTo(box, animate);
  }

  function countryBox() {
    return [0, 0, CHILE_MAP.width, CHILE_MAP.height];
  }

  function boxAround(bounds, padFraction, minSpan) {
    const [x0, y0, x1, y1] = bounds;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    let w = Math.max(x1 - x0, minSpan);
    let h = Math.max(y1 - y0, minSpan);
    w *= 1 + padFraction;
    h *= 1 + padFraction;
    return [cx - w / 2, cy - h / 2, w, h];
  }

  function scalePins() {
    const rect = svg.getBoundingClientRect();
    const height = rect.height || 640;
    const unit = (view[3] / height) * 7;
    riversLayer.querySelectorAll('.run-pin').forEach((pin) => {
      pin.setAttribute('r', unit.toFixed(2));
    });
    riversLayer.querySelectorAll('.run-end').forEach((pin) => {
      pin.setAttribute('r', (unit * 0.72).toFixed(2));
    });
  }

  function drawRivers(list) {
    rivers = list;
    riversLayer.replaceChildren();
    for (const river of list) {
      const put = projectLonLat(river.putIn.lng, river.putIn.lat);
      const take = projectLonLat(river.takeOut.lng, river.takeOut.lat);
      const group = document.createElementNS(NS, interactive ? 'a' : 'g');
      group.setAttribute('class', 'run');
      group.dataset.river = river.id;
      if (interactive) {
        group.setAttribute('href', hrefFor(`/river/${encodeURIComponent(river.id)}`));
        group.setAttribute('aria-label', `${river.name}, ${river.section}, class ${river.grade}`);
      }
      group.append(
        segment(put, take, 'run-hit'),
        segment(put, take, 'run-line'),
        dot(put, 'run-pin'),
        dot(take, 'run-end')
      );
      riversLayer.append(group);
    }
    scalePins();
  }

  if (interactive) {
    svg.addEventListener('pointerover', (event) => {
      if (event.pointerType === 'touch') return;
      const link = event.target.closest?.('a[data-region]');
      if (link) hotHandler?.(link.dataset.region);
    });
    svg.addEventListener('focusin', (event) => {
      const link = event.target.closest?.('a[data-region]');
      if (link) hotHandler?.(link.dataset.region);
    });
    svg.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const index = regionLinks.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowDown') next = Math.min(regionLinks.length - 1, index + 1);
      if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = regionLinks.length - 1;
      regionLinks[next].focus();
    });
  }

  const resize = new ResizeObserver(() => {
    if (!flying) scalePins();
  });
  resize.observe(container);

  function showCountry({ animate = false } = {}) {
    svg.classList.remove('is-zoomed', 'is-dimmed');
    setActive(null);
    riversLayer.replaceChildren();
    rivers = [];
    commit(countryBox(), animate);
  }

  function showRegion(regionId, list, { animate = true } = {}) {
    const bounds = CHILE_MAP.kayakBounds[regionId];
    svg.classList.add('is-zoomed', 'is-dimmed');
    setActive(regionId);
    drawRivers(list);
    if (bounds) commit(boxAround(bounds, 0.42, 96), animate);
  }

  function showRun(river, { animate = true } = {}) {
    const region = getRegionById(river.regionId);
    svg.classList.add('is-zoomed', 'is-dimmed');
    setActive(river.regionId);
    drawRivers([river]);
    const put = projectLonLat(river.putIn.lng, river.putIn.lat);
    const take = projectLonLat(river.takeOut.lng, river.takeOut.lat);
    const bounds = [
      Math.min(put[0], take[0]),
      Math.min(put[1], take[1]),
      Math.max(put[0], take[0]),
      Math.max(put[1], take[1])
    ];
    const runBox = boxAround(bounds, 0.65, 22);
    const regionBox = region && CHILE_MAP.kayakBounds[region.id]
      ? boxAround(CHILE_MAP.kayakBounds[region.id], 0.35, 96)
      : countryBox();
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit(runBox, false);
      return;
    }
    commit(regionBox, false);
    requestAnimationFrame(() => commit(runBox, true));
  }

  function setHot(regionId) {
    for (const link of regionLinks) {
      link.classList.toggle('is-hot', !!regionId && link.dataset.region === regionId);
    }
  }

  function setActive(regionId) {
    for (const link of regionLinks) {
      const on = !!regionId && link.dataset.region === regionId;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }

  function setRiverFilter(predicate) {
    riversLayer.querySelectorAll('.run').forEach((node) => {
      const river = rivers.find((item) => item.id === node.dataset.river);
      const on = river ? predicate(river) : true;
      node.classList.toggle('is-muted', !on);
      if (on) node.removeAttribute('tabindex');
      else node.setAttribute('tabindex', '-1');
    });
  }

  function emphasizeRiver(riverId) {
    riversLayer.querySelectorAll('.run').forEach((node) => {
      const on = node.dataset.river === riverId;
      node.classList.toggle('is-picked', on);
      if (on) riversLayer.append(node);
    });
  }

  function regionAtScreenY(y) {
    const svgBox = svg.getBoundingClientRect();
    if (y < svgBox.top || y > svgBox.bottom) return null;
    for (const link of regionLinks) {
      const rect = link.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom && rect.width > 1) return link.dataset.region;
    }
    return null;
  }

  showCountry({ animate: false });

  return {
    showCountry,
    showRegion,
    showRun,
    setHot,
    setActive,
    setRiverFilter,
    emphasizeRiver,
    regionAtScreenY,
    onHot(handler) { hotHandler = handler; },
    destroy() {
      cancelAnimationFrame(frame);
      resize.disconnect();
      container.replaceChildren();
    }
  };
}

function adminShape(admin, kayak) {
  const group = document.createElementNS(NS, 'g');
  const hit = document.createElementNS(NS, 'path');
  hit.setAttribute('d', admin.d);
  hit.setAttribute('class', 'admin-hit');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', admin.d);
  path.setAttribute('class', kayak ? 'admin-path' : 'admin-path is-context');
  group.append(hit, path);
  return group;
}

function graticule() {
  const group = document.createElementNS(NS, 'g');
  group.setAttribute('class', 'graticule');
  group.setAttribute('aria-hidden', 'true');
  for (const lat of [-20, -30, -40, -50]) {
    const y = projectLonLat(-70, lat)[1];
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('x2', String(CHILE_MAP.width));
    line.setAttribute('y1', y.toFixed(1));
    line.setAttribute('y2', y.toFixed(1));
    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', '8');
    text.setAttribute('y', (y - 6).toFixed(1));
    text.textContent = `${Math.abs(lat)}°S`;
    group.append(line, text);
  }
  for (const lon of [-74, -72, -70, -68]) {
    const x = projectLonLat(lon, -35)[0];
    if (x < 20 || x > CHILE_MAP.width - 12) continue;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('y1', '0');
    line.setAttribute('y2', String(CHILE_MAP.height));
    line.setAttribute('x1', x.toFixed(1));
    line.setAttribute('x2', x.toFixed(1));
    group.append(line);
  }
  return group;
}

function segment(a, b, className) {
  const line = document.createElementNS(NS, 'line');
  line.setAttribute('class', className);
  line.setAttribute('x1', a[0].toFixed(2));
  line.setAttribute('y1', a[1].toFixed(2));
  line.setAttribute('x2', b[0].toFixed(2));
  line.setAttribute('y2', b[1].toFixed(2));
  return line;
}

function dot(point, className) {
  const circle = document.createElementNS(NS, 'circle');
  circle.setAttribute('class', className);
  circle.setAttribute('cx', point[0].toFixed(2));
  circle.setAttribute('cy', point[1].toFixed(2));
  circle.setAttribute('r', '4');
  return circle;
}
