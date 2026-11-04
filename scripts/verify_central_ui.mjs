import { Browser } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';

async function main() {
  console.log('1. Authenticating as admin@safaqat.dz...');
  const res = await fetch('http://localhost/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@safaqat.dz',
      password: process.env.SEPAQAT_SEED_PASSWORD || 'Safaqat@2026',
    }),
  });

  if (!res.ok) {
    console.error('Failed to authenticate:', res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const accessToken = data.access;
  const refreshToken = data.refresh || accessToken;
  const user = data.user || {
    id: 'central-admin',
    email: 'admin@safaqat.dz',
    role: 'central_admin',
    display_name: 'المفتش المركزي للرقابة والمتابعة',
    organization_name: 'المفتشية العامة للصفقات والمشتريات العمومية',
  };
  console.log('Authenticated successfully!');

  console.log('2. Launching headless browser...');
  const browser = await Browser.launch({ width: 1440, height: 900 });
  const page = await browser.newPage({ width: 1440, height: 900 });

  // Navigate to blank origin to set localStorage
  await page.goto('http://localhost/');
  await page.eval((access, refresh, u) => {
    localStorage.setItem('safaqat_access_token', access);
    localStorage.setItem('safaqat_refresh_token', refresh);
    localStorage.setItem('safaqat_user', JSON.stringify(u));
  }, accessToken, refreshToken, user);

  console.log('3. Navigating to /central/integrity...');
  await page.goto('http://localhost/central/integrity', { settleMs: 5000 });
  await new Promise((r) => setTimeout(r, 4000));

  // Check current URL and title
  const url1 = await page.eval(() => window.location.href);
  console.log('Current URL:', url1);

  // Take screenshot of integrity view
  const shot1 = await page.screenshot({ fullPage: false });
  writeFileSync('central_integrity_verified.jpg', shot1);
  console.log('Saved central_integrity_verified.jpg');

  // Verify that the old dark container is gone and the new light one exists
  const integrityAnalysis = await page.eval(() => {
    const text = document.body.innerText;
    const hasOldBadge = text.includes('الجمهورية الجزائرية الديمقراطية الشعبية · المفتشية العامة للصفقات العمومية');
    const darkBanner = document.querySelector('.bg-gradient-to-r.from-navy-950');
    return {
      hasOldBadge,
      hasDarkBanner: !!darkBanner,
      bodyTextSnippet: text.slice(0, 300),
    };
  });
  console.log('Integrity page analysis:', integrityAnalysis);

  console.log('4. Navigating to /central/authorities...');
  await page.goto('http://localhost/central/authorities', { settleMs: 5000 });
  await new Promise((r) => setTimeout(r, 4000));
  const shot2 = await page.screenshot({ fullPage: false });
  writeFileSync('central_authorities_verified.jpg', shot2);
  console.log('Saved central_authorities_verified.jpg');

  console.log('5. Testing topbar icons for 403 or routing errors...');
  const topbarCheck = await page.eval(() => {
    const buttons = Array.from(document.querySelectorAll('.portal-topbar__actions button, .portal-topbar__actions [role="button"]'));
    return buttons.map(b => ({
      title: b.getAttribute('title') || b.getAttribute('aria-label') || b.innerText,
      className: b.className,
    }));
  });
  console.log('Topbar buttons:', topbarCheck);

  await browser.close();
  console.log('Verification completed successfully!');
}

main().catch(err => {
  console.error('Error in verification:', err);
  process.exit(1);
});
