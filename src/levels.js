// Live readings for guide runs, shaped like a small /v1 payload.
// Hub JSON is read as published. This file does not add gauges together
// and does not apply area-ratio estimates.

export const HUBS = {
  pucon: 'https://chilewaterlevels.com/pucon/api/data',
  panguipulli: 'https://chilewaterlevels.com/panguipulli/api/current',
  maipo: 'https://chilewaterlevels.com/maipo/api/data',
  futaleufu: 'https://chilewaterlevels.com/futaleufu/api/current',
  baker: 'https://chilewaterlevels.com/baker/api/data'
};

const DGA = 'DGA provisional';
const DAM = 'Hidroeléctrica Futaleufú';

// Only runs whose section is the station itself. Codes that disagree with
// the guide's stored code are noted in the report; the match is the station
// name plus the run, not a nearby river.
export const GAUGE_MAP = [
  { runId: 'trancura-upper', hub: 'pucon', station: '09412001-2', href: 'https://chilewaterlevels.com/pucon/guide/trancura', credit: DGA },
  { runId: 'trancura-lower', hub: 'pucon', station: '09414001-3', href: 'https://chilewaterlevels.com/pucon/guide/trancura', credit: DGA },
  { runId: 'rio-liucura', hub: 'pucon', station: '09416001-4', href: 'https://chilewaterlevels.com/pucon/guide/liucura', credit: DGA },
  { runId: 'rio-maichin', hub: 'pucon', station: '09411001-7', href: 'https://chilewaterlevels.com/pucon/guide/maichin', credit: DGA },
  { runId: 'river-fuy-upper', hub: 'panguipulli', station: 'fuy', href: 'https://chilewaterlevels.com/panguipulli/guide/fuy', credit: DGA },
  { runId: 'rio-enco', hub: 'panguipulli', station: 'enco', href: 'https://chilewaterlevels.com/panguipulli/guide/enco', credit: DGA },
  { runId: 'rio-san-pedro', hub: 'panguipulli', station: 'sanpedro', href: 'https://chilewaterlevels.com/panguipulli/guide/san-pedro', credit: DGA },
  { runId: 'rio-futaleufu-bridge-to-bridge', hub: 'futaleufu', kind: 'b2b', href: 'https://chilewaterlevels.com/futaleufu/guide/futaleufu', credit: `${DAM} · ${DGA}` },
  { runId: 'rio-espolon', hub: 'futaleufu', kind: 'espolon', href: 'https://chilewaterlevels.com/futaleufu/guide/espolon', credit: DGA },
  { runId: 'rio-maipo', hub: 'maipo', station: '05704016-5', href: 'https://chilewaterlevels.com/maipo/guide/maipo', credit: DGA },
  { runId: 'rio-baker-lower', hub: 'baker', station: '11536004-3', href: 'https://chilewaterlevels.com/baker/guide/baker', credit: DGA }
];

const STALE_MINUTES = 4 * 60;

export function readingsFromPayloads(payloads, now = Date.now()) {
  const readings = [];
  for (const entry of GAUGE_MAP) {
    const payload = payloads?.[entry.hub];
    if (!payload) continue;
    const reading = entry.kind === 'b2b'
      ? fromBridgeToBridge(payload, entry, now)
      : entry.kind === 'espolon'
        ? fromEspolon(payload, entry, now)
        : fromStation(payload, entry, now);
    if (reading) readings.push(reading);
  }
  return readings;
}

export function fromStation(payload, entry, now) {
  const station = findStation(payload, entry.station);
  if (!station) return null;
  const current = station.current || station;
  const flow = numberOrNull(current.flow) ?? numberOrNull(current.cms);
  const level = numberOrNull(current.level);
  const time = stamp(current.t ?? current.iso);
  if (flow == null && level == null) return null;
  if (!time) return null;
  const age = ageMinutes(time, now);
  const stale = current.stale === true || age > STALE_MINUTES;
  const useLevel = flow == null;
  return {
    runId: entry.runId,
    stationId: station.code || entry.station,
    stationName: station.short || station.name || current.name || entry.station,
    value: useLevel ? level : roundFlow(flow),
    unit: useLevel ? 'm' : 'm³/s',
    kind: useLevel ? 'level' : 'flow',
    time: new Date(time).toISOString(),
    ageMinutes: age,
    stale,
    trend: trendFrom(current.trend || current.dgaTrend),
    basis: basisOf(current),
    credit: entry.credit,
    href: entry.href,
    gaugeApprox: null
  };
}

export function fromBridgeToBridge(payload, entry, now) {
  const basis = payload.gaugeBasis;
  const gauge = payload.gaugeReading || payload.gauge?.gaugeReading;
  const cms = numberOrNull(basis?.cms);
  if (!basis?.ok || cms == null) return null;
  const time = stamp(payload.t || payload.iso || payload.now);
  const age = time ? ageMinutes(time, now) : null;
  const stale = basis.stale === true || payload.stale === true || age == null || age > STALE_MINUTES;
  const trend = trendFrom(payload.views?.both?.trend || payload.trend);
  return {
    runId: entry.runId,
    stationId: 'b2b',
    stationName: 'Bridge to Bridge put-in gauge',
    value: roundFlow(cms),
    unit: 'm³/s',
    kind: 'flow',
    time: time ? new Date(time).toISOString() : null,
    ageMinutes: age,
    stale,
    trend,
    basis: 'estimated',
    credit: entry.credit,
    href: entry.href,
    gaugeApprox: numberOrNull(gauge?.approx ?? payload.gaugeReading?.approx)
  };
}

export function fromEspolon(payload, entry, now) {
  const esp = payload.esp;
  if (!esp?.ok) return null;
  const cms = numberOrNull(esp.cms);
  const time = stamp(esp.t || esp.iso);
  if (cms == null || !time) return null;
  const age = ageMinutes(time, now);
  return {
    runId: entry.runId,
    stationId: 'espolon',
    stationName: esp.name || 'Río Espolón',
    value: roundFlow(cms),
    unit: 'm³/s',
    kind: 'flow',
    time: new Date(time).toISOString(),
    ageMinutes: age,
    stale: esp.stale === true || age > (esp.staleAfterHours || 4) * 60,
    trend: trendFrom(esp.trend),
    basis: esp.estimated ? 'estimated' : 'measured',
    credit: entry.credit,
    href: entry.href,
    gaugeApprox: null
  };
}

function findStation(payload, id) {
  const stations = payload.stations || payload.gauges || {};
  if (stations[id]) return stations[id];
  return Object.values(stations).find((station) => station?.code === id || station?.key === id) || null;
}

function basisOf(current) {
  if (current.estimated) return 'estimated';
  if (current.extrapolated) return 'derived';
  if (current.unconfirmed) return 'experimental';
  return 'measured';
}

function trendFrom(value) {
  if (!value) return null;
  const word = typeof value === 'object' ? value.direction : value;
  const text = String(word || '').toLowerCase();
  if (/estab|steady|stable/.test(text)) return 'steady';
  if (/sub|ris|alza/.test(text)) return 'rising';
  if (/baj|fall|desc/.test(text)) return 'falling';
  return null;
}

function stamp(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 1e12 ? n * 1000 : n;
}

function ageMinutes(time, now) {
  return Math.max(0, Math.round((now - time) / 60000));
}

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function roundFlow(value) {
  return Math.round(value * 10) / 10;
}
