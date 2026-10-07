import type { ReactNode, CSSProperties } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import type { TranslationKey } from '@/i18n/ar';
import './landing.css';
import { useState } from 'react';

interface ProcLifecycleStage {
  num: string;
  icon: ReactNode;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

const PROC_LIFECYCLE: ProcLifecycleStage[] = [
  {
    num: '01',
    titleKey: 'landing.proc_lifecycle.s1_title',
    descKey: 'landing.proc_lifecycle.s1_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11l18-5v12L3 13v-2z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
  },
  {
    num: '02',
    titleKey: 'landing.proc_lifecycle.s2_title',
    descKey: 'landing.proc_lifecycle.s2_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    num: '03',
    titleKey: 'landing.proc_lifecycle.s3_title',
    descKey: 'landing.proc_lifecycle.s3_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    num: '04',
    titleKey: 'landing.proc_lifecycle.s4_title',
    descKey: 'landing.proc_lifecycle.s4_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    num: '05',
    titleKey: 'landing.proc_lifecycle.s5_title',
    descKey: 'landing.proc_lifecycle.s5_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
  },
  {
    num: '06',
    titleKey: 'landing.proc_lifecycle.s6_title',
    descKey: 'landing.proc_lifecycle.s6_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
];

type OwnerKey =
  | 'contractingAuthority'
  | 'economicOperator'
  | 'centralAdministration';

interface ProcurementScene {
  id: number;
  order: number;
  owner: OwnerKey;
  ownerLabel: string;
  title: string;
  description: string;
  documentLabel: string;
  documentType: string;
  status: string;
  statusKey: 'prep' | 'published' | 'notified' | 'submitted' | 'eval' | 'remote' | 'granted' | 'audit';
  aiDescription: string;
  direction: string;
  icon: string;
}

const procurementScenes: ProcurementScene[] = [
  {
    id: 1,
    order: 1,
    owner: 'contractingAuthority',
    ownerLabel: 'المصلحة المتعاقدة',
    title: 'تحضير الصفقة',
    description: 'تُحضّر المصلحة مشروع الصفقة ودفتر الشروط والمعايير والآجال قبل النشر.',
    documentLabel: 'دفتر الشروط',
    documentType: 'وثيقة تأسيسية',
    status: 'قيد الإعداد',
    statusKey: 'prep',
    aiDescription: 'يقترح هيكلة الوثائق ويرصد الحقول الناقصة وينبه إلى نقاط الامتثال.',
    direction: 'authority->central',
    icon: 'doc',
  },
  {
    id: 2,
    order: 2,
    owner: 'contractingAuthority',
    ownerLabel: 'المصلحة المتعاقدة',
    title: 'نشر الإعلان',
    description: 'تنشر المصلحة الإعلان وملفات الاستشارة عبر مساحة موحدة.',
    documentLabel: 'إعلان الصفقة',
    documentType: 'إعلان رسمي',
    status: 'منشور',
    statusKey: 'published',
    aiDescription: 'يتحقق من اكتمال بيانات الإعلان ويقترح صياغة أوضح وتصنيفاً مناسباً.',
    direction: 'authority->operator',
    icon: 'announce',
  },
  {
    id: 3,
    order: 3,
    owner: 'economicOperator',
    ownerLabel: 'المتعامل الاقتصادي',
    title: 'استلام الفرصة',
    description: 'يتلقى المتعامل إشعار الفرصة ويطّلع على الإعلان ودفتر الشروط ضمن حسابه.',
    documentLabel: 'إشعار فرصة',
    documentType: 'إشعار',
    status: 'تم الإشعار',
    statusKey: 'notified',
    aiDescription: 'يطابق الفرصة مع مجال نشاطه وينبهه إلى الآجال والوثائق المطلوبة.',
    direction: 'operator->authority',
    icon: 'notify',
  },
  {
    id: 4,
    order: 4,
    owner: 'economicOperator',
    ownerLabel: 'المتعامل الاقتصادي',
    title: 'إعداد وإرسال العرض',
    description: 'يُحضّر المتعامل عرضه التقني والمالي ويرفعه قبل انتهاء الأجل.',
    documentLabel: 'عرض تقني ومالي',
    documentType: 'عرض',
    status: 'تم الإيداع',
    statusKey: 'submitted',
    aiDescription: 'يراجع اكتمال الملف وينبه إلى الوثائق الناقصة وينظم قائمة الإيداع.',
    direction: 'operator->authority',
    icon: 'submit',
  },
  {
    id: 5,
    order: 5,
    owner: 'contractingAuthority',
    ownerLabel: 'المصلحة المتعاقدة',
    title: 'فتح وتقييم العروض',
    description: 'تفتح المصلحة الملفات وتقيم العروض وفق شبكة المعايير المعتمدة.',
    documentLabel: 'ملف التقييم',
    documentType: 'ملف داخلي',
    status: 'قيد التقييم',
    statusKey: 'eval',
    aiDescription: 'يلخص الملفات ويقارن عناصر التقييم ويرصد التناقضات؛ ولا يمنح نقطة أو يتخذ قراراً.',
    direction: 'authority->central',
    icon: 'eval',
  },
  {
    id: 6,
    order: 6,
    owner: 'economicOperator',
    ownerLabel: 'المتعامل الاقتصادي',
    title: 'متابعة حالة العرض',
    description: 'يتابع المتعامل عن بُعد حالة عرضه والإشعارات والمراسلات ضمن حدود صلاحياته.',
    documentLabel: 'إشعار حالة العرض',
    documentType: 'إشعار متابعة',
    status: 'متابعة عن بعد',
    statusKey: 'remote',
    aiDescription: 'يشرح الحالة بلغة واضحة ويرتب التنبيهات والمواعيد.',
    direction: 'operator->authority',
    icon: 'track',
  },
  {
    id: 7,
    order: 7,
    owner: 'contractingAuthority',
    ownerLabel: 'المصلحة المتعاقدة',
    title: 'المنح المؤقت',
    description: 'توثق المصلحة قرار المنح المؤقت وأسبابه ومحاضرته وتنشره وفق الإجراء المعتمد.',
    documentLabel: 'قرار المنح المؤقت',
    documentType: 'قرار',
    status: 'قرار موثّق',
    statusKey: 'granted',
    aiDescription: 'يتأكد من اكتمال مستندات القرار وينبه إلى خطوات النشر أو الاعتراض اللازمة.',
    direction: 'authority->operator',
    icon: 'award',
  },
  {
    id: 8,
    order: 8,
    owner: 'centralAdministration',
    ownerLabel: 'الإدارة المركزية',
    title: 'الرقابة المركزية',
    description: 'تراقب الإدارة المركزية مسار الإجراء وسجل التدقيق والتنبيهات دون التدخل في صلاحيات الإسناد.',
    documentLabel: 'سجل التدقيق',
    documentType: 'سجل رقابي',
    status: 'تحت المراقبة',
    statusKey: 'audit',
    aiDescription: 'يرصد الأنماط غير الاعتيادية والتأخيرات والملفات التي تحتاج مراجعة بشرية.',
    direction: 'central->authority',
    icon: 'audit',
  },
];

// Clean Reveal specifications from attached design template
const CLEAN_REVEAL_DIAMONDS = [
  [14, 2.6, 0.25, 1.4],
  [10, 2.2, 0.55, 1.5],
  [8, 3.6, 0.75, 1.7],
  [6, 5.0, 0.95, 1.9],
  [12, 6.5, 1.15, 2.0],
  [9, 7.5, 1.4, 2.0],
] as const;

const CLEAN_REVEAL_BARS = [
  [-14, -6, -45, 16, 0.9, -6, 10, 0.8, 1.4],
  [10, -12, 45, 22, 1.1, 8, -12, 0.95, 1.5],
  [-4, 8, 45, 10, 0.8, -10, 6, 1.0, 1.3],
  [18, 6, -45, 14, 1.0, 10, -8, 1.1, 1.5],
  [-22, 2, 45, 26, 1.2, -4, 14, 1.2, 1.7],
  [6, -2, 45, 5, 2.2, -3, 5, 1.3, 1.2],
  [-8, 12, -45, 8, 1.6, 3, -6, 1.35, 1.3],
  [24, -8, 45, 18, 0.9, -12, 8, 1.5, 1.5],
  [-18, -14, -45, 20, 1.0, 12, -10, 1.55, 1.6],
  [14, 14, 45, 12, 0.8, -8, 10, 1.7, 1.4],
  [-2, -18, -45, 9, 1.8, 4, -9, 1.8, 1.4],
  [-26, 10, 45, 13, 0.9, 8, -6, 1.9, 1.4],
  [28, 2, -45, 24, 1.1, -10, 10, 2.0, 1.5],
] as const;

export function LandingPage() {
  const { user, status } = useAuth();
  const [, setLocation] = useLocation();
  const { t, dir, lang, setLang } = useI18n();
  const [currentScene, setCurrentScene] = useState(0);
  const scenes = procurementScenes;
  const sceneClass = `scene-${currentScene + 1}`;

  const isGateActive = (owner: OwnerKey) => scenes[currentScene].owner === owner;

  const activeGate = scenes[currentScene].owner;

  const handleGateSelect = (owner: OwnerKey) => {
    // find scene where owner is active as primary? map by scene order - just allow manual switch to primary owner context if desired; keep deterministic
    const idx = scenes.findIndex((s) => s.owner === owner);
    if (idx !== -1) {
      setCurrentScene(idx);
    }
  };

  const goToScene = (idx: number) => {
    setCurrentScene(Math.max(0, Math.min(scenes.length - 1, idx)));
  };

  const nextScene = () => goToScene(currentScene + 1);
  const prevScene = () => goToScene(currentScene - 1);

  const getPortalPath = () => {
    if (!user) return '/login';
    if (user.role === 'central_admin') return '/central';
    return `/${user.role}`;
  };

  return (
    <div className="landing-root min-h-screen w-full flex flex-col font-sans" dir={dir}>
      {/* Top Banner if user is already authenticated */}
      {status === 'authenticated' && user && (
        <div className="w-full bg-emerald-950/90 border-b border-emerald-800/60 px-4 py-2 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2 z-50">
          <div className="truncate max-w-[230px] sm:max-w-none">
            أنت مسجل بحساب: <strong className="text-white">{user.displayName || user.email}</strong>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-emerald-600 text-emerald-100 hover:bg-emerald-900 whitespace-nowrap"
            onClick={() => setLocation(getPortalPath())}
          >
            الانتقال إلى مساحة عملك
          </Button>
        </div>
      )}

      {/* Header / Navbar (Neumorphic Style) */}
      <nav className="neu-navbar">
        <div className="wrap flex items-center justify-between h-16">
          {/* Framed Brand Logo with Algerian Identity */}
          <div className="flex items-center gap-3">
            <div className="neu-brand-pill">
              <span className="neu-brand-dot" aria-hidden="true"></span>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">{t('landing.brand')}</span>
              <span className="neu-brand-subtag">الجمهورية الجزائرية</span>
            </div>
          </div>

          {/* Navigation Anchors (Desktop) */}
          <div className="hidden md:flex items-center gap-4 text-sm font-semibold">
            <a href="#challenges" className="neu-nav-link">{t('landing.nav.challenges')}</a>
            <a href="#portals" className="neu-nav-link">{t('landing.nav.portals')}</a>
            <a href="#innovation" className="neu-nav-link">{t('landing.nav.innovation')}</a>
            <a href="#journey" className="neu-nav-link">{t('landing.nav.journey')}</a>
            <a href="#legal" className="neu-nav-link">{t('landing.nav.legal')}</a>
          </div>

          {/* Actions: Language Switcher + Login CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
              className="neu-icon-btn"
              aria-label="تبديل لغة العرض"
            >
              {lang === 'ar' ? 'Français' : 'العربية'}
            </button>
            <Link href="/login" className="neu-btn neu-btn-primary !py-2 !px-5 !text-xs !shadow-sm">
              <span>{t('landing.join_v2.btn')}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================================================
          HERO SECTION — CLEAN REVEAL (صفقات ذكية)
      ============================================================= */}
      <header className="hero-clean-reveal-section" id="hero">
        <div
          key={lang}
          className="reveal play"
          role="img"
          aria-label={t('landing.hero.clean_reveal_name')}
        >
          <div className="fx" aria-hidden="true">
            <div className="anchor">
              <i className="dot"></i>
              {/* Frosted-glass diamonds */}
              {CLEAN_REVEAL_DIAMONDS.map(([w, s, d, dur], idx) => (
                <i
                  key={`dia-${idx}`}
                  className="dia"
                  style={{
                    '--w': `${w}cqw`,
                    '--s': s,
                    '--delay': `${d}s`,
                    '--dur': `${dur}s`,
                  } as CSSProperties}
                />
              ))}
              {/* Sliding light bars */}
              {CLEAN_REVEAL_BARS.map(([ox, oy, rot, len, th, x0, x1, d, dur], idx) => (
                <i
                  key={`bar-${idx}`}
                  className="bar"
                  style={{
                    '--ox': `${ox}cqw`,
                    '--oy': `${oy}cqw`,
                    '--rot': `${rot}deg`,
                    '--len': `${len}cqw`,
                    '--th': `${th}cqw`,
                    '--x0': `${x0}cqw`,
                    '--x1': `${x1}cqw`,
                    '--delay': `${d}s`,
                    '--dur': `${dur}s`,
                  } as CSSProperties}
                />
              ))}
              {/* Sweeping ring before colour stage */}
              <i
                className="dia ring"
                style={{
                  '--w': '26cqw',
                  '--s': 2.4,
                } as CSSProperties}
              />
            </div>
            {/* Long diagonal light beam cast by the logo */}
            <div className="beam"></div>
          </div>

          {/* Centered logo (dark silhouette -> color stage) */}
          <div className="anchor">
            <div className="logo" aria-hidden="true">
              <span className="dark">{t('landing.hero.clean_reveal_name')}</span>
              <span className="col">{t('landing.hero.clean_reveal_name')}</span>
            </div>
          </div>

          {/* Bottom tag line */}
          <p className="tag" aria-hidden="true">
            {t('landing.hero.clean_reveal_tag')}
          </p>
        </div>
      </header>

      {/* ============================================================
          TRANSITION SECTION - الهوية الجزائرية
      ============================================================= */}
      <section className="hero-identity-transition">
        <div className="identity-wave">
          <div className="wave-layer wave-1"></div>
          <div className="wave-layer wave-2"></div>
          <div className="identity-emblem">
            <div className="crescent-star">
              <span className="crescent">☪</span>
              <span className="star">★</span>
            </div>
          </div>
        </div>
        <div className="gradient-overlay"></div>
      </section>

      {/* ============================================================
          FEATURES SECTION - قسم المميزات الرئيسية
      ============================================================= */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">لماذا تختار <span className="brand-highlight">&quot;صفقات ذكية&quot;</span>؟</h2>
            <p className="features-subtitle">
              منصة متكاملة مصممة خصيصاً للمشتريات العمومية الجزائرية، 
              تجمع بين الامتثال القانوني والذكاء الاصطناعي
            </p>
            <div className="features-divider">
              <span className="divider-line"></span>
              <span className="divider-emblem">⬡</span>
              <span className="divider-line"></span>
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-card neumorphic-card">
              <div className="feature-icon compliance-icon">⚖️</div>
              <h3 className="feature-title">امتثال قانون 12/23</h3>
              <p className="feature-description">بنود عقود ذكية متوافقة تلقائياً مع قانون الصفقات العمومية الجزائري</p>
              <div className="feature-badge">قانوني</div>
            </div>

            <div className="feature-card neumorphic-card">
              <div className="feature-icon ai-icon">🤖</div>
              <h3 className="feature-title">ذكاء اصطناعي</h3>
              <p className="feature-description">تحليل عروض الأسعار واكتشاف الشذوذ باقتراحات مبنية على البيانات</p>
              <div className="feature-badge ai-badge">AI</div>
            </div>

            <div className="feature-card neumorphic-card">
              <div className="feature-icon security-icon">🔐</div>
              <h3 className="feature-title">تشفير وتجميد</h3>
              <p className="feature-description">تجميد تشفيري للسجلات وطوابع زمنية معتمدة غير قابلة للتعديل</p>
              <div className="feature-badge security-badge">🔒</div>
            </div>

            <div className="feature-card neumorphic-card">
              <div className="feature-icon roles-icon">👥</div>
              <h3 className="feature-title">صلاحيات دورية</h3>
              <p className="feature-description">أدوار مخصصة (مشتري، مورد، مراجع، مدير) مع سجل تدقيق كامل</p>
              <div className="feature-badge roles-badge">👤</div>
            </div>

            <div className="feature-card neumorphic-card">
              <div className="feature-icon reports-icon">📊</div>
              <h3 className="feature-title">تقارير فورية</h3>
              <p className="feature-description">لوحات تحكم تفاعلية وتقارير PDF/Excel جاهزة للتحميل</p>
              <div className="feature-badge reports-badge">📈</div>
            </div>

            <div className="feature-card neumorphic-card">
              <div className="feature-icon integration-icon">🔄</div>
              <h3 className="feature-title">تكامل سلس</h3>
              <p className="feature-description">APIs جاهزة للتكامل مع أنظمة المحاسبة والموارد المؤسسية</p>
              <div className="feature-badge integration-badge">⚡</div>
            </div>
          </div>

          <div className="features-cta">
            <button type="button" className="btn-features-primary">اطلب عرضًا تجريبيًا</button>
            <button type="button" className="btn-features-secondary">تواصل معنا</button>
          </div>
        </div>
      </section>

      {/* PROCUREMENT JOURNEY DEMO - من الإعلان إلى الاستلام */}
      <section id="procurement-demo" className="procurement-journey">
        <div className="procurement-journey__container">
          <header className="procurement-journey__header">
            <span className="procurement-journey__eyebrow">
              <span className="procurement-journey__dot-gold" aria-hidden="true"></span>
              <span>دورة الصفقة الرقمية</span>
            </span>
            <h2 className="procurement-journey__title">
              من إعداد الصفقة إلى المنح المؤقت… رحلة موحّدة لكل الأطراف
            </h2>
            <p className="procurement-journey__subtitle">
              تعمل المصلحة المتعاقدة والمتعامل الاقتصادي والإدارة المركزية ضمن مسار رقمي مترابط،
              مع توثيق الإجراءات ومساعدة الذكاء الاصطناعي.
            </p>
            <div className="procurement-journey__decor" aria-hidden="true">
              <span className="procurement-journey__decor-line"></span>
              <span className="procurement-journey__decor-node"></span>
              <span className="procurement-journey__decor-line"></span>
            </div>
          </header>

          <div className="procurement-journey__demo-window" role="region" aria-label="عرض تفاعلي لرحلة الصفقة">
            {/* Window Header */}
            <div className="procurement-journey__window-header">
              <div className="procurement-journey__window-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="procurement-journey__window-title">مسار الصفقة الرقمية</div>
              <span className="procurement-journey__live-badge">متابعة مباشرة</span>
            </div>

            {/* Main Scene Area */}
            <div className={`procurement-journey__scene scene-${currentScene}`} data-scene={currentScene + 1}>
              {/* Mobile Tabs */}
              <div className="procurement-journey__tabs" role="tablist" aria-label="أطراف رحلة الصفقة">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeGate === 'contractingAuthority'}
                  className={`procurement-journey__tab ${activeGate === 'contractingAuthority' ? 'is-active' : ''}`}
                  onClick={() => handleGateSelect('contractingAuthority')}
                >
                  المصلحة المتعاقدة
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeGate === 'economicOperator'}
                  className={`procurement-journey__tab ${activeGate === 'economicOperator' ? 'is-active' : ''}`}
                  onClick={() => handleGateSelect('economicOperator')}
                >
                  المتعامل الاقتصادي
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeGate === 'centralAdministration'}
                  className={`procurement-journey__tab ${activeGate === 'centralAdministration' ? 'is-active' : ''}`}
                  onClick={() => handleGateSelect('centralAdministration')}
                >
                  الرقابة
                </button>
              </div>

              {/* Three Gates */}
              <div className="procurement-journey__gates">
                {/* A — Contracting Authority */}
                <div
                  className={`procurement-journey__gate procurement-journey__gate--authority ${isGateActive('contractingAuthority') ? 'is-active' : ''}`}
                >
                  <div className="procurement-journey__gate-header">
                    <div className="procurement-journey__gate-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18" />
                        <path d="M5 21V7l8-4v18" />
                        <path d="M19 21V11l-6-4" />
                        <path d="M9 9h.01" />
                        <path d="M9 12h.01" />
                        <path d="M9 15h.01" />
                      </svg>
                    </div>
                    <div className="procurement-journey__gate-label">المصلحة المتعاقدة</div>
                  </div>
                  <ul className="procurement-journey__gate-stages">
                    <li className={currentScene >= 0 ? (currentScene === 0 ? 'is-current' : currentScene > 0 ? 'is-past' : '') : ''}>
                      مشروع الصفقة
                    </li>
                    <li className={currentScene >= 1 ? (currentScene === 1 ? 'is-current' : currentScene > 1 ? 'is-past' : '') : ''}>
                      الإعلان
                    </li>
                    <li className={currentScene >= 4 ? (currentScene === 4 ? 'is-current' : currentScene > 4 ? 'is-past' : '') : ''}>
                      التقييم
                    </li>
                    <li className={currentScene >= 6 ? (currentScene === 6 ? 'is-current' : currentScene > 6 ? 'is-past' : '') : ''}>
                      المنح المؤقت
                    </li>
                  </ul>
                </div>

                {/* Document + AI */}
                <div className="procurement-journey__center">
                  <div className={`procurement-journey__document ${sceneClass}`} aria-live="polite">
                    <div className="procurement-journey__document-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <span>{scenes[currentScene].documentLabel}</span>
                    </div>
                    <div className="procurement-journey__document-body">
                      <span className="procurement-journey__document-type">{scenes[currentScene].documentType}</span>
                      <span className={`procurement-journey__document-status status-${scenes[currentScene].statusKey}`}>
                        {scenes[currentScene].status}
                      </span>
                    </div>
                  </div>

                  <div className={`procurement-journey__ai ${isGateActive(scenes[currentScene].owner) ? 'is-visible' : ''}`}>
                    <span className="procurement-journey__ai-icon" aria-hidden="true">✦</span>
                    <div className="procurement-journey__ai-content">
                      <div className="procurement-journey__ai-title">مساعد ذكي</div>
                      <p className="procurement-journey__ai-desc">{scenes[currentScene].aiDescription}</p>
                    </div>
                  </div>
                </div>

                {/* B — Economic Operator */}
                <div
                  className={`procurement-journey__gate procurement-journey__gate--operator ${isGateActive('economicOperator') ? 'is-active' : ''}`}
                >
                  <div className="procurement-journey__gate-header">
                    <div className="procurement-journey__gate-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div className="procurement-journey__gate-label">المتعامل الاقتصادي</div>
                  </div>
                  <ul className="procurement-journey__gate-stages">
                    <li className={currentScene >= 2 ? (currentScene === 2 ? 'is-current' : currentScene > 2 ? 'is-past' : '') : ''}>
                      استلام الفرصة
                    </li>
                    <li className={currentScene >= 3 ? (currentScene === 3 ? 'is-current' : currentScene > 3 ? 'is-past' : '') : ''}>
                      إعداد العرض
                    </li>
                    <li className={currentScene >= 5 ? (currentScene === 5 ? 'is-current' : currentScene > 5 ? 'is-past' : '') : ''}>
                      المتابعة عن بعد
                    </li>
                  </ul>
                </div>

                {/* C — Central Administration */}
                <div
                  className={`procurement-journey__gate procurement-journey__gate--central ${isGateActive('centralAdministration') ? 'is-active' : ''}`}
                >
                  <div className="procurement-journey__gate-header">
                    <div className="procurement-journey__gate-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="procurement-journey__gate-label">الإدارة المركزية</div>
                  </div>
                  <div className="procurement-journey__central-note">
                    متابعة ورقابة دون تدخل في صلاحيات الإسناد
                  </div>
                  <ul className="procurement-journey__gate-stages">
                    <li className={currentScene >= 7 ? 'is-current' : ''}>سجل التدقيق</li>
                  </ul>
                </div>
              </div>

              {/* Scene Details */}
              <div className="procurement-journey__details">
                <div className="procurement-journey__details-top">
                  <span className="procurement-journey__scene-counter">
                    {String(currentScene + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')}
                  </span>
                  <span className="procurement-journey__owner-label">{scenes[currentScene].ownerLabel}</span>
                </div>
                <h3 className="procurement-journey__scene-title">{scenes[currentScene].title}</h3>
                <p className="procurement-journey__scene-desc">{scenes[currentScene].description}</p>
                <div className="procurement-journey__ai-support">
                  <span className="procurement-journey__ai-support-label">دعم الذكاء الاصطناعي</span>
                  <p className="procurement-journey__ai-support-desc">{scenes[currentScene].aiDescription}</p>
                </div>
                <span className={`procurement-journey__scene-status status-${scenes[currentScene].statusKey}`}>
                  {scenes[currentScene].status}
                </span>
              </div>

              {/* Controls */}
              <div className="procurement-journey__controls">
                <button
                  type="button"
                  className="procurement-journey__control-btn"
                  onClick={prevScene}
                  disabled={currentScene === 0}
                  aria-label="المرحلة السابقة"
                >
                  ‹ السابق
                </button>
                <div className="procurement-journey__dots" role="tablist" aria-label="مؤشرات المراحل">
                  {scenes.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-label={`المرحلة ${idx + 1}`}
                      aria-selected={idx === currentScene}
                      className={`procurement-journey__dot ${idx === currentScene ? 'is-active' : ''}`}
                      onClick={() => goToScene(idx)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="procurement-journey__control-btn"
                  onClick={nextScene}
                  disabled={currentScene === scenes.length - 1}
                  aria-label="المرحلة التالية"
                >
                  التالي ›
                </button>
              </div>
            </div>
          </div>

          {/* Legal disclaimer */}
          <div className="procurement-journey__legal">
            الذكاء الاصطناعي يساعد في التنظيم والتحليل والتنبيه، ولا يتخذ قرارات التقييم أو الإسناد أو المنح بدلاً من الجهات المخوّلة.
          </div>

          {/* CTA */}
          <div className="procurement-journey__cta">
            <p className="procurement-journey__cta-text">مسار واحد، صلاحيات واضحة، وقرارات قابلة للتتبع.</p>
            <div className="procurement-journey__cta-actions">
              <Link href="/login" className="procurement-journey__btn procurement-journey__btn--primary">
                استكشف دورة الصفقة
              </Link>
              <Link href="/login" className="procurement-journey__btn procurement-journey__btn--secondary">
                اطلب عرضًا توضيحيًا
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROCUREMENT LIFECYCLE SECTION - دورة الصفقة العمومية */}
      <section id="procurement-lifecycle" className="proc-cycle-section">
        <div className="proc-cycle-container">
          <header className="proc-cycle-header">
            <span className="proc-cycle-pill">{t('landing.proc_lifecycle.badge')}</span>
            <h2 className="proc-cycle-title">{t('landing.proc_lifecycle.title')}</h2>
            <p className="proc-cycle-subtitle">{t('landing.proc_lifecycle.subtitle')}</p>
          </header>

          <ol className="proc-cycle-track">
            {PROC_LIFECYCLE.map((stage) => (
              <li key={stage.num} className="proc-cycle-step">
                <div className="proc-cycle-card">
                  <div className="proc-cycle-card-top">
                    <span className="proc-cycle-num" aria-hidden="true">{stage.num}</span>
                    <span className="proc-cycle-icon" aria-hidden="true">{stage.icon}</span>
                  </div>
                  <h3 className="proc-cycle-name">{t(stage.titleKey)}</h3>
                  <p className="proc-cycle-desc">{t(stage.descKey)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 2 — تحويل التحديات إلى حلول ذكية (Neumorphic Comparison) */}
      <section id="challenges" className="challenges-neu-section">
        <div className="challenges-wrapper">
          <header className="innovation-intro">
            <span className="innovation-pill">{t('landing.challenges.badge')}</span>
            <h2 className="main-heading">{t('landing.challenges.title')}</h2>
            <p className="sub-heading">{t('landing.challenges.subtitle')}</p>
          </header>

          <div className="comparison-grid">
            {/* Card 1: Challenges */}
            <article className="comp-card">
              <span className="comp-badge comp-badge-trad">
                <span className="w-2 h-2 rounded-full bg-red-600" aria-hidden="true"></span>
                <span>{t('landing.challenges.trad_label')}</span>
              </span>

              <div className="comp-items-list">
                <div className="comp-item-row">
                  <div className="comp-item-icon comp-item-icon-trad" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path d="M8 9h8M8 13h5" />
                    </svg>
                  </div>
                  <div className="comp-item-texts">
                    <h4>{t('landing.challenges.t1_title')}</h4>
                    <p>{t('landing.challenges.t1_desc')}</p>
                  </div>
                </div>

                <div className="comp-item-row">
                  <div className="comp-item-icon comp-item-icon-trad" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </div>
                  <div className="comp-item-texts">
                    <h4>{t('landing.challenges.t2_title')}</h4>
                    <p>{t('landing.challenges.t2_desc')}</p>
                  </div>
                </div>

                <div className="comp-item-row">
                  <div className="comp-item-icon comp-item-icon-trad" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19h16M7 15V9M12 15V5M17 15v-3" />
                    </svg>
                  </div>
                  <div className="comp-item-texts">
                    <h4>{t('landing.challenges.t3_title')}</h4>
                    <p>{t('landing.challenges.t3_desc')}</p>
                  </div>
                </div>
              </div>
            </article>

            {/* Middle Directional Arrow */}
            <div className="comp-arrow-mid" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </div>

            {/* Card 2: Solutions */}
            <article className="comp-card">
              <span className="comp-badge comp-badge-sol">
                <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true"></span>
                <span>{t('landing.challenges.sol_label')}</span>
              </span>

              <div className="comp-items-list">
                <div className="comp-item-row">
                  <div className="comp-item-icon comp-item-icon-sol" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
                    </svg>
                  </div>
                  <div className="comp-item-texts">
                    <h4>{t('landing.challenges.s1_title')}</h4>
                    <p>{t('landing.challenges.s1_desc')}</p>
                  </div>
                </div>

                <div className="comp-item-row">
                  <div className="comp-item-icon comp-item-icon-sol" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="8" />
                      <path d="M12 7v5l4 2" />
                    </svg>
                  </div>
                  <div className="comp-item-texts">
                    <h4>{t('landing.challenges.s2_title')}</h4>
                    <p>{t('landing.challenges.s2_desc')}</p>
                  </div>
                </div>

                <div className="comp-item-row">
                  <div className="comp-item-icon comp-item-icon-sol" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7z" />
                    </svg>
                  </div>
                  <div className="comp-item-texts">
                    <h4>{t('landing.challenges.s3_title')}</h4>
                    <p>{t('landing.challenges.s3_desc')}</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 3 — حلول مخصصة للجميع (Neumorphic Three Portals) */}
      <section className="portals-neu-section" id="portals">
        <div className="portals-wrapper">
          <header className="innovation-intro">
            <span className="innovation-pill">{t('landing.portals_v2.badge')}</span>
            <h2 className="main-heading">{t('landing.portals_v2.title')}</h2>
            <p className="sub-heading">{t('landing.portals_v2.subtitle')}</p>
          </header>

          <div className="portals-grid">
            {/* Authority Portal */}
            <article className="portal-neu-card">
              <div className="portal-card-top">
                <span className="portal-badge portal-badge-authority">
                  {t('landing.portals_v2.authority_tag')}
                </span>
                <h3>{t('landing.portals_v2.authority_title')}</h3>
                <p>{t('landing.portals_v2.authority_desc')}</p>
                <ul className="portal-feature-list">
                  <li className="portal-feature-item">
                    <span className="portal-item-bullet portal-bullet-authority" aria-hidden="true"></span>
                    <span>{t('landing.portals_v2.authority_f1')}</span>
                  </li>
                  <li className="portal-feature-item">
                    <span className="portal-item-bullet portal-bullet-authority" aria-hidden="true"></span>
                    <span>{t('landing.portals_v2.authority_f2')}</span>
                  </li>
                  <li className="portal-feature-item">
                    <span className="portal-item-bullet portal-bullet-authority" aria-hidden="true"></span>
                    <span>{t('landing.portals_v2.authority_f3')}</span>
                  </li>
                </ul>
              </div>
            </article>

            {/* Operator Portal */}
            <article className="portal-neu-card">
              <div className="portal-card-top">
                <span className="portal-badge portal-badge-operator">
                  {t('landing.portals_v2.operator_tag')}
                </span>
                <h3>{t('landing.portals_v2.operator_title')}</h3>
                <p>{t('landing.portals_v2.operator_desc')}</p>
                <ul className="portal-feature-list">
                  <li className="portal-feature-item">
                    <span className="portal-item-bullet portal-bullet-operator" aria-hidden="true"></span>
                    <span>{t('landing.portals_v2.operator_f1')}</span>
                  </li>
                  <li className="portal-feature-item">
                    <span className="portal-item-bullet portal-bullet-operator" aria-hidden="true"></span>
                    <span>{t('landing.portals_v2.operator_f2')}</span>
                  </li>
                  <li className="portal-feature-item">
                    <span className="portal-item-bullet portal-bullet-operator" aria-hidden="true"></span>
                    <span>{t('landing.portals_v2.operator_f3')}</span>
                  </li>
                </ul>
              </div>
            </article>

            {/* Central Admin Portal */}
            <article className="portal-neu-card">
              <div className="portal-card-top">
                <span className="portal-badge portal-badge-central">
                  {t('landing.portals_v2.central_tag')}
                </span>
                <h3>{t('landing.portals_v2.central_title')}</h3>
                <p>{t('landing.portals_v2.central_desc')}</p>
                <ul className="portal-feature-list">
                  <li className="portal-feature-item">
                    <span className="portal-item-bullet portal-bullet-central" aria-hidden="true"></span>
                    <span>{t('landing.portals_v2.central_f1')}</span>
                  </li>
                  <li className="portal-feature-item">
                    <span className="portal-item-bullet portal-bullet-central" aria-hidden="true"></span>
                    <span>{t('landing.portals_v2.central_f2')}</span>
                  </li>
                  <li className="portal-feature-item">
                    <span className="portal-item-bullet portal-bullet-central" aria-hidden="true"></span>
                    <span>{t('landing.portals_v2.central_f3')}</span>
                  </li>
                </ul>
              </div>
              <div className="portal-role-note">
                {t('landing.portals_v2.central_note')}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 4 — أين يكمن الابتكار؟ (Neumorphic 4 Cards) */}
      <section id="innovation" className="innovation-hub">
        <div className="innovation-wrapper">
          <header className="innovation-intro">
            <span className="innovation-pill">{t('landing.innovation.badge')}</span>
            <h2 className="main-heading">{t('landing.innovation.heading')}</h2>
            <p className="sub-heading">{t('landing.innovation.subheading')}</p>
          </header>

          <div className="cards-grid">
            {/* Card 1 */}
            <article className="soft-card">
              <div className="icon-bubble" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="card-headline">{t('landing.innovation.c1_title')}</h3>
              <p className="card-summary">{t('landing.innovation.c1_desc')}</p>
              <div className="impact-block">
                <span className="impact-tag">{t('landing.innovation.benefit_lbl')}</span>
                <span className="impact-desc">{t('landing.innovation.c1_benefit')}</span>
              </div>
            </article>

            {/* Card 2 */}
            <article className="soft-card">
              <div className="icon-bubble" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V11a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V9.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" />
                  <path d="M8.5 13a4.5 4.5 0 0 0-4.5 4.5V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5A4.5 4.5 0 0 0 15.5 13" />
                </svg>
              </div>
              <h3 className="card-headline">{t('landing.innovation.c2_title')}</h3>
              <p className="card-summary">{t('landing.innovation.c2_desc')}</p>
              <div className="impact-block">
                <span className="impact-tag">{t('landing.innovation.benefit_lbl')}</span>
                <span className="impact-desc">{t('landing.innovation.c2_benefit')}</span>
              </div>
            </article>

            {/* Card 3 */}
            <article className="soft-card">
              <div className="icon-bubble" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <path d="M10 6.5h4M17.5 10v4" />
                </svg>
              </div>
              <h3 className="card-headline">{t('landing.innovation.c3_title')}</h3>
              <p className="card-summary">{t('landing.innovation.c3_desc')}</p>
              <div className="impact-block">
                <span className="impact-tag">{t('landing.innovation.benefit_lbl')}</span>
                <span className="impact-desc">{t('landing.innovation.c3_benefit')}</span>
              </div>
            </article>

            {/* Card 4 */}
            <article className="soft-card">
              <div className="icon-bubble" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3 className="card-headline">{t('landing.innovation.c4_title')}</h3>
              <p className="card-summary">{t('landing.innovation.c4_desc')}</p>
              <div className="impact-block">
                <span className="impact-tag">{t('landing.innovation.benefit_lbl')}</span>
                <span className="impact-desc">{t('landing.innovation.c4_benefit')}</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5 — رحلة الصفقة (5-Stage Neumorphic Timeline) */}
      <section className="lifecycle-section" id="journey">
        <div className="lifecycle-container">
          <header className="lifecycle-header">
            <span className="lifecycle-pill">{t('landing.journey_v2.badge')}</span>
            <h2 className="lifecycle-title">{t('landing.journey_v2.heading')}</h2>
            <p className="lifecycle-subtitle">{t('landing.journey_v2.subheading')}</p>
          </header>

          <div className="timeline-track">
            <div className="track-connector" aria-hidden="true"></div>

            {/* Stage 1 */}
            <article className="timeline-step">
              <div className="step-marker">
                <span className="step-num">1</span>
              </div>
              <div className="step-card">
                <div className="card-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <h3 className="step-heading">{t('landing.journey_v2.s1_title')}</h3>
                <p className="step-summary">{t('landing.journey_v2.s1_desc')}</p>
                <div className="step-role-box">
                  <span className="role-badge">{t('landing.journey_v2.role_lbl')}</span>
                  <span className="role-text">{t('landing.journey_v2.s1_role')}</span>
                </div>
              </div>
            </article>

            {/* Stage 2 */}
            <article className="timeline-step">
              <div className="step-marker">
                <span className="step-num">2</span>
              </div>
              <div className="step-card">
                <div className="card-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <h3 className="step-heading">{t('landing.journey_v2.s2_title')}</h3>
                <p className="step-summary">{t('landing.journey_v2.s2_desc')}</p>
                <div className="step-role-box">
                  <span className="role-badge">{t('landing.journey_v2.role_lbl')}</span>
                  <span className="role-text">{t('landing.journey_v2.s2_role')}</span>
                </div>
              </div>
            </article>

            {/* Stage 3 */}
            <article className="timeline-step">
              <div className="step-marker">
                <span className="step-num">3</span>
              </div>
              <div className="step-card">
                <div className="card-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
                <h3 className="step-heading">{t('landing.journey_v2.s3_title')}</h3>
                <p className="step-summary">{t('landing.journey_v2.s3_desc')}</p>
                <div className="step-role-box">
                  <span className="role-badge">{t('landing.journey_v2.role_lbl')}</span>
                  <span className="role-text">{t('landing.journey_v2.s3_role')}</span>
                </div>
              </div>
            </article>

            {/* Stage 4 */}
            <article className="timeline-step">
              <div className="step-marker">
                <span className="step-num">4</span>
              </div>
              <div className="step-card">
                <div className="card-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    <path d="M15 5l3 3" />
                  </svg>
                </div>
                <h3 className="step-heading">{t('landing.journey_v2.s4_title')}</h3>
                <p className="step-summary">{t('landing.journey_v2.s4_desc')}</p>
                <div className="step-role-box">
                  <span className="role-badge">{t('landing.journey_v2.role_lbl')}</span>
                  <span className="role-text">{t('landing.journey_v2.s4_role')}</span>
                </div>
              </div>
            </article>

            {/* Stage 5 */}
            <article className="timeline-step">
              <div className="step-marker">
                <span className="step-num">5</span>
              </div>
              <div className="step-card">
                <div className="card-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <circle cx="12" cy="14" r="3" />
                    <path d="M12 11v6" />
                  </svg>
                </div>
                <h3 className="step-heading">{t('landing.journey_v2.s5_title')}</h3>
                <p className="step-summary">{t('landing.journey_v2.s5_desc')}</p>
                <div className="step-role-box">
                  <span className="role-badge">{t('landing.journey_v2.role_lbl')}</span>
                  <span className="role-text">{t('landing.journey_v2.s5_role')}</span>
                </div>
              </div>
            </article>
          </div>

          <footer className="lifecycle-footer">
            <div className="results-banner">
              <span className="results-icon" aria-hidden="true">✓</span>
              <span className="results-text">{t('landing.journey_v2.results_bar')}</span>
            </div>
            <Link className="cta-neu-btn" href="/login">
              <span>{t('landing.journey_v2.cta_btn')}</span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="cta-arrow" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </Link>
          </footer>
        </div>
      </section>

      {/* 6 — الركائز القانونية (Neumorphic Legal Pillars) */}
      <section id="legal" className="legal-neu-section">
        <div className="legal-wrapper">
          <header className="innovation-intro">
            <span className="innovation-pill">{t('landing.legal_v2.badge')}</span>
            <h2 className="main-heading">{t('landing.legal_v2.title')}</h2>
            <p className="sub-heading">{t('landing.legal_v2.subtitle')}</p>
          </header>

          <div className="legal-grid">
            <article className="legal-neu-card">
              <div>
                <span className="legal-badge">{t('landing.legal_v2.tag')}</span>
                <h3>{t('landing.legal_v2.p1_title')}</h3>
                <p>{t('landing.legal_v2.p1_desc')}</p>
              </div>
              <span className="legal-ref-tag">{t('landing.legal_v2.pending_ref')}</span>
            </article>

            <article className="legal-neu-card">
              <div>
                <span className="legal-badge">{t('landing.legal_v2.tag')}</span>
                <h3>{t('landing.legal_v2.p2_title')}</h3>
                <p>{t('landing.legal_v2.p2_desc')}</p>
              </div>
              <span className="legal-ref-tag">{t('landing.legal_v2.pending_ref')}</span>
            </article>

            <article className="legal-neu-card">
              <div>
                <span className="legal-badge">{t('landing.legal_v2.tag')}</span>
                <h3>{t('landing.legal_v2.p3_title')}</h3>
                <p>{t('landing.legal_v2.p3_desc')}</p>
              </div>
              <span className="legal-ref-tag">{t('landing.legal_v2.pending_ref')}</span>
            </article>
          </div>

          <div className="legal-disclaimer-box">
            {t('landing.legal_v2.disclaimer')}
          </div>
        </div>
      </section>

      {/* 7 — CTA (Neumorphic Join Section) */}
      <section className="join-neu-section" id="join">
        <div className="join-wrapper">
          <div className="join-neu-card">
            <span className="join-badge">
              <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true"></span>
              <span>{t('landing.join_v2.badge')}</span>
            </span>
            <h2 className="join-title">{t('landing.join_v2.title')}</h2>
            <p className="join-desc">{t('landing.join_v2.subtitle')}</p>
            <Link className="join-cta-btn" href="/login">
              <span>{t('landing.join_v2.btn')}</span>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER (Neumorphic) */}
      <footer className="neu-footer">
        <div className="footer-divider" aria-hidden="true"></div>
        <div className="footer-grid">
          <div className="footer-col">
            <div className="neu-brand-pill mb-3">
              <span className="neu-brand-dot" aria-hidden="true"></span>
              <span className="font-extrabold text-slate-900 text-sm">{t('landing.brand')}</span>
            </div>
            <p className="max-w-[28ch] text-xs text-slate-500 leading-relaxed">{t('landing.footer_v2.sub')}</p>
          </div>
          <div className="footer-col">
            <h4>{t('landing.footer_v2.sections_head')}</h4>
            <div className="footer-col-links">
              <a href="#challenges">{t('landing.nav.challenges')}</a>
              <a href="#portals">{t('landing.nav.portals')}</a>
              <a href="#innovation">{t('landing.nav.innovation')}</a>
              <a href="#journey">{t('landing.nav.journey')}</a>
              <a href="#legal">{t('landing.nav.legal')}</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>{t('landing.footer_v2.login_head')}</h4>
            <div className="footer-col-links">
              <Link href="/login">{t('landing.join_v2.btn')}</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">{t('landing.footer_v2.rights')}</div>
      </footer>
    </div>
  );
}
