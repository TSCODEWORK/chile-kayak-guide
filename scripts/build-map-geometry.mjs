// Builds src/data/chile-map.json from Natural Earth 1:10m admin-1 (public domain).
// Offshore islands west of 76.2°W (Rapa Nui, Juan Fernández) are omitted so
// mainland Chile fills the frame. Antarctic claims are not in this extract.
//
// Source: https://www.naturalearthdata.com/
// File: ne_10m_admin_1_states_provinces.geojson
//
// Usage: node scripts/build-map-geometry.mjs /path/to/ne_10m_admin_1_states_provinces.geojson

import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2] || '/tmp/geo/ne_10m.json';
const output = new URL('../src/data/chile-map.json', import.meta.url);

const KAYAK_BY_ISO = {
  'CL-VS': 'central',
  'CL-RM': 'central',
  'CL-LI': 'maule',
  'CL-ML': 'maule',
  'CL-NB': 'biobio',
  'CL-BI': 'biobio',
  'CL-AR': 'araucania',
  'CL-LR': 'los-rios',
  'CL-LL': 'los-lagos',
  'CL-AI': 'aysen'
};

const EPS = 0.012;

function distToSeg(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function dp(points, eps) {
  if (points.length <= 2) return points.slice();
  let maxD = 0;
  let idx = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = distToSeg(points[i], points[0], points[end]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > eps) {
    const left = dp(points.slice(0, idx + 1), eps);
    const right = dp(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[end]];
}

function simplifyRing(ring, eps) {
  let pts = ring.map((p) => [p[0], p[1]]);
  const n = pts.length;
  if (n > 2 && pts[0][0] === pts[n - 1][0] && pts[0][1] === pts[n - 1][1]) {
    pts = pts.slice(0, -1);
  }
  if (pts.length < 4) return null;
  let far = 1;
  let maxD = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > maxD) {
      maxD = d;
      far = i;
    }
  }
  if (far < 1 || far >= pts.length - 1) return null;
  const a = dp(pts.slice(0, far + 1), eps);
  const b = dp(pts.slice(far).concat([pts[0]]), eps);
  const merged = a.slice(0, -1).concat(b.slice(0, -1));
  if (merged.length < 4) return null;
  merged.push(merged[0]);
  return merged;
}

function ringBBox(ring) {
  let minLon = 180;
  let maxLon = -180;
  let minLat = 90;
  let maxLat = -90;
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, maxLon, minLat, maxLat };
}

function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum) / 2;
}

function polygonsOf(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function keepPolygon(poly) {
  const box = ringBBox(poly[0]);
  if (box.maxLon < -76.2) return false;
  if (box.minLat < -60) return false;
  if (ringArea(poly[0]) < 0.008) return false;
  return true;
}

const raw = JSON.parse(readFileSync(input, 'utf8'));
const kept = [];

for (const feature of raw.features) {
  const props = feature.properties || {};
  if (props.adm0_a3 !== 'CHL') continue;
  const iso = props.iso_3166_2;
  const polygons = polygonsOf(feature.geometry).filter(keepPolygon).map((poly) => {
    return poly
      .map((ring) => simplifyRing(ring, EPS))
      .filter(Boolean);
  }).filter((poly) => poly.length);
  if (!polygons.length) continue;
  kept.push({
    iso,
    name: props.name,
    kayak: KAYAK_BY_ISO[iso] || null,
    polygons
  });
}

if (kept.length !== 16) {
  console.error(`Expected 16 Chilean regions, got ${kept.length}`);
  process.exit(1);
}

let minLon = 180;
let maxLon = -180;
let minLat = 90;
let maxLat = -90;
for (const region of kept) {
  for (const poly of region.polygons) {
    for (const ring of poly) {
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }
}

const PAD = 16;
const TARGET_W = 280;
const LAT_REF = -42;
const cos = Math.cos((LAT_REF * Math.PI) / 180);
const spanX = (maxLon - minLon) * cos;
const spanY = maxLat - minLat;
const scale = (TARGET_W - PAD * 2) / spanX;
const width = TARGET_W;
const height = Math.round(spanY * scale + PAD * 2);
const projectParams = {
  lon0: round(minLon, 6),
  lat0: round(maxLat, 6),
  scaleX: round(cos * scale, 6),
  scaleY: round(scale, 6),
  pad: PAD
};

function round(n, d) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function project(lon, lat) {
  return [
    (lon - projectParams.lon0) * projectParams.scaleX + projectParams.pad,
    (projectParams.lat0 - lat) * projectParams.scaleY + projectParams.pad
  ];
}

function pathAndBounds(polygons) {
  let d = '';
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let minGLon = 180;
  let maxGLon = -180;
  let minGLat = 90;
  let maxGLat = -90;
  for (const poly of polygons) {
    for (const ring of poly) {
      const pts = [];
      for (const [lon, lat] of ring) {
        if (lon < minGLon) minGLon = lon;
        if (lon > maxGLon) maxGLon = lon;
        if (lat < minGLat) minGLat = lat;
        if (lat > maxGLat) maxGLat = lat;
        const [x, y] = project(lon, lat);
        const rx = Math.round(x * 10) / 10;
        const ry = Math.round(y * 10) / 10;
        if (rx < minX) minX = rx;
        if (ry < minY) minY = ry;
        if (rx > maxX) maxX = rx;
        if (ry > maxY) maxY = ry;
        const last = pts[pts.length - 1];
        if (!last || last[0] !== rx || last[1] !== ry) pts.push([rx, ry]);
      }
      if (pts.length < 3) continue;
      d += pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + 'Z';
    }
  }
  return {
    d,
    bounds: [round(minX, 2), round(minY, 2), round(maxX, 2), round(maxY, 2)],
    geo: [round(minGLon, 4), round(minGLat, 4), round(maxGLon, 4), round(maxGLat, 4)]
  };
}

const admins = kept.map((region) => {
  const drawn = pathAndBounds(region.polygons);
  return {
    iso: region.iso,
    name: region.name,
    kayak: region.kayak,
    d: drawn.d,
    bounds: drawn.bounds,
    geo: drawn.geo
  };
});

const kayakBounds = {};
const kayakGeo = {};
for (const admin of admins) {
  if (!admin.kayak) continue;
  const b = kayakBounds[admin.kayak];
  if (!b) {
    kayakBounds[admin.kayak] = admin.bounds.slice();
    kayakGeo[admin.kayak] = admin.geo.slice();
  } else {
    b[0] = Math.min(b[0], admin.bounds[0]);
    b[1] = Math.min(b[1], admin.bounds[1]);
    b[2] = Math.max(b[2], admin.bounds[2]);
    b[3] = Math.max(b[3], admin.bounds[3]);
    const g = kayakGeo[admin.kayak];
    g[0] = Math.min(g[0], admin.geo[0]);
    g[1] = Math.min(g[1], admin.geo[1]);
    g[2] = Math.max(g[2], admin.geo[2]);
    g[3] = Math.max(g[3], admin.geo[3]);
  }
}
for (const key of Object.keys(kayakBounds)) {
  kayakBounds[key] = kayakBounds[key].map((n) => round(n, 2));
  kayakGeo[key] = kayakGeo[key].map((n) => round(n, 4));
}

const map = {
  source: 'Natural Earth 1:10m cultural vectors, admin-1, public domain (naturalearthdata.com). Mainland Chile only.',
  width,
  height,
  project: projectParams,
  admins,
  kayakBounds,
  kayakGeo
};

writeFileSync(output, JSON.stringify(map));
const bytes = Buffer.byteLength(JSON.stringify(map));
console.log(`Wrote ${output.pathname} (${bytes} bytes)`);
console.log(`viewBox 0 0 ${width} ${height}`);
console.log('kayak', Object.keys(kayakBounds).join(', '));
