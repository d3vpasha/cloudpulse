import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError


def get_local_identity() -> dict:
    sts = boto3.client("sts")
    response = sts.get_caller_identity()
    return {
        "account": response["Account"],
        "arn": response["Arn"],
        "user_id": response["UserId"],
    }


def validate_aws_credentials() -> None:
    try:
        get_local_identity()
    except (NoCredentialsError, PartialCredentialsError) as e:
        raise RuntimeError(
            "AWS credentials are not configured. Please set up AWS credentials before starting the backend.\n"
            "Configure credentials via:\n"
            "  - AWS credentials file (~/.aws/credentials)\n"
            "  - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)\n"
            "  - IAM role (if running on AWS)\n"
        ) from e
