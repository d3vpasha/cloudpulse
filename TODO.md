# CloudPulse TODO

## Subscription System (Future Implementation)

Currently, the scan frequency and manual scan limits are simulated based on a hardcoded `plan` value in the Workspace model. This needs to be replaced with a real subscription/billing system.

### Tasks

- [ ] **User Authentication**: Implement user login/signup (currently single implicit workspace)
- [ ] **Subscription Database Schema**: 
  - Add `Subscription` model with plan tier, billing info, renewal date
  - Link Workspace to Subscription
  - Add subscription history/audit trail
- [ ] **Billing Integration**: Choose provider (Stripe, Paddle, etc.)
- [ ] **Payment Processing**: Implement checkout flow, webhook handlers for payment events
- [ ] **Plan Enforcement Middleware**: Replace hardcoded plan checks with database queries
- [ ] **Billing Dashboard**: Show subscription status, usage, upgrade/downgrade options
- [ ] **Trial Period**: Free trial logic before first payment
- [ ] **Plan Upgrade/Downgrade**: Handle mid-cycle changes

### Current Simulation

- Workspace.plan is set to "FREE" by default
- Can be manually changed to "PRO" or "ENTERPRISE" for testing
- Plans define:
  - `scan_frequency`: DAILY (Free), EVERY_6H (Pro), HOURLY (Enterprise)
  - `manual_scans_per_day_limit`: 1 (Free), 8 (Pro), unlimited (Enterprise)

### Files to Update When Building Real System

- `app/models/workspace.py` - Remove `plan`, add `subscription_id` reference
- `app/services/plan_service.py` - Replace with subscription lookup
- All places checking `workspace.plan` - update to query Subscription instead
