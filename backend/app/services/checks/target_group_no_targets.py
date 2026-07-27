from app.services.checks.base import BaseCheck, CheckContext, CheckFinding
from app.services.checks.registry import register_check
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel


@register_check
class TargetGroupNoTargetsCheck(BaseCheck):
    check_type = "elbv2_target_group_no_targets"
    finding_code = "ELB01"
    display_name = "Target Group With No Registered Targets"
    category = CheckCategory.SECURITY
    resource_group = ResourceGroup.NETWORK
    resource_type = "Target Group"
    default_risk_level = RiskLevel.MEDIUM

    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        findings = []
        elbv2 = ctx.boto_session.client("elbv2", region_name=ctx.region)

        paginator = elbv2.get_paginator("describe_target_groups")
        for page in paginator.paginate():
            for tg in page.get("TargetGroups", []):
                tg_arn = tg["TargetGroupArn"]
                tg_name = tg["TargetGroupName"]

                health = elbv2.describe_target_health(TargetGroupArn=tg_arn)
                if health.get("TargetHealthDescriptions"):
                    continue

                findings.append(
                    CheckFinding(
                        check_type=self.check_type,
                        finding_code=self.finding_code,
                        resource_id=tg_arn,
                        resource_type=self.resource_type,
                        resource_group=self.resource_group,
                        category=self.category,
                        region=ctx.region,
                        title=f"Target group {tg_name} has no registered targets",
                        description="Target group has zero registered targets. Any load balancer listener rule pointing to it will silently drop traffic.",
                        risk_level=self.default_risk_level,
                        estimated_monthly_savings=0.0,
                        raw_metadata={
                            "target_group_arn": tg_arn,
                            "target_group_name": tg_name,
                            "target_type": tg.get("TargetType"),
                            "protocol": tg.get("Protocol"),
                            "port": tg.get("Port"),
                            "vpc_id": tg.get("VpcId"),
                            "load_balancer_arns": tg.get("LoadBalancerArns", []),
                        },
                    )
                )

        return findings
