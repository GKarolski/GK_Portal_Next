-- Increase STARTER limits to be more reasonable given PDF usage
UPDATE saas_tenants 
SET token_limit_monthly = 500000 
WHERE plan_tier = 'STARTER';

-- Or specifically for the current tenant if needed, but let's update the plan baseline in code too if we want perm change.
-- Ideally we Update the Plan Definition in PHP too, but this is a quick fix for existing tenants.
