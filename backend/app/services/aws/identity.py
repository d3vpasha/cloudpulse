import boto3


def get_local_identity() -> dict:
    sts = boto3.client("sts")
    response = sts.get_caller_identity()
    return {
        "account": response["Account"],
        "arn": response["Arn"],
        "user_id": response["UserId"],
    }
