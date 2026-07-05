from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import ScanStatus, ScanTrigger


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), default=1)
    connection_id = Column(String, ForeignKey("connections.id"))
    connection_name = Column(String, nullable=True)
    status = Column(Enum(ScanStatus), default=ScanStatus.PENDING)
    trigger = Column(Enum(ScanTrigger), default=ScanTrigger.MANUAL)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    regions_scanned = Column(JSON, default=[])
    resource_count = Column(Integer, default=0)
    finding_count = Column(Integer, default=0)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
