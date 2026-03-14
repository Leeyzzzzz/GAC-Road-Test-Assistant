
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    KIWI_URL: str = "http://localhost:8080"
    KIWI_USERNAME: str = "admin"
    KIWI_PASSWORD: str = "admin"
    CORS_ORIGINS: list = ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
