from pydantic import BaseModel
from datetime import datetime
from app.models.enums import ProviderType, ConnectionStatus


class ConnectionCreate(BaseModel):
    name: str
    provider: ProviderType = ProviderType.AWS


class ConnectionUpdate(BaseModel):
    role_arn: str | None = None
    name: str | None = None


class ConnectionResponse(BaseModel):
    id: str
    name: str
    provider: ProviderType
    aws_account_id: str | None
    role_arn: str | None
    external_id: str
    status: ConnectionStatus
    last_tested_at: datetime | None
    last_test_error: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TrustPolicyResponse(BaseModel):
    local_account_id: str
    local_arn: str
    external_id: str
    trust_policy: dict
    permissions_policy: dict


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    aws_account_id: str | None = None
