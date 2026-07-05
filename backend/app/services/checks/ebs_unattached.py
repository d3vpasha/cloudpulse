from app.services.checks.base import BaseCheck, CheckContext, CheckFinding
from app.services.checks.registry import register_check
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel
from app.services.pricing import ebs_monthly_savings


@register_check
class EbsUnattachedVolumeCheck(BaseCheck):
    check_type = "ebs_unattached_volume"
    display_name = "Unattached EBS Volume"
    category = CheckCategory.COST
    resource_group = ResourceGroup.STORAGE
    resource_type = "EBS Volume"
    default_risk_level = RiskLevel.HIGH

    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        findings = []
        ec2 = ctx.boto_session.client("ec2", region_name=ctx.region)

        paginator = ec2.get_paginator("describe_volumes")
        pages = paginator.paginate(
            Filters=[{"Name": "status", "Values": ["available"]}]
        )

        for page in pages:
            for volume in page.get("Volumes", []):
                volume_id = volume["VolumeId"]
                size_gb = volume["Size"]
                volume_type = volume["VolumeType"]
                savings = ebs_monthly_savings(size_gb)

                findings.append(
                    CheckFinding(
                        check_type=self.check_type,
                        resource_id=volume_id,
                        resource_type=self.resource_type,
                        resource_group=self.resource_group,
                        category=self.category,
                        region=ctx.region,
                        title=f"Unattached EBS volume {volume_id}",
                        description=f"EBS volume is not attached to any instance. Size: {size_gb} GiB ({volume_type}).",
                        risk_level=self.default_risk_level,
                        estimated_monthly_savings=savings,
                        raw_metadata={
                            "volume_id": volume_id,
                            "size_gb": size_gb,
                            "volume_type": volume_type,
                            "availability_zone": volume.get("AvailabilityZone"),
                            "created_time": volume.get("CreateTime", "").isoformat()
                            if volume.get("CreateTime")
                            else None,
                        },
                    )
                )

        return findings
