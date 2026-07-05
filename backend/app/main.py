from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.base import engine, Base
from app.models.workspace import Workspace
from app.models.connection import Connection
from app.models.scan import Scan
from app.models.finding import Finding
from app.routers import connections, scans, findings, dashboard, settings as settings_router, meta

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


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
