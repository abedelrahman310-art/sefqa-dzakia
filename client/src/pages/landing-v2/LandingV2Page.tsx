import { useLayoutEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useLocation } from 'wouter';
import Logo from '@/components/ui/Logo';
import { useI18n } from '@/i18n';
import landingCss from './landing-v2.css?inline';
import landingHtml from './landing-page.html?raw';
import logoCss from '@/components/ui/logo.css?inline';
import fr from '@/locales/fr.json';

const frTranslations = fr as unknown as Record<string, string>;
const LANDING_TITLE = 'صفقات ذكية | المنصة الوطنية الذكية للصفقات العمومية';

/** يوحّد المسافات كما في جرد النصوص الأصلي (194 نصاً). */
function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * يطبّق لغة الصفحة على شجرة Shadow DOM دون إعادة بنائها.
 *
 * النصوص الأصلية تُحفظ في WeakMap لكل عقدة نصية، حتى يمكن الرجوع إليها عند
 * التبديل من الفرنسية إلى العربية. فقرة `.story-intro` تحتوي وسوم <em> مجزأة،
 * لذلك تُستبدل ككتلة HTML كاملة بدل معالجة عقدها النصية.
 */
function applyLandingLanguage(
  root: HTMLElement,
  lang: 'ar' | 'fr',
  textOriginals: WeakMap<Text, string>,
  attributeOriginals: WeakMap<Element, Map<string, string>>,
  storyIntroOriginals: WeakMap<Element, string>,
): void {
  const isFr = lang === 'fr';
  root.lang = lang;
  root.dir = isFr ? 'ltr' : 'rtl';

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const text = current as Text;
    const parent = text.parentElement;
    current = walker.nextNode();

    if (!parent) continue;
    const tag = parent.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE') continue;
    if (parent.closest('.story-intro')) continue;

    let original = textOriginals.get(text);
    if (original === undefined) {
      original = text.data;
      const key = normalizeText(original);
      if (!key || !frTranslations[key]) continue;
      textOriginals.set(text, original);
    }

    if (!isFr) {
      text.data = original;
      continue;
    }

    const translated = frTranslations[normalizeText(original)];
    if (!translated) continue;

    const leading = original.match(/^\s*/)?.[0] ?? '';
    const trailing = original.match(/\s*$/)?.[0] ?? '';
    text.data = `${leading}${translated}${trailing}`;
  }

  root.querySelectorAll<HTMLElement>('[aria-label]').forEach((element) => {
    let originals = attributeOriginals.get(element);
    if (!originals) {
      originals = new Map([['aria-label', element.getAttribute('aria-label') ?? '']]);
      attributeOriginals.set(element, originals);
    }
    const original = originals.get('aria-label') ?? '';
    const translated = frTranslations[original];
    if (!translated) return;
    element.setAttribute('aria-label', isFr ? translated : original);
  });

  const storyIntro = root.querySelector<HTMLElement>('.story-intro');
  if (storyIntro) {
    let original = storyIntroOriginals.get(storyIntro);
    if (original === undefined) {
      original = storyIntro.innerHTML;
      storyIntroOriginals.set(storyIntro, original);
    }
    storyIntro.innerHTML = isFr ? frTranslations['landing.story_intro'] : original;
  }
}

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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const textOriginalsRef = useRef(new WeakMap<Text, string>());
  const attributeOriginalsRef = useRef(new WeakMap<Element, Map<string, string>>());
  const storyIntroOriginalsRef = useRef(new WeakMap<Element, string>());
  const { lang, dir, setLang, t } = useI18n();
  const [, setLocation] = useLocation();
  const langRef = useRef(lang);
  langRef.current = lang;

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
    root.innerHTML = landingHtml;
    rootRef.current = root;

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

      const langBtn = target.closest('#landing-lang-btn');
      if (langBtn) {
        event.preventDefault();
        setLang(langRef.current === 'ar' ? 'fr' : 'ar');
        return;
      }

      const anchor = target.closest('a');
      const href = anchor?.getAttribute('href');
      if (!href) return;

      if (href.startsWith('#')) {
        event.preventDefault();
        window.history.replaceState(null, '', href);
        scrollToHash(href, 'smooth');
        return;
      }

      if (href.startsWith('/') && !href.startsWith('//')) {
        event.preventDefault();
        setLocation(href);
        return;
      }
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
      rootRef.current = null;
      // إلغاء تركيب الشعارات خارج دورة تصيير React لتفادي تحذير الإلغاء المتزامن
      queueMicrotask(() => {
        logoRoots.forEach((logoRoot) => logoRoot.unmount());
      });
      shadow.replaceChildren();
      document.title = previousTitle;
    };
  }, []);

  // تطبيق الترجمة عند أول تركيب وعند كل تبديل لغة، دون إعادة بناء الصفحة.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    applyLandingLanguage(
      root,
      lang,
      textOriginalsRef.current,
      attributeOriginalsRef.current,
      storyIntroOriginalsRef.current,
    );
    document.title = lang === 'fr' ? frTranslations['landing.page_title'] : LANDING_TITLE;

    const langBtn = root.querySelector<HTMLButtonElement>('#landing-lang-btn');
    if (langBtn) {
      langBtn.textContent = lang === 'ar' ? 'FR' : 'عربي';
      langBtn.setAttribute(
        'aria-label',
        lang === 'ar' ? 'Passer au français' : 'التحويل إلى العربية',
      );
    }

    const termsLink = root.querySelector<HTMLAnchorElement>('.footer-col a[href="/terms"]');
    if (termsLink) termsLink.textContent = t('landing.footer.terms');

    const faqLink = root.querySelector<HTMLAnchorElement>('.footer-col a[href="/faq"]');
    if (faqLink) faqLink.textContent = t('landing.footer.faq');

    const a11yLink = root.querySelector<HTMLAnchorElement>('.footer-col a[href="/accessibility"]');
    if (a11yLink) a11yLink.textContent = t('landing.footer.accessibility');

    const aiPowerLink = root.querySelector<HTMLAnchorElement>('.footer-col a[href="#ai"]');
    if (aiPowerLink) aiPowerLink.textContent = t('landing.footer.ai_power');
  }, [lang, t]);

  return (
    <div
      ref={hostRef}
      className="landing-standalone"
      dir={dir}
      lang={lang}
      id="top"
      style={{ display: 'block', width: '100%', minHeight: '100vh' }}
    />
  );
}
