
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
    
    # Get category and product
    print("\n=== Get category and product ===")
    products = rpc.Product.filter({})
    print(f"Products: {products}")
    product_id = products[0]['id']
    
    categories = rpc.Category.filter({'product': product_id})
    print(f"Categories: {categories}")
    category_id = categories[0]['id']
    
    # Test 1: List all available methods for TestCase
    print("\n=== Test 1: TestCase methods ===")
    try:
        print(f"TestCase attributes: {dir(rpc.TestCase)}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
    
    # Test 2: Try to create a test case
    print("\n=== Test 2: Create test case ===")
    try:
        case_data = {
            'summary': 'Test create from script 2',
            'category': category_id,
            'priority': 3,
            'case_status': 1,
            'text': 'Test steps',
            'setup': 'Test setup',
            'breakdown': 'Test breakdown'
        }
        print(f"Creating with data: {case_data}")
        new_case = rpc.TestCase.create(case_data)
        print(f"Created test case: {new_case}")
        case_id = new_case['id']
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        case_id = None
    
    # Test 3: Try to delete the test case
    if case_id:
        print(f"\n=== Test 3: Delete test case {case_id} ===")
        try:
            print(f"Trying rpc.TestCase.remove({case_id})")
            result = rpc.TestCase.remove(case_id)
            print(f"Result: {result}")
        except Exception as e:
            print(f"ERROR remove: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            
        try:
            print(f"\nTrying rpc.TestCase.delete({case_id})")
            result = rpc.TestCase.delete(case_id)
            print(f"Result: {result}")
        except Exception as e:
            print(f"ERROR delete: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
    
    # Test 4: Try to update a test case
    print("\n=== Test 4: Update test case ===")
    test_cases = rpc.TestCase.filter({})
    if test_cases:
        tc = test_cases[0]
        print(f"Updating test case {tc['id']}")
        try:
            update_data = {
                'summary': tc['summary'] + ' (updated)',
            }
            print(f"Update data: {update_data}")
            result = rpc.TestCase.update(tc['id'], update_data)
            print(f"Result: {result}")
        except Exception as e:
            print(f"ERROR update: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
    
except Exception as e:
    print(f"ERROR: Failed to connect: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

