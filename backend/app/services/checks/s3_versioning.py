from app.services.checks.base import BaseCheck, CheckContext, CheckFinding
from app.services.checks.registry import register_check
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel


@register_check
class S3VersioningCheck(BaseCheck):
    check_type = "s3_bucket_versioning_disabled"
    finding_code = "S3V01"
    display_name = "S3 Bucket Versioning Disabled"
    category = CheckCategory.SECURITY
    resource_group = ResourceGroup.STORAGE
    resource_type = "S3 Bucket"
    default_risk_level = RiskLevel.LOW
    global_check = True

    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        findings = []
        s3 = ctx.boto_session.client("s3", region_name=ctx.region)

        try:
            response = s3.list_buckets()
        except Exception:
            return findings

        for bucket in response.get("Buckets", []):
            bucket_name = bucket["Name"]

            try:
                versioning = s3.get_bucket_versioning(Bucket=bucket_name)
                status = versioning.get("Status")

                if status != "Enabled":
                    findings.append(
                        CheckFinding(
                            check_type=self.check_type,
                            finding_code=self.finding_code,
                            resource_id=bucket_name,
                            resource_type=self.resource_type,
                            resource_group=self.resource_group,
                            category=self.category,
                            region=ctx.region,
                            title=f"S3 bucket {bucket_name} has versioning disabled",
                            description=(
                                "S3 bucket versioning is disabled. Versioning protects against accidental deletions, "
                                "object corruption, and ransomware by maintaining object history. It's a best practice "
                                "for production data, though may not be necessary for temporary storage or logs."
                            ),
                            risk_level=self.default_risk_level,
                            estimated_monthly_savings=0.0,
                            raw_metadata={
                                "bucket_name": bucket_name,
                                "versioning_status": status,
                                "creation_date": bucket.get("CreationDate", "").isoformat()
                                if bucket.get("CreationDate")
                                else None,
                            },
                        )
                    )
            except Exception:
                pass

        return findings
