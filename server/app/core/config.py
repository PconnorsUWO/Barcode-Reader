from pydantic import BaseSettings

class Settings(BaseSettings):
    API_TITLE: str = "Barcode API"

settings = Settings() 
