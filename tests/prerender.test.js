import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REGIONS, RIVERS, getRegionById, getRiverById } from '../src/data/rivers-data.js';
import { applyMeta, filesFor, pages, siteOrigin, summarize, writePrerenderedPages } from '../src/prerender.js';

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${message}`);
  }
}

const template = `<!doctype html>
<html><head>
  <title>Chile Kayak Guide · Whitewater atlas</title>
  <meta name="description" content="A whitewater kayaking atlas of Chile: 44 runs across 7 regions, from the Maipo to the Baker. Flow ranges, grades, rapids, access, and live gauges.">
  <meta property="og:title" content="Chile Kayak Guide">
  <meta property="og:description" content="A field atlas of Chile's whitewater. Pick a region on the map and drop into the runs.">
</head><body><main id="app-view"></main></body></html>`;

const list = pages();
const home = list.filter((page) => page.path === '/');
const regionPages = list.filter((page) => page.path.startsWith('/region/'));
const riverPages = list.filter((page) => page.path.startsWith('/river/'));

assert(home.length === 1, 'one home page');
assert(regionPages.length === REGIONS.length, `region pages ${regionPages.length} != ${REGIONS.length}`);
assert(riverPages.length === RIVERS.length, `river pages ${riverPages.length} != ${RIVERS.length}`);
assert(!list.some((page) => page.path.startsWith('/api')), 'prerender must not shadow /api');
assert(!list.some((page) => page.path.includes('..')), 'no parent segments');

const araucania = regionPages.find((page) => page.path === '/region/araucania');
assert(araucania, 'araucania route exists');
assert(araucania?.title === `${getRegionById('araucania').name} · Chile Kayak Guide`, 'araucania title');
assert(araucania?.description.length > 40, 'araucania description');
assert(!/david hughes/i.test(araucania?.description || ''), 'region description is not attributed to David Hughes');

const trancura = riverPages.find((page) => page.path === '/river/trancura-upper');
const trancuraRiver = getRiverById('trancura-upper');
assert(trancura?.title === `${trancuraRiver.name} · Chile Kayak Guide`, 'trancura title matches the client title');
assert(trancura?.description.includes(trancuraRiver.section), 'trancura description includes the section');
assert(trancura?.description.includes('Class'), 'trancura description includes the grade');
assert(!/david hughes/i.test(trancura.description), 'river description is not attributed to David Hughes');

assert(JSON.stringify(filesFor(home[0])) === JSON.stringify(['index.html']), 'home file');
assert(JSON.stringify(filesFor(araucania)) === JSON.stringify([
  'region/araucania.html',
  'region/araucania/index.html'
]), 'region files cover both Cloudflare and GitHub Pages');
assert(JSON.stringify(filesFor(trancura)) === JSON.stringify([
  'river/trancura-upper.html',
  'river/trancura-upper/index.html'
]), 'river files');

const rendered = applyMeta(template, araucania);
assert(rendered.includes(`<title>${araucania.title}</title>`), 'title replaced');
assert(rendered.includes(`content="${araucania.description}"`), 'description replaced');
assert(rendered.includes(`property="og:title" content="${araucania.title}"`), 'og:title');
assert(rendered.includes(`property="og:description" content="${araucania.description}"`), 'og:description');
assert(rendered.includes(`rel="canonical" href="${siteOrigin()}/region/araucania"`), 'canonical');
assert(rendered.includes(`property="og:url" content="${siteOrigin()}/region/araucania"`), 'og:url');
assert((rendered.match(/<title>/g) || []).length === 1, 'one title');
assert(!rendered.includes('Pick a region on the map'), 'generic og description removed');

const quoted = applyMeta(template, { path: '/region/araucania', title: 'A & B "quote"', description: 'Rock < ledge' });
assert(quoted.includes('A &amp; B &quot;quote&quot;'), 'title escaped');
assert(quoted.includes('Rock &lt; ledge'), 'description escaped');

assert(summarize('one two', 50) === 'one two', 'short summary unchanged');
assert(summarize('alpha beta gamma', 10).endsWith('…'), 'long summary ellipsizes');

const previousSite = process.env.SITE_URL;
process.env.SITE_URL = 'https://example.test/';
assert(applyMeta(template, araucania).includes('https://example.test/region/araucania'), 'SITE_URL overrides the canonical origin');
if (previousSite === undefined) delete process.env.SITE_URL;
else process.env.SITE_URL = previousSite;

const dir = mkdtempSync(join(tmpdir(), 'ckg-prerender-'));
try {
  const written = writePrerenderedPages(dir, template);
  assert(written.length === list.length * 2 - 1, `expected home once plus two files per route, got ${written.length}`);
  const flat = readFileSync(join(dir, 'region/araucania.html'), 'utf8');
  const nested = readFileSync(join(dir, 'region/araucania/index.html'), 'utf8');
  assert(flat === nested, 'flat and directory index HTML match');
  assert(flat.includes(araucania.title), 'written file has the region title');
  const riverHtml = readFileSync(join(dir, 'river/trancura-upper.html'), 'utf8');
  assert(riverHtml.includes(trancura.title), 'written river file');
  assert(!written.some((file) => file.startsWith('api/')), 'writer did not emit api files');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const redirects = readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8');
const redirectRules = redirects.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#')).join('\n');
assert(!/\/\*\s+\S+\s+200/.test(redirectRules), '_redirects must not contain a splat 200 rewrite');
assert(!/index\.html/.test(redirectRules), 'no active index.html rewrite');

const notFound = readFileSync(new URL('../public/404.html', import.meta.url), 'utf8');
assert(notFound.includes('noindex'), '404 is noindex');
assert(!notFound.includes('id="app-view"'), '404 is not a copy of the app shell');
assert(!notFound.includes('type="module"'), '404 does not boot the app');
assert(/isn.t on the map/.test(notFound), '404 explains the miss');

console.log(`Prerender checks passed: ${passed}`);
if (failed) {
  console.error(`Prerender checks failed: ${failed}`);
  process.exit(1);
}
