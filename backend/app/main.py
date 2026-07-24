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
        if 'scheduled_scans_enabled' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN scheduled_scans_enabled BOOLEAN DEFAULT 1'))
        if 'scan_frequency' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN scan_frequency TEXT DEFAULT "DAILY"'))
        if 'last_scheduled_scan_at' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN last_scheduled_scan_at DATETIME'))
        if 'next_scheduled_scan_at' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN next_scheduled_scan_at DATETIME'))
        if 'manual_scans_today' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN manual_scans_today INTEGER DEFAULT 0'))
        if 'last_manual_scan_date' not in workspaces_columns:
            conn.execute(text('ALTER TABLE workspaces ADD COLUMN last_manual_scan_date DATE'))
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
