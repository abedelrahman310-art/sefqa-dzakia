import { Browser } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';

async function main() {
  console.log('1. Launching browser for desktop verification of #bid-prep...');
  const browser = await Browser.launch({ width: 1440, height: 1200 });
  const page = await browser.newPage({ width: 1440, height: 1200 });

  await page.goto('http://localhost/', { settleMs: 1500 });
  await page.eval(() => {
    localStorage.setItem('lang', 'ar');
    localStorage.setItem('i18nextLng', 'ar');
    location.reload();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to #bid-prep section
  await page.eval(() => {
    const el = document.querySelector('#bid-prep');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const desktopShot = await page.screenshot({ fullPage: false });
  writeFileSync('C:/Users/NADIR/.gemini/antigravity/brain/cda8a817-84f8-45d1-9799-61b977120e0b/bid_prep_desktop_verified.jpg', desktopShot);
  console.log('Saved bid_prep_desktop_verified.jpg');

  // Evaluate stages content
  const data = await page.eval(() => {
    const section = document.querySelector('#bid-prep');
    if (!section) return { error: 'Section #bid-prep not found' };

    const h2 = section.querySelector('h2')?.innerText;
    const cards = Array.from(section.querySelectorAll('.grid-cols-4 > div'));
    const stageData = cards.map(c => {
      const num = c.querySelector('.font-mono')?.innerText;
      const title = c.querySelector('h3')?.innerText;
      const role = c.querySelector('p')?.innerText;
      return { num, title, role };
    });

    const disclaimer = section.querySelector('.max-w-3xl p')?.innerText;
    const alertText = section.querySelector('.bg-amber-50 span')?.innerText;
    const ctaText = section.querySelector('a[href="/register/operator"]')?.innerText;

    return {
      title: h2,
      stagesCount: stageData.length,
      stages: stageData,
      disclaimer,
      alertText,
      ctaText
    };
  });

  console.log('Desktop data:', JSON.stringify(data, null, 2));

  // Test Mobile View
  console.log('2. Switching to mobile viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.eval(() => {
    const el = document.querySelector('#bid-prep');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const mobileShot = await page.screenshot({ fullPage: false });
  writeFileSync('C:/Users/NADIR/.gemini/antigravity/brain/cda8a817-84f8-45d1-9799-61b977120e0b/bid_prep_mobile_verified.jpg', mobileShot);
  console.log('Saved bid_prep_mobile_verified.jpg');

  await browser.close();
  console.log('Verification finished successfully.');
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
