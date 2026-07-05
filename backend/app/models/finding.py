from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, JSON, Float, UniqueConstraint
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel, FindingStatus


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), default=1)
    connection_id = Column(String, ForeignKey("connections.id"))
    first_seen_scan_id = Column(String, ForeignKey("scans.id"))
    last_seen_scan_id = Column(String, ForeignKey("scans.id"))

    check_type = Column(String)
    category = Column(Enum(CheckCategory))
    resource_group = Column(Enum(ResourceGroup))
    resource_type = Column(String)
    resource_id = Column(String)
    region = Column(String)

    title = Column(String)
    description = Column(String)
    risk_level = Column(Enum(RiskLevel))
    priority_rank = Column(Integer)
    estimated_monthly_savings = Column(Float)

    status = Column(Enum(FindingStatus), default=FindingStatus.OPEN)
    first_detected_at = Column(DateTime, server_default=func.now())
    last_detected_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime, nullable=True)
    ignored_at = Column(DateTime, nullable=True)
    ignored_reason = Column(String, nullable=True)

    raw_metadata = Column(JSON, default={})
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("connection_id", "check_type", "resource_id", name="uq_finding_dedup"),
    )
