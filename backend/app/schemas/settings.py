from pydantic import BaseModel


class SettingsResponse(BaseModel):
    active_providers: list[str]
    active_regions: list[str]


class SettingsUpdate(BaseModel):
    active_providers: list[str] | None = None
    active_regions: list[str] | None = None
