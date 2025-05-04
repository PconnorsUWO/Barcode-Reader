# server/app/core/models.py
from pydantic import BaseModel, Field
from datetime import datetime

class ScanIn(BaseModel):
    barcode: str            = Field(..., min_length=4)
    location: str           = Field(default="Unknown Location")
    timestamp: datetime     = Field(default_factory=datetime.utcnow)
    method: str             = Field(default="auto")
