import { useLayoutEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Logo from '@/components/ui/Logo';
import landingCss from './landing-v2.css?inline';
import landingHtml from './landing-page.html?raw';
import logoCss from '@/components/ui/logo.css?inline';

const LANDING_TITLE = 'صفقات ذكية | المنصة الوطنية الذكية للصفقات العمومية';

/**
 * The attached landing page is a complete standalone HTML document. It is
 * rendered inside a shadow root so its global selectors (body, footer, .btn,
 * .container, @keyframes, …) cannot leak into the operator, authority, or
 * central portals. The markup and styles below are kept verbatim apart from
 * the root selector/font-size adaptation in landing-v2.css and the app route
 * mapping.
 */
export function LandingV2Page() {
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const previousTitle = document.title;
    document.title = LANDING_TITLE;

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Amiri:wght@700;900&display=swap';

    const style = document.createElement('style');
    // أنماط صفحة الهبوط + أنماط الشعار: الأنماط العالمية لا تعبر حدود الظل
    style.textContent = `${landingCss}\n${logoCss}`;

    const root = document.createElement('div');
    root.className = 'landing-root';
    root.lang = 'ar';
    root.dir = 'rtl';
    root.innerHTML = landingHtml;

    shadow.replaceChildren(fontLink, style, root);

    /**
     * تركيب الشعار الرسمي (<Logo />) داخل مواضع `[data-logo-slot]` في الهيدر
     * والبطولة والفاصل بين كل قسمين. صفحة الهبوط مستند HTML خام داخل Shadow DOM،
     * فتُركَّب الشعارات في جذور React مستقلة لكل موضع.
     */
    const logoRoots: Root[] = Array.from(
      root.querySelectorAll<HTMLElement>('[data-logo-slot]'),
    ).map((slot) => {
      const rawSize = slot.dataset.logoSize ?? '48';
      const size: number | string = rawSize.endsWith('%') ? rawSize : Number(rawSize) || 48;
      const slotRoot = createRoot(slot);
      slotRoot.render(<Logo size={size} />);
      return slotRoot;
    });

    const scrollToHash = (hash: string, behavior: 'auto' | 'smooth') => {
      const id = hash.replace(/^#/, '');
      if (!id || id === 'home' || id === 'top') {
        window.scrollTo({ top: 0, behavior });
        return;
      }

      shadow.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
    };

    const handleClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a');
      const href = anchor?.getAttribute('href');
      if (!href?.startsWith('#')) return;

      event.preventDefault();
      window.history.replaceState(null, '', href);
      scrollToHash(href, 'smooth');
    };

    shadow.addEventListener('click', handleClick);

    let active = true;
    let initialScrollTimer: number | undefined;

    const scrollToCurrentHash = (behavior: 'auto' | 'smooth') => {
      if (!active || !window.location.hash) return;
      scrollToHash(window.location.hash, behavior);
    };

    const handleHashChange = () => scrollToCurrentHash('smooth');
    window.addEventListener('hashchange', handleHashChange);

    initialScrollTimer = window.setTimeout(() => scrollToCurrentHash('auto'), 500);
    void document.fonts.ready.then(() => scrollToCurrentHash('auto')).catch(() => undefined);

    return () => {
      active = false;
      if (initialScrollTimer !== undefined) window.clearTimeout(initialScrollTimer);
      window.removeEventListener('hashchange', handleHashChange);
      shadow.removeEventListener('click', handleClick);
      // إلغاء تركيب الشعارات خارج دورة تصيير React لتفادي تحذير الإلغاء المتزامن
      queueMicrotask(() => {
        logoRoots.forEach((logoRoot) => logoRoot.unmount());
      });
      shadow.replaceChildren();
      document.title = previousTitle;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="landing-standalone"
      dir="rtl"
      id="top"
      style={{ display: 'block', width: '100%', minHeight: '100vh' }}
    />
  );
}
