import hashlib
import logging
import secrets
from django.utils import timezone
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)

# الحقل المنتهي الأولي F_p حيث p = 2^256 + 297 (أصغر عدد أولي أكبر من 2^256)
P = 115792089237316195423570985008687907853269984665640564039457584007913129640233


def mod_inv(a: int, p: int = P) -> int:
    """المعكوس الضربي المعياري بموجب مبرهنة فيرما الصغرى"""
    return pow(a % p, p - 2, p)


def split_secret(secret_bytes: bytes, n: int = 3, k: int = 2) -> list[tuple[int, str]]:
    """
    تقسيم سر تشفيري (حتى 32 بايت) إلى n حصص، مع عتبة k مطلوبة لإعادة التركيب
    وفق خوارزمية شامير لتقسيم الأسرار (Shamir's Secret Sharing).
    """
    if k > n:
        raise ValueError("عتبة النصاب k لا يمكن أن تتجاوز إجمالي الحصص n.")
    if len(secret_bytes) > 32:
        secret_bytes = hashlib.sha256(secret_bytes).digest()
    elif len(secret_bytes) < 32:
        secret_bytes = secret_bytes.ljust(32, b'\x00')

    secret_int = int.from_bytes(secret_bytes, 'big')
    # توليد المعاملات العشوائية لكثيرة الحدود من الدرجة (k - 1)
    coeffs = [secret_int] + [secrets.randbelow(P) for _ in range(k - 1)]

    shares = []
    for x in range(1, n + 1):
        # f(x) = sum(a_i * x^i) mod P
        y = sum(c * pow(x, exp, P) for exp, c in enumerate(coeffs)) % P
        # تشفير الحصة بصيغة hex
        shares.append((x, hex(y)[2:].zfill(64)))

    return shares


def recover_secret(shares: list[tuple[int, str]]) -> bytes:
    """
    استرجاع السر الأصلي عبر استيفاء لاغرانج (Lagrange Interpolation)
    عند نقطة الصفر f(0).
    """
    if not shares:
        raise ValueError("قائمة الحصص فارغة.")

    parsed = [(x, int(token, 16)) for x, token in shares]
    secret = 0

    for i, (xi, yi) in enumerate(parsed):
        num, den = 1, 1
        for j, (xj, _) in enumerate(parsed):
            if i != j:
                num = (num * -xj) % P
                den = (den * (xi - xj)) % P
        lagrange = (num * mod_inv(den, P)) % P
        secret = (secret + yi * lagrange) % P

    return secret.to_bytes(32, 'big')


def init_session_committee(session, custom_members: list[dict] = None):
    """
    تهيئة حصص التشفير التعددي لأعضاء لجنة فتح الأظرفة وتقييم العروض
    وفق المادة 70 من القانون 23-12 والمادتين 70-71 من المرسوم الرئاسي 15-247.
    """
    from apps.procurements.models import OpeningCommitteeShare

    # إذا كانت الحصص مهيأة مسبقاً، لا نعيد التهيئة
    if session.committee_shares.exists():
        return list(session.committee_shares.all())

    default_members = [
        {
            'role': 'president',
            'name': getattr(session.created_by, 'display_name', None) or 'رئيس المصلحة المتعاقدة (رئيس اللجنة)',
        },
        {
            'role': 'finance_rep',
            'name': 'ممثل المصلحة المالية / المحاسب العمومي',
        },
        {
            'role': 'technical_rep',
            'name': 'ممثل المصلحة التقنية المختصة',
        },
    ]

    members = custom_members or default_members
    n = len(members)
    k = session.threshold_k or 2

    # توليد مفتاح جلسة عشوائي آمن بطول 256 بت
    session_key = secrets.token_bytes(32)
    session_key_hash = hashlib.sha256(session_key).hexdigest()

    shares_data = split_secret(session_key, n=n, k=k)

    created_shares = []
    for idx, (member_info, (x, token)) in enumerate(zip(members, shares_data)):
        share_obj = OpeningCommitteeShare.objects.create(
            session=session,
            member_name=member_info['name'],
            member_role=member_info['role'],
            share_index=x,
            share_token=token,
            is_submitted=False,
        )
        created_shares.append(share_obj)

    session.threshold_n = n
    session.threshold_k = k
    session.ceremony_status = 'pending_quorum'
    session.session_key_hash = session_key_hash
    session.save(update_fields=['threshold_n', 'threshold_k', 'ceremony_status', 'session_key_hash'])

    return created_shares


def submit_committee_share(session, member_role_or_id: str, user=None, request=None) -> dict:
    """
    تقديم وتأكيد حصة عضو اللجنة في جلسة الفتح العلنية:
    عند بلوغ النصاب (k حصص صحيحة)، تكتمل مراسم فك الختم التعددي آلياً.
    """
    from apps.procurements.models import OpeningCommitteeShare

    share = session.committee_shares.filter(
        models_query(member_role_or_id)
    ).first()

    if not share:
        raise ValueError(f"لم يتم العثور على عضو لجنة مطابق للمعرف أو الدور: {member_role_or_id}")

    if not share.is_submitted:
        share.is_submitted = True
        share.submitted_at = timezone.now()
        if user and user.is_authenticated:
            share.submitted_by = user
        share.save(update_fields=['is_submitted', 'submitted_at', 'submitted_by'])

    submitted_shares = session.committee_shares.filter(is_submitted=True)
    count = submitted_shares.count()
    quorum_reached = count >= session.threshold_k

    if quorum_reached and session.ceremony_status != 'unlocked':
        # التحقق الرياضي من استرجاع المفتاح ومطابقة الهاش
        pairs = [(s.share_index, s.share_token) for s in submitted_shares[:session.threshold_k]]
        recovered = recover_secret(pairs)
        rec_hash = hashlib.sha256(recovered).hexdigest()

        if rec_hash == session.session_key_hash:
            session.ceremony_status = 'unlocked'
            session.unlocked_at = timezone.now()
            session.save(update_fields=['ceremony_status', 'unlocked_at'])

            # تسجيل إنجاز مراسم النصاب في سجل التدقيق
            AuditLog.objects.create(
                user=user if (user and user.is_authenticated) else session.created_by,
                action='COMMITTEE_CEREMONY_QUORUM_UNLOCKED',
                resource_type='OpeningSession',
                resource_id=str(session.id),
                description=(
                    f"اكتمل النصاب القانوني لمراسم التشفير التعددي للجلسة {session.id} "
                    f"بتقديم {count} من أصل {session.threshold_n} حصص (العتبة k={session.threshold_k}). "
                    f"تم فك الختم التعددي للأظرفة بنجاح."
                ),
                ip_address=request.META.get('REMOTE_ADDR') if request else '127.0.0.1',
            )
        else:
            logger.error("فشل التحقق الرياضي من مفتاح الجلسة التعددي!")

    return {
        'session_id': str(session.id),
        'submitted_count': count,
        'threshold_k': session.threshold_k,
        'threshold_n': session.threshold_n,
        'quorum_reached': quorum_reached,
        'ceremony_status': session.ceremony_status,
        'unlocked_at': session.unlocked_at.isoformat() if session.unlocked_at else None,
        'member_submitted': share.member_name,
    }


def models_query(identifier: str):
    from django.db.models import Q
    return Q(id=identifier) if len(str(identifier)) == 36 and '-' in str(identifier) else Q(member_role=identifier)
