from dataclasses import dataclass
from typing import Literal
from datetime import datetime, timedelta


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


def get_next_aligned_scan_time(frequency: str, now: datetime) -> datetime:
    if frequency == "HOURLY":
        return now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    elif frequency == "EVERY_6H":
        hour = now.hour
        next_boundary = ((hour // 6) + 1) * 6
        if next_boundary >= 24:
            next_dt = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            next_dt = now.replace(hour=next_boundary, minute=0, second=0, microsecond=0)
        return next_dt
    else:
        return (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)


def is_aligned_scan_time(frequency: str, dt: datetime) -> bool:
    if dt.minute != 0 or dt.second != 0 or dt.microsecond != 0:
        return False
    if frequency == "DAILY":
        return dt.hour == 0
    elif frequency == "EVERY_6H":
        return dt.hour % 6 == 0
    return True


def can_run_manual_scan(plan: str, manual_scans_today: int) -> bool:
    plan_details = get_plan_details(plan)
    if plan_details.manual_scans_per_day_limit is None:
        return True
    return manual_scans_today < plan_details.manual_scans_per_day_limit
