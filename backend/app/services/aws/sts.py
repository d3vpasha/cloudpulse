import boto3
from app.models.connection import Connection


def assume_role_session(connection: Connection) -> boto3.Session:
    sts = boto3.client("sts")
    response = sts.assume_role(
        RoleArn=connection.role_arn,
        RoleSessionName=f"cloudpulse-{connection.id}",
        ExternalId=connection.external_id,
        DurationSeconds=3600,
    )
    credentials = response["Credentials"]
    return boto3.Session(
        aws_access_key_id=credentials["AccessKeyId"],
        aws_secret_access_key=credentials["SecretAccessKey"],
        aws_session_token=credentials["SessionToken"],
    )
