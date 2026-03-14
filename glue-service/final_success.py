
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

from tcms_api import TCMS

print("SSL patch applied...")

rpc = TCMS()
print("TCMS initialized...")

result = rpc.exec('Product.filter', {})
print(f"✅ Success! Result: {result}")
