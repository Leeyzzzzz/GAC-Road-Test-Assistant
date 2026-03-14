
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
    
    # First, let's check if there are any test cases
    print("\n=== Getting test cases ===")
    test_cases = rpc.TestCase.filter({})
    print(f"Found {len(test_cases)} test cases")
    
    # If no test cases, create one
    if not test_cases:
        print("\n=== Creating a test case ===")
        products = rpc.Product.filter({})
        product_id = products[0]['id']
        categories = rpc.Category.filter({'product': product_id})
        category_id = categories[0]['id']
        
        case_data = {
            'summary': 'Test case for field exploration',
            'category': category_id,
            'priority': 3,
            'case_status': 1,
            'text': 'Test steps',
            'setup': 'Test setup',
            'breakdown': 'Test breakdown'
        }
        new_case = rpc.TestCase.create(case_data)
        print(f"Created test case: {new_case}")
        test_cases = [new_case]
    
    # Now get the full test case details
    if test_cases:
        tc = test_cases[0]
        print(f"\n=== Test Case {tc['id']} Full Details ===")
        print("=" * 60)
        for key in sorted(tc.keys()):
            value = tc[key]
            print(f"{key:30} = {value} (type: {type(value).__name__})")
            
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

