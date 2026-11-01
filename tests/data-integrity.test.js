// Test Suite: Data Integrity & River Schema Verification
// Ensures the codebase can safely be built upon without breaking schemas.

import { REGIONS, RIVERS, getRegionById, getRiverById, getRiversByRegion } from '../src/data/rivers-data.js';

console.log('🧪 Starting Chile Whitewater Guide Data Integrity Tests...\n');

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
  }
}

// 1. Verify Regions
assert(REGIONS.length === 7, `Expected 7 regions, got ${REGIONS.length}`);

const regionIds = new Set();
REGIONS.forEach(reg => {
  assert(!regionIds.has(reg.id), `Duplicate region id: ${reg.id}`);
  regionIds.add(reg.id);
  assert(reg.name && reg.name.length > 0, `Region ${reg.id} missing name`);
  assert(reg.sub && reg.sub.length > 0, `Region ${reg.id} missing sub`);
  assert(reg.overview && reg.overview.length > 20, `Region ${reg.id} missing or short overview`);
  assert(reg.color && reg.color.startsWith('#'), `Region ${reg.id} has invalid color`);
});

// 2. Verify Rivers
assert(RIVERS.length >= 40, `Expected at least 40 rivers, got ${RIVERS.length}`);

const riverIds = new Set();
RIVERS.forEach(r => {
  // Uniqueness
  assert(!riverIds.has(r.id), `Duplicate river ID: ${r.id}`);
  riverIds.add(r.id);

  // Region validity
  assert(regionIds.has(r.regionId), `River ${r.id} references invalid region: ${r.regionId}`);

  // Basic metadata
  assert(r.name && r.name.length > 0, `River ${r.id} missing name`);
  assert(r.section && r.section.length > 0, `River ${r.id} missing section`);
  assert([3, 4, 5].includes(r.classNumber), `River ${r.id} invalid classNumber: ${r.classNumber}`);
  assert(r.grade && r.grade.length > 0, `River ${r.id} missing grade`);
  assert(r.character && r.character.length > 0, `River ${r.id} missing character`);

  // Flow range
  assert(r.optimalFlow && typeof r.optimalFlow.minCms === 'number', `River ${r.id} missing minCms`);
  assert(r.optimalFlow && typeof r.optimalFlow.maxCms === 'number', `River ${r.id} missing maxCms`);
  assert(r.optimalFlow.maxCms >= r.optimalFlow.minCms, `River ${r.id} maxCms < minCms`);

  // Coordinates
  assert(r.putIn && typeof r.putIn.lat === 'number' && typeof r.putIn.lng === 'number', `River ${r.id} invalid put-in coords`);
  assert(r.takeOut && typeof r.takeOut.lat === 'number' && typeof r.takeOut.lng === 'number', `River ${r.id} invalid take-out coords`);

  // David Hughes PKR Content
  assert(r.davidBeta && r.davidBeta.length > 100, `River ${r.id} missing or short David Hughes beta`);
  assert(r.pkrProTip && r.pkrProTip.length > 15, `River ${r.id} missing PKR Pro Tip`);

  // Rapids & Hazards
  assert(Array.isArray(r.keyRapids) && r.keyRapids.length > 0, `River ${r.id} has no key rapids`);
  assert(Array.isArray(r.hazards) && r.hazards.length > 0, `River ${r.id} has no hazards listed`);
});

// 3. Verify Helper functions
const trancura = getRiverById('trancura-upper');
assert(trancura && trancura.name === 'Río Trancura', 'getRiverById failed for trancura-upper');

const puconRivers = getRiversByRegion('araucania');
assert(puconRivers.length === 11, `Expected 11 Araucania rivers, got ${puconRivers.length}`);

console.log(`\n========================================`);
console.log(`✅ Passed: ${passed} assertions`);
if (failed > 0) {
  console.log(`❌ Failed: ${failed} assertions`);
  process.exit(1);
} else {
  console.log(`🎉 All data integrity tests passed!`);
  console.log(`========================================\n`);
}
