
import ssl
import sys

ssl._create_default_https_context = ssl._create_unverified_context

from tcms_api import TCMS

print("SSL patch applied...")

rpc = TCMS()
print("TCMS initialized...")

print("\n" + "="*60)
print("dir(rpc) content:")
print("="*60)
print(dir(rpc))

print("\n" + "="*60)
print("Trying various API paths...")
print("="*60)

for attr_name in dir(rpc):
    if not attr_name.startswith('_'):
        try:
            attr = getattr(rpc, attr_name)
            if hasattr(attr, 'filter'):
                print(f"✓ Found {attr_name} with .filter() method!")
                try:
                    result = attr.filter({})
                    print(f"  → filter() succeeded, got {len(result)} items")
                except Exception as e:
                    print(f"  → filter() failed: {type(e).__name__}: {e}")
        except Exception as e:
            pass
