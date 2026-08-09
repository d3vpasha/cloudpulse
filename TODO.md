# CloudPulse TODO

## Recurring Schedules (Future Implementation)

The Schedules page and its sidebar entry were removed on 2026-08-09. They were a
`ComingSoonPlaceholder` with no logic behind them.

Scheduling today is workspace-wide and plan-driven: `app/services/scheduler.py` reads
`get_plan_details(workspace.plan).scan_frequency`, then scans every connected connection
in one pass. The user picks nothing beyond their plan tier.

A Schedules page is worth building once any of these is needed:

- [ ] **Per-connection cadence**: prod daily, dev weekly. Needs a schedule row per connection
      instead of `Workspace.next_scheduled_scan_at`.
- [ ] **Time of day**: scans currently fire whenever the plan interval boundary lands, not at
      a chosen hour. See `get_next_aligned_scan_time` in `app/services/plan_service.py`.
- [ ] **Pause without deleting**: no way today to stop scanning one account while keeping its
      connection.

Restore point: `frontend/src/pages/scan/SchedulesPage.tsx`, the `schedules` route in
`frontend/src/App.tsx`, and the `NavItem` in `frontend/src/layout/Sidebar.tsx`.

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
