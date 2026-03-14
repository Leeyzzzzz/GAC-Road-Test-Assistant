
from tcms_api import TCMS
import inspect

print("TCMS class signature:", inspect.signature(TCMS.__init__))
print("\nTCMS module docstring:", TCMS.__doc__ if TCMS.__doc__ else "No docstring")
print("\nDir of TCMS:", dir(TCMS))
