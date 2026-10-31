import { useState } from 'react';
import { LegalLayout } from './LegalLayout';
import { useI18n } from '@/i18n';
import {
  HelpCircle,
  ChevronDown,
  Search,
  UserCheck,
  FileLock2,
  Tv,
  BrainCircuit,
  Scale,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  categoryFr: string;
  question: string;
  questionFr: string;
  answer: string;
  answerFr: string;
  icon: LucideIcon;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-register',
    category: 'الحسابات والتسجيل',
    categoryFr: 'Comptes & Inscription',
    icon: UserCheck,
    question: 'كيف يتم إنشاء حساب وتفعيله للمتعامل الاقتصادي أو المصلحة المتعاقدة؟',
    questionFr: 'Comment créer et valider un compte opérateur ou autorité contractante ?',
    answer:
      'يتم التسجيل إلكترونياً بالكامل عبر بوابة التسجيل المخصصة لكل طرف. يقوم المتعامل الاقتصادي بإدخال رقم السجل التجاري الإلكتروني ورقم التعريف الجبائي (NIF) ورفع الوثائق الثبوتية. يقوم النظام بالتحقق الآلي الفوري مع قواعد البيانات الوطنية، ويتم تفعيل الحساب وإصدار شهادة اعتماد رقمية تمكنه من المشاركة في كافة الصفقات المفتوحة.',
    answerFr:
      'L’inscription s’effectue entièrement en ligne via le portail dédié. L’opérateur saisit son registre de commerce électronique, son NIF et téléverse ses justificatifs. Le système procède à une vérification instantanée auprès des bases de données nationales pour activer le compte et émettre un certificat numérique d’habilitation.',
  },
  {
    id: 'faq-submission',
    category: 'إيداع وتشفير العروض',
    categoryFr: 'Dépôt & Chiffrement',
    icon: FileLock2,
    question: 'كيف يقوم المتعامل الاقتصادي بإيداع عرضه وتشفيره إلكترونياً؟',
    questionFr: 'Comment l’opérateur dépose-t-il et chiffre-t-il son offre en ligne ?',
    answer:
      'بعد تحميل دفتر الشروط، يقوم المتعامل بتحضير العرض التقني والعرض المالي ومذكرة الفعالية. عند الضغط على "إيداع العرض"، تقوم المنصة بتشفير الملفات محلياً قبل إرسالها باستخدام بروتوكول التشفير العسكري (AES-256) مع ختم زمني رقمي (Digital Timestamping). لا يمكن لأي مسؤول أو مصلحة متعاقدة فك التشفير أو الاطلاع على الأسعار قبل جلسة الفتح الرسمية.',
    answerFr:
      'Après avoir téléchargé le cahier des charges, l’opérateur prépare son offre technique et financière. Lors de la soumission, les fichiers sont chiffrés localement de bout en bout en AES-256 avec horodatage électronique certifié. Aucune autorité ne peut consulter les offres avant la séance officielle d’ouverture.',
  },
  {
    id: 'faq-opening',
    category: 'جلسات الفتح العلنية',
    categoryFr: 'Ouverture des plis',
    icon: Tv,
    question: 'كيف تتم جلسات فتح الأظرفة الرقمية العلنية وما الذي يراه المتعهدون؟',
    questionFr: 'Comment se déroule la séance publique d’ouverture des plis en direct ?',
    answer:
      'في اليوم والتوقيت المحددين قانوناً في إعلان المناقصة، تفتح لجنة فتح الأظرفة الجلسة رقمياً. يقوم النظام تلقائياً بفك تشفير العروض المسلمة في الآجال، وتظهر مباشرة للمتعاملين الحاضرين عن بُعد قائمة المتعهدين ومبالغ العروض المالية والخصومات ومحضر الجلسة اللحظي، مما يضمن أقصى درجات النزاهة وتكافؤ الفرص.',
    answerFr:
      'À l’heure exacte fixée dans l’avis d’appel d’offres, la commission ouvre la session numérique. Le système déchiffre automatiquement les plis reçus à temps, affichant en temps réel aux soumissionnaires connectés la liste des participants, les montants financiers et le procès-verbal instantané.',
  },
  {
    id: 'faq-evaluation',
    category: 'التقييم والذكاء الاصطناعي',
    categoryFr: 'Évaluation & IA',
    icon: BrainCircuit,
    question: 'كيف يساعد محرك الذكاء الاصطناعي في تدقيق العروض وكشف الأسعار غير المتوازنة؟',
    questionFr: 'Comment l’IA assiste-t-elle à l’évaluation et détecte-t-elle les prix anormaux ?',
    answer:
      'يعمل محرك الذكاء الاصطناعي السيادي كمساعد قانوني للجان التقييم؛ حيث يقوم بفرز ومقارنة العروض مع بنك الأسعار المرجعية الوطنية وكشف العروض المنخفضة بشكل غير طبيعي (Offres anormalement basses) أو المفرطة، بالإضافة إلى رصد أنماط التواطؤ بين المتعهدين، وتوليد تقرير استرشادي معلل وفق معايير القانون رقم 23-12.',
    answerFr:
      'Le moteur d’IA souverain assiste les commissions d’évaluation en comparant les devis avec les référentiels de prix nationaux. Il identifie automatiquement les offres anormalement basses ou excessives, signale les anomalies de concurrence et génère un rapport d’audit conforme aux dispositions de la loi 23-12.',
  },
  {
    id: 'faq-appeals',
    category: 'الطعون والتظلمات',
    categoryFr: 'Recours & Contestations',
    icon: Scale,
    question: 'ما هي مسارات وآجال تقديم الطعن في نتائج المنح المؤقت للصفقة؟',
    questionFr: 'Quels sont les délais et modalités pour introduire un recours en ligne ?',
    answer:
      'فور نشر إعلان المنح المؤقت، يُتاح للمتعهد غير المقبول تقديم طعن إلكتروني مسبب عبر بوابته خلال مهلة عشرة (10) أيام عمل المقررة قانوناً. تُحال وثائق الطعن مباشرة إلى لجنة الصفقات المختصة، وتُعلق إجراءات إبرام الصفقة آلياً إلى حين البت في الطعن وإشعار كافة الأطراف بالقرار النهائي.',
    answerFr:
      'Dès la publication de l’attribution provisoire, tout soumissionnaire évincé dispose du délai légal de dix (10) jours ouvrables pour introduire un recours motivé via son espace. La procédure suspend automatiquement la contractualisation jusqu’à décision notifiée de la commission des marchés.',
  },
];

export function FAQPage() {
  const { lang } = useI18n();
  const isFr = lang === 'fr';

  const [openId, setOpenId] = useState<string | null>('faq-register');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: isFr ? 'جميع الأسئلة' : 'جميع التساؤلات', labelFr: 'Toutes les questions' },
    { id: 'الحسابات والتسجيل', label: 'الحسابات والتسجيل', labelFr: 'Comptes & Inscription' },
    { id: 'إيداع وتشفير العروض', label: 'إيداع العروض', labelFr: 'Dépôt des offres' },
    { id: 'جلسات الفتح العلنية', label: 'جلسات الفتح', labelFr: 'Séances d’ouverture' },
    { id: 'التقييم والذكاء الاصطناعي', label: 'الذكاء الاصطناعي', labelFr: 'Évaluation & IA' },
    { id: 'الطعون والتظلمات', label: 'الطعون', labelFr: 'Recours' },
  ];

  const filteredItems = FAQ_DATA.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const textToSearch = isFr
      ? `${item.questionFr} ${item.answerFr} ${item.categoryFr}`.toLowerCase()
      : `${item.question} ${item.answer} ${item.category}`.toLowerCase();

    return matchesCategory && textToSearch.includes(query);
  });

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <LegalLayout
      title={isFr ? 'Foire Aux Questions (FAQ)' : 'الأسئلة الشائعة ومركز الإجابات'}
      kicker={isFr ? 'Assistance & Réponses' : 'مركز المساعدة والاستفسارات'}
      subtitle={
        isFr
          ? 'Retrouvez toutes les réponses claires et détaillées aux interrogations récurrentes des opérateurs économiques et des autorités contractantes sur le fonctionnement de Safaqat Dhakia.'
          : 'إجابات شاملة ومفصلة عن التساؤلات الأكثر تداولاً من طرف المتعاملين الاقتصاديين والمصالح المتعاقدة حول آليات عمل وضوابط منصة «صفقات ذكية».'
      }
      icon={<HelpCircle className="w-3.5 h-3.5" />}
    >
      <div className="space-y-8">
        {/* شريط البحث السريع */}
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isFr
                ? 'Rechercher une question, mot-clé (ex: chiffrement, recours, NIF)...'
                : 'ابحث في الأسئلة الشائعة (مثلاً: تشفير العروض، فتح الأظرفة، الطعون)...'
            }
            className="w-full ps-11 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#047857] focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* فلاتر التصنيفات */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#0f3154] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-[#0f3154]'
              }`}
            >
              {isFr ? cat.labelFr : cat.label}
            </button>
          ))}
        </div>

        {/* قائمة الأسئلة القابلة للطي (Accordion) */}
        <div className="space-y-3" role="region" aria-label="قائمة الأسئلة الشائعة">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm">
                {isFr
                  ? 'Aucune question ne correspond à votre recherche.'
                  : 'لم يتم العثور على أي سؤال يطابق بحثك.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 text-xs text-[#047857] font-bold hover:underline"
              >
                {isFr ? 'Réinitialiser les filtres' : 'إعادة ضبط الفلاتر'}
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isOpen = openId === item.id;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-[#047857]/40 bg-[#f8fafc] shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 text-start flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isOpen
                            ? 'bg-[#047857] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="size-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#047857] block mb-0.5">
                          {isFr ? item.categoryFr : item.category}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-[#0f3154] leading-snug">
                          {isFr ? item.questionFr : item.question}
                        </h3>
                      </div>
                    </div>

                    <div
                      className={`size-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen
                          ? 'rotate-180 bg-[#047857]/10 text-[#047857]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 mt-1">
                      <p>{isFr ? item.answerFr : item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* بطاقة مساعدة إضافية في الأسفل */}
        <div className="bg-gradient-to-r from-[#0f3154]/5 to-[#047857]/5 border border-slate-200/80 rounded-2xl p-6 text-center space-y-2 mt-8">
          <Sparkles className="w-5 h-5 text-[#047857] mx-auto" />
          <h4 className="font-bold text-[#0f3154] text-sm sm:text-base">
            {isFr ? 'Vous avez une question spécifique ?' : 'هل لديك استفسار إجرائي خاص؟'}
          </h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {isFr
              ? 'Consultez notre assistant juridique interactif (RAG) disponible 24/7 pour analyser vos documents et répondre selon le droit algérien.'
              : 'يمكنك استخدام المساعد القانوني الذكي (RAG) المتاح على مدار الساعة داخل بوابتك لتصفح النصوص التنظيمية والإجابة المباشرة على استفساراتك.'}
          </p>
        </div>
      </div>
    </LegalLayout>
  );
}

export default FAQPage;
