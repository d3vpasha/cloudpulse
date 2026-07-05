from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.connection import Connection
from app.models.scan import Scan
from app.models.finding import Finding
from app.models.enums import FindingStatus, RiskLevel
from app.schemas.dashboard import DashboardOverviewResponse
from app.schemas.connection import ConnectionResponse
from app.schemas.scan import ScanResponse
from app.schemas.finding import FindingResponse, FindingSummaryResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(db: Session = Depends(get_db)):
    connections = db.query(Connection).filter(Connection.workspace_id == 1).all()

    latest_scan = (
        db.query(Scan)
        .filter(Scan.workspace_id == 1)
        .order_by(Scan.created_at.desc())
        .first()
    )

    findings_query = db.query(Finding).filter(
        Finding.workspace_id == 1,
        Finding.status.in_([FindingStatus.OPEN, FindingStatus.IGNORED]),
    )

    total_findings = findings_query.count()
    all_findings = findings_query.all()

    critical = sum(1 for f in all_findings if f.risk_level == RiskLevel.CRITICAL)
    high = sum(1 for f in all_findings if f.risk_level == RiskLevel.HIGH)
    medium = sum(1 for f in all_findings if f.risk_level == RiskLevel.MEDIUM)
    low = sum(1 for f in all_findings if f.risk_level == RiskLevel.LOW)

    total_savings = sum(f.estimated_monthly_savings for f in all_findings)

    summary = FindingSummaryResponse(
        total_findings=total_findings,
        critical=critical,
        high=high,
        medium=medium,
        low=low,
        informational=0,
        total_monthly_savings=round(total_savings, 2),
    )

    risk_distribution = {
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
    }

    top_findings = (
        db.query(Finding)
        .filter(
            Finding.workspace_id == 1,
            Finding.status.in_([FindingStatus.OPEN, FindingStatus.IGNORED]),
        )
        .order_by(Finding.priority_rank.asc(), Finding.created_at.desc())
        .limit(5)
        .all()
    )

    return DashboardOverviewResponse(
        connections=connections,
        latest_scan=latest_scan,
        summary=summary,
        risk_distribution=risk_distribution,
        top_findings=top_findings,
    )
