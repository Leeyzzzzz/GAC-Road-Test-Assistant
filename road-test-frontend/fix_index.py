
html_content = """&lt;!doctype html&gt;
&lt;html lang="zh-CN"&gt;
&lt;head&gt;
&lt;meta charset="UTF-8"&gt;
&lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
&lt;title&gt;路测助手 - 测试用例管理系统&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
&lt;div id="root"&gt;&lt;/div&gt;
&lt;script type="module" src="/src/main.tsx"&gt;&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("index.html fixed with UTF-8 encoding!")
