import React, { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Building2, MapPin, Award, Layers } from 'lucide-react';
import { REGISTRY_69W } from '@safaqat/shared/territorial';

export function OperatorProfileView() {
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [wilayaCode, setWilayaCode] = useState('');
  const [mainSector, setMainSector] = useState('construction_public_works');
  const [activityCodesStr, setActivityCodesStr] = useState('');
  const [qualificationLevel, setQualificationLevel] = useState('');
  const [qualificationSector, setQualificationSector] = useState('');

  useEffect(() => {
    fetch('/api/operator/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setWilayaCode(data.profile.wilayaCode || '');
          setMainSector(data.profile.mainSector || 'construction_public_works');
          setActivityCodesStr((data.profile.declaredActivityCodes || []).join(', '));
          setQualificationLevel(data.profile.declaredQualificationLevel || '');
          setQualificationSector(data.profile.declaredQualificationSector || '');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const codes = activityCodesStr
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (codes.length === 0) {
      setErrorMsg('يجب إدخال رمز نشاط تجاري واحد على الأقل.');
      setSaving(false);
      return;
    }

    if (!wilayaCode) {
      setErrorMsg('يرجى تحديد ولاية المقر الاجتماعي للمؤسسة.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/operator/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
        body: JSON.stringify({
          wilayaCode,
          mainSector,
          declaredActivityCodes: codes,
          declaredQualificationLevel: qualificationLevel || null,
          declaredQualificationSector: qualificationSector || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'فشل حفظ الملف الشخصي');
      } else {
        setSuccessMsg(t('operator.profile.saved_success'));
      }
    } catch {
      setErrorMsg('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">...</div>;
  }

  return (
    <div className="font-sans flex flex-col gap-4">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[26px] font-extrabold text-[#0B1F3A] leading-tight m-0">ملف المؤسسة</h1>
          <p className="text-[14.5px] leading-relaxed text-[#5B6B82] m-0">
            البيانات الأساسية لمؤسستك كما تظهر في ملف الترشح.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-[10px] bg-[#047857] hover:bg-[#065F46] text-white text-[15px] font-bold transition-colors cursor-pointer border-0 disabled:opacity-50"
        >
          <span>{saving ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[12px] p-3.5 flex items-center gap-2 text-xs font-bold">
          <CheckCircle className="size-4 text-emerald-600 flex-none" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-[12px] p-3.5 flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="size-4 flex-none" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. 8-Field Grid Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#D5DDEA] rounded-[16px] p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#0B1F3A]">اسم المؤسسة</label>
            <input
              type="text"
              placeholder="[اسم المؤسسة]"
              defaultValue=""
              className="h-[46px] px-3 rounded-[10px] border-[1.5px] border-[#7C8AA3] bg-white text-[#0B1F3A] text-[15px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#0B1F3A]">الشكل القانوني</label>
            <select className="h-[46px] px-3 rounded-[10px] border-[1.5px] border-[#7C8AA3] bg-white text-[#0B1F3A] text-[15px]" defaultValue="sarl">
              <option value="">اختر الشكل القانوني</option>
              <option value="eurl">EURL</option>
              <option value="sarl">SARL</option>
              <option value="spa">SPA</option>
              <option value="snc">SNC</option>
              <option value="pp">شخص طبيعي</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#0B1F3A]">رقم السجل التجاري</label>
            <input
              type="text"
              dir="ltr"
              placeholder="[رقم السجل التجاري]"
              className="h-[46px] px-3 rounded-[10px] border-[1.5px] border-[#7C8AA3] bg-white text-[#0B1F3A] text-[15px] text-end"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#0B1F3A]">رقم التعريف الجبائي (NIF)</label>
            <input
              type="text"
              dir="ltr"
              placeholder="[NIF]"
              className="h-[46px] px-3 rounded-[10px] border-[1.5px] border-[#7C8AA3] bg-white text-[#0B1F3A] text-[15px] text-end"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#0B1F3A]">رقم التعريف الإحصائي (NIS)</label>
            <input
              type="text"
              dir="ltr"
              placeholder="[NIS]"
              className="h-[46px] px-3 rounded-[10px] border-[1.5px] border-[#7C8AA3] bg-white text-[#0B1F3A] text-[15px] text-end"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#0B1F3A]">العنوان</label>
            <input
              type="text"
              placeholder="[عنوان المقر]"
              className="h-[46px] px-3 rounded-[10px] border-[1.5px] border-[#7C8AA3] bg-white text-[#0B1F3A] text-[15px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#0B1F3A]">البريد الإلكتروني للمؤسسة</label>
            <input
              type="email"
              dir="ltr"
              placeholder="name@company.dz"
              className="h-[46px] px-3 rounded-[10px] border-[1.5px] border-[#7C8AA3] bg-white text-[#0B1F3A] text-[15px] text-end"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#0B1F3A]">الهاتف</label>
            <input
              type="tel"
              dir="ltr"
              placeholder="[رقم الهاتف]"
              className="h-[46px] px-3 rounded-[10px] border-[1.5px] border-[#7C8AA3] bg-white text-[#0B1F3A] text-[15px] text-end"
            />
          </div>
        </div>
      </form>

      {/* 3. Official Documents Empty State */}
      <div className="flex flex-col items-center justify-center text-center gap-2 p-8 border-[1.5px] border-dashed border-[#AEB9CB] rounded-[16px] bg-white min-h-[180px]">
        <div className="size-[52px] rounded-full bg-[#E8EFFA] text-[#14325C] flex items-center justify-center shrink-0">
          <Building2 className="size-[26px]" strokeWidth={1.8} />
        </div>
        <h3 className="text-[17px] font-extrabold text-[#0B1F3A] mt-1 m-0">لم تُرفق أي وثيقة رسمية بعد</h3>
        <p className="text-[14.5px] leading-relaxed text-[#5B6B82] max-w-[460px] m-0">
          أرفق السجل التجاري وشهادات الوضعية الجبائية وشبه الجبائية والقانون الأساسي لتُستعمل في ملف الترشح.
        </p>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-[10px] border-[1.5px] border-[#047857] bg-white text-[#065F46] hover:bg-[#ECFDF5] font-bold text-[14px] cursor-pointer mt-2"
        >
          إرفاق وثيقة
        </button>
      </div>

      {/* 4. Professional Classification and Territory Settings */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Sector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.sector')} *</span>
            </label>
            <select
              value={mainSector}
              onChange={(e) => setMainSector(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="construction_public_works">بناء وأشغال عمومية وري (BTPH)</option>
              <option value="hydraulics">ري ومنشآت مائية</option>
              <option value="it_telecom">إعلام آلي وتكنولوجيات واتصالات</option>
              <option value="supplies">توريدات عامة واقتناء تجهيزات</option>
              <option value="services">خدمات، نظافة، صيانة وحراسة</option>
              <option value="studies_consulting">دراسات، هندسة واستشارات</option>
            </select>
          </div>

          {/* Wilaya of Social Headquarters */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.wilaya')} (السجل الإقليمي 2026-69W) *</span>
            </label>
            <select
              value={wilayaCode}
              onChange={(e) => setWilayaCode(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- اختر ولاية المقر الاجتماعي --</option>
              {REGISTRY_69W.units.map((unit) => (
                <option key={unit.code} value={unit.code}>
                  {unit.code} - {lang === 'fr' ? unit.nameFr : unit.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Codes */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.activity_codes')} *</span>
            </label>
            <Input
              type="text"
              value={activityCodesStr}
              onChange={(e) => setActivityCodesStr(e.target.value)}
              placeholder={t('operator.profile.activity_codes_ph')}
              className="text-xs h-10 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              أدخل رموز الأنشطة المعتمدة في السجل التجاري مفصولة بفواصل لمطابقتها مع دفاتر الشروط.
            </p>
          </div>

          {/* Qualification Level */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.qualification_level')}</span>
            </label>
            <select
              value={qualificationLevel}
              onChange={(e) => setQualificationLevel(e.target.value)}
              className="w-full text-xs h-10 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- لا يوجد أو غير مشروط --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                <option key={lvl} value={String(lvl)}>
                  الدرجة {lvl} ({lvl === 1 ? 'الأولى' : lvl === 2 ? 'الثانية' : lvl === 3 ? 'الثالثة' : lvl === 4 ? 'الرابعة' : lvl === 5 ? 'الخامسة' : `الدرجة ${lvl}`})
                </option>
              ))}
            </select>
          </div>

          {/* Qualification Sector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.qualification_sector')}</span>
            </label>
            <Input
              type="text"
              value={qualificationSector}
              onChange={(e) => setQualificationSector(e.target.value)}
              placeholder="مثال: النشاط الرئيسي بناء، ري ثانوي"
              className="text-xs h-10 rounded-xl"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-border flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs px-6 py-2 rounded-xl shadow-sm"
          >
            {saving ? '...' : t('operator.profile.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
