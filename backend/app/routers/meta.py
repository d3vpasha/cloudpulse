from fastapi import APIRouter
from app.services.aws.identity import get_local_identity

router = APIRouter(prefix="/api/meta", tags=["meta"])

AWS_REGIONS = {
    "United States": [
        {"name": "N. Virginia", "code": "us-east-1"},
        {"name": "Ohio", "code": "us-east-2"},
        {"name": "N. California", "code": "us-west-1"},
        {"name": "Oregon", "code": "us-west-2"},
    ],
    "Asia Pacific": [
        {"name": "Mumbai", "code": "ap-south-1"},
        {"name": "Singapore", "code": "ap-southeast-1"},
        {"name": "Sydney", "code": "ap-southeast-2"},
        {"name": "Tokyo", "code": "ap-northeast-1"},
        {"name": "Seoul", "code": "ap-northeast-2"},
        {"name": "Osaka", "code": "ap-northeast-3"},
    ],
    "Canada": [
        {"name": "Central", "code": "ca-central-1"},
    ],
    "Europe": [
        {"name": "Frankfurt", "code": "eu-central-1"},
        {"name": "Ireland", "code": "eu-west-1"},
        {"name": "London", "code": "eu-west-2"},
        {"name": "Paris", "code": "eu-west-3"},
        {"name": "Stockholm", "code": "eu-north-1"},
    ],
    "South America": [
        {"name": "São Paulo", "code": "sa-east-1"},
    ],
    "Middle East": [
        {"name": "Bahrain", "code": "me-south-1"},
        {"name": "UAE", "code": "me-central-1"},
    ],
    "Africa": [
        {"name": "Cape Town", "code": "af-south-1"},
    ],
}


@router.get("/regions")
def get_regions():
    return {"regions": AWS_REGIONS}


@router.get("/local-identity")
def get_local_aws_identity():
    try:
        identity = get_local_identity()
        return identity
    except Exception as e:
        return {"error": str(e)}
