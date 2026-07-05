# Import all checks to register them
from app.services.checks.ebs_unattached import EbsUnattachedVolumeCheck
from app.services.checks.eip_unattached import UnattachedElasticIpCheck
from app.services.checks.stopped_ec2_instance import StoppedEC2InstanceCheck

__all__ = [
    "EbsUnattachedVolumeCheck",
    "UnattachedElasticIpCheck",
    "StoppedEC2InstanceCheck",
]
