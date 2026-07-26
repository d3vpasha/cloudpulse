from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.config import settings
from app.db.base import engine, Base
from app.models.workspace import Workspace
from app.models.connection import Connection
from app.models.scan import Scan
from app.models.finding import Finding
from app.routers import connections, scans, findings, dashboard, settings as settings_router, meta
from app.services.scheduler import start_scheduler, stop_scheduler
from app.services.aws.identity import validate_aws_credentials
from app.services.plan_service import get_plan_details, is_aligned_scan_time
from app.models.finding import compute_dedup_hash, Finding
from app.models.enums import FindingStatus

app = FastAPI(
    title="CloudPulse API",
    description="Multi-cloud FinOps scanner",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

from sqlalchemy.orm import Session
from app.db.base import SessionLocal

def run_migrations():
    inspector = inspect(engine)
    scans_columns = [col['name'] for col in inspector.get_columns('scans')]
    if 'connection_name' not in scans_columns:
        with engine.connect() as conn:
            conn.execute(text('ALTER TABLE scans ADD COLUMN connection_name TEXT'))
            conn.commit()

    workspaces_columns = [col['name'] for col in inspector.get_columns('workspaces')]
    with engine.connect() as conn:
        if 'plan' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN plan TEXT DEFAULT "FREE"'))
        if 'last_scheduled_scan_at' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN last_scheduled_scan_at DATETIME'))
        if 'next_scheduled_scan_at' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN next_scheduled_scan_at DATETIME'))
        if 'manual_scans_today' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN manual_scans_today INTEGER DEFAULT 0'))
        if 'last_manual_scan_date' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN last_manual_scan_date DATE'))
        conn.commit()

    findings_columns = [col['name'] for col in inspector.get_columns('findings')]
    with engine.connect() as conn:
        if 'aws_account_id' not in findings_columns:
            conn.execute(text('ALTER TABLE findings ADD COLUMN aws_account_id TEXT'))
        if 'finding_code' not in findings_columns:
            conn.execute(text('ALTER TABLE findings ADD COLUMN finding_code TEXT'))
        if 'dedup_hash' not in findings_columns:
            conn.execute(text('ALTER TABLE findings ADD COLUMN dedup_hash TEXT'))
        conn.commit()

run_migrations()

def init_workspace():
    db = SessionLocal()
    try:
        workspace = db.query(Workspace).filter(Workspace.id == 1).first()
        if not workspace:
            workspace = Workspace(id=1, name="default")
            db.add(workspace)
            db.commit()
    finally:
        db.close()

init_workspace()


def fix_legacy_scan_schedule():
    db = SessionLocal()
    try:
        workspace = db.query(Workspace).filter(Workspace.id == 1).first()
        if workspace and workspace.next_scheduled_scan_at:
            plan_details = get_plan_details(workspace.plan)
            if not is_aligned_scan_time(plan_details.scan_frequency, workspace.next_scheduled_scan_at):
                workspace.next_scheduled_scan_at = None
                db.commit()
    finally:
        db.close()

fix_legacy_scan_schedule()


def backfill_and_dedupe_findings():
    from app.services.checks.registry import get_check
    db = SessionLocal()
    try:
        findings = db.query(Finding).filter(Finding.workspace_id == 1).all()

        for finding in findings:
            if not finding.aws_account_id:
                if finding.connection_id:
                    conn = db.query(Connection).filter(Connection.id == finding.connection_id).first()
                    if conn and conn.aws_account_id:
                        finding.aws_account_id = conn.aws_account_id

                if not finding.aws_account_id:
                    fallback_conn = db.query(Connection).filter(
                        Connection.workspace_id == 1,
                        Connection.status == 'connected'
                    ).first()
                    if fallback_conn and fallback_conn.aws_account_id:
                        finding.aws_account_id = fallback_conn.aws_account_id

            if not finding.finding_code:
                check_cls = get_check(finding.check_type)
                if check_cls:
                    finding.finding_code = check_cls.finding_code

        db.commit()

        findings = db.query(Finding).filter(Finding.workspace_id == 1).all()
        for finding in findings:
            if finding.aws_account_id and finding.finding_code:
                finding.dedup_hash = compute_dedup_hash(1, finding.aws_account_id, finding.finding_code, finding.resource_id)

        db.commit()

        findings = db.query(Finding).filter(Finding.workspace_id == 1).all()
        dedup_groups = {}
        for finding in findings:
            key = (1, finding.dedup_hash)
            if key not in dedup_groups:
                dedup_groups[key] = []
            dedup_groups[key].append(finding)

        for group in dedup_groups.values():
            if len(group) > 1:
                oldest = min(group, key=lambda f: f.first_detected_at)
                newest = max(group, key=lambda f: f.last_detected_at)

                kept_status = FindingStatus.IGNORED if any(f.status == FindingStatus.IGNORED for f in group) else FindingStatus.OPEN
                kept_ignored_reason = next((f.ignored_reason for f in group if f.status == FindingStatus.IGNORED), None)

                oldest.last_detected_at = newest.last_detected_at
                oldest.last_seen_scan_id = newest.last_seen_scan_id
                oldest.connection_id = newest.connection_id
                oldest.aws_account_id = newest.aws_account_id
                oldest.estimated_monthly_savings = newest.estimated_monthly_savings
                oldest.description = newest.description
                oldest.raw_metadata = newest.raw_metadata
                oldest.status = kept_status
                oldest.ignored_reason = kept_ignored_reason

                for duplicate in group:
                    if duplicate.id != oldest.id:
                        db.delete(duplicate)

        db.commit()
    finally:
        db.close()


backfill_and_dedupe_findings()

# Validate AWS credentials are available before starting
validate_aws_credentials()

app.include_router(connections.router)
app.include_router(scans.router)
app.include_router(findings.router)
app.include_router(dashboard.router)
app.include_router(settings_router.router)
app.include_router(meta.router)


@app.on_event("startup")
def startup_event():
    start_scheduler()


@app.on_event("shutdown")
def shutdown_event():
    stop_scheduler()


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
