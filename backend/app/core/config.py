from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql://user:password@localhost:5433/di_portal",
        alias="DATABASE_URL",
    )
    cvr_api_key: str = Field(default="", alias="CVR_API_KEY")
    cvr_contact_email: str = Field(default="di-portal@di.dk", alias="CVR_CONTACT_EMAIL")
    virkdata_api_key: str = Field(default="", alias="VIRKDATA_API_KEY")
    jwt_secret: str = Field(alias="JWT_SECRET")

    smtp_host: str = Field(default="smtp.gmail.com", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_user: str = Field(default="", alias="SMTP_USER")
    smtp_password: str = Field(default="", alias="SMTP_PASSWORD")
    email_from: str = Field(default="", alias="EMAIL_FROM")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")
    cvr_mock: bool = Field(default=False, alias="CVR_MOCK")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
