from pydantic import BaseModel
from datetime import datetime
from app.models.enums import CheckCategory, RiskLevel
from app.schemas.connection import ConnectionResponse
from app.schemas.scan import ScanResponse
from app.schemas.finding import FindingSummaryResponse


class CommonIssueResponse(BaseModel):
    check_type: str
    display_name: str
    resource_type: str
    risk_level: RiskLevel
    category: CheckCategory
    count: int
    monthly_savings: float


class DashboardOverviewResponse(BaseModel):
    connections: list[ConnectionResponse]
    latest_scan: ScanResponse | None
    summary: FindingSummaryResponse
    risk_distribution: dict
    common_issues: list[CommonIssueResponse]
