from app.services.checks.base import BaseCheck, CheckContext, CheckFinding
from app.services.checks.registry import register_check
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel


@register_check
class LogGroupRetentionCheck(BaseCheck):
    check_type = "cloudwatch_log_group_retention"
    finding_code = "CW01"
    display_name = "CloudWatch Log Group Retention Not Configured"
    category = CheckCategory.SECURITY
    resource_group = ResourceGroup.STORAGE
    resource_type = "CloudWatch Log Group"
    default_risk_level = RiskLevel.MEDIUM

    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        findings = []
        logs = ctx.boto_session.client("logs", region_name=ctx.region)
        threshold = ctx.settings.log_retention_threshold_days

        paginator = logs.get_paginator("describe_log_groups")
        for page in paginator.paginate():
            for lg in page.get("logGroups", []):
                name = lg["logGroupName"]
                retention_days = lg.get("retentionInDays")
                stored_bytes = lg.get("storedBytes", 0)

                if retention_days is None:
                    title = f"Log group {name} has no expiration policy"
                    description = (
                        "This log group is set to retain logs indefinitely (Never expire). "
                        "If this retention is not required for audit or compliance reasons, "
                        "consider lowering the retention period to reduce storage costs."
                    )
                elif retention_days > threshold:
                    title = f"Log group {name} retention exceeds {threshold} days"
                    description = (
                        f"This log group retains logs for {retention_days} days, above your "
                        f"configured threshold of {threshold} days. If this retention is not "
                        "required for audit or compliance reasons, consider lowering the "
                        "retention period to reduce storage costs."
                    )
                else:
                    continue

                findings.append(
                    CheckFinding(
                        check_type=self.check_type,
                        finding_code=self.finding_code,
                        resource_id=name,
                        resource_type=self.resource_type,
                        resource_group=self.resource_group,
                        category=self.category,
                        region=ctx.region,
                        title=title,
                        description=description,
                        risk_level=self.default_risk_level,
                        estimated_monthly_savings=0.0,
                        raw_metadata={
                            "log_group_name": name,
                            "retention_in_days": retention_days,
                            "stored_bytes": stored_bytes,
                            "threshold_days": threshold,
                        },
                    )
                )

        return findings
