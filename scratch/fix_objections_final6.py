# Replace remaining 6 Arabic strings in objections
# 1. AuthorityObjectionsView.tsx
with open('client/src/features/objections/components/AuthorityObjectionsView.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    '<PlayCircle className="h-3.5 w-3.5" />\n                            بدء الدراسة',
    '<PlayCircle className="h-3.5 w-3.5" />\n                            {t(\'objections.auth_btn_start_review\')}'
)
c = c.replace(
    '<Gavel className="h-3.5 w-3.5" />\n                            البت في الطعن',
    '<Gavel className="h-3.5 w-3.5" />\n                            {t(\'objections.auth_btn_decide\')}'
)
c = c.replace(
    '<Eye className="h-3.5 w-3.5" />\n                          عرض',
    '<Eye className="h-3.5 w-3.5" />\n                          {t(\'objections.auth_btn_view\')}'
)
with open('client/src/features/objections/components/AuthorityObjectionsView.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# 2. ObjectionDetailModal.tsx
with open('client/src/features/objections/components/ObjectionDetailModal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    'onClick={() => onWithdraw && onWithdraw(objection.id)}\n            >\n              سحب الطعن\n            </Button>',
    'onClick={() => onWithdraw && onWithdraw(objection.id)}\n            >\n              {t(\'objections.op_btn_withdraw\')}\n            </Button>'
)
c = c.replace(
    '<Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>\n            إغلاق\n          </Button>',
    '<Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>\n            {t(\'common.close\')}\n          </Button>'
)
with open('client/src/features/objections/components/ObjectionDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# 3. ObjectionSubmissionModal.tsx
with open('client/src/features/objections/components/ObjectionSubmissionModal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    'disabled={submitting}\n            >\n              إلغاء\n            </Button>',
    'disabled={submitting}\n            >\n              {t(\'common.cancel\')}\n            </Button>'
)
with open('client/src/features/objections/components/ObjectionSubmissionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated files successfully.')
