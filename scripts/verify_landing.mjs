import { Browser } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';

async function main() {
  console.log('1. Launching browser...');
  const browser = await Browser.launch({ width: 1440, height: 900 });
  const page = await browser.newPage({ width: 1440, height: 900 });

  console.log('2. Navigating to http://localhost/...');
  await page.goto('http://localhost/', { settleMs: 3000 });

  const landingAnalysis = await page.eval(() => {
    const main = document.querySelector('main');
    const sections = Array.from(main.querySelectorAll('header, section')).map((s) => s.id || s.tagName);
    const dividers = main.querySelectorAll('[role="separator"]').length;
    const heroH1 = document.querySelector('header h1')?.innerText;
    return {
      sectionCount: sections.length,
      sections,
      dividerCount: dividers,
      heroH1,
    };
  });

  console.log('Landing Page Analysis:', JSON.stringify(landingAnalysis, null, 2));

  console.log('3. Taking screenshot of hero & glass card...');
  const shot = await page.screenshot({ fullPage: false });
  writeFileSync('landing_redesign_verified.jpg', shot);
  console.log('Saved landing_redesign_verified.jpg');

  await browser.close();
  console.log('Verification finished successfully!');
}

main().catch((err) => {
  console.error('Error verifying landing:', err);
  process.exit(1);
});
