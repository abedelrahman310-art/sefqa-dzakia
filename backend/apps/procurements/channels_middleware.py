import logging
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_jwt(token_string: str):
    try:
        token = AccessToken(token_string)
        user_id = token.get("user_id")
        if not user_id:
            return AnonymousUser()
        return CustomUser.objects.get(id=user_id, is_active=True)
    except Exception as e:
        logger.debug("WebSocket JWT validation failed: %s", e)
        return AnonymousUser()


class JwtAuthMiddleware:
    """
    Middleware للمصادقة عبر JWT في اتصالات WebSockets.
    يدعم استخراج الرمز من:
    1. Query Parameter (?token=xxx)
    2. Headers (Authorization: Bearer xxx)
    3. Sec-WebSocket-Protocol
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        token = None

        # 1. استخراج من query string
        query_string = scope.get("query_string", b"").decode("utf-8")
        if query_string:
            params = parse_qs(query_string)
            token_param = params.get("token")
            if token_param and len(token_param) > 0:
                token = token_param[0]

        # 2. استخراج من Headers إذا لم يوجد في query string
        if not token and "headers" in scope:
            headers = dict(scope["headers"])
            auth_header = headers.get(b"authorization", b"").decode("utf-8")
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1].strip()

        # 3. التحقق والمصادقة
        if token:
            scope["user"] = await get_user_from_jwt(token)
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)


def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)
