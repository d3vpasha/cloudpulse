from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.db.base import SessionLocal
from app.models.workspace import Workspace
from app.models.connection import Connection
from app.models.scan import Scan
from app.models.enums import ScanStatus, ScanTrigger, ConnectionStatus
from app.services.scan_orchestrator import run_scan_task
from app.services.plan_service import get_frequency_minutes, get_plan_details
import uuid

scheduler = BackgroundScheduler()


def check_and_run_scheduled_scans():
    db = SessionLocal()
    try:
        workspace = db.query(Workspace).filter(Workspace.id == 1).first()
        if not workspace:
            return

        if workspace.next_scheduled_scan_at and datetime.utcnow() < workspace.next_scheduled_scan_at:
            return

        connections = db.query(Connection).filter(
            Connection.workspace_id == 1,
            Connection.status == ConnectionStatus.CONNECTED,
        ).all()

        if not connections:
            return

        for connection in connections:
            scan = Scan(
                id=str(uuid.uuid4()),
                workspace_id=1,
                connection_id=connection.id,
                connection_name=connection.name,
                status=ScanStatus.PENDING,
                trigger=ScanTrigger.SCHEDULED,
                started_at=datetime.utcnow(),
            )
            db.add(scan)

        workspace.last_scheduled_scan_at = datetime.utcnow()
        plan_details = get_plan_details(workspace.plan)
        minutes = get_frequency_minutes(plan_details.scan_frequency)
        workspace.next_scheduled_scan_at = datetime.utcnow() + timedelta(minutes=minutes)
        db.commit()

        for connection in connections:
            scan = db.query(Scan).filter(
                Scan.connection_id == connection.id,
                Scan.trigger == ScanTrigger.SCHEDULED,
            ).order_by(Scan.created_at.desc()).first()
            if scan:
                run_scan_task(scan.id)

    except Exception as e:
        print(f"Error in scheduled scan check: {e}")
    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            check_and_run_scheduled_scans,
            IntervalTrigger(hours=1),
            id="check_scheduled_scans",
            replace_existing=True,
        )
        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
