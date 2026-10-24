-- Enable RLS on tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Create function to get current tenant ID from session variable
CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Create function to set tenant context
CREATE OR REPLACE FUNCTION app.set_tenant_context(tenant_id uuid)
RETURNS void AS $$
  BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for tenants table
CREATE POLICY tenant_isolation ON tenants
  FOR ALL
  USING (id = app.current_tenant_id());

-- RLS policies for memberships table
CREATE POLICY membership_isolation ON memberships
  FOR ALL
  USING (tenant_id = app.current_tenant_id());

-- RLS policies for user_tenant_memberships table
CREATE POLICY user_tenant_membership_isolation ON user_tenant_memberships
  FOR ALL
  USING (tenant_id = app.current_tenant_id());

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION app.current_tenant_id() TO public;
GRANT EXECUTE ON FUNCTION app.set_tenant_context(uuid) TO public;
