from pydantic import BaseModel
from datetime import datetime
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel, FindingStatus


class FindingResponse(BaseModel):
    id: str
    check_type: str
    category: CheckCategory
    resource_group: ResourceGroup
    resource_type: str
    resource_id: str
    region: str
    title: str
    description: str
    risk_level: RiskLevel
    priority_rank: int
    estimated_monthly_savings: float
    status: FindingStatus
    first_detected_at: datetime
    last_detected_at: datetime
    ignored_reason: str | None
    raw_metadata: dict

    class Config:
        from_attributes = True


class FindingListResponse(BaseModel):
    findings: list[FindingResponse]
    total: int
    page: int
    page_size: int


class FindingSummaryResponse(BaseModel):
    total_findings: int
    critical: int
    high: int
    medium: int
    low: int
    informational: int
    total_monthly_savings: float


class IgnoreFindingRequest(BaseModel):
    reason: str | None = None
