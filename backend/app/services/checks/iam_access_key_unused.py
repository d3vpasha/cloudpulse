from datetime import datetime, timezone
from app.services.checks.base import BaseCheck, CheckContext, CheckFinding
from app.services.checks.registry import register_check
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel


@register_check
class IamAccessKeyUnusedCheck(BaseCheck):
    check_type = "iam_access_key_unused"
    finding_code = "IAM01"
    display_name = "IAM Access Key Unused For A Long Time"
    category = CheckCategory.SECURITY
    resource_group = ResourceGroup.IDENTITY
    resource_type = "IAM Access Key"
    default_risk_level = RiskLevel.HIGH
    global_check = True

    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        findings = []
        iam = ctx.boto_session.client("iam")
        threshold = ctx.settings.access_key_unused_threshold_days
        now = datetime.now(timezone.utc)

        paginator = iam.get_paginator("list_users")
        for page in paginator.paginate():
            for user in page.get("Users", []):
                user_name = user["UserName"]

                for key in iam.list_access_keys(UserName=user_name).get("AccessKeyMetadata", []):
                    # a deactivated key cannot authenticate, so it carries no exposure
                    if key.get("Status") != "Active":
                        continue

                    key_id = key["AccessKeyId"]
                    created_at = key["CreateDate"]
                    last_used = iam.get_access_key_last_used(AccessKeyId=key_id)
                    last_used_at = last_used.get("AccessKeyLastUsed", {}).get("LastUsedDate")

                    if last_used_at is None:
                        idle_days = (now - created_at).days
                        if idle_days <= threshold:
                            continue
                        title = f"IAM access key {key_id} of user {user_name} has never been used"
                        description = (
                            f"This access key was created {idle_days} days ago and has never been "
                            f"used, above your configured threshold of {threshold} days. A key that "
                            "is never used is a standing credential with no benefit. Delete it, or "
                            "deactivate it first if you need a rollback window."
                        )
                    else:
                        idle_days = (now - last_used_at).days
                        if idle_days <= threshold:
                            continue
                        title = f"IAM access key {key_id} of user {user_name} unused for {idle_days} days"
                        description = (
                            f"This access key was last used {idle_days} days ago, above your "
                            f"configured threshold of {threshold} days. Long-lived unused keys are a "
                            "common breach vector. If the key is no longer needed, delete it; if it "
                            "is still required, rotate it."
                        )

                    findings.append(
                        CheckFinding(
                            check_type=self.check_type,
                            finding_code=self.finding_code,
                            resource_id=key_id,
                            resource_type=self.resource_type,
                            resource_group=self.resource_group,
                            category=self.category,
                            region=ctx.region,
                            title=title,
                            description=description,
                            risk_level=self.default_risk_level,
                            estimated_monthly_savings=0.0,
                            raw_metadata={
                                "user_name": user_name,
                                "access_key_id": key_id,
                                "created_at": created_at.isoformat(),
                                "last_used_at": last_used_at.isoformat() if last_used_at else None,
                                "last_used_service": last_used.get("AccessKeyLastUsed", {}).get("ServiceName"),
                                "last_used_region": last_used.get("AccessKeyLastUsed", {}).get("Region"),
                                "idle_days": idle_days,
                                "threshold_days": threshold,
                            },
                        )
                    )

        return findings
