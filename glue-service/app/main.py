
import sys

try:
    import distutils.util
except ImportError:
    class MockDistutilsUtil:
        @staticmethod
        def strtobool(val):
            val = val.lower()
            if val in ('y', 'yes', 't', 'true', 'on', '1'):
                return 1
            elif val in ('n', 'no', 'f', 'false', 'off', '0'):
                return 0
            else:
                raise ValueError(f"invalid truth value {val!r}")
    
    class MockDistutils:
        util = MockDistutilsUtil()
    
    mock_distutils = MockDistutils()
    sys.modules['distutils'] = mock_distutils
    sys.modules['distutils.util'] = mock_distutils.util

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import hierarchy, testcases

app = FastAPI(title="路测助手 - 胶水服务", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hierarchy.router)
app.include_router(testcases.router)


@app.get("/")
async def root():
    return {"message": "路测助手 API 服务", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
