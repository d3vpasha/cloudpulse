import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.scan import Scan
from app.models.connection import Connection
from app.models.workspace import Workspace
from app.models.enums import ScanStatus, ConnectionStatus, ScanTrigger
from app.schemas.scan import ScanResponse, ScanListResponse
from app.services.scan_orchestrator import run_scan_task

router = APIRouter(prefix="/api", tags=["scans"])


@router.post("/connections/{connection_id}/scans", response_model=ScanResponse, status_code=202)
def trigger_scan(
    connection_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if connection.status != ConnectionStatus.CONNECTED:
        raise HTTPException(
            status_code=400,
            detail="Connection must be tested and connected before scanning",
        )

    workspace = db.query(Workspace).filter(Workspace.id == 1).first()
    if not workspace or not workspace.active_providers or len(workspace.active_providers) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one provider must be enabled in Settings",
        )

    if not workspace.active_regions or len(workspace.active_regions) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one region must be selected in Settings",
        )

    scan = Scan(
        id=str(uuid.uuid4()),
        workspace_id=1,
        connection_id=connection_id,
        connection_name=connection.name,
        status=ScanStatus.PENDING,
        trigger=ScanTrigger.MANUAL,
        started_at=datetime.utcnow(),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    background_tasks.add_task(run_scan_task, scan.id)

    return scan


@router.get("/scans", response_model=ScanListResponse)
def list_scans(
    page: int = 1, page_size: int = 10, connection_id: str | None = None, db: Session = Depends(get_db)
):
    query = db.query(Scan).filter(Scan.workspace_id == 1)

    if connection_id:
        query = query.filter(Scan.connection_id == connection_id)

    total = query.count()
    scans = (
        query.order_by(Scan.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ScanListResponse(scans=scans, total=total, page=page, page_size=page_size)


@router.get("/scans/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/scans/latest/by-connection/{connection_id}", response_model=ScanResponse)
def get_latest_scan_for_connection(
    connection_id: str, db: Session = Depends(get_db)
):
    scan = (
        db.query(Scan)
        .filter(Scan.connection_id == connection_id)
        .order_by(Scan.created_at.desc())
        .first()
    )
    if not scan:
        raise HTTPException(status_code=404, detail="No scans found for this connection")
    return scan
