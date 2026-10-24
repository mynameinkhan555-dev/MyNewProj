-- Create user_tenant_memberships table
CREATE TABLE IF NOT EXISTS user_tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MEMBER', 'GUEST')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tenant_id)
);

-- Create indexes
CREATE INDEX idx_user_tenant_memberships_user_id ON user_tenant_memberships(user_id);
CREATE INDEX idx_user_tenant_memberships_tenant_id ON user_tenant_memberships(tenant_id);
CREATE INDEX idx_user_tenant_memberships_active ON user_tenant_memberships(is_active) WHERE is_active = true;
