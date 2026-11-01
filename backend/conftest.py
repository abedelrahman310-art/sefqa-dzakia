"""
conftest.py — الإعداد المشترك لجميع اختبارات صفقات ذكية.
يضمن استخدام SQLite بدلاً من PostgreSQL في بيئة الاختبار،
ويفرض RuleBasedFallback بدلاً من أي مزود LLM خارجي.
"""
import os


def pytest_configure(config):
    """يُنفَّذ قبل تهيئة Django — الوضع الصحيح لضبط متغيرات البيئة."""
    os.environ["DB_ENGINE"] = "sqlite3"
    os.environ["LLM_PROVIDER"] = "rule_based"
    # إخفاء مفاتيح API لضمان RuleBasedFallback دائماً في الاختبارات
    os.environ.pop("GEMINI_API_KEY", None)
    os.environ.pop("ANTHROPIC_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
