from abc import ABC, abstractmethod
from dataclasses import dataclass
import boto3
from app.models.connection import Connection
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel


@dataclass
class CheckSettings:
    log_retention_threshold_days: int
    access_key_unused_threshold_days: int


@dataclass
class CheckContext:
    connection: Connection
    region: str
    boto_session: boto3.Session
    settings: CheckSettings


@dataclass
class CheckFinding:
    check_type: str
    finding_code: str
    resource_id: str
    resource_type: str
    resource_group: ResourceGroup
    category: CheckCategory
    region: str
    title: str
    description: str
    risk_level: RiskLevel
    estimated_monthly_savings: float
    raw_metadata: dict


class BaseCheck(ABC):
    check_type: str
    finding_code: str
    display_name: str
    category: CheckCategory = CheckCategory.COST
    resource_group: ResourceGroup
    resource_type: str
    default_risk_level: RiskLevel
    # Global services (IAM, S3) return the same resources from every region,
    # so these checks run once per scan instead of once per active region.
    global_check: bool = False

    @abstractmethod
    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        pass
