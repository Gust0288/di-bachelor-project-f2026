from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql://user:password@localhost:5433/di_portal",
        alias="DATABASE_URL",
    )
    cvr_api_key: str = Field(default="", alias="CVR_API_KEY")
    jwt_secret: str = Field(default="change-me-in-production", alias="JWT_SECRET")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
