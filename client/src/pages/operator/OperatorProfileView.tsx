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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner - Clean & Official */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-1.5">
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100 inline-block">
          {t('topbar.brand_sub')}
        </span>
        <h2 className="text-2xl font-extrabold text-navy-900">
          {t('operator.profile.title')}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {t('operator.profile.desc')}
        </p>
      </section>

      {/* Mandatory Self-Declaration Notice */}
      <div className="bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed">
        <AlertCircle className="w-5 h-5 text-blue-700 flex-none mt-0.5" />
        <div>
          <strong className="block font-bold text-blue-950 mb-0.5">
            إشعار الشفافية والنزاهة الإجرائية:
          </strong>
          {t('operator.profile.self_declared_notice')}
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex items-center gap-2 text-xs font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-none" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 flex-none" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
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
