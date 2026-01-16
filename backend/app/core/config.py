"""Core configuration for Solvari Radar"""
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment"""

    # App
    APP_NAME: str = "Solvari Radar"
    APP_VERSION: str = "2.1.0"
    DEBUG: bool = True

    # API
    API_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/solvari_radar"
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Providers
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # KVK API
    KVK_API_KEY: Optional[str] = None
    KVK_USE_PRODUCTION: bool = False

    # Google Places API
    GOOGLE_PLACES_API_KEY: Optional[str] = None

    # Scraper Settings
    SCRAPER_DELAY_MIN: float = 1.0
    SCRAPER_DELAY_MAX: float = 3.0
    SCRAPER_MAX_CONCURRENT: int = 5

    # Classification Thresholds
    VAKMAN_MIN_YEARS: int = 5
    QUALITY_SCORE_THRESHOLD: float = 7.0

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra env vars


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
