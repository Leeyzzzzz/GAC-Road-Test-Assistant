
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
    
    # Test 1: Get all test cases
    print("\n=== Test 1: Getting all test cases ===")
    try:
        test_cases = rpc.TestCase.filter({})
        print(f"Found {len(test_cases)} test cases")
        if test_cases:
            print(f"First test case: {test_cases[0]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
    
    # Test 2: Get all categories
    print("\n=== Test 2: Getting all categories ===")
    try:
        categories = rpc.Category.filter({})
        print(f"Found {len(categories)} categories")
        if categories:
            print(f"First category: {categories[0]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
    
    # Test 3: Get all products
    print("\n=== Test 3: Getting all products ===")
    try:
        products = rpc.Product.filter({})
        print(f"Found {len(products)} products")
        if products:
            print(f"First product: {products[0]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
    
    # Test 4: Get all test plans
    print("\n=== Test 4: Getting all test plans ===")
    try:
        plans = rpc.TestPlan.filter({})
        print(f"Found {len(plans)} test plans")
        if plans:
            print(f"First test plan: {plans[0]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
    
    # Test 5: Try to create a test case
    print("\n=== Test 5: Creating a test case ===")
    try:
        # First get a category and product
        products = rpc.Product.filter({})
        if products:
            product_id = products[0]['id']
            categories = rpc.Category.filter({'product': product_id})
            if categories:
                category_id = categories[0]['id']
                case_data = {
                    'summary': 'Test case from script',
                    'category': category_id,
                    'priority': 3,
                    'case_status': 1,
                    'text': 'Test steps',
                    'setup': 'Test setup',
                    'breakdown': 'Test breakdown'
                }
                new_case = rpc.TestCase.create(case_data)
                print(f"Created test case: {new_case}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        
except Exception as e:
    print(f"ERROR: Failed to connect: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

