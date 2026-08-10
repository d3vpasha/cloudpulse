from pydantic import BaseModel
from datetime import datetime


class SettingsResponse(BaseModel):
    active_providers: list[str]
    active_regions: list[str]
    scan_frequency: str
    plan_name: str
    has_active_connection: bool
    next_scheduled_scan_at: datetime | None
    manual_scans_today: int
    manual_scans_limit: int | None
    log_retention_threshold_days: int
    access_key_unused_threshold_days: int


class SettingsUpdate(BaseModel):
    active_providers: list[str] | None = None
    active_regions: list[str] | None = None
    log_retention_threshold_days: int | None = None
    access_key_unused_threshold_days: int | None = None
