import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const srcDir = path.join(rootDir, 'client/src');

function getAllFiles(dir, extensions = ['.ts', '.tsx', '.html']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'locales', 'i18n'].includes(file)) {
        results = results.concat(getAllFiles(fullPath, extensions));
      }
    } else if (extensions.includes(path.extname(file))) {
      results.push(fullPath);
    }
  }
  return results;
}

const arabicCharRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function scanCodebase() {
  const files = getAllFiles(srcDir);
  const hardcodedArabicInJSX = [];
  const directFormattingUsages = [];
  const physicalDirectionalUsages = [];

  for (const filePath of files) {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Skip pure comments
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return;
      }

      // 1. Detect Arabic characters outside of comments
      // Exclude lines with explicit i18n lookup or comment markers
      if (arabicCharRegex.test(line)) {
        // Exclude lines where the Arabic text is solely inside comments
        const codePart = line.split('//')[0];
        if (arabicCharRegex.test(codePart)) {
          // Check if it's JSX text, template literal, or attribute
          hardcodedArabicInJSX.push({
            file: relPath,
            line: lineNum,
            content: trimmed,
          });
        }
      }

      // 2. Direct formatting calls
      if (
        (line.includes('.toLocaleString(') && !line.includes('//')) ||
        (line.includes('.toLocaleDateString(') && !line.includes('//') && !relPath.includes('format.ts')) ||
        (line.includes('.toFixed(') && !line.includes('//') && !relPath.includes('chart') && !relPath.includes('format.ts'))
      ) {
        directFormattingUsages.push({
          file: relPath,
          line: lineNum,
          content: trimmed,
        });
      }

      // 3. Physical directional Tailwind classes
      // We look for class names with pl-, pr-, ml-, mr-, text-left, text-right, left-, right-
      const physicalMatch = line.match(/\b(pl-\d+|pr-\d+|ml-\d+|mr-\d+|text-left|text-right)\b/);
      if (physicalMatch) {
        physicalDirectionalUsages.push({
          file: relPath,
          line: lineNum,
          matched: physicalMatch[0],
          content: trimmed,
        });
      }
    });
  }

  return {
    hardcodedArabicInJSX,
    directFormattingUsages,
    physicalDirectionalUsages,
  };
}

if (process.argv[1] === __filename) {
  const { hardcodedArabicInJSX, directFormattingUsages, physicalDirectionalUsages } = scanCodebase();

  console.log('=== Codebase Scan Results ===\n');
  console.log(`Hardcoded Arabic occurrences: ${hardcodedArabicInJSX.length}`);

  const filesWithArabic = [...new Set(hardcodedArabicInJSX.map((x) => x.file))];
  console.log(`Files with Arabic text (${filesWithArabic.length}):`);
  filesWithArabic.forEach((f) => {
    const count = hardcodedArabicInJSX.filter((x) => x.file === f).length;
    console.log(`  - ${f} (${count} lines)`);
  });

  console.log(`\nDirect formatting occurrences: ${directFormattingUsages.length}`);
  const filesWithFormatting = [...new Set(directFormattingUsages.map((x) => x.file))];
  filesWithFormatting.forEach((f) => {
    const count = directFormattingUsages.filter((x) => x.file === f).length;
    console.log(`  - ${f} (${count} lines)`);
  });

  console.log(`\nPhysical directional class occurrences: ${physicalDirectionalUsages.length}`);
  const filesWithDirectional = [...new Set(physicalDirectionalUsages.map((x) => x.file))];
  filesWithDirectional.forEach((f) => {
    const count = physicalDirectionalUsages.filter((x) => x.file === f).length;
    console.log(`  - ${f} (${count} lines)`);
  });
}
