import { CHILE_MAP, projectLonLat } from '../src/geo.js';
import { REGIONS, RIVERS } from '../src/data/rivers-data.js';
import { joinBase, parseLocation, stripBase, toPath } from '../src/router.js';

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${message}`);
  }
}

assert(CHILE_MAP.admins.length === 16, `expected 16 admin regions, got ${CHILE_MAP.admins.length}`);
assert(String(CHILE_MAP.source).includes('Natural Earth'), 'map source is not Natural Earth');
assert(CHILE_MAP.width > 100 && CHILE_MAP.height > CHILE_MAP.width * 3, 'Chile viewBox is not tall');

const kayakIds = new Set(REGIONS.map((region) => region.id));
for (const id of kayakIds) {
  assert(CHILE_MAP.kayakBounds[id], `missing geometry for ${id}`);
  assert(CHILE_MAP.kayakGeo[id], `missing geographic bounds for ${id}`);
}
for (const admin of CHILE_MAP.admins) {
  assert(admin.d && admin.d.length > 40, `${admin.iso} has no path`);
  assert(admin.kayak === null || kayakIds.has(admin.kayak), `${admin.iso} has unknown kayak id ${admin.kayak}`);
}
assert(Object.keys(CHILE_MAP.kayakBounds).length === REGIONS.length, 'kayak group count drifted');

function inside(lon, lat, geo, slack = 0.35) {
  return lon >= geo[0] - slack && lon <= geo[2] + slack && lat >= geo[1] - slack && lat <= geo[3] + slack;
}

for (const river of RIVERS) {
  const geo = CHILE_MAP.kayakGeo[river.regionId];
  assert(geo, `${river.id} region has no geo bounds`);
  if (!geo) continue;
  assert(
    inside(river.putIn.lng, river.putIn.lat, geo),
    `${river.id} put-in ${river.putIn.lat},${river.putIn.lng} is outside ${river.regionId}`
  );
  const [x, y] = projectLonLat(river.putIn.lng, river.putIn.lat);
  assert(Number.isFinite(x) && Number.isFinite(y), `${river.id} did not project`);
}

const rapa = projectLonLat(-109.3, -27.1);
assert(rapa[0] < 0 || rapa[0] > CHILE_MAP.width, 'Rapa Nui should sit outside the mainland frame');

const santiago = [-33.45, -70.66];
assert(inside(santiago[1], santiago[0], CHILE_MAP.kayakGeo.central, 0.05), 'Santiago should fall in Central Chile');

assert(stripBase('/region/araucania', '/') === '/region/araucania', 'root region path');
assert(stripBase('/chile-kayak-guide/region/araucania', '/chile-kayak-guide/') === '/region/araucania', 'project-page region path');
assert(stripBase('/chile-kayak-guide/', '/chile-kayak-guide/') === '/', 'project-page home slash');
assert(stripBase('/chile-kayak-guide', '/chile-kayak-guide/') === '/', 'project-page home');
assert(joinBase('/', '/region/central') === '/region/central', 'join root');
assert(joinBase('/chile-kayak-guide/', '/') === '/chile-kayak-guide/', 'join home prefix');
assert(joinBase('/chile-kayak-guide/', '/river/trancura-upper') === '/chile-kayak-guide/river/trancura-upper', 'join river prefix');

const fromHash = parseLocation({ pathname: '/', hash: '#/river/trancura-upper', base: '/' });
assert(fromHash.name === 'river' && fromHash.id === 'trancura-upper', 'hash routes still resolve');
const fromPath = parseLocation({ pathname: '/region/los-rios/', hash: '', base: '/' });
assert(fromPath.name === 'region' && fromPath.id === 'los-rios', 'trailing slash region');
assert(toPath({ name: 'home' }) === '/', 'home path');
assert(toPath({ name: 'region', id: 'biobio' }) === '/region/biobio', 'region path');
assert(toPath({ name: 'home', lang: 'es' }) === '/es', 'spanish home');
assert(toPath({ name: 'with', lang: 'es' }) === '/es/with', 'spanish who page');
assert(toPath({ name: 'river', id: 'trancura-upper', lang: 'es' }) === '/es/river/trancura-upper', 'spanish river');
const spanish = parseLocation({ pathname: '/es/region/araucania', hash: '', base: '/' });
assert(spanish.name === 'region' && spanish.id === 'araucania' && spanish.lang === 'es', 'spanish region path');
const who = parseLocation({ pathname: '/with/', hash: '', base: '/' });
assert(who.name === 'with' && who.lang === 'en', 'who page path');
assert(stripBase('/chile-kayak-guide/es/with', '/chile-kayak-guide/') === '/es/with', 'project-page spanish path');

console.log(`Map & route checks passed: ${passed}`);
if (failed) {
  console.error(`Map & route checks failed: ${failed}`);
  process.exit(1);
}
