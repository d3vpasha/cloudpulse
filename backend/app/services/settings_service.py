from sqlalchemy.orm import Session
from app.models.workspace import Workspace
from app.models.connection import Connection
from app.models.enums import ConnectionStatus
from app.schemas.settings import SettingsUpdate


def get_settings(db: Session) -> Workspace:
    workspace = db.query(Workspace).filter(Workspace.id == 1).first()
    if not workspace:
        workspace = Workspace(id=1)
        db.add(workspace)
        db.commit()
    return workspace


def has_active_connection(db: Session) -> bool:
    connection = db.query(Connection).filter(
        Connection.workspace_id == 1,
        Connection.status == ConnectionStatus.CONNECTED,
    ).first()
    return connection is not None


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

    if settings_update.log_retention_threshold_days is not None:
        if not (1 <= settings_update.log_retention_threshold_days <= 3653):
            raise ValueError("log_retention_threshold_days must be between 1 and 3653")
        workspace.log_retention_threshold_days = settings_update.log_retention_threshold_days

    if settings_update.access_key_unused_threshold_days is not None:
        if not (1 <= settings_update.access_key_unused_threshold_days <= 365):
            raise ValueError("access_key_unused_threshold_days must be between 1 and 365")
        workspace.access_key_unused_threshold_days = settings_update.access_key_unused_threshold_days

    db.commit()
    return workspace
