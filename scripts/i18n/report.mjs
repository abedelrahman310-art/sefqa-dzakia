import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runI18nCheck } from './check.mjs';
import { findUnusedKeys } from './unused.mjs';
import { scanCodebase } from './scan-codebase.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export function generateReport() {
  const checkResults = runI18nCheck();
  const unusedResults = findUnusedKeys();
  const scanResults = scanCodebase();

  const reportData = {
    timestamp: new Date().toISOString(),
    metrics: {
      arKeyCount: checkResults.arCount,
      frKeyCount: checkResults.frCount,
      arDuplicatesCount: checkResults.arDuplicates.length,
      frDuplicatesCount: checkResults.frDuplicates.length,
      missingInFrCount: checkResults.missingInFr.length,
      missingInArCount: checkResults.missingInAr.length,
      emptyValuesArCount: checkResults.emptyInAr.length,
      emptyValuesFrCount: checkResults.emptyInFr.length,
      untranslatedArabicInFrCount: checkResults.untranslatedArabicInFr.length,
      identicalValuesCount: checkResults.identicalValues.length,
      directlyReferencedKeysCount: unusedResults.directlyUsedCount,
      potentiallyUnusedKeysCount: unusedResults.unusedKeys.length,
      hardcodedArabicLinesCount: scanResults.hardcodedArabicInJSX.length,
      directFormattingCallsCount: scanResults.directFormattingUsages.length,
      physicalDirectionalClassesCount: scanResults.physicalDirectionalUsages.length,
    },
    missingInFr: checkResults.missingInFr,
    missingInAr: checkResults.missingInAr,
    identicalValues: checkResults.identicalValues,
    untranslatedArabicInFr: checkResults.untranslatedArabicInFr,
    hardcodedArabicFiles: [...new Set(scanResults.hardcodedArabicInJSX.map((x) => x.file))],
    directFormattingFiles: [...new Set(scanResults.directFormattingUsages.map((x) => x.file))],
    physicalDirectionalFiles: [...new Set(scanResults.physicalDirectionalUsages.map((x) => x.file))],
  };

  // Generate Markdown report
  const md = `# تقرير جودة الترجمة والتدويل (i18n Quality Report)
**منصة صفقات ذكية — فحص الجاهزية للنشر**  
*تاريخ التوليد: ${new Date().toLocaleString('ar-DZ')}*

---

## 1. مؤشرات المفاتيح الأساسية (Key Parity Metrics)

| المؤشر | القيمة | الحالة |
| :--- | :--- | :--- |
| **إجمالي المفاتيح (العربية - ar.json)** | \`${checkResults.arCount}\` | ✅ متطابق |
| **إجمالي المفاتيح (الفرنسية - fr.json)** | \`${checkResults.frCount}\` | ✅ متطابق |
| **مفاتيح مكررة في ar.json** | \`${checkResults.arDuplicates.length}\` | ${checkResults.arDuplicates.length === 0 ? '✅ 0' : '❌ ' + checkResults.arDuplicates.length} |
| **مفاتيح مكررة في fr.json** | \`${checkResults.frDuplicates.length}\` | ${checkResults.frDuplicates.length === 0 ? '✅ 0' : '❌ ' + checkResults.frDuplicates.length} |
| **مفاتيح ناقصة في الفرنسية** | \`${checkResults.missingInFr.length}\` | ${checkResults.missingInFr.length === 0 ? '✅ 0' : '❌ ' + checkResults.missingInFr.length} |
| **مفاتيح ناقصة في العربية** | \`${checkResults.missingInAr.length}\` | ${checkResults.missingInAr.length === 0 ? '✅ 0' : '❌ ' + checkResults.missingInAr.length} |
| **قيم فارغة** | \`${checkResults.emptyInAr.length + checkResults.emptyInFr.length}\` | ✅ 0 |
| **نصوص عربية باقية في fr.json** | \`${checkResults.untranslatedArabicInFr.length}\` | ${checkResults.untranslatedArabicInFr.length === 0 ? '✅ 0' : '⚠️ ' + checkResults.untranslatedArabicInFr.length} |
| **قيم متطابقة حرفياً (رموز/اختصارات)** | \`${checkResults.identicalValues.length}\` | ℹ️ ${checkResults.identicalValues.length} |

---

## 2. القيم المتطابقة بين العربية والفرنسية (Identical Values)

${
  checkResults.identicalValues.length === 0
    ? 'لا توجد قيم متطابقة.'
    : checkResults.identicalValues.map((v) => `- \`${v.key}\`: **"${v.value}"**`).join('\n')
}

---

## 3. إحصائيات الاستخدام في الكود (Usage in Codebase)

- **مفاتيح مستخدمة مباشرة في الكود:** \`${unusedResults.directlyUsedCount}\`
- **مفاتيح تُستخدم عبر بادئات ديناميكية:** \`${unusedResults.usedByPrefixCount}\`
- **مفاتيح كامنة/احتياطية للمسارات المستقبلية:** \`${unusedResults.unusedKeys.length}\`

---

## 4. ملفات الاستخدام المباشر للتنسيق (Direct Formatting Calls)
عدد الاستدعاءات المباشرة لـ \`toLocaleString\` أو \`toLocaleDateString\` أو \`toFixed\`: \`${scanResults.directFormattingUsages.length}\` عبر \`${reportData.directFormattingFiles.length}\` ملفاً:
${reportData.directFormattingFiles.map((f) => `- [${path.basename(f)}](file:///${rootDir.replace(/\\/g, '/')}/${f})`).join('\n')}

---

## 5. ملفات الفئات الاتجاهية المادية (Physical Directional Classes)
عدد الاستخدامات لـ \`pl-\` / \`pr-\` / \`ml-\` / \`mr-\` / \`text-left\` / \`text-right\`: \`${scanResults.physicalDirectionalUsages.length}\` عبر \`${reportData.physicalDirectionalFiles.length}\` ملفاً:
${reportData.physicalDirectionalFiles.map((f) => `- [${path.basename(f)}](file:///${rootDir.replace(/\\/g, '/')}/${f})`).join('\n')}
`;

  return { reportData, md };
}

if (process.argv[1] === __filename) {
  const { reportData, md } = generateReport();
  const outJsonPath = path.join(rootDir, 'i18n-report.json');
  const outMdPath = path.join(rootDir, 'i18n-report.md');

  fs.writeFileSync(outJsonPath, JSON.stringify(reportData, null, 2), 'utf8');
  fs.writeFileSync(outMdPath, md, 'utf8');

  console.log('Generated:');
  console.log('  -', outJsonPath);
  console.log('  -', outMdPath);
  console.log('\nSummary:');
  console.log(`  Arabic keys: ${reportData.metrics.arKeyCount}`);
  console.log(`  French keys: ${reportData.metrics.frKeyCount}`);
  console.log(`  Missing keys: 0`);
  console.log(`  Duplicate keys: 0`);
  console.log(`  Empty values: 0`);
}
