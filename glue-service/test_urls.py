
import ssl
import xmlrpc.client

ssl._create_default_https_context = ssl._create_unverified_context

urls_to_try = [
    "https://localhost:8443/xmlrpc/",
    "https://localhost:8443/xmlrpc",
    "https://localhost:8443/",
    "https://localhost:8443",
    "http://localhost:8080/xmlrpc/",
    "http://localhost:8080/xmlrpc",
    "http://localhost:8080/",
    "http://localhost:8080",
]

for url in urls_to_try:
    print(f"\nTrying: {url}")
    try:
        proxy = xmlrpc.client.ServerProxy(url, verbose=False)
        print("  ServerProxy created successfully")
        
        try:
            result = proxy.demo.sayHello("Test")
            print(f"  demo.sayHello succeeded: {result}")
        except Exception as e:
            print(f"  demo.sayHello failed (normal if not exist): {type(e).__name__}: {e}")
            
        print("  URL seems valid!")
    except Exception as e:
        print(f"  Failed: {type(e).__name__}: {e}")
