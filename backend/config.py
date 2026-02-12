from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    """Application settings"""
    
    # LLM Configuration
    gemini_api_key: str = ""
    openrouter_api_key: str = ""
    llm_provider: Literal["gemini", "openrouter"] = "gemini"
    gemini_model: str = "gemini-1.5-flash"
    openrouter_model: str = "google/gemini-flash-1.5"
    
    # Application
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"
    log_level: str = "INFO"
    
    # Risk zones (simulated data)
    enable_risk_zones: bool = True
    risk_zone_count: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
