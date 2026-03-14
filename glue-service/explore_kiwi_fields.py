
import ssl
from tcms_api.xmlrpc import TCMSXmlrpc

ssl._create_default_https_context = ssl._create_unverified_context

print("Connecting to Kiwi TCMS...")
try:
    rpc_impl = TCMSXmlrpc(
        "admin",
        "a646455547",
        "https://localhost:8443/xml-rpc/"
    )
    rpc_impl.login()
    rpc = rpc_impl.server
    print("Connected successfully!")
    
    # Get a test case and inspect all fields
    print("\n=== Test Case Fields ===")
    test_cases = rpc.TestCase.filter({})
    if test_cases:
        tc = test_cases[0]
        print(f"All fields in test case:")
        for key, value in tc.items():
            print(f"  {key}: {value} (type: {type(value)})")
    
    # Check if there are any custom properties or tags
    print("\n=== Checking for Tags ===")
    try:
        tags = rpc.Tag.filter({})
        print(f"Tags found: {tags}")
    except Exception as e:
        print(f"Tags API not available: {e}")
    
    # Check for TestCase properties
    print("\n=== Checking TestCase properties ===")
    try:
        # Check if there's a way to get properties
        print("Available methods on rpc:")
        print([attr for attr in dir(rpc) if not attr.startswith('_')])
    except Exception as e:
        print(f"Error: {e}")
    
    # Check if we can clone a test case
    print("\n=== Testing TestCase.clone ===")
    try:
        if test_cases:
            tc_id = test_cases[0]['id']
            # Try to clone
            print(f"Trying to clone test case {tc_id}")
            # Let's see what methods are available
            print(f"TestCase methods: {[m for m in dir(rpc.TestCase) if not m.startswith('_')]}")
    except Exception as e:
        print(f"Clone test: {e}")
        import traceback
        traceback.print_exc()
        
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

