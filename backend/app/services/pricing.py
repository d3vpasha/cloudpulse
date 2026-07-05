EBS_GB_MONTH_USD = 0.08
EIP_HOURLY_USD = 0.005
HOURS_PER_MONTH = 730


def ebs_monthly_savings(size_gb: float) -> float:
    return round(size_gb * EBS_GB_MONTH_USD, 2)


def eip_monthly_savings() -> float:
    return round(EIP_HOURLY_USD * HOURS_PER_MONTH, 2)
