import { REGIONS, RIVERS } from '../src/data/rivers-data.js';
import { OPERATORS } from '../src/data/operators.js';
import { englishContent, ui as en } from '../src/i18n/en.js';
import { content as esContent, ui as es } from '../src/i18n/es.js';

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL: ${message}`);
  }
}

function paths(value, prefix = '') {
  if (Array.isArray(value)) return value.map((_, index) => `${prefix}[${index}]`);
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => paths(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

const enPaths = new Set(paths(en));
const esPaths = new Set(paths(es));
for (const key of enPaths) assert(esPaths.has(key), `Spanish UI is missing ${key}`);
for (const key of esPaths) assert(enPaths.has(key), `English UI is missing ${key}`);

function leaves(value, prefix = '') {
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
  }
  return [[prefix, value]];
}

for (const [key, value] of leaves(en)) {
  assert(typeof value === 'string' && value.trim(), `English UI ${key} is empty`);
}
for (const [key, value] of leaves(es)) {
  assert(typeof value === 'string' && value.trim(), `Spanish UI ${key} is empty`);
  const english = leaves(en).find(([path]) => path === key)?.[1];
  const properName = key.endsWith('.name') || key === 'footPartner' || key === 'footCwl' || key === 'cwlCredit';
  if (!properName && typeof english === 'string' && english.length > 24) {
    assert(value !== english, `Spanish UI ${key} is still English`);
  }
}

const english = englishContent();
for (const region of REGIONS) {
  for (const key of ['sub', 'tagline', 'season', 'overview']) {
    assert(english.regions[region.id][key] === region[key], `English region ${region.id}.${key} drifted from the guide`);
    const spanish = esContent.regions[region.id]?.[key];
    assert(typeof spanish === 'string' && spanish.trim(), `Spanish region ${region.id}.${key} is missing`);
    if (region[key].length > 40) assert(spanish !== region[key], `Spanish region ${region.id}.${key} was not translated`);
  }
}

for (const river of RIVERS) {
  const source = english.rivers[river.id];
  const spanish = esContent.rivers[river.id];
  assert(source && spanish, `Missing copy for ${river.id}`);
  for (const key of ['section', 'character', 'season', 'grade', 'beta', 'tip', 'logistics', 'flow', 'putIn', 'takeOut']) {
    assert(typeof spanish[key] === 'string', `${river.id}.${key} is not a string`);
    if (source[key]) assert(spanish[key].trim(), `${river.id}.${key} is empty in Spanish`);
  }
  assert(spanish.rapids.length === river.keyRapids.length, `${river.id} rapid descriptions do not match`);
  assert(spanish.hazards.length === river.hazards.length, `${river.id} hazards do not match`);
  spanish.rapids.forEach((line, index) => {
    if (river.keyRapids[index].description) assert(line.trim(), `${river.id} rapid ${index} is empty in Spanish`);
  });
  assert(spanish.beta !== river.davidBeta, `${river.id} guide beta was not translated`);
}

assert(esContent.rivers['trancura-upper'].beta.includes('Salto Marimán'), 'Salto Marimán should keep its name');
assert(esContent.rivers['trancura-lower'].beta.includes('The Junction'), 'Rapid names stay in the Spanish beta');

for (const operator of OPERATORS) {
  for (const key of ['name', 'where', 'offers', 'detail']) {
    assert(en.ops[operator.id]?.[key], `English operator ${operator.id}.${key} missing`);
    assert(es.ops[operator.id]?.[key], `Spanish operator ${operator.id}.${key} missing`);
  }
  assert(operator.url.startsWith('https://'), `${operator.id} needs its own https link`);
}

console.log(`Translation checks passed: ${passed}`);
if (failed) {
  console.error(`Translation checks failed: ${failed}`);
  process.exit(1);
}
