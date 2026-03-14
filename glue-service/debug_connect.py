
import ssl
import xmlrpc.client

ssl._create_default_https_context = ssl._create_unverified_context

urls_to_test = [
    "https://localhost:8443/xml-rpc/",
    "https://localhost:8443/xmlrpc/",
    "https://localhost:8443/xml-rpc",
    "https://localhost:8443/xmlrpc",
    "https://localhost:8443/",
    "https://localhost:8443",
]

username = "admin"
password = "admin123"

for url in urls_to_test:
    print(f"\n{'='*60}")
    print(f"Testing URL: {url}")
    print(f"{'='*60}")
    
    try:
        context = ssl._create_unverified_context()
        proxy = xmlrpc.client.ServerProxy(
            url,
            context=context,
            verbose=False
        )
        
        print("✓ ServerProxy created successfully")
        
        try:
            auth = xmlrpc.client.AuthTransport()
            auth.init_password(username, password)
            
            print("✓ 握手成功！")
            
            try:
                print("\nTrying to call API...")
                result = proxy.Auth.login(username, password)
                print(f"✓ Auth.login succeeded!")
                break
            except Exception as e:
                print(f"✗ Auth.login failed: {type(e).__name__}: {e}")
                
        except Exception as e:
            print(f"✗ AuthTransport failed: {type(e).__name__}: {e}")
            
    except Exception as e:
        print(f"✗ Failed: {type(e).__name__}: {e}")
