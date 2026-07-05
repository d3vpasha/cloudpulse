from app.services.checks.base import BaseCheck, CheckContext, CheckFinding
from app.services.checks.registry import register_check
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel
from app.services.pricing import eip_monthly_savings


@register_check
class UnattachedElasticIpCheck(BaseCheck):
    check_type = "eip_unattached"
    display_name = "Unattached Elastic IP"
    category = CheckCategory.COST
    resource_group = ResourceGroup.NETWORK
    resource_type = "Elastic IP"
    default_risk_level = RiskLevel.LOW

    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        findings = []
        ec2 = ctx.boto_session.client("ec2", region_name=ctx.region)

        response = ec2.describe_addresses()

        for address in response.get("Addresses", []):
            if "AssociationId" not in address:
                allocation_id = address.get("AllocationId")
                public_ip = address.get("PublicIp")
                savings = eip_monthly_savings()

                findings.append(
                    CheckFinding(
                        check_type=self.check_type,
                        resource_id=allocation_id,
                        resource_type=self.resource_type,
                        resource_group=self.resource_group,
                        category=self.category,
                        region=ctx.region,
                        title=f"Unattached Elastic IP {public_ip}",
                        description="Elastic IP is not associated with any instance or network interface. AWS charges hourly for unassociated addresses.",
                        risk_level=self.default_risk_level,
                        estimated_monthly_savings=savings,
                        raw_metadata={
                            "allocation_id": allocation_id,
                            "public_ip": public_ip,
                            "domain": address.get("Domain"),
                        },
                    )
                )

        return findings
