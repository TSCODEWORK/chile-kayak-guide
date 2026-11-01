import { GAUGE_MAP, fromBridgeToBridge, fromEspolon, fromStation, readingsFromPayloads } from '../src/levels.js';

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${message}`);
  }
}

const now = Date.parse('2026-11-01T16:50:00.000Z');
const recent = Math.floor(now / 1000) - 30 * 60;

const mapped = new Set(GAUGE_MAP.map((entry) => entry.runId));
for (const id of [
  'trancura-upper', 'trancura-lower', 'rio-liucura', 'rio-maichin',
  'river-fuy-upper', 'rio-enco', 'rio-san-pedro',
  'rio-futaleufu-bridge-to-bridge', 'rio-espolon',
  'rio-maipo', 'rio-baker-lower'
]) {
  assert(mapped.has(id), `missing mapped run ${id}`);
}
for (const id of [
  'palguin-upper', 'rio-nevados', 'rio-puesco', 'river-fuy-lower',
  'rio-futaleufu-terminator', 'rio-puelo', 'rio-baker-upper',
  'rio-yeso', 'rio-pascua', 'rio-colorado-maipo'
]) {
  assert(!mapped.has(id), `${id} must not be attached to a gauge`);
}
assert(GAUGE_MAP.length === mapped.size, 'catalog has no duplicate runs');

const curarrehue = fromStation({
  stations: {
    '09412001-2': {
      code: '09412001-2',
      short: 'Curarrehue',
      current: { flow: 33.92, level: 1.69, t: recent, estimated: false, dgaTrend: 'estable' }
    }
  }
}, GAUGE_MAP[0], now);
assert(curarrehue.value === 33.9, `flow rounded, got ${curarrehue?.value}`);
assert(curarrehue.unit === 'm³/s' && curarrehue.kind === 'flow', 'flow unit');
assert(curarrehue.basis === 'measured', 'measured basis');
assert(curarrehue.trend === 'steady', 'dga estable is steady');
assert(curarrehue.stale === false, 'half-hour reading is fresh');
assert(curarrehue.credit === 'DGA provisional', 'DGA credit');

const extrapolated = fromStation({
  stations: { x: { code: 'x', short: 'X', current: { flow: 10, t: recent, extrapolated: true, dgaTrend: 'subiendo' } } }
}, { runId: 'r', station: 'x', credit: 'DGA provisional', href: 'https://example.test' }, now);
assert(extrapolated.basis === 'derived', 'extrapolated is derived');
assert(extrapolated.trend === 'rising', 'subiendo is rising');

const experimental = fromStation({
  stations: { x: { code: 'x', current: { flow: 10, t: recent, unconfirmed: true, dgaTrend: 'bajando' } } }
}, { runId: 'r', station: 'x', credit: 'DGA provisional', href: 'https://example.test' }, now);
assert(experimental.basis === 'experimental' && experimental.trend === 'falling', 'unconfirmed falling');

const old = fromStation({
  stations: { x: { code: 'x', short: 'Old', current: { flow: 4, t: recent - 6 * 3600, estimated: true } } }
}, { runId: 'r', station: 'x', credit: 'DGA provisional', href: 'https://example.test' }, now);
assert(old.stale === true && old.basis === 'estimated', 'old estimated reading is stale and labeled');
assert(old.ageMinutes > 300, 'age is honest');

const noTime = fromStation({
  stations: { x: { code: 'x', current: { flow: null, level: 0.44, t: null } } }
}, { runId: 'rio-puesco', station: 'x', credit: 'DGA provisional', href: 'https://example.test' }, now);
assert(noTime === null, 'a level without a timestamp is omitted');

const levelOnly = fromStation({
  gauges: { fuy: { key: 'fuy', code: '10100002-8', short: 'Río Fuy', flow: null, cms: 138.6, t: now - 50 * 60000, stale: false, trend: { direction: 'steady' } } }
}, { runId: 'river-fuy-upper', station: 'fuy', credit: 'DGA provisional', href: 'https://example.test' }, now);
assert(levelOnly.value === 138.6 && levelOnly.stationId === '10100002-8', 'panguipulli cms is the reading');

const dam = 230;
const esp = 50.5;
const azul = 16.1;
const b2b = fromBridgeToBridge({
  cms: dam,
  esp: { cms: esp },
  azul: { cms: azul },
  t: now - 40 * 60000,
  gaugeBasis: { ok: true, stale: false, cms: 295.1, damT: now - 7 * 3600000 },
  gaugeReading: { approx: -10 },
  views: { both: { cms: dam + esp + azul, trend: { direction: 'steady' } } }
}, { runId: 'rio-futaleufu-bridge-to-bridge', credit: 'Hidroeléctrica Futaleufú · DGA provisional', href: 'https://chilewaterlevels.com/futaleufu/guide/futaleufu' }, now);
assert(b2b.basis === 'estimated', 'B2B is estimated');
assert(b2b.value === 295.1, 'uses the published model flow');
assert(b2b.value !== dam + esp + azul, 'does not add dam, Espolón and Azul');
assert(b2b.gaugeApprox === -10, 'keeps the stick reading beside the flow');
assert(b2b.credit.includes('Hidroeléctrica Futaleufú'), 'dam credit');
assert(b2b.stale === false, 'the dam lag inside the model is not treated as a stale reading');

const espolon = fromEspolon({
  esp: { ok: true, name: 'Río Espolón', cms: 50.5, t: now - 20 * 60000, estimated: false, stale: false }
}, { runId: 'rio-espolon', credit: 'DGA provisional', href: 'https://chilewaterlevels.com/futaleufu/guide/espolon' }, now);
assert(espolon.basis === 'measured' && espolon.value === 50.5, 'Espolón is its own DGA reading');

const bundle = readingsFromPayloads({
  pucon: { stations: { '09412001-2': { code: '09412001-2', short: 'Curarrehue', current: { flow: 30, t: recent, dgaTrend: 'estable' } } } },
  futaleufu: {
    gaugeBasis: { ok: true, cms: 295.1, damT: now - 10 * 60000 },
    gaugeReading: { approx: -10 },
    esp: { ok: true, cms: 50.5, t: now - 10 * 60000, estimated: false }
  }
}, now);
const ids = bundle.map((reading) => reading.runId).sort();
assert(ids.includes('trancura-upper') && ids.includes('rio-espolon') && ids.includes('rio-futaleufu-bridge-to-bridge'), 'bundle keeps independent readings');
assert(!ids.includes('palguin-upper'), 'bundle does not invent Palguín');

console.log(`Level checks passed: ${passed}`);
if (failed) {
  console.error(`Level checks failed: ${failed}`);
  process.exit(1);
}
