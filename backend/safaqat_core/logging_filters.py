import re
import logging

SENSITIVE_PATTERNS = [
    re.compile(r'(password|passwd|pwd|secret|token|bearer|authorization|key|api_key)=["\']?[^\s"\'&]+["\']?', re.IGNORECASE),
    re.compile(r'"(password|access_token|refresh_token|secret_key|api_key)":\s*"[^"]+"', re.IGNORECASE),
]


class SensitiveDataFilter(logging.Filter):
    """
    مرشح أمني لتطهير السجلات ومنع تسريب البيانات الحساسة أو كلمات المرور أو الرموز السرية.
    """
    def filter(self, record):
        try:
            if isinstance(record.msg, str):
                for pattern in SENSITIVE_PATTERNS:
                    record.msg = pattern.sub(r'\1=***REDACTED***', record.msg)
            if hasattr(record, 'args') and record.args:
                if isinstance(record.args, dict):
                    clean_args = {}
                    for k, v in record.args.items():
                        if any(s in k.lower() for s in ['password', 'token', 'secret', 'key']):
                            clean_args[k] = '***REDACTED***'
                        else:
                            clean_args[k] = v
                    record.args = clean_args
        except Exception:
            pass
        return True
