import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const arPath = path.join(rootDir, 'client/src/locales/ar.json');
const srcDir = path.join(rootDir, 'client/src');

function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.html']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(getAllFiles(fullPath, extensions));
      }
    } else if (extensions.includes(path.extname(file))) {
      results.push(fullPath);
    }
  }
  return results;
}

export function findUnusedKeys() {
  const arRaw = fs.readFileSync(arPath, 'utf8');
  const ar = JSON.parse(arRaw);
  const keys = Object.keys(ar);

  const files = getAllFiles(srcDir);
  const fileContents = files.map((f) => ({
    path: f,
    content: fs.readFileSync(f, 'utf8'),
  }));

  // Combine contents for fast full-text substring search
  const combinedContent = fileContents.map((f) => f.content).join('\n');

  // Detect dynamic prefixes used in code like t(`nav.central.${item}`) or `operator.offers.${status}`
  const dynamicPrefixes = new Set();
  const templateRegex = /(?:t|i18n\.t)\(\s*[`"']([^`"'$]+)\$\{/g;
  let match;
  while ((match = templateRegex.exec(combinedContent)) !== null) {
    dynamicPrefixes.add(match[1]);
  }

  const unused = [];
  const usedByPrefix = [];
  const directlyUsed = [];

  for (const key of keys) {
    if (combinedContent.includes(key)) {
      directlyUsed.push(key);
    } else {
      let matchedDynamic = false;
      for (const prefix of dynamicPrefixes) {
        if (key.startsWith(prefix)) {
          matchedDynamic = true;
          break;
        }
      }
      if (matchedDynamic) {
        usedByPrefix.push(key);
      } else {
        unused.push(key);
      }
    }
  }

  return {
    totalKeys: keys.length,
    directlyUsedCount: directlyUsed.length,
    usedByPrefixCount: usedByPrefix.length,
    unusedKeys: unused,
  };
}

if (process.argv[1] === __filename) {
  const result = findUnusedKeys();
  console.log('--- i18n Unused Keys Check ---');
  console.log(`Total keys: ${result.totalKeys}`);
  console.log(`Directly referenced: ${result.directlyUsedCount}`);
  console.log(`Matched via dynamic prefix: ${result.usedByPrefixCount}`);
  console.log(`Potentially unused: ${result.unusedKeys.length}`);

  if (result.unusedKeys.length > 0) {
    console.log('\nPotentially unused keys (sample 20):');
    result.unusedKeys.slice(0, 20).forEach((k) => console.log('  -', k));
  }
}
