import { Browser } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';

async function main() {
  console.log('1. Launching browser for desktop verification of #procurement-matrix...');
  const browser = await Browser.launch({ width: 1440, height: 1300 });
  const page = await browser.newPage({ width: 1440, height: 1300 });

  await page.goto('http://localhost/', { settleMs: 1500 });
  await page.eval(() => {
    localStorage.setItem('lang', 'ar');
    localStorage.setItem('i18nextLng', 'ar');
    location.reload();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to #procurement-matrix section
  await page.eval(() => {
    const el = document.querySelector('#procurement-matrix');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1200));

  const desktopShot = await page.screenshot({ fullPage: false });
  writeFileSync('C:/Users/NADIR/.gemini/antigravity/brain/cda8a817-84f8-45d1-9799-61b977120e0b/unified_matrix_desktop_verified.jpg', desktopShot);
  console.log('Saved unified_matrix_desktop_verified.jpg');

  // Evaluate milestones data
  const data = await page.eval(() => {
    const section = document.querySelector('#procurement-matrix');
    if (!section) return { error: 'Section #procurement-matrix not found' };

    const h2 = section.querySelector('h2')?.innerText;
    const cards = Array.from(section.querySelectorAll('.space-y-6 > div, .space-y-8 > div'));
    const milestoneData = cards.map(c => {
      const step = c.querySelector('.font-mono')?.innerText;
      const title = c.querySelector('h3')?.innerText;
      const central = c.querySelector('.bg-linear-to-r p')?.innerText;
      return { step, title, central };
    });

    const disclaimer = section.querySelector('.max-w-3xl p')?.innerText;
    const alertText = section.querySelector('.bg-amber-50 span')?.innerText;
    const buttons = Array.from(section.querySelectorAll('a')).map(a => ({ text: a.innerText, href: a.getAttribute('href') }));

    return {
      title: h2,
      milestonesCount: milestoneData.length,
      milestones: milestoneData,
      disclaimer,
      alertText,
      buttons
    };
  });

  console.log('Desktop data:', JSON.stringify(data, null, 2));

  // Test Mobile View
  console.log('2. Switching to mobile viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.eval(() => {
    const el = document.querySelector('#procurement-matrix');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const mobileShot = await page.screenshot({ fullPage: false });
  writeFileSync('C:/Users/NADIR/.gemini/antigravity/brain/cda8a817-84f8-45d1-9799-61b977120e0b/unified_matrix_mobile_verified.jpg', mobileShot);
  console.log('Saved unified_matrix_mobile_verified.jpg');

  await browser.close();
  console.log('Verification finished successfully.');
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
