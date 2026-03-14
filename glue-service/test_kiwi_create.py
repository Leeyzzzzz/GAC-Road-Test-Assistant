import ssl
from tcms_api.xmlrpc import TCMSXmlrpc

ssl._create_default_https_context = ssl._create_unverified_context

print("Testing Kiwi TCMS TestCase create...")
rpc_impl = TCMSXmlrpc("admin", "a646455547", "https://localhost:8443/xml-rpc/")
rpc_impl.login()
rpc = rpc_impl.server

print("\n=== Getting categories ===")
try:
    categories = rpc.Category.filter({})
    print(f"Categories found: {len(categories)}")
    for c in categories:
        print(f"  - {c['id']}: {c['name']}")
except Exception as e:
    print(f"Error getting categories: {e}")

print("\n=== Getting priority values ===")
try:
    priorities = rpc.Priority.filter({})
    print(f"Priorities found: {len(priorities)}")
    for p in priorities:
        print(f"  - {p['id']}: {p['value']}")
except Exception as e:
    print(f"Error getting priorities: {e}")

print("\n=== Trying to create a test case ===")
try:
    if categories:
        test_case_data = {
            "summary": "Test case from script",
            "category": categories[0]['id'],
            "priority": 3,
            "is_automated": False,
            "text": "Test steps",
            "setup": "Setup",
            "breakdown": "Expected results"
        }
        print(f"Data to send: {test_case_data}")
        new_case = rpc.TestCase.create(test_case_data)
        print(f"SUCCESS! Created test case: {new_case}")
    else:
        print("No categories found, cannot create test case")
except Exception as e:
    print(f"ERROR creating test case: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
