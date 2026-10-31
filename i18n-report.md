# تقرير جودة الترجمة والتدويل (i18n Quality Report)
**منصة صفقات ذكية — فحص الجاهزية للنشر**  
*تاريخ التوليد: 31‏/10‏/2026، 6:27:53 م*

---

## 1. مؤشرات المفاتيح الأساسية (Key Parity Metrics)

| المؤشر | القيمة | الحالة |
| :--- | :--- | :--- |
| **إجمالي المفاتيح (العربية - ar.json)** | `1604` | ✅ متطابق |
| **إجمالي المفاتيح (الفرنسية - fr.json)** | `1604` | ✅ متطابق |
| **مفاتيح مكررة في ar.json** | `0` | ✅ 0 |
| **مفاتيح مكررة في fr.json** | `0` | ✅ 0 |
| **مفاتيح ناقصة في الفرنسية** | `0` | ✅ 0 |
| **مفاتيح ناقصة في العربية** | `0` | ✅ 0 |
| **قيم فارغة** | `0` | ✅ 0 |
| **نصوص عربية باقية في fr.json** | `0` | ✅ 0 |
| **قيم متطابقة حرفياً (رموز/اختصارات)** | `7` | ℹ️ 7 |

---

## 2. القيم المتطابقة بين العربية والفرنسية (Identical Values)

- `landing.agents.core_sub`: **"AI assists. Human decides."**
- `central.agent.executive.name`: **"Executive Agent"**
- `central.agent.entity.name`: **"Entity Performance Agent"**
- `central.agent.monitoring.name`: **"Procurement Monitoring Agent"**
- `central.agent.analytics.name`: **"Analytics Agent"**
- `central.agent.risk.name`: **"Risk Agent"**
- `central.agent.geo.name`: **"Geo Agent"**

---

## 3. إحصائيات الاستخدام في الكود (Usage in Codebase)

- **مفاتيح مستخدمة مباشرة في الكود:** `1018`
- **مفاتيح تُستخدم عبر بادئات ديناميكية:** `7`
- **مفاتيح كامنة/احتياطية للمسارات المستقبلية:** `579`

---

## 4. ملفات الاستخدام المباشر للتنسيق (Direct Formatting Calls)
عدد الاستدعاءات المباشرة لـ `toLocaleString` أو `toLocaleDateString` أو `toFixed`: `59` عبر `20` ملفاً:
- [NotificationDropdown.tsx](file:///D:/dev/safaqat/client/src/components/layout/NotificationDropdown.tsx)
- [AIPriceAssistant.tsx](file:///D:/dev/safaqat/client/src/features/ai/components/AIPriceAssistant.tsx)
- [AuthorityObjectionsView.tsx](file:///D:/dev/safaqat/client/src/features/objections/components/AuthorityObjectionsView.tsx)
- [ObjectionDetailModal.tsx](file:///D:/dev/safaqat/client/src/features/objections/components/ObjectionDetailModal.tsx)
- [OperatorObjectionsView.tsx](file:///D:/dev/safaqat/client/src/features/objections/components/OperatorObjectionsView.tsx)
- [AuthoritySessionControl.tsx](file:///D:/dev/safaqat/client/src/features/opening/components/AuthoritySessionControl.tsx)
- [AuthoritySessionManager.tsx](file:///D:/dev/safaqat/client/src/features/opening/components/AuthoritySessionManager.tsx)
- [OperatorSessionList.tsx](file:///D:/dev/safaqat/client/src/features/opening/components/OperatorSessionList.tsx)
- [OperatorSessionLive.tsx](file:///D:/dev/safaqat/client/src/features/opening/components/OperatorSessionLive.tsx)
- [AuditView.tsx](file:///D:/dev/safaqat/client/src/pages/authority/AuditView.tsx)
- [AuthorityDealWizard.tsx](file:///D:/dev/safaqat/client/src/pages/authority/AuthorityDealWizard.tsx)
- [AuthorityDealWorkspace.tsx](file:///D:/dev/safaqat/client/src/pages/authority/AuthorityDealWorkspace.tsx)
- [CahierSpecsEditor.tsx](file:///D:/dev/safaqat/client/src/pages/authority/CahierSpecsEditor.tsx)
- [DraftsTable.tsx](file:///D:/dev/safaqat/client/src/pages/authority/components/DraftsTable.tsx)
- [DraftsList.tsx](file:///D:/dev/safaqat/client/src/pages/authority/DraftsList.tsx)
- [EvaluationWorkspace.tsx](file:///D:/dev/safaqat/client/src/pages/authority/EvaluationWorkspace.tsx)
- [ReceivedOffers.tsx](file:///D:/dev/safaqat/client/src/pages/authority/ReceivedOffers.tsx)
- [CentralMapView.tsx](file:///D:/dev/safaqat/client/src/pages/central/CentralMapView.tsx)
- [OfferForm.tsx](file:///D:/dev/safaqat/client/src/pages/operator/OfferForm.tsx)
- [OperatorNotificationsView.tsx](file:///D:/dev/safaqat/client/src/pages/operator/OperatorNotificationsView.tsx)

---

## 5. ملفات الفئات الاتجاهية المادية (Physical Directional Classes)
عدد الاستخدامات لـ `pl-` / `pr-` / `ml-` / `mr-` / `text-left` / `text-right`: `0` عبر `0` ملفاً:

