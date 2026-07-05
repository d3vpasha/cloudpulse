from pydantic import BaseModel
from datetime import datetime
from app.models.enums import ScanStatus, ScanTrigger


class ScanResponse(BaseModel):
    id: str
    connection_id: str
    status: ScanStatus
    trigger: ScanTrigger
    started_at: datetime | None
    finished_at: datetime | None
    regions_scanned: list[str]
    resource_count: int
    finding_count: int
    error_message: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ScanListResponse(BaseModel):
    scans: list[ScanResponse]
    total: int
    page: int
    page_size: int
