from pydantic import BaseModel
from datetime import datetime


class SettingsResponse(BaseModel):
    active_providers: list[str]
    active_regions: list[str]
    scan_frequency: str
    plan_name: str
    next_scheduled_scan_at: datetime | None
    manual_scans_today: int
    manual_scans_limit: int | None


class SettingsUpdate(BaseModel):
    active_providers: list[str] | None = None
    active_regions: list[str] | None = None
