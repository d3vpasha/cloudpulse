from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.settings import SettingsResponse, SettingsUpdate, ScanScheduleUpdate
from app.services.settings_service import get_settings, update_settings, update_scan_schedule
from app.services.plan_service import get_plan_details

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_workspace_settings(db: Session = Depends(get_db)):
    workspace = get_settings(db)
    plan_details = get_plan_details(workspace.plan)
    return SettingsResponse(
        active_providers=workspace.active_providers,
        active_regions=workspace.active_regions,
        scheduled_scans_enabled=workspace.scheduled_scans_enabled,
        scan_frequency=workspace.scan_frequency,
        next_scheduled_scan_at=workspace.next_scheduled_scan_at,
        manual_scans_today=workspace.manual_scans_today,
        manual_scans_limit=plan_details.manual_scans_per_day_limit,
    )


@router.put("", response_model=SettingsResponse)
def update_workspace_settings(
    settings_update: SettingsUpdate, db: Session = Depends(get_db)
):
    try:
        workspace = update_settings(db, settings_update)
        plan_details = get_plan_details(workspace.plan)
        return SettingsResponse(
            active_providers=workspace.active_providers,
            active_regions=workspace.active_regions,
            scheduled_scans_enabled=workspace.scheduled_scans_enabled,
            scan_frequency=workspace.scan_frequency,
            next_scheduled_scan_at=workspace.next_scheduled_scan_at,
            manual_scans_today=workspace.manual_scans_today,
            manual_scans_limit=plan_details.manual_scans_per_day_limit,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/scan-schedule", response_model=SettingsResponse)
def update_scan_schedule_settings(
    schedule_update: ScanScheduleUpdate, db: Session = Depends(get_db)
):
    try:
        workspace = update_scan_schedule(db, schedule_update)
        plan_details = get_plan_details(workspace.plan)
        return SettingsResponse(
            active_providers=workspace.active_providers,
            active_regions=workspace.active_regions,
            scheduled_scans_enabled=workspace.scheduled_scans_enabled,
            scan_frequency=workspace.scan_frequency,
            next_scheduled_scan_at=workspace.next_scheduled_scan_at,
            manual_scans_today=workspace.manual_scans_today,
            manual_scans_limit=plan_details.manual_scans_per_day_limit,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
