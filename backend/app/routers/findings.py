from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, case
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.finding import Finding
from app.models.enums import FindingStatus, CheckCategory, ResourceGroup, RiskLevel
from app.schemas.finding import (
    FindingResponse,
    FindingListResponse,
    FindingSummaryResponse,
    IgnoreFindingRequest,
)

router = APIRouter(prefix="/api/findings", tags=["findings"])


@router.get("", response_model=FindingListResponse)
def list_findings(
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    category: str | None = None,
    resource_group: str | None = None,
    risk_level: str | None = None,
    region: str | None = None,
    connection_id: str | None = None,
    search: str | None = None,
    sort_by: str = "priority_rank",
    sort_order: str = "asc",
    db: Session = Depends(get_db),
):
    query = db.query(Finding).filter(Finding.workspace_id == 1)

    if status:
        try:
            query = query.filter(Finding.status == FindingStatus(status))
        except ValueError:
            pass

    if category:
        try:
            query = query.filter(Finding.category == CheckCategory(category))
        except ValueError:
            pass

    if resource_group:
        try:
            query = query.filter(Finding.resource_group == ResourceGroup(resource_group))
        except ValueError:
            pass

    if risk_level:
        try:
            query = query.filter(Finding.risk_level == RiskLevel(risk_level))
        except ValueError:
            pass

    if region:
        query = query.filter(Finding.region == region)

    if connection_id:
        query = query.filter(Finding.connection_id == connection_id)

    if search:
        query = query.filter(
            Finding.title.ilike(f"%{search}%") | Finding.description.ilike(f"%{search}%")
        )

    total = query.count()

    is_desc = sort_order.lower() == "desc"

    if sort_by == "priority_rank":
        order_expr = Finding.priority_rank.desc() if is_desc else Finding.priority_rank.asc()
        query = query.order_by(order_expr, Finding.created_at.desc())
    elif sort_by == "category":
        order_expr = Finding.category.desc() if is_desc else Finding.category.asc()
        query = query.order_by(order_expr)
    elif sort_by == "region":
        order_expr = Finding.region.desc() if is_desc else Finding.region.asc()
        query = query.order_by(order_expr)
    elif sort_by == "savings":
        order_expr = Finding.estimated_monthly_savings.desc() if is_desc else Finding.estimated_monthly_savings.asc()
        query = query.order_by(order_expr)
    elif sort_by == "risk_level":
        risk_severity = case(
            (Finding.risk_level == RiskLevel.CRITICAL, 0),
            (Finding.risk_level == RiskLevel.HIGH, 1),
            (Finding.risk_level == RiskLevel.MEDIUM, 2),
            (Finding.risk_level == RiskLevel.LOW, 3),
            else_=4,
        )
        order_expr = risk_severity.desc() if is_desc else risk_severity.asc()
        query = query.order_by(order_expr)
    elif sort_by == "first_detected_at":
        order_expr = Finding.first_detected_at.desc() if is_desc else Finding.first_detected_at.asc()
        query = query.order_by(order_expr)
    else:
        query = query.order_by(Finding.created_at.desc())

    findings = query.offset((page - 1) * page_size).limit(page_size).all()

    return FindingListResponse(findings=findings, total=total, page=page, page_size=page_size)


@router.get("/{finding_id}", response_model=FindingResponse)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding


@router.post("/{finding_id}/ignore")
def ignore_finding(
    finding_id: str,
    request: IgnoreFindingRequest,
    db: Session = Depends(get_db),
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.status = FindingStatus.IGNORED
    finding.ignored_at = datetime.utcnow()
    finding.ignored_reason = request.reason
    db.commit()

    return {"success": True}


@router.post("/{finding_id}/unignore")
def unignore_finding(finding_id: str, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.status = FindingStatus.OPEN
    finding.ignored_at = None
    finding.ignored_reason = None
    db.commit()

    return {"success": True}


@router.get("/summary/by-risk", response_model=FindingSummaryResponse)
def get_findings_summary(
    connection_id: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Finding).filter(
        Finding.workspace_id == 1,
        Finding.status.in_([FindingStatus.OPEN, FindingStatus.IGNORED]),
    )

    if connection_id:
        query = query.filter(Finding.connection_id == connection_id)

    all_findings = query.all()

    total_findings = len(all_findings)
    total_savings = sum(f.estimated_monthly_savings for f in all_findings)

    risk_counts = {
        "critical": sum(1 for f in all_findings if f.risk_level == RiskLevel.CRITICAL),
        "high": sum(1 for f in all_findings if f.risk_level == RiskLevel.HIGH),
        "medium": sum(1 for f in all_findings if f.risk_level == RiskLevel.MEDIUM),
        "low": sum(1 for f in all_findings if f.risk_level == RiskLevel.LOW),
    }

    return FindingSummaryResponse(
        total_findings=total_findings,
        critical=risk_counts["critical"],
        high=risk_counts["high"],
        medium=risk_counts["medium"],
        low=risk_counts["low"],
        informational=0,
        total_monthly_savings=round(total_savings, 2),
    )
