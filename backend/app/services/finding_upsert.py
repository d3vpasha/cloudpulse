from datetime import datetime
from sqlalchemy.orm import Session
from app.models.finding import Finding, compute_dedup_hash
from app.models.scan import Scan
from app.models.connection import Connection
from app.models.enums import FindingStatus
from app.services.checks.base import CheckFinding


def risk_level_to_priority(risk_level) -> int:
    priority_map = {"critical": 1, "high": 2, "medium": 3, "low": 4}
    return priority_map.get(risk_level.value, 5)


def upsert_findings(
    db: Session,
    connection: Connection,
    scan: Scan,
    findings_by_check: dict[str, list[CheckFinding]],
    regions_covered: list[str],
) -> int:
    """
    Upsert findings from a scan. Returns count of open findings after processing.

    Dedup key: (workspace_id, dedup_hash)
    - New finding -> insert, status=OPEN
    - Existing OPEN/RESOLVED -> refresh fields, reopen if needed, keep first_detected_at
    - Existing IGNORED -> refresh fields only, keep status=IGNORED
    - Not seen this scan + region ran -> auto-resolve
    """
    all_findings = []
    for check_findings in findings_by_check.values():
        all_findings.extend(check_findings)

    seen_keys = set()

    for finding_draft in all_findings:
        dedup_hash = compute_dedup_hash(1, connection.aws_account_id, finding_draft.finding_code, finding_draft.resource_id)
        seen_keys.add(dedup_hash)

        existing = db.query(Finding).filter(
            Finding.workspace_id == 1,
            Finding.dedup_hash == dedup_hash,
        ).first()

        if existing:
            existing.connection_id = connection.id
            existing.aws_account_id = connection.aws_account_id
            if existing.status == FindingStatus.IGNORED:
                existing.last_seen_scan_id = scan.id
                existing.last_detected_at = datetime.utcnow()
                existing.estimated_monthly_savings = finding_draft.estimated_monthly_savings
                existing.description = finding_draft.description
                existing.raw_metadata = finding_draft.raw_metadata
            else:
                existing.last_seen_scan_id = scan.id
                existing.last_detected_at = datetime.utcnow()
                existing.estimated_monthly_savings = finding_draft.estimated_monthly_savings
                existing.description = finding_draft.description
                existing.raw_metadata = finding_draft.raw_metadata
                if existing.status == FindingStatus.RESOLVED:
                    existing.status = FindingStatus.OPEN
                    existing.resolved_at = None
        else:
            import uuid
            new_finding = Finding(
                id=str(uuid.uuid4()),
                workspace_id=1,
                aws_account_id=connection.aws_account_id,
                connection_id=connection.id,
                first_seen_scan_id=scan.id,
                last_seen_scan_id=scan.id,
                check_type=finding_draft.check_type,
                finding_code=finding_draft.finding_code,
                category=finding_draft.category,
                resource_group=finding_draft.resource_group,
                resource_type=finding_draft.resource_type,
                resource_id=finding_draft.resource_id,
                dedup_hash=dedup_hash,
                region=finding_draft.region,
                title=finding_draft.title,
                description=finding_draft.description,
                risk_level=finding_draft.risk_level,
                priority_rank=risk_level_to_priority(finding_draft.risk_level),
                estimated_monthly_savings=finding_draft.estimated_monthly_savings,
                status=FindingStatus.OPEN,
                raw_metadata=finding_draft.raw_metadata,
            )
            db.add(new_finding)

    auto_resolve_findings(db, connection, scan, seen_keys, regions_covered)

    db.commit()

    open_findings = db.query(Finding).filter(
        Finding.workspace_id == 1,
        Finding.status.in_([FindingStatus.OPEN, FindingStatus.IGNORED]),
    ).all()

    return len(open_findings)


def auto_resolve_findings(
    db: Session,
    connection: Connection,
    scan: Scan,
    seen_keys: set[str],
    regions_covered: list[str],
) -> None:
    """
    Auto-resolve findings not seen in this scan (if the region/check actually ran).
    """
    from app.services.checks.registry import get_all_checks

    checks_by_type = {check.check_type: check for check in get_all_checks()}

    stale_findings = db.query(Finding).filter(
        Finding.workspace_id == 1,
        Finding.aws_account_id == connection.aws_account_id,
        Finding.status.in_([FindingStatus.OPEN, FindingStatus.IGNORED]),
    ).all()

    for finding in stale_findings:
        if (
            finding.dedup_hash not in seen_keys
            and finding.region in regions_covered
            and finding.check_type in checks_by_type
        ):
            finding.status = FindingStatus.RESOLVED
            finding.resolved_at = datetime.utcnow()
