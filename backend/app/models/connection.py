from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import ProviderType, ConnectionStatus


class Connection(Base):
    __tablename__ = "connections"

    id = Column(String, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), default=1)
    provider = Column(Enum(ProviderType), default=ProviderType.AWS)
    name = Column(String)
    aws_account_id = Column(String, nullable=True)
    role_arn = Column(String, nullable=True)
    external_id = Column(String)
    status = Column(Enum(ConnectionStatus), default=ConnectionStatus.PENDING)
    last_tested_at = Column(DateTime, nullable=True)
    last_test_error = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
