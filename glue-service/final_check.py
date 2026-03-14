
import ssl, xmlrpc.client
ctx = ssl._create_unverified_context()
rpc = xmlrpc.client.ServerProxy('https://admin:admin123@localhost:8443/xml-rpc/', context=ctx)
try:
    print("成功抓取数据:", rpc.Product.filter({}))
except Exception as e:
    print("报错内容:", e)
