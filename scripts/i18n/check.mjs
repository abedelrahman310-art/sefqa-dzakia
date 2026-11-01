import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const arPath = path.join(rootDir, 'client/src/locales/ar.json');
const frPath = path.join(rootDir, 'client/src/locales/fr.json');

function checkDuplicateKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match JSON object keys: "some.key":
  const keyRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g;
  const seen = new Map();
  const duplicates = [];
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    if (seen.has(key)) {
      duplicates.push({ key, firstIndex: seen.get(key), duplicateIndex: match.index });
    } else {
      seen.set(key, match.index);
    }
  }
  return { totalOccurrences: seen.size + duplicates.length, uniqueKeys: seen.size, duplicates };
}

export function runI18nCheck() {
  const arRaw = fs.readFileSync(arPath, 'utf8');
  const frRaw = fs.readFileSync(frPath, 'utf8');

  const arDupes = checkDuplicateKeys(arPath);
  const frDupes = checkDuplicateKeys(frPath);

  const ar = JSON.parse(arRaw);
  const fr = JSON.parse(frRaw);

  const arKeys = Object.keys(ar);
  const frKeys = Object.keys(fr);

  const arKeySet = new Set(arKeys);
  const frKeySet = new Set(frKeys);

  const missingInFr = arKeys.filter((k) => !frKeySet.has(k));
  const missingInAr = frKeys.filter((k) => !arKeySet.has(k));

  const emptyInAr = [];
  const emptyInFr = [];

  for (const [k, v] of Object.entries(ar)) {
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
      emptyInAr.push(k);
    }
  }

  for (const [k, v] of Object.entries(fr)) {
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
      emptyInFr.push(k);
    }
  }

  // Identical values analysis
  const arabicCharRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const untranslatedArabicInFr = [];
  const identicalValues = [];

  for (const k of arKeys) {
    if (frKeySet.has(k)) {
      const arVal = String(ar[k]).trim();
      const frVal = String(fr[k]).trim();

      // Check if French value still contains Arabic letters
      if (arabicCharRegex.test(frVal)) {
        untranslatedArabicInFr.push({ key: k, ar: arVal, fr: frVal });
      } else if (arVal === frVal) {
        // Same value without Arabic (e.g. "PDF", "ODS", "23-12", "FR")
        identicalValues.push({ key: k, value: arVal });
      }
    }
  }

  return {
    arCount: arKeys.length,
    frCount: frKeys.length,
    arDuplicates: arDupes.duplicates,
    frDuplicates: frDupes.duplicates,
    missingInFr,
    missingInAr,
    emptyInAr,
    emptyInFr,
    untranslatedArabicInFr,
    identicalValues,
  };
}

if (process.argv[1] === __filename) {
  const result = runI18nCheck();
  console.log('--- i18n Verification Result ---');
  console.log(`Arabic keys: ${result.arCount}`);
  console.log(`French keys: ${result.frCount}`);
  console.log(`Arabic duplicates: ${result.arDuplicates.length}`);
  console.log(`French duplicates: ${result.frDuplicates.length}`);
  console.log(`Missing in French: ${result.missingInFr.length}`);
  console.log(`Missing in Arabic: ${result.missingInAr.length}`);
  console.log(`Empty values in Arabic: ${result.emptyInAr.length}`);
  console.log(`Empty values in French: ${result.emptyInFr.length}`);
  console.log(`Untranslated Arabic in French: ${result.untranslatedArabicInFr.length}`);
  console.log(`Identical values (e.g. acronyms/numbers): ${result.identicalValues.length}`);

  if (result.missingInFr.length > 0) {
    console.log('\nKeys missing in fr.json:');
    result.missingInFr.forEach((k) => console.log('  -', k));
  }

  if (result.missingInAr.length > 0) {
    console.log('\nKeys missing in ar.json:');
    result.missingInAr.forEach((k) => console.log('  -', k));
  }

  if (result.untranslatedArabicInFr.length > 0) {
    console.log('\nSuspicious Arabic values in fr.json:');
    result.untranslatedArabicInFr.forEach(({ key, ar, fr }) =>
      console.log(`  - ${key}: "${ar}" => "${fr}"`)
    );
  }

  const hasErrors =
    result.arDuplicates.length > 0 ||
    result.frDuplicates.length > 0 ||
    result.missingInFr.length > 0 ||
    result.missingInAr.length > 0 ||
    result.emptyInAr.length > 0 ||
    result.emptyInFr.length > 0 ||
    result.untranslatedArabicInFr.length > 0;

  if (hasErrors) {
    console.error('\nFAIL: i18n verification failed.');
    process.exit(1);
  } else {
    console.log('\nSUCCESS: ar.json and fr.json are perfectly aligned!');
  }
}
