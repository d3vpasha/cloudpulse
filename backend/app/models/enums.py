from enum import Enum


class ProviderType(str, Enum):
    AWS = "aws"
    GCP = "gcp"
    AZURE = "azure"


class CheckCategory(str, Enum):
    COST = "cost"
    SECURITY = "security"


class ResourceGroup(str, Enum):
    STORAGE = "storage"
    NETWORK = "network"
    COMPUTE = "compute"


class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ConnectionStatus(str, Enum):
    PENDING = "pending"
    CONNECTED = "connected"
    ERROR = "error"


class ScanStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    PARTIAL_FAILURE = "partial_failure"
    FAILED = "failed"


class ScanTrigger(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"


class FindingStatus(str, Enum):
    OPEN = "open"
    IGNORED = "ignored"
    RESOLVED = "resolved"
