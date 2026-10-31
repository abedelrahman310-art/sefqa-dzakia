import { LegalLayout } from './LegalLayout';
import { useI18n } from '@/i18n';
import {
  Accessibility,
  Eye,
  Keyboard,
  Volume2,
  CheckCircle2,
  Languages,
  Mail,
  Sparkles,
} from 'lucide-react';

export function AccessibilityPage() {
  const { lang } = useI18n();
  const isFr = lang === 'fr';

  return (
    <LegalLayout
      title={isFr ? 'Déclaration d’Accessibilité Numérique' : 'بيان التزام إمكانية الوصول والشمول الرقمي'}
      kicker={isFr ? 'Inclusion pour tous' : 'الشمول الرقمي وتكافؤ الفرص'}
      subtitle={
        isFr
          ? 'Engagements et mesures techniques garantissant l’égal accès aux marchés publics algériens pour l’ensemble des citoyens et opérateurs, indépendamment de leurs capacités ou équipements.'
          : 'التزام منصة «صفقات ذكية» بتوفير تجربة استخدام رقمية عادلة ومتكافئة تضمن سهولة الوصول لجميع المواطنين والمتعاملين بمختلف قدراتهم، وفقاً للمعايير العالمية للشمول الرقمي (WCAG 2.1 AA).'
      }
      icon={<Accessibility className="w-3.5 h-3.5" />}
    >
      <div className="space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
        {/* بيان المبدأ */}
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-5 text-[#065f46] flex gap-4 items-start">
          <CheckCircle2 className="w-6 h-6 text-[#047857] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-[#0f3154]">
              {isFr ? 'Principes directeurs du service public' : 'مبدأ المساواة في المرفق العام الرقمي'}
            </h3>
            <p>
              {isFr
                ? 'L’accessibilité numérique est un droit fondamental et une exigence républicaine. La commande publique doit être transparente, accessible et compréhensible sans aucune barrière technique ou visuelle.'
                : 'يُعدّ النفاذ الميسر إلى الصفقات والطلبيات العمومية حقاً دستورياً أصيلاً يكرس مبدأ المساواة وتكافؤ الفرص وحرية الوصول إلى الطلب العمومي المنصوص عليه في القانون رقم 23-12.'}
            </p>
          </div>
        </div>

        {/* الميزات والمعايير المطبقة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. قارئات الشاشة */}
          <div className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-2 hover:border-[#047857]/50 transition-colors">
            <div className="size-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-1">
              <Volume2 className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-[#0f3154] text-base">
              {isFr ? 'Compatibilité lecteurs d’écran' : 'دعم قارئات الشاشة (Screen Readers)'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {isFr
                ? 'Balisage sémantique HTML5 rigoureux, attributs ARIA complets et textes alternatifs pour toutes les données tabulaires et graphiques.'
                : 'تعتمد المنصة هيكلية دلالية متكاملة (HTML5 Semantic) وتوفر وسوم ARIA الدقيقة والنصوص البديلة لكافة الجداول والرسومات البيانية لتسهيل قراءتها عبر برامج NVDA و JAWS و VoiceOver.'}
            </p>
          </div>

          {/* 2. التباين اللوني والخطوط */}
          <div className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-2 hover:border-[#047857]/50 transition-colors">
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
              <Eye className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-[#0f3154] text-base">
              {isFr ? 'Contraste élevé et typographie claire' : 'التباين البصري والوضوح الطباعي'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {isFr
                ? 'Respect strict d’un ratio de contraste supérieur à 4.5:1 (WCAG AA), typographie Cairo optimisée pour une lisibilité fluide en arabe et en français.'
                : 'تطبيق نسب تباين لوني فائقة (أكثر من 4.5:1 للنصوص العادية و 7:1 للعناوين الرئيسية) باستخدام ألوان الحبر السيادي، مع خط Cairo المعياري لضمان وضوح الأحرف وتشكيلها في جميع الشاشات.'}
            </p>
          </div>

          {/* 3. التنقل عبر لوحة المفاتيح */}
          <div className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-2 hover:border-[#047857]/50 transition-colors">
            <div className="size-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-1">
              <Keyboard className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-[#0f3154] text-base">
              {isFr ? 'Navigation complète au clavier' : 'التنقل الشامل عبر لوحة المفاتيح'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {isFr
                ? 'Possibilité de parcourir l’ensemble des formulaires et des démarches sans souris avec des indicateurs de focus nettement visibles.'
                : 'إمكانية إنجاز كامل الإجراءات وإيداع العروض وتصفح الصفقات باستخدام مفتاح Tab والأسهم دون الحاجة للفأرة، مع مؤشرات تركيز بصرية بارزة (Focus Visible Rings).'}
            </p>
          </div>

          {/* 4. ثنائية اللغة والاتجاهين */}
          <div className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-2 hover:border-[#047857]/50 transition-colors">
            <div className="size-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-1">
              <Languages className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-[#0f3154] text-base">
              {isFr ? 'Support bilingue dynamique (RTL/LTR)' : 'دعم أصيل للغتين والاتجاهين (RTL / LTR)'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {isFr
                ? 'Inversion naturelle de l’orientation de l’interface et adaptation typographique instantanée lors du passage du français à l’arabe.'
                : 'تصميم عربي أصيل ينطلق من اليمين إلى اليسار (RTL) بصورة طبيعية، مع التبديل السلس للغة الفرنسية (LTR) دون أي تداخل في العناصر أو كسر لتناسق الواجهات.'}
            </p>
          </div>
        </div>

        {/* معايير الامتثال التقني */}
        <section className="space-y-3 pt-4 border-t border-slate-200/60">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f3154]">
            {isFr ? 'Niveau de conformité aux standards internationaux' : 'مستوى الامتثال للمعايير الدولية'}
          </h2>
          <p>
            {isFr
              ? 'La plateforme Safaqat Dhakia est conçue en conformité avec les directives d’accessibilité aux contenus Web (WCAG 2.1) niveau AA émises par le W3C, ainsi qu’avec les référentiels nationaux de dématérialisation administrative.'
              : 'صُممت منصة صفقات ذكية طبقاً لدليل إمكانية الوصول إلى محتوى الويب (WCAG 2.1) بمستوى المطابقة (Level AA) المعتمد من اتحاد شبكة الويب العالمية (W3C)، فضلاً عن المعايير التقنية الوطنية الجزائرية للإدارة الإلكترونية.'}
          </p>
        </section>

        {/* المساعدة والإبلاغ عن عوائق */}
        <section className="space-y-4 pt-4 border-t border-slate-200/60">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f3154] flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#047857]" />
            {isFr ? 'Signalement d’une difficulté d’accès' : 'المساعدة والإبلاغ عن صعوبات الوصول'}
          </h2>
          <p>
            {isFr
              ? 'Si vous rencontrez le moindre obstacle pour consulter un avis d’appel d’offres, déposer une offre ou lire un document certifié, nos équipes techniques dédiées à l’accessibilité sont à votre disposition pour vous assister immédiatement :'
              : 'إذا واجهت أي صعوبة أو عائق تقني يمنعك من الوصول إلى تفاصيل صفقة، تحميل دفتر الشروط، أو استخدام أي من أدوات المنصة، يرجى إبلاغ فريق الإتاحة والشمول الرقمي فوراً عبر القنوات الآتية:'}
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 block mb-0.5">
                {isFr ? 'Courriel dédié à l’accessibilité :' : 'البريد الإلكتروني المخصص لإمكانية الوصول:'}
              </span>
              <span className="font-mono text-sm font-bold text-[#0f3154]">
                accessibility@safaqat-dz.ai
              </span>
            </div>
            <a
              href="mailto:accessibility@safaqat-dz.ai?subject=Signaler%20une%20difficult%C3%A9%20d'acc%C3%A8s%20-%20Safaqat%20Dhakia"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#047857] hover:bg-[#035e44] text-white shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFr ? 'Contacter l’assistance' : 'مراسلة فريق الدعم'}</span>
            </a>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}

export default AccessibilityPage;
