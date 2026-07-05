from pydantic import BaseModel
from datetime import datetime
from app.schemas.connection import ConnectionResponse
from app.schemas.scan import ScanResponse
from app.schemas.finding import FindingResponse, FindingSummaryResponse


class DashboardOverviewResponse(BaseModel):
    connections: list[ConnectionResponse]
    latest_scan: ScanResponse | None
    summary: FindingSummaryResponse
    risk_distribution: dict
    top_findings: list[FindingResponse]
