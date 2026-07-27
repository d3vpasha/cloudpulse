# Import all checks to register them
from app.services.checks.ebs_unattached import EbsUnattachedVolumeCheck
from app.services.checks.eip_unattached import UnattachedElasticIpCheck
from app.services.checks.stopped_ec2_instance import StoppedEC2InstanceCheck
from app.services.checks.target_group_no_targets import TargetGroupNoTargetsCheck

__all__ = [
    "EbsUnattachedVolumeCheck",
    "UnattachedElasticIpCheck",
    "StoppedEC2InstanceCheck",
    "TargetGroupNoTargetsCheck",
]
