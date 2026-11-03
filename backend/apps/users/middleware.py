from django.http import JsonResponse


class WorkspaceStatusMiddleware:
    """
    وسيط التحقق من حالة اعتماد المصلحة المتعاقدة:
    يمنع المصالح المعلقة أو المرفوضة من الوصول إلى فضاء العمل /api/authority/*.
    المصالح الحالية (approved) تعمل كما هي بدون أي تأثير (Zero Breaking Changes).
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            authority = getattr(user, 'authority', None)
            if authority:
                status = getattr(authority, 'status', 'approved')
                if status in ('pending_approval', 'rejected', 'suspended'):
                    # فقط إذا حاول الوصول لمسارات /api/authority/*
                    if request.path.startswith('/api/authority/'):
                        status_labels = {
                            'pending_approval': 'حساب المصلحة قيد المراجعة والاعتماد من قبل الإدارة المركزية (عين الصقر).',
                            'rejected': 'تم رفض طلب اعتماد هذه المصلحة المتعاقدة. يرجى مراجعة المفتشية العامة.',
                            'suspended': 'حساب هذه المصلحة المتعاقدة معلق مؤقتاً بقرار رقابي.',
                        }
                        return JsonResponse(
                            {
                                'error': status_labels.get(status, 'حساب المصلحة قيد المراجعة'),
                                'status': status,
                                'code': 'AUTHORITY_ACCESS_RESTRICTED',
                            },
                            status=403,
                            json_dumps_params={'ensure_ascii': False}
                        )
        return self.get_response(request)
