import { LegalLayout } from './LegalLayout';
import { useI18n } from '@/i18n';
import { ShieldCheck, Lock, AlertTriangle, Scale } from 'lucide-react';

export function TermsPage() {
  const { lang } = useI18n();
  const isFr = lang === 'fr';

  return (
    <LegalLayout
      title={isFr ? 'Conditions Générales d’Utilisation (CGU)' : 'شروط وأحكام استخدام المنصة'}
      kicker={isFr ? 'Cadre Réglementaire' : 'الإطار التنظيمي والتعاقدي'}
      subtitle={
        isFr
          ? 'Règles et conditions régissant l’accès et l’utilisation de la plateforme nationale « Safaqat Dhakia », conformément à la loi n° 23-12 relative aux marchés publics et à la loi 18-07 sur la protection des données.'
          : 'القواعد والضوابط المنظمة لاستخدام منصة «صفقات ذكية» للطلبيات والصفقات العمومية في الجمهورية الجزائرية الديمقراطية الشعبية، وفقاً لأحكام القانون رقم 23-12 وقانون حماية المعطيات رقم 18-07.'
      }
      icon={<Scale className="w-3.5 h-3.5" />}
    >
      <div className="space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
        {/* مقدمة قانونية */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-slate-700 flex gap-4 items-start">
          <ShieldCheck className="w-6 h-6 text-[#047857] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-[#0f3154]">
              {isFr ? 'Préambule et fondement légal' : 'ديباجة وسند قانوني'}
            </h3>
            <p>
              {isFr
                ? 'L’utilisation de la plateforme « Safaqat Dhakia » implique l’acceptation pleine et entière des présentes conditions. Tout acte posé sur la plateforme est réputé opposable devant les juridictions compétentes et les organes de contrôle financier et des marchés publics.'
                : 'يُعدّ تسجيل الدخول أو استخدام منصة «صفقات ذكية» إقراراً صريحاً بالاطلاع الكامل والالتزام غير المشروط بهذه الشروط والأحكام. وتخضع جميع المعاملات والإيداعات الرقمية لحجية الإثبات المقررة قانوناً بموجب التشريع الوطني الجزائري.'}
            </p>
          </div>
        </div>

        {/* المادة 1: التعريفات */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f3154] flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-lg bg-[#0f3154]/10 text-[#0f3154] text-xs font-black">
              01
            </span>
            {isFr ? 'Définitions et acteurs de la plateforme' : 'التعاريف والصفة القانونية للفاعلين'}
          </h2>
          <p>
            {isFr
              ? 'Au sens des présentes conditions, on entend par :'
              : 'في تطبيق أحكام هذه الشروط، يُقصد بالمصطلحات الآتية المعاني المبينة قرين كل منها:'}
          </p>
          <ul className="list-disc list-inside space-y-2 ps-2">
            <li>
              <strong className="text-[#0f3154]">{isFr ? 'La Plateforme :' : 'المنصة:'}</strong>{' '}
              {isFr
                ? 'Le système d’information national sécurisé « Safaqat Dhakia » dédié à la dématérialisation intégrale des marchés publics.'
                : 'المنظومة الرقمية الوطنية الموحدة «صفقات ذكية» المخصصة لأتمتة ورقمنة كافة محطات دورة حياة الصفقات العمومية.'}
            </li>
            <li>
              <strong className="text-[#0f3154]">{isFr ? 'L’Opérateur Économique :' : 'المتعامل الاقتصادي:'}</strong>{' '}
              {isFr
                ? 'Toute personne physique ou morale soumissionnaire ou candidate à la commande publique dûment immatriculée.'
                : 'كل شخص طبيعي أو معنوي مؤهل ومسجل قانوناً يترشح أو يودع عرضاً للمشاركة في طلب عمومي.'}
            </li>
            <li>
              <strong className="text-[#0f3154]">{isFr ? 'L’Autorité Contractante :' : 'المصلحة المتعاقدة:'}</strong>{' '}
              {isFr
                ? 'Les administrations publiques, institutions de l’État, collectivités locales et établissements publics à caractère administratif.'
                : 'الإدارات والمؤسسات العمومية والهيئات المحلية المخولة قانوناً بإبرام وتنفيذ الصفقات العمومية.'}
            </li>
            <li>
              <strong className="text-[#0f3154]">{isFr ? 'L’Administration Centrale :' : 'الإدارة المركزية (عين الصقر):'}</strong>{' '}
              {isFr
                ? 'L’autorité de contrôle stratégique et de supervision de conformité en temps réel.'
                : 'المستوى الرقابي السيادي المخول بالتدقيق والمتابعة المستمرة لمؤشرات الشفافية والامتثال القانوني.'}
            </li>
          </ul>
        </section>

        {/* المادة 2: الأهلية والتسجيل */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f3154] flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-lg bg-[#0f3154]/10 text-[#0f3154] text-xs font-black">
              02
            </span>
            {isFr ? 'Conditions d’éligibilité et authentification' : 'شروط الأهلية والتحقق من الهوية'}
          </h2>
          <p>
            {isFr
              ? 'L’inscription requiert la fourniture d’informations véridiques et de documents légaux à jour (Registre de commerce, Numéro d’Identification Fiscale NIF, etc.). L’usager est personnellement responsable de la confidentialité de ses identifiants et de toute action entreprise depuis son compte.'
              : 'يشترط لإنشاء وتفعيل الحساب تقديم بيانات رسمية صحيحة ومحدثة، تشمل رقم السجل التجاري ورقم التعريف الجبائي (NIF) والاعتمادات المهنية. ويتحمل صاحب الحساب المسؤولية الكاملة عن حفظ سرية بيانات الولوج وكلمات المرور وعن أي تصرف يجرى من خلال حسابه.'}
          </p>
        </section>

        {/* المادة 3: التشفير وحصانة الأظرفة */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f3154] flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-lg bg-[#0f3154]/10 text-[#0f3154] text-xs font-black">
              03
            </span>
            {isFr ? 'Chiffrement et inviolabilité des plis' : 'الختم التشفيري وحرمة الأظرفة'}
          </h2>
          <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-4 text-[#065f46] text-xs sm:text-sm flex gap-3">
            <Lock className="w-5 h-5 shrink-0 text-[#047857] mt-0.5" />
            <p>
              {isFr
                ? 'Les offres techniques et financières sont chiffrées de bout en bout (AES-256) dès leur soumission. Aucun tiers, y compris les administrateurs de la plateforme, ne peut accéder au contenu avant la séance officielle d’ouverture des plis.'
                : 'تُختم العروض التقنية والمالية وتُشفر فور إيداعها بخوارزميات تشفير غير قابلة للاختراق (AES-256). ويحظر النظام برمجياً فتح أو قراءة أي ملف قبل حلول الموعد الدقيق لجلسة فتح الأظرفة العلنية المنصوص عليها في الإعلان.'}
            </p>
          </div>
        </section>

        {/* المادة 4: حماية المعطيات الشخصية */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f3154] flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-lg bg-[#0f3154]/10 text-[#0f3154] text-xs font-black">
              04
            </span>
            {isFr ? 'Protection des données (Loi 18-07)' : 'حماية المعطيات ذات الطابع الشخصي (القانون 18-07)'}
          </h2>
          <p>
            {isFr
              ? 'Conformément à la loi n° 18-07, les données personnelles collectées font l’objet d’un traitement loyal et transparent, exclusivement destiné à l’instruction des marchés publics. Les données sont hébergées sur le territoire national souverain et ne sont cédées à aucun organisme étranger.'
              : 'تلتزم المنصة بتطبيق أعلى معايير الخصوصية طبقاً لأحكام القانون رقم 18-07 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي. تُحفظ وتُعالج البيانات داخل مراكز بيانات سيادية على التراب الوطني، ولا يجوز استغلالها إلا في إطار المهام الرقابية والتعاقدية المنصوص عليها قانوناً.'}
          </p>
        </section>

        {/* المادة 5: مكافحة التواطؤ والممارسات المحظورة */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f3154] flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-lg bg-[#0f3154]/10 text-[#0f3154] text-xs font-black">
              05
            </span>
            {isFr ? 'Prévention des ententes et intégrité' : 'مكافحة التواطؤ وضمان نزاهة المنافسة'}
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs sm:text-sm flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <p>
              {isFr
                ? 'Toute tentative de manipulation des offres, de fausse concurrence ou d’entente illicite est automatiquement tracée et signalée au Conseil National des Marchés Publics et aux instances judiciaires habilitées.'
                : 'يُحظر منعاً باتاً أي اتفاق مسبق، أو تقديم عروض صورية، أو تبادل للمعلومات السرية يرمي إلى التأثير على الأسعار أو تقييد المنافسة الحرة. ويرصد محرك التحليل الذكي بالمنصة أي شبهة تواطؤ ويُحيلها تلقائياً للتحقيق والرقابة.'}
            </p>
          </div>
        </section>

        {/* المادة 6: التعديلات والتحديثات */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#0f3154] flex items-center gap-2">
            <span className="flex items-center justify-center size-7 rounded-lg bg-[#0f3154]/10 text-[#0f3154] text-xs font-black">
              06
            </span>
            {isFr ? 'Modifications et opposabilité' : 'سريان الشروط والتحديثات المستمرة'}
          </h2>
          <p>
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
