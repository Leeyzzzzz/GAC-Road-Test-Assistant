
from tcms_api import TCMS

print("Testing tcms-api connection...")
rpc = TCMS()
print("Connected!")

print("\nGetting products...")
products = rpc.Product.filter({})
print(f"Found {len(products)} products:")
for p in products:
    print(f"  - {p['id']}: {p['name']}")
