from abc import ABC, abstractmethod
from dataclasses import dataclass
import boto3
from app.models.connection import Connection
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel


@dataclass
class CheckContext:
    connection: Connection
    region: str
    boto_session: boto3.Session


@dataclass
class CheckFinding:
    check_type: str
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
    display_name: str
    category: CheckCategory = CheckCategory.COST
    resource_group: ResourceGroup
    resource_type: str
    default_risk_level: RiskLevel

    @abstractmethod
    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        pass
