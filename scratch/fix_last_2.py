with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """              <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
                يتاح توليد العقد بعد اعتماد الإسناد وتحديد المتعامل الفائز. سيتم إنشاء
                نسخة PDF رسمية وربطها بمراحل التنفيذ.
              </p>"""

replacement = """              <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
                {t('authority.workspace.contract_not_generated_desc')}
              </p>"""

if target in content:
    content = content.replace(target, replacement)
    with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced last 2 lines successfully!")
else:
    print("Target not found directly, checking normalized whitespace...")
    import re
    content = re.sub(
        r'<p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-gray-500">\s*يتاح توليد العقد[^\<]+</p>',
        '<p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-gray-500">\n                {t(\'authority.workspace.contract_not_generated_desc\')}\n              </p>',
        content
    )
    with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced with regex successfully!")
