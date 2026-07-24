from dataclasses import dataclass
from typing import Literal


@dataclass
class PlanDetails:
    name: str
    scan_frequency: Literal["HOURLY", "EVERY_6H", "DAILY"]
    manual_scans_per_day_limit: int | None


PLANS = {
    "FREE": PlanDetails(
        name="Free",
        scan_frequency="DAILY",
        manual_scans_per_day_limit=1,
    ),
    "PRO": PlanDetails(
        name="Pro",
        scan_frequency="EVERY_6H",
        manual_scans_per_day_limit=8,
    ),
    "ENTERPRISE": PlanDetails(
        name="Enterprise",
        scan_frequency="HOURLY",
        manual_scans_per_day_limit=None,
    ),
}


def get_plan_details(plan: str) -> PlanDetails:
    return PLANS.get(plan, PLANS["FREE"])


def get_frequency_minutes(frequency: str) -> int:
    return {
        "HOURLY": 60,
        "EVERY_6H": 360,
        "DAILY": 1440,
    }.get(frequency, 1440)


def can_run_manual_scan(plan: str, manual_scans_today: int) -> bool:
    plan_details = get_plan_details(plan)
    if plan_details.manual_scans_per_day_limit is None:
        return True
    return manual_scans_today < plan_details.manual_scans_per_day_limit
