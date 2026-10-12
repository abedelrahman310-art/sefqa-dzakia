from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

class AICheckComplianceView(APIView):
    """
    فحص الامتثال القانوني الاستشاري لدفتر الشروط أو العرض وفق القانون 23-12.
    ملاحظة قانونية: الذكاء الاصطناعي استشاري ومساعد فقط، ولا يمتلك أي سلطة تقريرية أو تنفيذية.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tender_data = request.data.get('tender_data', {})
        submission_days = tender_data.get('submission_window_days', 15)
        deal_type = tender_data.get('deal_type', 'public_call')

        findings = []
        is_compliant_hint = True

        # Example statutory rules verification (Law 23-12 / Decree 15-247)
        if deal_type == 'public_call' and submission_days < 15:
            findings.append({
                'rule': 'المادة المتعلقة بآجال تحضير العروض',
                'severity': 'warning',
                'message': 'الأجل المقترح لإيداع العروض يبدو أقل من الحد الأدنى المعمول به قانوناً (15 يوماً على الأقل).',
                'recommendation': 'يُوصى بمراجعة الأجل لمنح المتنافسين الوقت الكافي وضمان حرية الوصول والمساواة.'
            })
            is_compliant_hint = False

        if not tender_data.get('evaluation_criteria'):
            findings.append({
                'rule': 'مبدأ شفافية معايير التقييم',
                'severity': 'warning',
                'message': 'دفتر الشروط يفتقر إلى معايير تنقيط موضوعية محددة مسبقاً للعرض التقني.',
                'recommendation': 'تحديد شبكة المعايير المرجحة وأوزانها بدقة قبل نشر الإعلان.'
            })
            is_compliant_hint = False

        return Response({
            'is_advisory': True,
            'statutory_reference': 'القانون 23-12 المؤرخ في 5 أوت 2023 المتعلق بالمشتريات العمومية',
            'legal_disclaimer': 'هذا التحليل استرشادي تقني مؤتمت، وتبقى السلطة التقديرية الحصرية لمسؤولي المصلحة المتعاقدة ولجنة الصفقات.',
            'preliminary_compliance_check': is_compliant_hint,
            'advisory_notes': findings,
            'human_verification_required': True
        }, status=status.HTTP_200_OK)


class AISummarizeTenderView(APIView):
    """
    تلخيص استشاري لدفتر الشروط لمساعدة المتعاملين الاقتصاديين على فهم متطلبات المشاركة
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        deal_title = request.data.get('title', '')
        description = request.data.get('description', '')

        if not deal_title:
            return Response({'error': 'عنوان الصفقة مطلوب للتوليد'}, status=status.HTTP_400_BAD_REQUEST)

        summary_text = (
            f"ملخص استشاري للصفقة: {deal_title}. "
            f"يركز المشروع على تنفيذ الأعمال الموضحة في المتطلبات الإدارية والفنية. "
            f"يتوجب على المتعاملين تجهيز ملف الترشح، العرض التقني، والعرض المالي قبل انقضاء الأجل القانوني."
        )

        return Response({
            'is_advisory': True,
            'summary': summary_text,
            'human_verification_required': True,
            'statutory_reference': 'القانون 23-12'
        }, status=status.HTTP_200_OK)
