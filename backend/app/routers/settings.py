from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.services.settings_service import get_settings, update_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_workspace_settings(db: Session = Depends(get_db)):
    workspace = get_settings(db)
    return SettingsResponse(
        active_providers=workspace.active_providers,
        active_regions=workspace.active_regions,
    )


@router.put("", response_model=SettingsResponse)
def update_workspace_settings(
    settings_update: SettingsUpdate, db: Session = Depends(get_db)
):
    try:
        workspace = update_settings(db, settings_update)
        return SettingsResponse(
            active_providers=workspace.active_providers,
            active_regions=workspace.active_regions,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
