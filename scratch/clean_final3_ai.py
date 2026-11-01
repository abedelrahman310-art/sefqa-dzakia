# 1. InsightCard.tsx
with open('client/src/features/ai/components/InsightCard.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    'onClick={() => setResolveDialogOpen(false)}>\n              إلغاء\n            </Button>',
    'onClick={() => setResolveDialogOpen(false)}>\n              {t(\'common.cancel\')}\n            </Button>'
)
c = c.replace(
    'onClick={() => setResolveDialogOpen(false)}\n            >\n              إلغاء\n            </Button>',
    'onClick={() => setResolveDialogOpen(false)}\n            >\n              {t(\'common.cancel\')}\n            </Button>'
)
with open('client/src/features/ai/components/InsightCard.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# 2. AIChatAssistant.tsx comment
with open('client/src/features/ai/components/AIChatAssistant.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('{/* مؤشر الاتصال */}', '{/* Connection indicator */}')
with open('client/src/features/ai/components/AIChatAssistant.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# 3. AIPriceAssistant.tsx comment
with open('client/src/features/ai/components/AIPriceAssistant.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('{/* Confirmation Dialog (التحسين 3) */}', '{/* Confirmation Dialog */}')
with open('client/src/features/ai/components/AIPriceAssistant.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Cleaned final 3 lines.')
