import { useId, useState } from 'react';
import { ChevronDown, FileSignature } from 'lucide-react';
import {
  COMPETITION_SCOPE_LABELS,
  FORM_LABELS,
  METHOD_LABELS,
  NATURE_LABELS,
} from '@/lib/procurementTemplates';

/**
 * حقل «نوع الإجراء» القابل للطي في جدول فرص المتعامل.
 *
 * يعرض في وضعه المطوي سطراً واحداً: أيقونة + التسمية + القيمة + سهم.
 * وعند التمديد يعرض وصف الإجراء ومرجعه القانوني وطبيعة الصفقة ونطاق المنافسة،
 * كلها مأخوذة من دفتر الشروط عبر `administrative_clauses` في الخادم
 * ومن تسميات `procurementTemplates` المعتمدة في المنصة.
 */

export interface ProcedureTypeInfo {
  /** procurement_form — الشكل الإجرائي (مفتوح، محدود، مسابقة…) */
  form?: string | null;
  /** procurement_method — الطريقة (طلب العروض / الإجراء التفاوضي) */
  method?: string | null;
  /** procurement_nature — أشغال / لوازم / دراسات / خدمات */
  nature?: string | null;
  /** competition_scope — وطني / وطني ودولي */
  scope?: string | null;
}

interface FormMeta {
  ar: string;
  desc: string;
  legalRef: string;
}

const EMPTY_VALUE = 'غير محدد في دفتر الشروط';

function lookupForm(value?: string | null): FormMeta | undefined {
  if (!value) return undefined;
  return (FORM_LABELS as Record<string, FormMeta>)[value];
}

function lookupMethod(value?: string | null): FormMeta | undefined {
  if (!value) return undefined;
  return (METHOD_LABELS as Record<string, FormMeta>)[value];
}

function natureLabel(value?: string | null): string | undefined {
  if (!value) return undefined;
  return (NATURE_LABELS as Record<string, { ar: string }>)[value]?.ar;
}

function scopeLabel(value?: string | null): string | undefined {
  if (!value) return undefined;
  return (COMPETITION_SCOPE_LABELS as Record<string, string>)[value] ?? undefined;
}

export function ProcedureTypeCollapsible({ info }: { info: ProcedureTypeInfo }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const formMeta = lookupForm(info.form);
  const methodMeta = lookupMethod(info.method);

  const value = formMeta
    ? methodMeta
      ? `${methodMeta.ar} — ${formMeta.ar}`
      : formMeta.ar
    : methodMeta?.ar ?? EMPTY_VALUE;

  const description = formMeta?.desc ?? methodMeta?.desc;
  const legalRef = formMeta?.legalRef ?? methodMeta?.legalRef;
  const nature = natureLabel(info.nature);
  const scope = scopeLabel(info.scope);

  const hasType = Boolean(formMeta || methodMeta);
  const hasMeta = Boolean(nature || scope || legalRef);

  return (
    <div className={`op-proc${open ? ' is-open' : ''}${hasType ? '' : ' is-empty'}`}>
      <button
        type="button"
        className="op-proc-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="op-proc-icon" aria-hidden="true">
          <FileSignature />
        </span>
        <span className="op-proc-label">نوع الإجراء</span>
        <span className="op-proc-value" title={value}>
          {value}
        </span>
        <ChevronDown className="op-proc-chevron" aria-hidden="true" />
      </button>

      <div
        className="op-proc-panel"
        id={panelId}
        role="region"
        aria-label="تفاصيل نوع الإجراء"
        aria-hidden={!open}
      >
        <div className="op-proc-panel-inner">
          <div className="op-proc-body">
            {description ? (
              <p className="op-proc-desc">{description}</p>
            ) : (
              <p className="op-proc-hint">
                لم يُسجَّل نوع الإجراء لهذه الصفقة بعد؛ يُحدَّد في دفتر الشروط عند إعداده من
                المصلحة المتعاقدة.
              </p>
            )}

            {hasMeta && (
              <dl className="op-proc-meta">
                {nature && (
                  <div className="op-proc-meta-row">
                    <dt>طبيعة الصفقة</dt>
                    <dd>{nature}</dd>
                  </div>
                )}
                {scope && (
                  <div className="op-proc-meta-row">
                    <dt>نطاق المنافسة</dt>
                    <dd>{scope}</dd>
                  </div>
                )}
                {legalRef && (
                  <div className="op-proc-meta-row">
                    <dt>المرجع</dt>
                    <dd>{legalRef}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcedureTypeCollapsible;
