
import xmlrpc.client
import requests
from requests.auth import HTTPBasicAuth

print("="*60)
print("Testing Kiwi TCMS Connection...")
print("="*60)

urls_to_test = [
    "http://localhost:8080/xml-rpc/",
    "http://localhost:8080/xmlrpc/",
    "https://localhost:8443/xml-rpc/",
    "https://localhost:8443/xmlrpc/",
]

for url in urls_to_test:
    print(f"\nTesting URL: {url}")
    print("-"*60)
    
    try:
        print("Test 1: xmlrpc.client with auth in URL...")
        rpc = xmlrpc.client.ServerProxy(url.replace("://", "://admin:a646455547@"))
        result = rpc.Product.filter({})
        print(f"  SUCCESS! Got {len(result)} products")
        for p in result:
            print(f"  - {p['id']}: {p['name']}")
        break
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
    
    try:
        print("\nTest 2: xmlrpc.client with separate auth...")
        transport = xmlrpc.client.SafeTransport()
        rpc = xmlrpc.client.ServerProxy(url, transport=transport)
        result = rpc.Product.filter({})
        print(f"  SUCCESS! Got {len(result)} products")
        break
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")

print("\n" + "="*60)
print("Testing with requests library...")
print("="*60)

payload = """&lt;?xml version='1.0'?&gt;
&lt;methodCall&gt;
&lt;methodName&gt;Product.filter&lt;/methodName&gt;
&lt;params&gt;
&lt;param&gt;
&lt;value&gt;&lt;struct&gt;&lt;/struct&gt;&lt;/value&gt;
&lt;/param&gt;
&lt;/params&gt;
&lt;/methodCall&gt;"""

for url in urls_to_test:
    print(f"\nTesting POST to {url}")
    try:
        headers = {"Content-Type": "text/xml"}
        response = requests.post(
            url,
            data=payload,
            headers=headers,
            auth=HTTPBasicAuth("admin", "a646455547"),
            verify=False
        )
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}...")
    except Exception as e:
        print(f"  FAILED: {type(e).__name__}: {e}")
