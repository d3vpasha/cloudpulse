from app.services.checks.base import BaseCheck, CheckContext, CheckFinding
from app.services.checks.registry import register_check
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel
from app.services.pricing import ebs_monthly_savings
from datetime import datetime


@register_check
class StoppedEC2InstanceCheck(BaseCheck):
    check_type = "stopped_ec2_instance"
    display_name = "Stopped EC2 Instance"
    category = CheckCategory.COST
    resource_group = ResourceGroup.COMPUTE
    resource_type = "EC2 Instance"
    default_risk_level = RiskLevel.MEDIUM

    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        findings = []
        ec2 = ctx.boto_session.client("ec2", region_name=ctx.region)

        paginator = ec2.get_paginator("describe_instances")
        pages = paginator.paginate(
            Filters=[{"Name": "instance-state-name", "Values": ["stopped"]}]
        )

        for page in pages:
            for reservation in page.get("Reservations", []):
                for instance in reservation.get("Instances", []):
                    instance_id = instance["InstanceId"]
                    instance_type = instance["InstanceType"]
                    state_transition_reason = instance.get("StateTransitionReason", "Unknown")

                    # Extract stop time from StateTransitionReason if available
                    stopped_at = None
                    try:
                        if "(" in state_transition_reason and ")" in state_transition_reason:
                            time_str = state_transition_reason.split("(")[-1].split(")")[0]
                            stopped_at = time_str
                    except Exception:
                        pass

                    # Get root volume size to estimate storage costs
                    root_volume_size = 0
                    for mapping in instance.get("BlockDeviceMappings", []):
                        if "Ebs" in mapping:
                            volume_id = mapping["Ebs"].get("VolumeId")
                            if volume_id:
                                root_volume_size += 20  # Default estimate if we can't get actual size

                    # Estimate monthly savings: stopped instances don't incur compute costs
                    # but still incur storage costs. Estimate based on instance type
                    instance_type_cost = self._estimate_instance_hourly_cost(instance_type)
                    monthly_compute_savings = instance_type_cost * 730  # hours per month

                    findings.append(
                        CheckFinding(
                            check_type=self.check_type,
                            resource_id=instance_id,
                            resource_type=self.resource_type,
                            resource_group=self.resource_group,
                            category=self.category,
                            region=ctx.region,
                            title=f"Stopped EC2 instance {instance_id}",
                            description=f"EC2 instance is in stopped state. Instance type: {instance_type}. {f'Stopped at: {stopped_at}' if stopped_at else 'Stop time unknown'}. Stopped instances still incur storage costs for their EBS volumes.",
                            risk_level=self.default_risk_level,
                            estimated_monthly_savings=round(monthly_compute_savings, 2),
                            raw_metadata={
                                "instance_id": instance_id,
                                "instance_type": instance_type,
                                "instance_state": instance["State"]["Name"],
                                "state_transition_reason": state_transition_reason,
                                "stopped_at": stopped_at,
                                "launch_time": instance.get("LaunchTime", "").isoformat()
                                if instance.get("LaunchTime")
                                else None,
                            },
                        )
                    )

        return findings

    def _estimate_instance_hourly_cost(self, instance_type: str) -> float:
        # Simple estimation based on common instance types (on-demand pricing, us-east-1)
        # This is a rough estimate; actual pricing varies by region and pricing model
        pricing_map = {
            "t2.micro": 0.0116,
            "t2.small": 0.0232,
            "t2.medium": 0.0464,
            "t2.large": 0.0928,
            "t3.micro": 0.0104,
            "t3.small": 0.0208,
            "t3.medium": 0.0416,
            "t3.large": 0.0832,
            "m5.large": 0.096,
            "m5.xlarge": 0.192,
            "m5.2xlarge": 0.384,
            "m6i.large": 0.096,
            "m6i.xlarge": 0.192,
            "c5.large": 0.085,
            "c5.xlarge": 0.17,
            "c6i.large": 0.085,
            "c6i.xlarge": 0.17,
        }
        # Return the cost if we have it, otherwise estimate based on first character
        if instance_type in pricing_map:
            return pricing_map[instance_type]
        # Fallback estimate: t2.medium as default
        return 0.0464
