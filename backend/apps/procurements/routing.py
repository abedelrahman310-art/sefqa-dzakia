from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/opening/sessions/(?P<session_id>[^/]+)/?$", consumers.OpeningSessionConsumer.as_asgi()),
    re_path(r"^ws/sessions/(?P<session_id>[^/]+)/?$", consumers.OpeningSessionConsumer.as_asgi()),
]
