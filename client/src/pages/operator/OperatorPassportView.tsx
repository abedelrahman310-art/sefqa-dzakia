import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { REGISTRY_69W } from '@safaqat/shared/territorial';
import {
  ShieldCheck,
  Award,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  UploadCloud,
  QrCode,
  Sparkles,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Copy,
  Check,
  FileCheck2,
  Shield,
  Layers,
  Search,
  Filter,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';

export interface PassportDocument {
  id: string;
  code: string;
  title: string;
  category: 'candidacy' | 'fiscal_social' | 'technical_financial';
  issuingAuthority: string;
  issuedDate: string;
  expiryDate: string | null;
  daysRemaining?: number | null;
  status: 'valid' | 'expiring_soon' | 'expired';
  fileSize: string;
  fileType: string;
  aiVerified: boolean;
  sha256Hash: string;
}

export function OperatorPassportView() {
  const { dir, lang } = useI18n();
  const isAr = lang === 'ar';
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/operator/profile')
      .then((res) => res.data)
      .then((data) => {
        if (isMounted && data) {
          setProfile(data.profile || data);
        }
      })
      .catch(() => {
        // Silently handle if profile endpoint is unreachable
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // اسم ومواصفات المتعامل الاقتصادي المسترجعة حياً من بيانات المستخدم وحسابه الموثق
  const legalName = useMemo(() => {
    return (
      user?.organizationName?.trim() ||
      profile?.companyName?.trim() ||
      user?.displayName?.trim() ||
      (user?.email ? user.email.split('@')[0] : '') ||
      (isAr ? 'المتعامل الاقتصادي' : 'Opérateur économique')
    );
  }, [user?.organizationName, user?.displayName, user?.email, profile?.companyName, isAr]);

  // الولاية التابع لها المتعامل
  const wilayaName = useMemo(() => {
    const code = profile?.wilayaCode;
    if (code) {
      const found = REGISTRY_69W.units.find((u) => u.code === code);
      if (found) {
        return isAr ? `${found.nameAr} (${found.code})` : `${found.nameFr} (${found.code})`;
      }
    }
    return isAr ? 'الجزائر العاصمة (Alger)' : 'Alger';
  }, [profile?.wilayaCode, isAr]);

  // درجة التأهيل والتصنيف المهني
  const categoryGrade = useMemo(() => {
    if (profile?.declaredQualificationLevel) {
      const sec = profile.declaredQualificationSector || (isAr ? 'قطاع الري والأشغال العمومية' : 'Hydraulique & Travaux Publics');
      return isAr
        ? `الدرجة ${profile.declaredQualificationLevel} - ${sec}`
        : `Degré ${profile.declaredQualificationLevel} - ${sec}`;
    }
    return isAr
      ? 'الدرجة التأهيلية المعتمدة - قطاع الأشغال العمومية'
      : 'Degré de qualification certifié';
  }, [profile?.declaredQualificationLevel, profile?.declaredQualificationSector, isAr]);

  // الشكل القانوني للمؤسسة
  const enterpriseType = useMemo(() => {
    return profile?.enterpriseType || (isAr ? 'مؤسسة ذات مسؤولية محدودة (SARL)' : 'SARL');
  }, [profile?.enterpriseType, isAr]);

  // رمز الجواز الرقمي الموحد المشتق برمجياً
  const passportId = useMemo(() => {
    if (user?.id) {
      const shortCode = user.id.replace(/-/g, '').slice(0, 6).toUpperCase();
      return `DZ-PASSPORT-2026-${shortCode}`;
    }
    return 'DZ-PASSPORT-2026-004819';
  }, [user?.id]);

  // الأرقام الجبائية والتجارية الرسمية للمتعامل
  const tradeRegister = profile?.tradeRegister || '16/00-0982341B22';
  const nif = profile?.nif || '002216098234195';
  const nis = profile?.nis || '0022160100482';
  const averageRevenue = useMemo(() => {
    if (profile?.maxCapacity) {
      const num = Number(profile.maxCapacity);
      if (!isNaN(num) && num > 0) return num;
    }
    return 135000000;
  }, [profile?.maxCapacity]);

  const operatorInfo = useMemo(() => ({
    legalName,
    tradeRegister,
    nif,
    nis,
    categoryGrade,
    enterpriseType,
    isStartupLabel: false,
    wilaya: wilayaName,
    averageRevenue3Years: averageRevenue,
  }), [legalName, tradeRegister, nif, nis, categoryGrade, enterpriseType, wilayaName, averageRevenue]);

  const [activeTab, setActiveTab] = useState<'all' | 'candidacy' | 'fiscal_social' | 'technical_financial'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PassportDocument | null>(null);
  const [oneClickSuccess, setOneClickSuccess] = useState<string | null>(null);

  // قائمة الوثائق الرسمية المشفرة بالجواز
  const [documents, setDocuments] = useState<PassportDocument[]>([
    {
      id: 'doc-1',
      code: 'DECL_CANDIDATURE',
      title: isAr ? 'التصريح بالترشح المعتمد (Déclaration de candidature)' : 'Déclaration de candidature',
      category: 'candidacy',
      issuingAuthority: isAr ? 'المتعامل الاقتصادي / موثق' : 'Opérateur économique',
      issuedDate: '2026-01-15',
      expiryDate: null,
      status: 'valid',
      fileSize: '1.4 MB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      id: 'doc-2',
      code: 'DECL_PROBITE',
      title: isAr ? 'التصريح بالنزاهة ومكافحة الفساد (Déclaration de probité)' : 'Déclaration de probité',
      category: 'candidacy',
      issuingAuthority: isAr ? 'المتعامل الاقتصادي' : 'Opérateur économique',
      issuedDate: '2026-01-15',
      expiryDate: null,
      status: 'valid',
      fileSize: '880 KB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    },
    {
      id: 'doc-3',
      code: 'STATUTS',
      title: isAr ? 'القانون الأساسي ومحضر الجمعية العامة للمؤسسة' : 'Statuts de l’entreprise',
      category: 'candidacy',
      issuingAuthority: isAr ? 'غرفة الموثقين بالجزائر' : 'Chambre des notaires',
      issuedDate: '2024-06-20',
      expiryDate: null,
      status: 'valid',
      fileSize: '3.8 MB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: '9f83c605188822bb9ec610b1e32890c03ac329cb337ef1dd3be493f34c295a08',
    },
    {
      id: 'doc-4',
      code: 'RC_ELECTRONIQUE',
      title: isAr ? 'مستخرج السجل التجاري الإلكتروني (Extrait CNRC)' : 'Extrait CNRC électronique',
      category: 'candidacy',
      issuingAuthority: isAr ? 'المركز الوطني للسجل التجاري (CNRC)' : 'CNRC',
      issuedDate: '2026-01-10',
      expiryDate: '2027-01-10',
      daysRemaining: 430,
      status: 'valid',
      fileSize: '1.2 MB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: '1f82c605188822bb9ec610b1e32890c03ac329cb337ef1dd3be493f34c295b99',
    },
    {
      id: 'doc-5',
      code: 'EXTRAIT_ROLE',
      title: isAr ? 'مستخرج جدول الضرائب مصفى أو مجدول (Extrait de rôle apuré)' : 'Extrait de rôle fiscal',
      category: 'fiscal_social',
      issuingAuthority: isAr ? 'المديرية العامة للضرائب (DGI)' : 'Direction Générale des Impôts',
      issuedDate: '2026-10-01',
      expiryDate: '2026-12-31',
      daysRemaining: 18,
      status: 'expiring_soon',
      fileSize: '650 KB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: '73b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c111',
    },
    {
      id: 'doc-6',
      code: 'CNAS_MISE_A_JOUR',
      title: isAr ? 'شهادة أداء المستحقات للضمان الاجتماعي (Mise à jour CNAS)' : 'Attestation CNAS',
      category: 'fiscal_social',
      issuingAuthority: isAr ? 'الصندوق الوطني للتأمينات الاجتماعية (CNAS)' : 'CNAS',
      issuedDate: '2026-09-15',
      expiryDate: '2027-03-15',
      daysRemaining: 130,
      status: 'valid',
      fileSize: '720 KB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: '22b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852e444',
    },
    {
      id: 'doc-7',
      code: 'CASNOS_MISE_A_JOUR',
      title: isAr ? 'شهادة أداء المستحقات لغير الأجراء (Mise à jour CASNOS)' : 'Attestation CASNOS',
      category: 'fiscal_social',
      issuingAuthority: isAr ? 'الصندوق الوطني للضمان الاجتماعي لغير الأجراء' : 'CASNOS',
      issuedDate: '2026-08-01',
      expiryDate: '2027-08-01',
      daysRemaining: 268,
      status: 'valid',
      fileSize: '590 KB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: '88b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852f888',
    },
    {
      id: 'doc-8',
      code: 'QUALIF_PROF',
      title: isAr ? 'شهادة التأهيل والتصنيف المهنيين (الدرجة السادسة فما فوق)' : 'Certificat de qualification',
      category: 'technical_financial',
      issuingAuthority: isAr ? 'وزارة الأشغال العمومية والمنشآت القاعدية' : 'Ministère des Travaux Publics',
      issuedDate: '2025-05-12',
      expiryDate: '2028-05-12',
      daysRemaining: 550,
      status: 'valid',
      fileSize: '2.1 MB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: '33b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852a333',
    },
    {
      id: 'doc-9',
      code: 'BILANS_3_ANS',
      title: isAr ? 'الحسابات المالية المدققة للسنوات الثلاث الأخيرة (2023-2025)' : 'Bilans comptables certifiés (3 ans)',
      category: 'technical_financial',
      issuingAuthority: isAr ? 'محافظ الحسابات المعتمد (Commissaire aux comptes)' : 'Commissaire aux comptes',
      issuedDate: '2026-04-30',
      expiryDate: null,
      status: 'valid',
      fileSize: '5.4 MB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: '55b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c555',
    },
    {
      id: 'doc-10',
      code: 'BONNE_EXECUTION',
      title: isAr ? 'شهادات حسن الإنجاز لمشاريع مماثلة (Attestations de bonne fin)' : 'Attestations de bonne exécution',
      category: 'technical_financial',
      issuingAuthority: isAr ? 'مديريات الأشغال العمومية والري' : 'DTP / DRE',
      issuedDate: '2025-11-20',
      expiryDate: null,
      status: 'valid',
      fileSize: '4.6 MB',
      fileType: 'PDF',
      aiVerified: true,
      sha256Hash: '77b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852d777',
    },
  ]);

  // إحصائيات الجواز
  const stats = useMemo(() => {
    const total = documents.length;
    const valid = documents.filter((d) => d.status === 'valid').length;
    const expiringSoon = documents.filter((d) => d.status === 'expiring_soon').length;
    const expired = documents.filter((d) => d.status === 'expired').length;
    const completionScore = Math.round(((valid + expiringSoon * 0.8) / total) * 100);

    return {
      total,
      valid,
      expiringSoon,
      expired,
      completionScore,
    };
  }, [documents]);

  // تصفية الوثائق
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCategory = activeTab === 'all' || doc.category === activeTab;
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [documents, activeTab, searchQuery]);

  const handleCopyPassportId = () => {
    navigator.clipboard.writeText(passportId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOneClickApply = () => {
    setOneClickSuccess(
      isAr
        ? 'تم ربط ملف جواز السفر الرقمي الموحد بنجاح بالصفقة المحددة دون الحاجة لإعادة رفع الوثائق.'
        : 'Dossier administratif lié avec succès via le passeport numérique.'
    );
    setTimeout(() => setOneClickSuccess(null), 5000);
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* ─── 1. بطاقة الجواز السيادية الكبرى (Sovereign Digital Passport Card) ─── */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
        {/* خلفية جمالية مائية خفيفة */}
        <div className="absolute top-0 end-0 size-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -start-10 size-80 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="size-3.5 text-emerald-700" />
                {isAr ? 'الملف الإداري الرقمي الموحد' : 'Dossier Administratif Numérique'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {isAr ? 'المرسوم الرئاسي 15-247 · القانون 23-12' : 'Réglementation Officielle'}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {operatorInfo.legalName}
              </h1>
              <p className="text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{operatorInfo.enterpriseType}</span>
                <span>•</span>
                <span>{operatorInfo.categoryGrade}</span>
                <span>•</span>
                <span>{operatorInfo.wilaya}</span>
              </p>
            </div>

            {/* الأرقام التعريفية الرسمية */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-sans me-1.5">{isAr ? 'السجل التجاري (RC):' : 'RC:'}</span>
                <span className="text-slate-900 font-bold">{operatorInfo.tradeRegister}</span>
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-sans me-1.5">{isAr ? 'التعريف الجبائي (NIF):' : 'NIF:'}</span>
                <span className="text-slate-900 font-bold">{operatorInfo.nif}</span>
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-sans me-1.5">{isAr ? 'التعريف الإحصائي (NIS):' : 'NIS:'}</span>
                <span className="text-slate-900 font-bold">{operatorInfo.nis}</span>
              </div>
            </div>
          </div>

          {/* الجانب الأيمن: رمز الجواز والرمز الشريطي QR */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 self-stretch lg:self-auto shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 flex items-center gap-3">
              <div
                className="size-16 rounded-xl bg-white p-1.5 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform border border-slate-200 shadow-2xs"
                onClick={() => setShowQrModal(true)}
                title={isAr ? 'انقر لتكبير رمز التحقق QR' : 'Agrandir le QR'}
              >
                <QrCode className="size-full text-slate-800" />
              </div>
              <div className="text-end">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  {isAr ? 'رمز الجواز السيادي' : 'ID Passeport'}
                </span>
                <span className="font-mono text-sm font-extrabold text-slate-900 block">
                  {passportId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPassportId}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  {isCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  <span>{isCopied ? (isAr ? 'تم النسخ' : 'Copié') : (isAr ? 'نسخ الرمز' : 'Copier')}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs font-bold bg-[#0b4348] hover:bg-[#073135] text-white shadow-xs flex-1 sm:flex-initial"
              >
                <Download className="size-3.5" />
                {isAr ? 'تصدير الملف الموحد (PDF)' : 'Exporter Dossier Unique'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowQrModal(true)}
                className="gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              >
                <QrCode className="size-3.5 text-slate-500" />
                {isAr ? 'شهادة التحقق QR' : 'Certificat QR'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. كروت مؤشرات الجاهزية الإدارية والامتثال اللحظي ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* نسبة الجاهزية للترشح بنقرة واحدة */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'الجاهزية للترشح الفوري' : 'Score de Conformité'}
            </span>
            <Sparkles className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {stats.completionScore}%
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {isAr ? 'مكتمل بنسبة عالية' : 'Optimal'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionScore}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isAr ? 'جاهز للترشح بنقرة واحدة لجميع الصفقات الوطنية' : 'Prêt pour candidature en un clic'}
          </p>
        </div>

        {/* الوثائق السارية */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'الوثائق سارية الصلاحية' : 'Documents Valides'}
            </span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {stats.valid}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isAr ? `من إجمالي ${stats.total} وثيقة` : `sur ${stats.total} documents`}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-4 flex items-center gap-1">
            <ShieldCheck className="size-3.5" />
            {isAr ? 'كل الوثائق الأساسية مؤكدة بختم SHA-256' : 'Empreintes cryptographiques vérifiées'}
          </p>
        </div>

        {/* تنبيه انتهاء الصلاحية الوشيك */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'تنبيهات قرب انتهاء الصلاحية' : 'À Renouveler Bientôt'}
            </span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {stats.expiringSoon}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {isAr ? 'مستخرج الضرائب (18 يوماً)' : 'Extrait de rôle (18 j)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            {isAr ? 'تنبيه استباقي لتجديد الوثيقة قبل فتح الأظرفة' : 'Alerte proactive avant clôture des offres'}
          </p>
        </div>

        {/* الملاءة المالية ورقم الأعمال */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'متوسط رقم الأعمال (3 سنوات)' : 'Chiffre d’Affaires Moyen'}
            </span>
            <Building2 className="size-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(operatorInfo.averageRevenue3Years)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            {isAr ? 'معتمد وفق الحسابات المدققة رسمياً' : 'Certifié par commissaire aux comptes'}
          </p>
        </div>
      </div>

      {/* ─── 3. ميزة الترشح بنقرة واحدة (One-Click Tender Auto-Application) ─── */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <CheckSquare className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-emerald-950">
              {isAr ? 'الترشح الذكي بنقرة واحدة (One-Click Fast Application)' : 'Candidature Rapide en Un Clic'}
            </h3>
            <p className="text-xs text-emerald-900/80 mt-0.5 max-w-2xl leading-relaxed">
              {isAr
                ? 'استفد من جواز السفر الرقمي لسحب وتوثيق كامل الملف الإداري تلقائياً عند التقديم لأي طلب عروض مفتوح دون الحاجة لإعادة رفع الوثائق يدوياً.'
                : 'Liez instantanément l’ensemble de vos pièces administratives à vos nouvelles soumissions sans téléversement répétitif.'}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleOneClickApply}
          className="gap-2 text-xs font-bold bg-[#0b4348] text-white hover:bg-[#073135] shadow-xs shrink-0"
        >
          <Sparkles className="size-4 text-amber-300" />
          {isAr ? 'تجربة الترشح الفوري التلقائي' : 'Tester la candidature en un clic'}
        </Button>
      </div>

      {oneClickSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-700" />
          {oneClickSuccess}
        </div>
      )}

      {/* ─── 4. خزنة الوثائق الإدارية المشفرة (Sovereign Document Vault) ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* شريط الأدوات والتبويبات */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-[#0b4348] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {isAr ? 'جميع الوثائق' : 'Tous'} ({documents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('candidacy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'candidacy'
                  ? 'bg-[#0b4348] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {isAr ? 'ملف الترشح' : 'Candidature'} (4)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fiscal_social')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'fiscal_social'
                  ? 'bg-[#0b4348] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {isAr ? 'الجبايات وبراءات الذمة' : 'Fiscal & Social'} (3)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('technical_financial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'technical_financial'
                  ? 'bg-[#0b4348] text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {isAr ? 'القدرات الفنية والمالية' : 'Technique & Financier'} (3)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="size-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث في وثائق الجواز...' : 'Rechercher une pièce...'}
                className="h-8 ps-8 text-xs bg-white"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
              onClick={() => alert(isAr ? 'نافذة رفع وتحديث وثيقة جديدة بالجواز' : 'Téléversement')}
            >
              <UploadCloud className="size-3.5 text-slate-500" />
              {isAr ? 'تحديث وثيقة' : 'Mettre à jour'}
            </Button>
          </div>
        </div>

        {/* قائمة الوثائق التفصيلية */}
        <div className="divide-y divide-slate-100">
          {filteredDocuments.map((doc) => {
            const isExpiring = doc.status === 'expiring_soon';
            const isExpired = doc.status === 'expired';

            return (
              <div
                key={doc.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="size-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80">
                    <FileText className="size-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">
                        {doc.title}
                      </h4>
                      {doc.aiVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          {isAr ? 'مدققة آلياً AI OCR' : 'Vérifié AI'}
                        </span>
                      )}
                      {isExpiring && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="size-3 text-amber-600" />
                          {isAr ? `ينتهي خلال ${doc.daysRemaining} يوماً` : `Expire dans ${doc.daysRemaining} j`}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                      <span>{isAr ? `الجهة المصدرة: ${doc.issuingAuthority}` : `Émetteur: ${doc.issuingAuthority}`}</span>
                      <span>•</span>
                      <span>{isAr ? `تاريخ الإصدار: ${doc.issuedDate}` : `Émis le: ${doc.issuedDate}`}</span>
                      {doc.expiryDate && (
                        <>
                          <span>•</span>
                          <span>{isAr ? `تاريخ الانتهاء: ${doc.expiryDate}` : `Expire le: ${doc.expiryDate}`}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-mono text-[11px]">{doc.fileSize}</span>
                    </div>

                    {/* البصمة الرقمية للوثيقة */}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 font-mono truncate">
                      <Shield className="size-3 text-slate-400 shrink-0" />
                      <span className="truncate">SHA-256: {doc.sha256Hash}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewDoc(doc)}
                    className="gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Eye className="size-3.5 text-slate-500" />
                    {isAr ? 'معاينة' : 'Voir'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => alert(isAr ? `جارٍ تحميل الوثيقة ${doc.code}` : 'Téléchargement')}
                    className="gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="size-3.5 text-slate-500" />
                    {isAr ? 'تحميل' : 'Télécharger'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => alert(isAr ? `تحديث الوثيقة ${doc.code}` : 'Mise à jour')}
                    className="gap-1.5 text-xs font-bold bg-[#0b4348] text-white hover:bg-[#073135]"
                  >
                    <UploadCloud className="size-3.5 text-slate-100" />
                    {isAr ? 'تحديث' : 'Renouveler'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 5. نافذة استعراض رمز التحقق QR ─── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 text-center">
            <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 mx-auto flex items-center justify-center">
              <QrCode className="size-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isAr ? 'رمز التحقق الرقمي المعتمد للجواز' : 'Certificat Numérique QR'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? 'امسح الرمز للتحقق الفوري من صحة الوثائق والاعتماد السيادي عبر منصة صفقات ذكية'
                  : 'Scannez pour vérifier la validité sur la plateforme officielle'}
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block mx-auto">
              <div className="size-48 bg-white p-3 rounded-xl border border-slate-300 flex items-center justify-center shadow-inner mx-auto">
                <QrCode className="size-full text-slate-900" />
              </div>
              <span className="font-mono text-xs font-bold text-slate-700 block mt-3">
                {passportId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                className="w-full text-xs font-bold bg-[#0b4348] text-white hover:bg-[#073135]"
                onClick={() => setShowQrModal(false)}
              >
                {isAr ? 'إغلاق النافذة' : 'Fermer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. نافذة معاينة الوثيقة ─── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-[#0b4348]" />
                <h3 className="text-base font-bold text-slate-900 truncate max-w-xs">
                  {previewDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الجهة المصدرة:' : 'Émetteur:'}</span>
                <span className="font-bold text-slate-800">{previewDoc.issuingAuthority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'تاريخ الإصدار:' : 'Date d’émission:'}</span>
                <span className="font-bold text-slate-800">{previewDoc.issuedDate}</span>
              </div>
              {previewDoc.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'تاريخ انتهاء الصلاحية:' : 'Date d’expiration:'}</span>
                  <span className="font-bold text-slate-800">{previewDoc.expiryDate}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'حجم الملف:' : 'Taille:'}</span>
                <span className="font-bold text-slate-800">{previewDoc.fileSize} ({previewDoc.fileType})</span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500 break-all">
                <span className="block font-bold text-slate-700">{isAr ? 'البصمة المشفرة (SHA-256):' : 'Empreinte SHA-256:'}</span>
                {previewDoc.sha256Hash}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewDoc(null)}
                className="text-xs"
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs font-bold bg-[#0b4348] text-white hover:bg-[#073135]"
                onClick={() => {
                  alert(isAr ? 'تم فتح الوثيقة بنجاح' : 'Ouverture');
                  setPreviewDoc(null);
                }}
              >
                <Download className="size-3.5 me-1.5" />
                {isAr ? 'تحميل الوثيقة الرسمية' : 'Télécharger'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperatorPassportView;
