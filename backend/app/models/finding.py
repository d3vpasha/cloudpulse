from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, JSON, Float, UniqueConstraint
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel, FindingStatus
import hashlib


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), default=1)
    aws_account_id = Column(String)
    connection_id = Column(String, ForeignKey("connections.id"), nullable=True)
    first_seen_scan_id = Column(String, ForeignKey("scans.id"))
    last_seen_scan_id = Column(String, ForeignKey("scans.id"))

    check_type = Column(String)
    finding_code = Column(String, nullable=True)
    category = Column(Enum(CheckCategory))
    resource_group = Column(Enum(ResourceGroup))
    resource_type = Column(String)
    resource_id = Column(String)
    dedup_hash = Column(String, nullable=True)
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
        UniqueConstraint("workspace_id", "dedup_hash", name="uq_finding_dedup"),
    )


def compute_dedup_hash(workspace_id: int, aws_account_id: str, finding_code: str, resource_id: str) -> str:
    key = f"{workspace_id}:{aws_account_id}:{finding_code}:{resource_id}"
    return hashlib.sha256(key.encode()).hexdigest()
