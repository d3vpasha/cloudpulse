from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean, Date
from sqlalchemy.sql import func
from app.db.base import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, default=1)
    name = Column(String, default="default")
    active_providers = Column(JSON, default=["aws"])
    active_regions = Column(JSON, default=["us-east-1"])
    plan = Column(String, default="FREE")
    scheduled_scans_enabled = Column(Boolean, default=True)
    scan_frequency = Column(String, default="DAILY")
    last_scheduled_scan_at = Column(DateTime)
    next_scheduled_scan_at = Column(DateTime)
    manual_scans_today = Column(Integer, default=0)
    last_manual_scan_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
