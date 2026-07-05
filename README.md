# CloudPulse

CloudPulse is a multi-tenant FinOps scanner for AWS (with GCP and Azure support coming soon). It identifies unused cloud resources that are costing you money: unattached EBS volumes, unattached Elastic IPs, idle instances, and more.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- AWS account with an IAM role for CloudPulse to assume

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (default points to http://localhost:8000/api)
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## AWS Account Setup

CloudPulse uses **cross-account IAM role assumption** to scan AWS accounts. This means:
- No long-lived AWS credentials stored in CloudPulse database
- Customers/accounts control access via IAM roles
- Temporary credentials auto-rotate

### Two Deployment Modes

#### Mode 1: Local Testing (Default)
For testing CloudPulse locally on your machine:

1. **Configure AWS credentials locally:**
   ```bash
   aws configure
   # Enter credentials from the account you want to scan
   ```

2. **Start CloudPulse backend** (uses your local credentials automatically)
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

3. **Create a read-only IAM role** in your AWS account
   - The wizard in CloudPulse will show you exactly what to do
   - Trust the local user/role shown in the wizard

4. **Add connection in CloudPulse**
   - Open http://localhost:5173
   - Click **Connections** → **Add connection**
   - Follow the 4-step wizard (name → role setup → paste ARN → test)

#### Mode 2: SaaS (Recommended for Production)
For hosting CloudPulse as a multi-account SaaS:

1. **Configure the SaaS backend account in `backend/.env`:**
   ```bash
   SAAS_AWS_ACCOUNT_ID=111111111111              # Your SaaS account ID
   SAAS_AWS_PRINCIPAL_ARN=arn:aws:iam::111111111111:role/CloudPulseBackend
   ```

2. **The wizard will now show customers:**
   - "Create a role in YOUR account that trusts account 111111111111"
   - The trust policy points to your SaaS backend account
   - Each customer creates the role independently in their own account

3. **Example: Scan Dev from Preprod**
   - Preprod account (111111111111): CloudPulse backend runs here
   - Dev account (999999999999): Create a read-only role here
   - Role trust policy: allows preprod account to assume it
   - CloudPulse (in preprod) assumes the role and scans dev

### Connection Wizard

When you add a connection, CloudPulse shows a guided wizard:

**Step 1:** Enter connection name (e.g., "Dev Account")

**Step 2:** Create an IAM role - **choose your method:**
- **AWS Console:** 7-step walkthrough in the UI
- **AWS CLI:** Copy-paste 5 commands

**Step 3:** Paste the role ARN from step 2

**Step 4:** Test the connection (CloudPulse assumes the role to verify it works)

## Architecture

### Backend

- **FastAPI** web framework
- **SQLAlchemy** ORM with SQLite (easily swappable for PostgreSQL)
- **boto3** for AWS API calls
- Cross-account role assumption via STS AssumeRole
- Modular check engine (easily extensible for new checks)

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **TanStack React Query** for data fetching and caching
- **React Router** for navigation

### Database

- **SQLite** for v1 (perfect for local dev/small deployments)
- Easily upgradeable to PostgreSQL
- Schema: Workspace → Connections → Scans → Findings

## Checks (v1)

| Check | Category | Risk | Description |
|-------|----------|------|-------------|
| Unattached EBS volumes | Cost | High | EBS volumes not attached to any instance |
| Unattached Elastic IPs | Cost | Low | Elastic IPs not associated with any instance |
| Stopped EC2 instances | Cost | Medium | EC2 instances in stopped state (still incur storage costs) |

**Required IAM Permissions:**
```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:DescribeVolumes",
    "ec2:DescribeAddresses",
    "ec2:DescribeInstances",
    "ec2:DescribeRegions"
  ],
  "Resource": "*"
}
```

## Roadmap

- [ ] Scheduled scans (Celery + Redis)
- [ ] GCP support (Compute Engine, Cloud Storage)
- [ ] Azure support (VMs, Disks)
- [ ] Security checks (IAM key age, open security groups, unencrypted volumes)
- [ ] Idle EC2 instance detection (CloudWatch metrics)
- [ ] Email/webhook notifications
- [ ] Team/organization support
- [ ] Real AWS Pricing API integration
- [ ] Custom policies and exceptions

## Configuration

Edit `backend/.env`:
- `CORS_ORIGINS`: Comma-separated list of allowed frontend origins
- `DATABASE_PATH`: Path to SQLite database file
- `AWS_REGION`: Default AWS region

## Development

### Adding a New Check

1. Create a new file in `backend/app/services/checks/` (e.g., `my_check.py`)
2. Inherit `BaseCheck` and implement `run(ctx: CheckContext)`
3. Use the `@register_check` decorator
4. Done! The check will be auto-discovered and run on every scan

Example:
```python
from app.services.checks.base import BaseCheck, CheckContext, CheckFinding
from app.services.checks.registry import register_check
from app.models.enums import CheckCategory, ResourceGroup, RiskLevel

@register_check
class MyCheck(BaseCheck):
    check_type = "my_check"
    display_name = "My Check"
    category = CheckCategory.COST
    resource_group = ResourceGroup.STORAGE
    resource_type = "My Resource"
    default_risk_level = RiskLevel.MEDIUM

    def run(self, ctx: CheckContext) -> list[CheckFinding]:
        # Query AWS, collect findings, return list
        pass
```

## Known Limitations (v1)

- No authentication/multi-user (single workspace)
- SQLite only (fine for local dev, not production-scale)
- Hardcoded pricing rates (ignores regional variance)
- No scheduled scans yet (manual trigger only)
- Minimal IAM permissions (only what v1 checks need)

## License

MIT
