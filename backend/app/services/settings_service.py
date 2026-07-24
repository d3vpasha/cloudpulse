from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.workspace import Workspace
from app.schemas.settings import SettingsUpdate, ScanScheduleUpdate
from app.services.plan_service import get_frequency_minutes


def get_settings(db: Session) -> Workspace:
    workspace = db.query(Workspace).filter(Workspace.id == 1).first()
    if not workspace:
        workspace = Workspace(id=1)
        db.add(workspace)
        db.commit()
    return workspace


def update_settings(db: Session, settings_update: SettingsUpdate) -> Workspace:
    workspace = get_settings(db)

    if settings_update.active_providers is not None:
        allowed_providers = {"aws", "gcp", "azure"}
        invalid = [p for p in settings_update.active_providers if p not in allowed_providers]
        if invalid:
            raise ValueError(f"Invalid providers: {invalid}")
        allowed_for_v1 = {"aws"}
        non_aws = [p for p in settings_update.active_providers if p not in allowed_for_v1]
        if non_aws:
            raise ValueError(f"Providers {non_aws} are not yet available")
        workspace.active_providers = settings_update.active_providers

    if settings_update.active_regions is not None:
        workspace.active_regions = settings_update.active_regions

    db.commit()
    return workspace


def update_scan_schedule(db: Session, schedule_update: ScanScheduleUpdate) -> Workspace:
    workspace = get_settings(db)

    valid_frequencies = {"HOURLY", "EVERY_6H", "DAILY"}
    if schedule_update.scan_frequency not in valid_frequencies:
        raise ValueError(f"Invalid frequency. Must be one of: {valid_frequencies}")

    workspace.scheduled_scans_enabled = schedule_update.scheduled_scans_enabled
    workspace.scan_frequency = schedule_update.scan_frequency

    if schedule_update.scheduled_scans_enabled:
        minutes = get_frequency_minutes(schedule_update.scan_frequency)
        workspace.next_scheduled_scan_at = datetime.utcnow() + timedelta(minutes=minutes)
    else:
        workspace.next_scheduled_scan_at = None

    db.commit()
    return workspace
