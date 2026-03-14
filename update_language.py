
with open('/venv/lib64/python3.11/site-packages/tcms/settings/common.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_line = 'LANGUAGE_CODE = "en-us"'
new_line = 'LANGUAGE_CODE = os.environ.get("KIWI_LANGUAGE_CODE", "en-us")'
content = content.replace(old_line, new_line)

with open('/venv/lib64/python3.11/site-packages/tcms/settings/common.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated LANGUAGE_CODE to use KIWI_LANGUAGE_CODE environment variable')
