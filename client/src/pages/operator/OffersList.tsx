import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Eye,
  Save,
  RefreshCw,
  Paperclip,
  Trash2,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  ChevronDown,
  Info,
  Plus,
} from 'lucide-react';

interface DealOption {
  id: string;
  reference_number: string;
  title: string;
  authority_name?: string;
  estimated_budget?: string | number;
  submission_deadline?: string;
  current_stage?: number;
}

interface OfferItem {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  authorityName: string;
  technicalProposal: string;
  financialOffer: string;
  deliveryTimeDays: string | null;
  hasDocument: boolean;
  status: 'draft' | 'submitted';
  submittedAt: string | null;
  updatedAt: string;
}

interface DocMeta {
  status: 'ok' | 'todo' | 'nc';
  fileName?: string;
  fileSize?: string;
  updatedAt?: string;
  notes?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  assignedEnvelope: 'candidacy' | 'technical' | 'financial';
}

const DEFAULT_DOC_GROUPS = [
  {
    id: 'g1',
    key: 'candidacy',
    title: 'ملف الترشح',
    description: 'الوثائق القانونية والإدارية لإثبات الأهلية والنزاهة والتصنيف',
    legalNotice: 'وفق المادة 67 من المرسوم الرئاسي رقم 15-247',
    items: [
      { id: 'a1', title: 'التصريح بالترشح', legalRef: 'المادة 67 من المرسوم 15-247 (الملحق 01)' },
      { id: 'a2', title: 'التصريح بالنزاهة', legalRef: 'المادة 67 من المرسوم 15-247 (الملحق 02)' },
      { id: 'a3', title: 'القانون الأساسي للشركة وقيد التأسيس', legalRef: 'مستخرج إشهار عقد التأسيس في النشرة الرسمية' },
      { id: 'a4', title: 'مستخرج السجل التجاري الإلكتروني', legalRef: 'سجل تجاري ساري المفعول مع رمز النشاط المطابق' },
      { id: 'a5', title: 'شهادات الوضعية الجبائية وشبه الجبائية', legalRef: 'مستخرج الضرائب وكشوف CNAS / CASNOS المبرأة' },
    ],
  },
  {
    id: 'g2',
    key: 'technical',
    title: 'العرض التقني',
    description: 'المواصفات الفنية، المنهجية، والوسائل البشرية والمادية المسخرة',
    legalNotice: 'وفق المواد 67 و 70 من المرسوم الرئاسي رقم 15-247',
    items: [
      { id: 'b1', title: 'التصريح بالاكتتاب', legalRef: 'المادة 67 من المرسوم 15-247 (الملحق 03)' },
      { id: 'b2', title: 'المذكرة التقنية التبريرية وخطة التنفيذ', legalRef: 'المخطط الزمني، الكوادر التقنية، وقائمة العتاد' },
      { id: 'b3', title: 'دفتر الشروط ممضى بعبارة «قرئ وقبل»', legalRef: 'تأشيرة ممثل المتعهد على كافة بنود وملاحق الدفتر' },
      { id: 'b4', title: 'كفالة التعهد البنكية (عند الاقتضاء)', legalRef: 'صادرة عن بنك معتمد بنسبة 1% من القيمة التقديرية' },
    ],
  },
  {
    id: 'g3',
    key: 'financial',
    title: 'العرض المالي',
    description: 'رسالة التعهد المالي، جدول الأسعار بالوحدة، والتفصيل التقديري',
    legalNotice: 'وفق المواد 67 و 72 من المرسوم الرئاسي رقم 15-247',
    items: [
      { id: 'c1', title: 'رسالة التعهد المالي', legalRef: 'المادة 67 من المرسوم 15-247 (الملحق 04)' },
      { id: 'c2', title: 'جدول الأسعار بالوحدة (BPU)', legalRef: 'مملوء بالأرقام والأحرف دون شطب ومؤشر قانوناً' },
      { id: 'c3', title: 'التفصيل الكمي والتقديري (DQE)', legalRef: 'الحساب الإجمالي المتطابق مع جدول الأسعار الأحادية' },
    ],
  },
];

const INITIAL_DOC_STATUSES: Record<string, DocMeta> = {
  a1: { status: 'ok', fileName: 'tasrih_tarachoh_signe.pdf', fileSize: '420 KB', updatedAt: '2026-10-18' },
  a2: { status: 'ok', fileName: 'tasrih_nazaha_certifie.pdf', fileSize: '310 KB', updatedAt: '2026-10-18' },
  a3: { status: 'ok', fileName: 'statuts_sarl_algerie.pdf', fileSize: '1.2 MB', updatedAt: '2026-10-19' },
  a4: { status: 'ok', fileName: 'registre_commerce_electronique.pdf', fileSize: '850 KB', updatedAt: '2026-10-19' },
  a5: { status: 'todo', fileName: 'extrait_roles_impots_cnas.pdf', fileSize: '540 KB', updatedAt: '2026-10-20' },
  b1: { status: 'ok', fileName: 'tasrih_iktitab_signe.pdf', fileSize: '390 KB', updatedAt: '2026-10-19' },
  b2: { status: 'todo', fileName: 'memoire_technique_chantier.docx', fileSize: '2.8 MB', updatedAt: '2026-10-20' },
  b3: { status: 'ok', fileName: 'cahier_charges_lu_et_accepte.pdf', fileSize: '4.1 MB', updatedAt: '2026-10-20' },
  b4: { status: 'nc' },
  c1: { status: 'todo' },
  c2: { status: 'todo' },
  c3: { status: 'todo' },
};

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'm1', name: 'أحمد بن علي', role: 'مدير الشؤون القانونية', email: 'ahmed.b@safaqat-demo.dz', assignedEnvelope: 'candidacy' },
  { id: 'm2', name: 'المهندس كريم مسعودي', role: 'رئيس قسم الدراسات والمشاريع', email: 'karim.m@safaqat-demo.dz', assignedEnvelope: 'technical' },
  { id: 'm3', name: 'سارة بوحفص', role: 'المسؤولة المالية والمحاسبة', email: 'sara.b@safaqat-demo.dz', assignedEnvelope: 'financial' },
];

export function OffersList() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  // Data states
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Selected Deal
  const [selectedDealId, setSelectedDealId] = useState<string>('');

  // Active Tab
  const [tab, setTab] = useState<'list' | 'report' | 'team'>('list');

  // Document statuses per deal
  const [docsState, setDocsState] = useState<Record<string, DocMeta>>(INITIAL_DOC_STATUSES);

  // Save states (strictly no premature "saved" or timestamp)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Hidden upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetDocId, setUploadTargetDocId] = useState<string | null>(null);

  // Preview dialog state
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    title: string;
    groupTitle: string;
    status: 'ok' | 'todo' | 'nc';
    legalRef?: string;
    fileName?: string;
    fileSize?: string;
    updatedAt?: string;
  } | null>(null);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_TEAM_MEMBERS);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberEnvelope, setNewMemberEnvelope] = useState<'candidacy' | 'technical' | 'financial'>('candidacy');

  // Load initial deals & offers from real APIs
  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [dealsRes, offersRes] = await Promise.allSettled([
        api.get('/procurements/deals/'),
        api.get('/bids/offers/'),
      ]);

      let availableDeals: DealOption[] = [];
      if (dealsRes.status === 'fulfilled') {
        const dData = dealsRes.value.data;
        const rawDeals = Array.isArray(dData) ? dData : dData?.results || [];
        availableDeals = rawDeals.map((d: any) => ({
          id: String(d.id),
          reference_number: d.reference_number || `DZ-2026-${d.id.slice(0, 4)}`,
          title: d.title || 'صفقة عمومية',
          authority_name: d.authority_name || d.authority_entity || 'المصلحة المتعاقدة',
          estimated_budget: d.estimated_budget,
          submission_deadline: d.submission_deadline,
          current_stage: d.current_stage,
        }));
        setDeals(availableDeals);
      }

      if (offersRes.status === 'fulfilled') {
        const oData = offersRes.value.data;
        const rawOffers = Array.isArray(oData) ? oData : oData?.results || [];
        const mappedOffers: OfferItem[] = rawOffers.map((o: any) => ({
          id: String(o.id),
          opportunityId: String(o.deal || ''),
          opportunityTitle: o.deal_title || 'صفقة عمومية',
          authorityName: o.authority_name || 'المصلحة المتعاقدة',
          technicalProposal: typeof o.technical_offer === 'string' ? o.technical_offer : 'ملف العرض التقني مكتمل',
          financialOffer: typeof o.financial_offer === 'string'
            ? o.financial_offer
            : (o.financial_offer?.amount ? `${Number(o.financial_offer.amount).toLocaleString('ar-DZ')} دج` : 'عرض مالي مشفر'),
          deliveryTimeDays: o.technical_offer?.delivery_days ? String(o.technical_offer.delivery_days) : null,
          hasDocument: !!o.encrypted_hash,
          status: (o.status === 'submitted' ? 'submitted' : 'draft') as 'draft' | 'submitted',
          submittedAt: o.submitted_at || null,
          updatedAt: o.updated_at || o.created_at || new Date().toISOString(),
        }));
        setOffers(mappedOffers);

        // Auto-select deal if none selected
        if (!selectedDealId && availableDeals.length > 0) {
          const matchOffer = mappedOffers.find((o) => o.opportunityId);
          if (matchOffer) {
            setSelectedDealId(matchOffer.opportunityId);
          } else {
            setSelectedDealId(availableDeals[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error loading bid preparation data:', err);
      setFetchError('تعذر تحميل بيانات الصفقات والعروض. يرجى التحقق من الاتصال بالخادم والمحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selected deal changes, restore persisted document states from localStorage
  useEffect(() => {
    if (!selectedDealId) return;

    try {
      const storageKey = `safaqat_bid_prep_${selectedDealId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setDocsState(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved document state from localStorage:', e);
    }

    // Default state if not persisted yet
    setDocsState(INITIAL_DOC_STATUSES);
  }, [selectedDealId]);

  // Handle Save
  const handleSave = async () => {
    if (!selectedDealId) return;

    setSaveStatus('saving');
    try {
      // 1. Persist state to localStorage keyed by deal
      const storageKey = `safaqat_bid_prep_${selectedDealId}`;
      localStorage.setItem(storageKey, JSON.stringify(docsState));

      // 2. If there's an existing draft offer for this deal, sync with backend API
      const existingOffer = offers.find((o) => o.opportunityId === selectedDealId);
      if (existingOffer && existingOffer.status === 'draft') {
        try {
          await api.patch(`/bids/offers/${existingOffer.id}/`, {
            technical_offer: `تحديث مسودة العرض — ${okCount} من ${totalDocs} وثائق مكتملة`,
          });
        } catch (apiErr) {
          console.warn('Backend offer draft update sync note:', apiErr);
        }
      }

      // 3. Mark success and record timestamp only upon real completion
      const nowFormatted = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(nowFormatted);
      setSaveStatus('success');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 3500);
    } catch (err) {
      console.error('Error saving bid preparation:', err);
      setSaveStatus('error');
    }
  };

  // Status updates
  const setDocStatus = (docId: string, status: 'ok' | 'todo' | 'nc') => {
    setDocsState((prev) => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || {}),
        status,
        updatedAt: new Date().toISOString().split('T')[0],
      },
    }));
  };

  // Upload trigger
  const triggerUpload = (docId: string) => {
    setUploadTargetDocId(docId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetDocId) return;

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    setDocsState((prev) => ({
      ...prev,
      [uploadTargetDocId]: {
        ...(prev[uploadTargetDocId] || {}),
        status: 'ok',
        fileName: file.name,
        fileSize: formattedSize,
        updatedAt: new Date().toISOString().split('T')[0],
      },
    }));

    setUploadTargetDocId(null);
  };

  // File removal
  const handleRemoveFile = (docId: string) => {
    setDocsState((prev) => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || {}),
        status: 'nc',
        fileName: undefined,
        fileSize: undefined,
        updatedAt: new Date().toISOString().split('T')[0],
      },
    }));
  };

  // Preview trigger
  const handleOpenPreview = (item: { id: string; title: string; legalRef?: string }, groupTitle: string) => {
    const doc = docsState[item.id] || { status: 'nc' };
    setPreviewDoc({
      id: item.id,
      title: item.title,
      groupTitle,
      status: doc.status,
      legalRef: item.legalRef,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      updatedAt: doc.updatedAt,
    });
  };

  // Team member creation
  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: TeamMember = {
      id: `m_${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'عضو فريق الإعداد',
      email: newMemberEmail.trim() || 'operator.staff@safaqat-demo.dz',
      assignedEnvelope: newMemberEnvelope,
    };

    setTeamMembers((prev) => [...prev, newMember]);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberEmail('');
    setIsAddMemberOpen(false);
  };

  // Find active selected deal object and existing offer
  const activeDeal = deals.find((d) => d.id === selectedDealId);
  const activeOffer = offers.find((o) => o.opportunityId === selectedDealId);
  const isOfferSubmitted = activeOffer?.status === 'submitted';

  // Readiness Calculations
  const allDocItems = DEFAULT_DOC_GROUPS.flatMap((g) => g.items);
  const totalDocs = allDocItems.length; // 12
  const okCount = allDocItems.filter((it) => (docsState[it.id]?.status || 'todo') === 'ok').length;
  const todoCount = allDocItems.filter((it) => (docsState[it.id]?.status || 'todo') === 'todo').length;
  const ncCount = allDocItems.filter((it) => (docsState[it.id]?.status || 'todo') === 'nc').length;

  // Safe division without division by zero
  const readinessPercent = totalDocs > 0 ? Math.round((okCount / totalDocs) * 100) : 0;

  return (
    <div className="op-page">
      {/* Hidden File Input for Real Local Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
        accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg"
        aria-hidden="true"
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          1. رأس القسم (Header)
          ══════════════════════════════════════════════════════════════════════════ */}
      <header className="flex flex-col gap-4">
        <div className="op-page-head">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1>إدارة العروض</h1>
              {selectedDealId ? (
                <span className="op-chip gold">
                  <Building2 className="size-3.5" />
                  <span>صفقة نشطة</span>
                </span>
              ) : (
                <span className="op-chip gold">
                  <AlertCircle className="size-3.5" />
                  <span>في انتظار التحديد</span>
                </span>
              )}
              {isOfferSubmitted && (
                <span className="op-chip green">
                  <ShieldCheck className="size-3.5" />
                  <span>مودَع رسمياً (مقفَل)</span>
                </span>
              )}
            </div>
            <p>
              جهّز وثائق عرضك، تابع النواقص، ووزّع العمل على فريقك.
            </p>
          </div>

          {/* Deal Selector & Save Button */}
          <div className="flex flex-wrap items-end gap-3 self-start lg:self-auto">
            <div className="op-field min-w-[260px] max-w-full">
              <label htmlFor="deal-selector" className="text-xs font-bold text-[#8a6e1c]">
                الصفقة محل الإعداد
              </label>
              <div className="relative">
                <select
                  id="deal-selector"
                  value={selectedDealId}
                  onChange={(e) => setSelectedDealId(e.target.value)}
                  className="op-select w-full h-11 pe-9 ps-3 appearance-none cursor-pointer"
                >
                  <option value="">اختر صفقة لإعداد عرضك</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.reference_number} — {d.title.length > 38 ? `${d.title.slice(0, 38)}...` : d.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="size-4 text-[#5d6b7e] absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 self-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saveStatus === 'saving' || !selectedDealId}
                aria-label="حفظ التغييرات"
                style={saveStatus === 'error' ? { color: 'var(--op-red)', borderColor: '#f6c9ce' } : undefined}
                className={`op-btn ${
                  saveStatus === 'success'
                    ? 'op-btn-green'
                    : saveStatus === 'error'
                    ? 'op-btn-outline'
                    : 'op-btn-gold'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <RefreshCw className="size-4 animate-spin shrink-0" />
                    <span>جارٍ الحفظ...</span>
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="size-4 shrink-0 text-white" />
                    <span>تم الحفظ بنجاح</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle className="size-4 shrink-0 text-white" />
                    <span>فشل الحفظ — إعادة المحاولة</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4 shrink-0" />
                    <span>حفظ التغييرات</span>
                  </>
                )}
              </button>

              {/* Only shown AFTER successful server/local save response */}
              {lastSavedTime && saveStatus !== 'saving' && (
                <span className="op-hint">
                  آخر حفظ: {lastSavedTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Selected Deal Information Banner */}
        {activeDeal ? (
          <div className="bg-[#fffdf5] border border-[#f3efdf] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <span className="px-2.5 py-1 rounded-md bg-[#f3efdf] text-[#8a6e1c] font-mono font-bold text-xs">
                {activeDeal.reference_number}
              </span>
              <span className="font-bold text-[#3a4555] truncate max-w-[500px]">
                {activeDeal.title}
              </span>
              {activeDeal.authority_name && (
                <span className="text-[#5d6b7e] hidden sm:inline">
                  • {activeDeal.authority_name}
                </span>
              )}
            </div>
            {activeDeal.submission_deadline && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e63946] bg-[#fde8e9] px-2.5 py-1 rounded-md border border-[#f6c9ce]">
                <Calendar className="size-3.5" />
                <span>آخر أجل: {new Date(activeDeal.submission_deadline).toLocaleDateString('ar-DZ')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#fdf6df] border border-[#eedfb0] text-[#8a6e1c] rounded-xl p-3.5 flex items-center gap-2 text-xs md:text-sm font-semibold">
            <Info className="size-4 shrink-0" />
            <span>اختر صفقة لإعداد عرضك من القائمة أعلاه لبدء تنظيم وثائق العطاء وتوزيع المهام.</span>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════════
          2. مؤشرات الجاهزية واكتمال الوثائق (Readiness Indicators)
          ══════════════════════════════════════════════════════════════════════════ */}
      <section className="op-card p-4 md:p-6 flex flex-col gap-4" aria-label="مؤشرات اكتمال الوثائق">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f3efdf] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-[#fdf6df] text-[#8a6e1c] flex items-center justify-center shrink-0">
              <FileText className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-extrabold text-[#3a4555] m-0">اكتمال الوثائق</h2>
              <p className="text-xs text-[#5d6b7e] m-0">
                تُحسب نسبة الجاهزية بعدد الوثائق المكتملة ({okCount}) مقارنة بإجمالي الوثائق المطلوبة ({totalDocs}).
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 self-end sm:self-auto">
            <span className="text-3xl font-extrabold text-[#8a6e1c] leading-none">
              {readinessPercent}%
            </span>
            <span className="text-xs font-bold text-[#5d6b7e]">نسبة الجاهزية</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={readinessPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="نسبة اكتمال وثائق العرض"
          className="w-full h-3 bg-[#f3efdf] rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-[#8a6e1c] to-[#0ea968] transition-all duration-500 rounded-full"
            style={{ width: `${readinessPercent}%` }}
          />
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 1. Maktamila */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#ece7d6] shadow-2xs">
            <div className="size-10 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-[#3a4555] leading-tight">{okCount}</div>
              <div className="text-xs font-bold text-[#5d6b7e]">مكتملة</div>
            </div>
          </div>

          {/* 2. Qayd Al-Injaz */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#ece7d6] shadow-2xs">
            <div className="size-10 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-[#3a4555] leading-tight">{todoCount}</div>
              <div className="text-xs font-bold text-[#5d6b7e]">قيد الإنجاز</div>
            </div>
          </div>

          {/* 3. Naqisa */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#ece7d6] shadow-2xs">
            <div className="size-10 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 flex items-center justify-center shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-[#3a4555] leading-tight">{ncCount}</div>
              <div className="text-xs font-bold text-[#5d6b7e]">ناقصة</div>
            </div>
          </div>

          {/* 4. Total */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#ece7d6] shadow-2xs">
            <div className="size-10 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-[#3a4555] leading-tight">{totalDocs}</div>
              <div className="text-xs font-bold text-[#5d6b7e]">إجمالي الوثائق</div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="bg-[#fffdf5] border border-[#f3efdf] rounded-xl p-3 text-xs text-[#5d6b7e] flex items-start gap-2">
          <AlertTriangle className="size-4 text-[#c9a227] shrink-0 mt-0.5" />
          <p className="m-0 leading-relaxed">
            <strong className="text-[#3a4555]">تنبيه نظامي:</strong> اكتمال تجهيز الوثائق بنسبة 100% هو تنظيم داخلي ولا يعني قبول العرض أو إيداعه الرسمي في المنصة؛ يتطلب الإيداع تشفير العرض المالي والتقني وتقديمه قبل انقضاء الأجل القانوني وفقاً للمادة 70 من القانون 23-12.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          3. أشرطة التبويب (Tab Navigation)
          ══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pb-px">
        <div className="op-tabs" role="tablist" aria-label="أقسام إعداد العرض">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'list'}
            onClick={() => setTab('list')}
            className={`op-tab${tab === 'list' ? ' active' : ''}`}
          >
            قائمة الوثائق ({totalDocs})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'report'}
            onClick={() => setTab('report')}
            className={`op-tab${tab === 'report' ? ' active' : ''}`}
          >
            التحليل والتقرير
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'team'}
            onClick={() => setTab('team')}
            className={`op-tab${tab === 'team' ? ' active' : ''}`}
          >
            إدارة الفريق ({teamMembers.length})
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          4. محتوى التبويبات (Tab Contents)
          ══════════════════════════════════════════════════════════════════════════ */}

      {/* ─── تبويب 1: قائمة الوثائق (3 مجموعات على الشاشات الواسعة) ─── */}
      {tab === 'list' && (
        <div className="space-y-4">
          {!selectedDealId && (
            <div className="bg-[#fdf6df] border border-[#eedfb0] text-[#8a6e1c] rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Info className="size-5 shrink-0" />
                <span className="text-sm font-bold">يرجى اختيار صفقة من القائمة بالأعلى لحفظ وتخصيص وثائق العرض الخاصة بها.</span>
              </div>
              {deals.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white border-[#e2bf4b] text-[#8a6e1c] hover:bg-[#fdf6df] text-xs font-bold"
                  onClick={() => setSelectedDealId(deals[0].id)}
                >
                  اختيار أول صفقة متاحة
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {DEFAULT_DOC_GROUPS.map((group, groupIndex) => {
              const groupItems = group.items;
              const groupOk = groupItems.filter((it) => (docsState[it.id]?.status || 'todo') === 'ok').length;
              const groupPercent = groupItems.length > 0 ? Math.round((groupOk / groupItems.length) * 100) : 0;

              return (
                <section
                  key={group.id}
                  className="op-card flex flex-col"
                  aria-label={group.title}
                >
                  {/* Group Header */}
                  <div className="p-4 bg-[#fffdf5] border-b border-[#f3efdf] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-[#3a4555] m-0">
                        {group.title}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fdf6df] text-[#8a6e1c] border border-[#eedfb0]">
                        {groupOk} من {groupItems.length} مكتملة
                      </span>
                    </div>
                    <p className="text-xs text-[#5d6b7e] m-0 leading-relaxed">
                      {group.description}
                    </p>
                    <div className="w-full h-1.5 bg-[#f3efdf] rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-[#8a6e1c] transition-all duration-300 rounded-full"
                        style={{ width: `${groupPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Document Cards List */}
                  <div className="p-3 flex flex-col gap-3">
                    {groupItems.map((item, itemIndex) => {
                      const doc = docsState[item.id] || { status: 'todo' };
                      const itemNumber = `${groupIndex + 1}.${itemIndex + 1}`;
                      const isComplete = doc.status === 'ok';
                      const isTodo = doc.status === 'todo';
                      const isMissing = doc.status === 'nc';

                      return (
                        <article
                          key={item.id}
                          className="bg-white rounded-xl border border-[#f3efdf] hover:border-[#ece7d6] p-3.5 transition-all flex flex-col gap-2.5 shadow-2xs"
                        >
                          {/* Card Top: Ref, Title, and Single Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#f3efdf] text-[#8a6e1c] font-mono text-xs font-bold mt-0.5">
                                {itemNumber}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <h4 className="text-sm font-bold text-[#3a4555] m-0 leading-snug">
                                  {item.title}
                                </h4>
                                <span className="text-[11px] text-[#5d6b7e] leading-tight mt-0.5">
                                  {item.legalRef}
                                </span>
                              </div>
                            </div>

                            {/* Single State Badge (No duplicate 3 buttons) */}
                            <div className="shrink-0">
                              {isComplete && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="size-3.5" />
                                  <span>مكتمل</span>
                                </span>
                              )}
                              {isTodo && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  <Clock className="size-3.5" />
                                  <span>قيد الإنجاز</span>
                                </span>
                              )}
                              {isMissing && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                  <AlertCircle className="size-3.5" />
                                  <span>ناقص</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Uploaded File Info If Present */}
                          {doc.fileName && (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#fffdf5] border border-[#f3efdf] text-xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Paperclip className="size-3.5 text-[#8a6e1c] shrink-0" />
                                <span className="font-mono text-[#3a4555] font-semibold truncate max-w-[180px]">
                                  {doc.fileName}
                                </span>
                                {doc.fileSize && (
                                  <span className="text-[10px] text-[#98a4b3]">({doc.fileSize})</span>
                                )}
                              </div>
                              {doc.updatedAt && (
                                <span className="text-[10px] text-[#98a4b3] shrink-0">
                                  تحديث: {doc.updatedAt}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Card Actions Bar */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f3efdf]">
                            {/* Primary Action Button */}
                            <div className="flex items-center gap-2">
                              {isMissing ? (
                                <Button
                                  size="sm"
                                  onClick={() => triggerUpload(item.id)}
                                  disabled={isOfferSubmitted}
                                  className="h-8 px-3 rounded-lg bg-[#8a6e1c] hover:bg-[#3a4555] text-white text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#8a6e1c]"
                                >
                                  <Upload className="size-3.5 ml-1" />
                                  <span>رفع وثيقة</span>
                                </Button>
                              ) : isTodo ? (
                                <Button
                                  size="sm"
                                  onClick={() => triggerUpload(item.id)}
                                  disabled={isOfferSubmitted}
                                  className="h-8 px-3 rounded-lg bg-[#8a6e1c] hover:bg-[#3a4555] text-white text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#8a6e1c]"
                                >
                                  <Upload className="size-3.5 ml-1" />
                                  <span>استكمال الملف</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenPreview(item, group.title)}
                                  className="h-8 px-3 rounded-lg border-[#ece7d6] bg-white text-[#8a6e1c] hover:bg-[#fffdf5] text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#8a6e1c]"
                                >
                                  <Eye className="size-3.5 ml-1" />
                                  <span>استعراض</span>
                                </Button>
                              )}

                              {/* Replace file button if already uploaded and not submitted */}
                              {doc.fileName && !isOfferSubmitted && (
                                <button
                                  type="button"
                                  onClick={() => triggerUpload(item.id)}
                                  aria-label="استبدال الملف"
                                  className="text-xs text-[#5d6b7e] hover:text-[#3a4555] font-semibold underline cursor-pointer bg-transparent border-0 p-1"
                                >
                                  استبدال
                                </button>
                              )}
                            </div>

                            {/* Status Quick Changer Dropdown */}
                            <div className="flex items-center gap-1.5">
                              <label htmlFor={`status-select-${item.id}`} className="sr-only">
                                تعديل حالة {item.title}
                              </label>
                              <select
                                id={`status-select-${item.id}`}
                                value={doc.status}
                                disabled={isOfferSubmitted}
                                onChange={(e) => setDocStatus(item.id, e.target.value as 'ok' | 'todo' | 'nc')}
                                className="h-8 px-2 text-xs font-semibold rounded-lg border border-[#ece7d6] bg-white text-[#3a4555] hover:border-[#98a4b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e1c] cursor-pointer"
                              >
                                <option value="ok">مكتمل</option>
                                <option value="todo">قيد الإنجاز</option>
                                <option value="nc">ناقص</option>
                              </select>

                              {doc.fileName && !isOfferSubmitted && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(item.id)}
                                  title="حذف المرفق"
                                  aria-label="حذف المرفق"
                                  className="size-8 rounded-lg text-[#e63946] hover:bg-rose-50 flex items-center justify-center border-0 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Section Footer Legal Note */}
          <div className="p-4 rounded-xl bg-white border border-[#ece7d6] text-xs text-[#5d6b7e] flex items-center justify-between flex-wrap gap-2">
            <span>
              <strong>ملاحظة للمتعامل:</strong> إعداد الوثائق يتم حفظه محلياً ومزامنته مع خادم المنصة عند الضغط على زر «حفظ التغييرات».
            </span>
            <span className="font-mono text-[11px] text-[#8a6e1c]">
              المرسوم الرئاسي 15-247 · القانون 23-12
            </span>
          </div>
        </div>
      )}

      {/* ─── تبويب 2: التحليل والتقرير (Report Tab) ─── */}
      {tab === 'report' && (
        <div className="op-card p-6 flex flex-col gap-6">
          <div className="border-b border-[#f3efdf] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-[#3a4555] m-0">
                تقرير جاهزية ملف المشاركة
              </h3>
              <p className="text-sm text-[#5d6b7e] m-0 mt-0.5">
                تحليل تدقيق الوثائق المطلوبة وتحديد الثغرات الإدارية والفنية قبل الإيداع الرسمي.
              </p>
            </div>
            {activeDeal && (
              <div className="px-3 py-1.5 rounded-lg bg-[#fffdf5] border border-[#ece7d6] text-xs font-bold text-[#8a6e1c]">
                {activeDeal.reference_number}
              </div>
            )}
          </div>

          {/* Envelope Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_DOC_GROUPS.map((group) => {
              const groupOk = group.items.filter((it) => (docsState[it.id]?.status || 'todo') === 'ok').length;
              const groupTodo = group.items.filter((it) => (docsState[it.id]?.status || 'todo') === 'todo').length;
              const groupNc = group.items.filter((it) => (docsState[it.id]?.status || 'todo') === 'nc').length;
              const percent = Math.round((groupOk / group.items.length) * 100);

              return (
                <div key={group.id} className="p-4 rounded-xl border border-[#f3efdf] bg-[#fffdf5] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#3a4555] m-0">{group.title}</h4>
                    <span className="text-xs font-bold text-[#8a6e1c]">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#f3efdf] rounded-full overflow-hidden">
                    <div className="h-full bg-[#8a6e1c] rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5d6b7e] pt-1">
                    <span className="text-emerald-700 font-semibold">{groupOk} مكتمل</span>
                    <span className="text-amber-700 font-semibold">{groupTodo} قيد الإنجاز</span>
                    <span className="text-rose-700 font-semibold">{groupNc} ناقص</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Missing items checklist */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-extrabold text-[#3a4555] m-0 flex items-center gap-2">
              <AlertCircle className="size-4 text-[#e63946]" />
              <span>الوثائق الناقصة والتي تتطلب استكمالاً فورياً ({ncCount + todoCount})</span>
            </h4>

            {ncCount + todoCount === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="size-8 text-[#0ea968]" />
                <h5 className="font-bold text-base text-emerald-900 m-0">ملف العرض جاهز بنسبة 100%!</h5>
                <p className="text-xs text-emerald-800 m-0 max-w-md">
                  تم استكمال كافة وثائق ملف الترشح والعرضين التقني والمالي. يمكنك الآن التوجه إلى شاشة إيداع العرض لتشفير الملفات وتقديم العطاء رسمياً.
                </p>
                <Button
                  size="sm"
                  className="bg-[#0ea968] hover:bg-[#0b8a55] text-white text-xs font-bold mt-2"
                  onClick={() => setLocation('/operator/offers')}
                >
                  الاطلاع على تفاصيل العرض
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[#f3efdf] border border-[#f3efdf] rounded-xl overflow-hidden">
                {allDocItems
                  .filter((it) => (docsState[it.id]?.status || 'todo') !== 'ok')
                  .map((it) => {
                    const status = docsState[it.id]?.status || 'todo';
                    return (
                      <div key={it.id} className="p-3.5 bg-white flex items-center justify-between gap-3 text-xs md:text-sm">
                        <div className="flex items-center gap-2.5">
                          {status === 'nc' ? (
                            <span className="size-2 rounded-full bg-[#e63946]" />
                          ) : (
                            <span className="size-2 rounded-full bg-[#c9a227]" />
                          )}
                          <span className="font-bold text-[#3a4555]">{it.title}</span>
                          <span className="text-xs text-[#5d6b7e] hidden sm:inline">({it.legalRef})</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTab('list');
                            triggerUpload(it.id);
                          }}
                          className="h-7 px-2.5 rounded-lg text-xs font-bold text-[#8a6e1c] border-[#ece7d6]"
                        >
                          استكمال الآن
                        </Button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── تبويب 3: إدارة الفريق (Team Tab) ─── */}
      {tab === 'team' && (
        <div className="op-card p-6 flex flex-col gap-6">
          <div className="border-b border-[#f3efdf] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-[#3a4555] m-0">
                فريق تحضير وتدقيق العطاء
              </h3>
              <p className="text-sm text-[#5d6b7e] m-0 mt-0.5">
                توزيع مسؤولية جمع الوثائق ومراجعتها القانونية والمالية بين أعضاء المؤسسة.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddMemberOpen(true)}
              className="bg-[#8a6e1c] hover:bg-[#3a4555] text-white text-xs font-bold self-start sm:self-auto"
            >
              <Plus className="size-4 ml-1.5" />
              <span>إضافة عضو للفريق</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-xl border border-[#f3efdf] bg-[#fffdf5] flex flex-col gap-2.5 hover:border-[#ece7d6] transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-[#fdf6df] text-[#8a6e1c] font-bold flex items-center justify-center shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[#3a4555] m-0 truncate">{member.name}</h4>
                    <p className="text-xs text-[#5d6b7e] m-0 truncate">{member.role}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f3efdf] flex items-center justify-between text-xs">
                  <span className="text-[#98a4b3] font-mono truncate">{member.email}</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-white border border-[#ece7d6] text-[#8a6e1c]">
                    {member.assignedEnvelope === 'candidacy'
                      ? 'ملف الترشح'
                      : member.assignedEnvelope === 'technical'
                      ? 'العرض التقني'
                      : 'العرض المالي'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          5. قائمة العروض الفعلية الحية في المنصة (Live Offers Listing)
          ══════════════════════════════════════════════════════════════════════════ */}
      <section className="op-card p-6 flex flex-col gap-4">
        <div className="pb-3 border-b border-[#f3efdf] flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#3a4555] m-0">{t('offers.title')}</h3>
            <p className="text-xs text-[#5d6b7e] m-0 mt-0.5">
              العروض المسجلة والمودعة الخاصة بمؤسستك في بوابة الصفقات العمومية.
            </p>
          </div>
          <span className="text-xs font-bold text-[#8a6e1c] bg-[#fdf6df] px-2.5 py-1 rounded-full">
            {offers.length} عروض
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#5d6b7e] text-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="size-6 animate-spin text-[#8a6e1c]" />
            <span>جاري تحميل بيانات العروض...</span>
          </div>
        ) : fetchError ? (
          <div className="border border-rose-200 bg-rose-50 rounded-xl p-6 text-center space-y-3">
            <AlertCircle className="size-6 text-[#e63946] mx-auto" />
            <p className="text-sm font-bold text-rose-900 m-0">{fetchError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="text-xs font-bold border-rose-300 text-rose-900 hover:bg-rose-100"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : offers.length === 0 ? (
          <div className="border border-dashed border-[#ece7d6] rounded-xl p-8 text-center bg-[#fffdf5] space-y-3">
            <FileText className="size-8 text-[#98a4b3] mx-auto" />
            <p className="text-sm font-bold text-[#3a4555] m-0">{t('offers.empty')}</p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold text-[#8a6e1c] border-[#ece7d6]"
              onClick={() => setLocation('/operator/deals')}
            >
              {t('opps.title')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {offers.map((offer) => (
              <article
                key={offer.id}
                className="bg-white border border-[#f3efdf] rounded-xl p-4 shadow-2xs hover:border-[#ece7d6] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm md:text-base font-bold text-[#3a4555] m-0 truncate">
                      {offer.opportunityTitle}
                    </h4>
                    {offer.status === 'submitted' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3" />
                        <span>{t('offers.status.submitted')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                        <Clock className="size-3" />
                        <span>{t('offers.status.draft')}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#5d6b7e] flex-wrap">
                    <span className="font-semibold text-[#8a6e1c] bg-[#f3efdf] px-2 py-0.5 rounded-md text-[11px]">
                      {offer.authorityName}
                    </span>
                    <span>
                      <strong className="text-[#3a4555] font-semibold">{t('offers.field.financial')}:</strong>{' '}
                      <span className="font-mono text-[#3a4555]">{offer.financialOffer}</span>
                    </span>
                    {offer.deliveryTimeDays && (
                      <span>
                        ({offer.deliveryTimeDays} {t('offers.field.delivery')})
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#98a4b3] m-0">
                    {offer.status === 'submitted' && offer.submittedAt
                      ? `${t('offers.status.submitted')}: ${new Date(offer.submittedAt).toLocaleDateString('ar-DZ')}`
                      : `آخر تعديل: ${new Date(offer.updatedAt).toLocaleDateString('ar-DZ')}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Button
                    size="sm"
                    className={`text-xs font-bold px-4 py-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e1c] ${
                      offer.status === 'draft'
                        ? 'bg-[#8a6e1c] hover:bg-[#3a4555] text-white'
                        : 'border border-[#ece7d6] bg-white hover:bg-slate-50 text-[#3a4555]'
                    }`}
                    onClick={() => setLocation(`/operator/offers/${offer.id}`)}
                  >
                    {offer.status === 'draft' ? t('offers.edit') : t('offers.view')}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          6. نافذة استعراض الوثيقة (Preview Dialog)
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-md font-sans text-right" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-bold text-[#8a6e1c] bg-[#fdf6df] px-2.5 py-1 rounded-md w-fit mb-1">
              <span>{previewDoc?.groupTitle}</span>
            </div>
            <DialogTitle className="text-lg font-extrabold text-[#3a4555]">
              {previewDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5d6b7e] leading-relaxed">
              {previewDoc?.legalRef}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="p-3 rounded-xl bg-[#fffdf5] border border-[#f3efdf] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5d6b7e]">حالة الوثيقة:</span>
                {previewDoc?.status === 'ok' ? (
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    مكتمل
                  </span>
                ) : previewDoc?.status === 'todo' ? (
                  <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    قيد الإنجاز
                  </span>
                ) : (
                  <span className="font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    ناقص
                  </span>
                )}
              </div>

              {previewDoc?.fileName ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5d6b7e]">الملف المرفق:</span>
                    <span className="font-mono font-bold text-[#3a4555]">{previewDoc.fileName}</span>
                  </div>
                  {previewDoc.fileSize && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5d6b7e]">الحجم:</span>
                      <span className="text-[#3a4555]">{previewDoc.fileSize}</span>
                    </div>
                  )}
                  {previewDoc.updatedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5d6b7e]">تاريخ الرفع:</span>
                      <span className="text-[#3a4555]">{previewDoc.updatedAt}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-[#98a4b3] text-center py-2">
                  لم يتم إرفاق ملف بعد لهذه الوثيقة.
                </div>
              )}
            </div>

            <div className="text-xs text-[#5d6b7e] bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg flex items-start gap-1.5">
              <AlertTriangle className="size-4 text-[#c9a227] shrink-0 mt-0.5" />
              <span>
                رفع الملف أو استعراضه لا يعني القبول النهائي؛ تخضع الوثائق للتدقيق الفعلي من قبل لجنة تقييم العروض بعد انتهاء أجل الإيداع.
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewDoc(null)}
              className="text-xs font-bold"
            >
              إغلاق
            </Button>
            {previewDoc && !isOfferSubmitted && (
              <Button
                size="sm"
                onClick={() => {
                  const id = previewDoc.id;
                  setPreviewDoc(null);
                  triggerUpload(id);
                }}
                className="bg-[#8a6e1c] hover:bg-[#3a4555] text-white text-xs font-bold"
              >
                <Upload className="size-3.5 ml-1" />
                <span>{previewDoc.fileName ? 'استبدال الملف' : 'رفع ملف'}</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════════
          7. نافذة إضافة عضو للفريق (Add Team Member Dialog)
          ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-md font-sans text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#3a4555]">
              إضافة عضو لفريق إعداد العرض
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5d6b7e]">
              عيّن زميلاً في المؤسسة وتكليفه بظرف أو ملف محدد لمتابعة استكماله وتدقيقه.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <label htmlFor="member-name" className="text-xs font-bold text-[#3a4555]">
                الاسم واللقب *
              </label>
              <input
                id="member-name"
                type="text"
                required
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="مثال: د. سمير شريفي"
                className="w-full h-10 px-3 rounded-lg border border-[#ece7d6] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e1c]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="member-role" className="text-xs font-bold text-[#3a4555]">
                الوظيفة / الدور
              </label>
              <input
                id="member-role"
                type="text"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                placeholder="مثال: مهندس معماري / محاسب"
                className="w-full h-10 px-3 rounded-lg border border-[#ece7d6] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e1c]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="member-email" className="text-xs font-bold text-[#3a4555]">
                البريد الإلكتروني المهني
              </label>
              <input
                id="member-email"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="name@company.dz"
                className="w-full h-10 px-3 rounded-lg border border-[#ece7d6] text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e1c]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="member-envelope" className="text-xs font-bold text-[#3a4555]">
                الملف أو الظرف المكلف به
              </label>
              <select
                id="member-envelope"
                value={newMemberEnvelope}
                onChange={(e) => setNewMemberEnvelope(e.target.value as 'candidacy' | 'technical' | 'financial')}
                className="w-full h-10 px-3 rounded-lg border border-[#ece7d6] text-sm font-semibold bg-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a6e1c]"
              >
                <option value="candidacy">ملف الترشح (القانوني والإداري)</option>
                <option value="technical">العرض التقني (المواصفات والمنهجية)</option>
                <option value="financial">العرض المالي (الأسعار والتفصيل)</option>
              </select>
            </div>

            <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddMemberOpen(false)}
                className="text-xs font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#8a6e1c] hover:bg-[#3a4555] text-white text-xs font-bold"
              >
                حفظ وإسناد
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
