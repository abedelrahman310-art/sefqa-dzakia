import { LegalLayout } from './LegalLayout';
import { useI18n } from '@/i18n';
import { ShieldCheck, Lock, AlertTriangle, Scale } from 'lucide-react';

/**
 * TermsPage — وثيقة شروط الاستخدام بلغة النظام الموحّد V3:
 * ورقة بيضاء بحواف شعرية، ترقيم أزرق tint، وصندوقا استثناء
 * بارز علوي (أزرق للختم التشفيري، برتقالي #ffa666 لحظر التواطؤ).
 * النصوص كما هي حرفياً؛ التركيب والألوان فقط أعيدت صياغتها.
 */
export function TermsPage() {
  const { lang } = useI18n();
  const isFr = lang === 'fr';

  return (
    <LegalLayout
      title={isFr ? 'Conditions Générales d’Utilisation (CGU)' : 'شروط وأحكام استخدام المنصة'}
      kicker={isFr ? 'Cadre Réglementaire' : 'الإطار التنظيمي والتعاقدي'}
      subtitle={
        isFr
          ? 'Règles et conditions régissant l’accès et l’utilisation de la Plateforme Intelligente « Safaqat Dhakia », conformément à la loi n° 23-12 relative aux marchés publics et à la loi 18-07 sur la protection des données.'
          : 'القواعد والضوابط المنظمة لاستخدام منصة «صفقات ذكية» للطلبيات والصفقات العمومية في الجمهورية الجزائرية الديمقراطية الشعبية، وفقاً لأحكام القانون رقم 23-12 وقانون حماية المعطيات رقم 18-07.'
      }
      icon={<Scale className="w-3.5 h-3.5" />}
    >
      <div className="space-y-10 text-[#080808] leading-relaxed">
        {/* مقدمة قانونية */}
        <div className="bg-[#f0f0f0] border border-[#d8d8d8] rounded-[8px] p-5 flex gap-4 items-start">
          <div className="p-2 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5] shrink-0">
            <ShieldCheck className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#080808]">
              {isFr ? 'Préambule et fondement légal' : 'ديباجة وسند قانوني'}
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#080808]">
              {isFr
                ? 'L’utilisation de la plateforme « Safaqat Dhakia » implique l’acceptation pleine et entière des présentes conditions. Tout acte posé sur la plateforme est réputé opposable devant les juridictions compétentes et les organes de contrôle financier et des marchés publics.'
                : 'يُعدّ تسجيل الدخول أو استخدام منصة «صفقات ذكية» إقراراً صريحاً بالاطلاع الكامل والالتزام غير المشروط بهذه الشروط والأحكام. وتخضع جميع المعاملات والإيداعات الرقمية لحجية الإثبات المقررة قانوناً بموجب التشريع الوطني الجزائري.'}
            </p>
          </div>
        </div>

        {/* المادة 1: التعريفات */}
        <section className="space-y-3">
          <h2 className="text-[20px] sm:text-[24px] font-bold text-[#080808] tracking-tight flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5] text-[13px] font-bold font-mono shrink-0">
              01
            </span>
            {isFr ? 'Définitions et acteurs de la plateforme' : 'التعاريف والصفة القانونية للفاعلين'}
          </h2>
          <p className="text-[15px] sm:text-[16px]">
            {isFr
              ? 'Au sens des présentes conditions, on entend par :'
              : 'في تطبيق أحكام هذه الشروط، يُقصد بالمصطلحات الآتية المعاني المبينة قرين كل منها:'}
          </p>
          <ul className="list-disc list-inside space-y-2 ps-2 text-[15px] sm:text-[16px]">
            <li>
              <strong className="font-bold">{isFr ? 'La Plateforme :' : 'المنصة:'}</strong>{' '}
              {isFr
                ? 'La Plateforme Intelligente « Safaqat Dhakia » dédiée à la dématérialisation intégrale des marchés publics.'
                : 'المنصة الذكية الموحدة «صفقات ذكية» المخصصة لأتمتة ورقمنة كافة محطات دورة حياة الصفقات العمومية.'}
            </li>
            <li>
              <strong className="font-bold">{isFr ? 'L’Opérateur Économique :' : 'المتعامل الاقتصادي:'}</strong>{' '}
              {isFr
                ? 'Toute personne physique ou morale soumissionnaire ou candidate à la commande publique dûment immatriculée.'
                : 'كل شخص طبيعي أو معنوي مؤهل ومسجل قانوناً يترشح أو يودع عرضاً للمشاركة في طلب عمومي.'}
            </li>
            <li>
              <strong className="font-bold">{isFr ? 'L’Autorité Contractante :' : 'المصلحة المتعاقدة:'}</strong>{' '}
              {isFr
                ? 'Les administrations publiques, institutions de l’État, collectivités locales et établissements publics à caractère administratif.'
                : 'الإدارات والمؤسسات العمومية والهيئات المحلية المخولة قانوناً بإبرام وتنفيذ الصفقات العمومية.'}
            </li>
            <li>
              <strong className="font-bold">{isFr ? 'L’Administration Centrale :' : 'الإدارة المركزية للرقابة:'}</strong>{' '}
              {isFr
                ? 'L’autorité de contrôle stratégique et de supervision de conformité en temps réel.'
                : 'المستوى الرقابي السيادي المخول بالتدقيق والمتابعة المستمرة لمؤشرات الشفافية والامتثال القانوني.'}
            </li>
          </ul>
        </section>

        {/* المادة 2: الأهلية والتسجيل */}
        <section className="space-y-3">
          <h2 className="text-[20px] sm:text-[24px] font-bold text-[#080808] tracking-tight flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5] text-[13px] font-bold font-mono shrink-0">
              02
            </span>
            {isFr ? 'Conditions d’éligibilité et authentification' : 'شروط الأهلية والتحقق من الهوية'}
          </h2>
          <p className="text-[15px] sm:text-[16px]">
            {isFr
              ? 'L’inscription requiert la fourniture d’informations véridiques et de documents légaux à jour (Registre de commerce, Numéro d’Identification Fiscale NIF, etc.). L’usager est personnellement responsable de la confidentialité de ses identifiants et de toute action entreprise depuis son compte.'
              : 'يشترط لإنشاء وتفعيل الحساب تقديم بيانات رسمية صحيحة ومحدثة، تشمل رقم السجل التجاري ورقم التعريف الجبائي (NIF) والاعتمادات المهنية. ويتحمل صاحب الحساب المسؤولية الكاملة عن حفظ سرية بيانات الولوج وكلمات المرور وعن أي تصرف يجرى من خلال حسابه.'}
          </p>
        </section>

        {/* المادة 3: التشفير وحصانة الأظرفة */}
        <section className="space-y-3">
          <h2 className="text-[20px] sm:text-[24px] font-bold text-[#080808] tracking-tight flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5] text-[13px] font-bold font-mono shrink-0">
              03
            </span>
            {isFr ? 'Chiffrement et inviolabilité des plis' : 'الختم التشفيري وحرمة الأظرفة'}
          </h2>
          <div className="border border-[#d8d8d8] border-t-4 border-t-[#146ef5] rounded-[6px] bg-white p-4 flex gap-3 items-start">
            <Lock className="size-5 shrink-0 text-[#146ef5] mt-0.5" />
            <p className="text-[14px] sm:text-[15px]">
              {isFr
                ? 'Les offres techniques et financières sont chiffrées de bout en bout (AES-256) dès leur soumission. Aucun tiers, y compris les administrateurs de la plateforme, ne peut accéder au contenu avant la séance officielle d’ouverture des plis.'
                : 'تُختم العروض التقنية والمالية وتُشفر فور إيداعها بخوارزميات تشفير غير قابلة للاختراق (AES-256). ويحظر النظام برمجياً فتح أو قراءة أي ملف قبل حلول الموعد الدقيق لجلسة فتح الأظرفة العلنية المنصوص عليها في الإعلان.'}
            </p>
          </div>
        </section>

        {/* المادة 4: حماية المعطيات الشخصية */}
        <section className="space-y-3">
          <h2 className="text-[20px] sm:text-[24px] font-bold text-[#080808] tracking-tight flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5] text-[13px] font-bold font-mono shrink-0">
              04
            </span>
            {isFr ? 'Protection des données (Loi 18-07)' : 'حماية المعطيات ذات الطابع الشخصي (القانون 18-07)'}
          </h2>
          <p className="text-[15px] sm:text-[16px]">
            {isFr
              ? 'Conformément à la loi n° 18-07, les données personnelles collectées font l’objet d’un traitement loyal et transparent, exclusivement destiné à l’instruction des marchés publics. Les données sont hébergées sur le territoire national souverain et ne sont cédées à aucun organisme étranger.'
              : 'تلتزم المنصة بتطبيق أعلى معايير الخصوصية طبقاً لأحكام القانون رقم 18-07 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي. تُحفظ وتُعالج البيانات داخل مراكز بيانات سيادية على التراب الوطني، ولا يجوز استغلالها إلا في إطار المهام الرقابية والتعاقدية المنصوص عليها قانوناً.'}
          </p>
        </section>

        {/* المادة 5: مكافحة التواطؤ والممارسات المحظورة */}
        <section className="space-y-3">
          <h2 className="text-[20px] sm:text-[24px] font-bold text-[#080808] tracking-tight flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5] text-[13px] font-bold font-mono shrink-0">
              05
            </span>
            {isFr ? 'Prévention des ententes et intégrité' : 'مكافحة التواطؤ وضمان نزاهة المنافسة'}
          </h2>
          <div className="border border-[#d8d8d8] border-t-4 border-t-[#ffa666] rounded-[6px] bg-white p-4 flex gap-3 items-start">
            <AlertTriangle className="size-5 shrink-0 text-[#c2410c] mt-0.5" />
            <p className="text-[14px] sm:text-[15px]">
              {isFr
                ? 'Toute tentative de manipulation des offres, de fausse concurrence ou d’entente illicite est automatiquement tracée et signalée au Conseil National des Marchés Publics et aux instances judiciaires habilitées.'
                : 'يُحظر منعاً باتاً أي اتفاق مسبق، أو تقديم عروض صورية، أو تبادل للمعلومات السرية يرمي إلى التأثير على الأسعار أو تقييد المنافسة الحرة. ويرصد محرك التحليل الذكي بالمنصة أي شبهة تواطؤ ويُحيلها تلقائياً للتحقيق والرقابة.'}
            </p>
          </div>
        </section>

        {/* المادة 6: التعديلات والتحديثات */}
        <section className="space-y-3">
          <h2 className="text-[20px] sm:text-[24px] font-bold text-[#080808] tracking-tight flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5] text-[13px] font-bold font-mono shrink-0">
              06
            </span>
            {isFr ? 'Modifications et opposabilité' : 'سريان الشروط والتحديثات المستمرة'}
          </h2>
          <p className="text-[15px] sm:text-[16px]">
            {isFr
              ? 'L’administration de la plateforme se réserve le droit de mettre à jour les présentes conditions pour les adapter aux évolutions législatives ou aux impératifs de cybersécurité nationale. Les usagers en seront notifiés via leur espace dédié.'
              : 'تحتفظ إدارة المنصة بالحق في تعديل أو تحيين هذه الشروط كلما اقتضت ذلك التعديلات التشريعية أو متطلبات الأمن السيبراني السيادي، وتُصبح نافذة فور نشرها على المنصة وإشعار المستخدمين عبر حساباتهم.'}
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

export default TermsPage;
