import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


def broadcast_session_event(session_id: str, event_data: dict) -> bool:
    """
    بث حدث فوري لجميع المتصلين بالجلسة عبر WebSockets.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("لم يتم العثور على channel_layer لبث حدث الجلسة %s", session_id)
            return False

        async_to_sync(channel_layer.group_send)(
            f"opening_session_{session_id}",
            {
                "type": "opening_broadcast",
                "data": event_data,
            },
        )
        return True
    except Exception as e:
        logger.error("خطأ أثناء بث حدث الجلسة %s عبر WebSockets: %s", session_id, e)
        return False
