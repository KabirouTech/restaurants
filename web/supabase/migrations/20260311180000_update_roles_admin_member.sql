-- Update role values: admin, member, superadmin (superadmin is dev-only)
-- Old roles: admin, staff, driver → New roles: superadmin, admin, member

-- 1. Migrate existing data
UPDATE profiles SET role = 'member' WHERE role IN ('staff', 'driver');
UPDATE organization_invitations SET role = 'member' WHERE role IN ('staff', 'driver');

-- 2. Drop old constraint and add new one on organization_invitations
ALTER TABLE organization_invitations DROP CONSTRAINT IF EXISTS organization_invitations_role_check;
ALTER TABLE organization_invitations
  ADD CONSTRAINT organization_invitations_role_check
  CHECK (role IN ('superadmin', 'admin', 'member'));
