import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.models.scan import Scan
from app.models.connection import Connection
from app.models.enums import ScanStatus, ConnectionStatus
from app.services.aws.sts import assume_role_session
from app.services.checks.registry import get_all_checks
from app.services.checks.base import CheckContext
from app.services.finding_upsert import upsert_findings
# Import checks to register them
import app.services.checks


def get_active_regions(db: Session) -> list[str]:
    from app.models.workspace import Workspace
    workspace = db.query(Workspace).filter(Workspace.id == 1).first()
    return workspace.active_regions if workspace else ["us-east-1"]


def run_scan_task(scan_id: str) -> None:
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return

        connection = db.query(Connection).filter(Connection.id == scan.connection_id).first()
        if not connection:
            return

        scan.status = ScanStatus.RUNNING
        scan.started_at = datetime.utcnow()
        db.commit()

        try:
            session = assume_role_session(connection)
        except Exception as e:
            scan.status = ScanStatus.FAILED
            scan.error_message = str(e)
            scan.finished_at = datetime.utcnow()
            connection.status = ConnectionStatus.ERROR
            connection.last_test_error = str(e)
            db.commit()
            return

        regions = get_active_regions(db)
        findings_by_check = {}
        region_errors = []

        for region in regions:
            for check_cls in get_all_checks():
                try:
                    ctx = CheckContext(
                        connection=connection, region=region, boto_session=session
                    )
                    check_instance = check_cls()
                    results = check_instance.run(ctx)
                    if check_instance.check_type not in findings_by_check:
                        findings_by_check[check_instance.check_type] = []
                    findings_by_check[check_instance.check_type].extend(results)
                except Exception as e:
                    region_errors.append(f"{region}/{check_cls.check_type}: {str(e)}")

        finding_count = upsert_findings(db, connection, scan, findings_by_check, regions)

        if not findings_by_check and region_errors:
            scan.status = ScanStatus.FAILED
        elif region_errors:
            scan.status = ScanStatus.PARTIAL_FAILURE
        else:
            scan.status = ScanStatus.SUCCEEDED

        scan.regions_scanned = regions
        scan.resource_count = sum(len(f) for f in findings_by_check.values())
        scan.finding_count = finding_count
        scan.error_message = "; ".join(region_errors) if region_errors else None
        scan.finished_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        try:
            scan.status = ScanStatus.FAILED
            scan.error_message = str(e)
            scan.finished_at = datetime.utcnow()
            db.commit()
        except:
            pass
    finally:
        db.close()
