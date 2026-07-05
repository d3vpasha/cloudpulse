import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.connection import Connection
from app.models.enums import ConnectionStatus
from app.schemas.connection import (
    ConnectionCreate,
    ConnectionUpdate,
    ConnectionResponse,
    TrustPolicyResponse,
    TestConnectionResponse,
)
from app.services.aws.identity import get_local_identity
from app.services.aws.sts import assume_role_session
from app.core.security_ids import generate_external_id

router = APIRouter(prefix="/api/connections", tags=["connections"])


@router.post("", response_model=ConnectionResponse)
def create_connection(conn_create: ConnectionCreate, db: Session = Depends(get_db)):
    connection = Connection(
        id=str(uuid.uuid4()),
        workspace_id=1,
        name=conn_create.name,
        provider=conn_create.provider,
        external_id=generate_external_id(),
        status=ConnectionStatus.PENDING,
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return connection


@router.get("", response_model=list[ConnectionResponse])
def list_connections(db: Session = Depends(get_db)):
    connections = db.query(Connection).filter(Connection.workspace_id == 1).all()
    return connections


@router.get("/{connection_id}", response_model=ConnectionResponse)
def get_connection(connection_id: str, db: Session = Depends(get_db)):
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection


@router.patch("/{connection_id}", response_model=ConnectionResponse)
def update_connection(
    connection_id: str, conn_update: ConnectionUpdate, db: Session = Depends(get_db)
):
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if conn_update.role_arn is not None:
        connection.role_arn = conn_update.role_arn
    if conn_update.name is not None:
        connection.name = conn_update.name

    db.commit()
    db.refresh(connection)
    return connection


@router.delete("/{connection_id}")
def delete_connection(connection_id: str, db: Session = Depends(get_db)):
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    db.delete(connection)
    db.commit()
    return {"success": True}


@router.get("/{connection_id}/trust-policy", response_model=TrustPolicyResponse)
def get_trust_policy(connection_id: str, db: Session = Depends(get_db)):
    from app.config import settings

    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    # Use SaaS principal if configured, otherwise use local identity
    if settings.is_saas_mode:
        local_account_id = settings.saas_aws_account_id
        local_arn = settings.saas_aws_principal_arn
    else:
        local_identity = get_local_identity()
        local_account_id = local_identity["account"]
        local_arn = local_identity["arn"]

        if "assumed-role" in local_arn:
            parts = local_arn.split("/")
            role_name = parts[1]
            account_id = parts[0].split(":")[4]
            local_arn = f"arn:aws:iam::{account_id}:role/{role_name}"

    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": local_arn},
                "Action": "sts:AssumeRole",
                "Condition": {"StringEquals": {"sts:ExternalId": connection.external_id}},
            }
        ],
    }

    permissions_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeVolumes",
                    "ec2:DescribeAddresses",
                    "ec2:DescribeInstances",
                    "ec2:DescribeRegions",
                ],
                "Resource": "*",
            }
        ],
    }

    return TrustPolicyResponse(
        local_account_id=local_account_id,
        local_arn=local_arn,
        external_id=connection.external_id,
        trust_policy=trust_policy,
        permissions_policy=permissions_policy,
    )


@router.post("/{connection_id}/test", response_model=TestConnectionResponse)
def test_connection(connection_id: str, db: Session = Depends(get_db)):
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if not connection.role_arn:
        raise HTTPException(
            status_code=400,
            detail="Role ARN must be set before testing the connection",
        )

    try:
        session = assume_role_session(connection)
        sts = session.client("sts")
        identity = sts.get_caller_identity()

        connection.aws_account_id = identity["Account"]
        connection.status = ConnectionStatus.CONNECTED
        connection.last_tested_at = datetime.utcnow()
        connection.last_test_error = None
        db.commit()

        return TestConnectionResponse(
            success=True,
            message="Connection test successful",
            aws_account_id=connection.aws_account_id,
        )
    except Exception as e:
        connection.status = ConnectionStatus.ERROR
        connection.last_test_error = str(e)
        connection.last_tested_at = datetime.utcnow()
        db.commit()

        return TestConnectionResponse(success=False, message=str(e))
