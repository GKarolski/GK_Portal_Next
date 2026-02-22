-- Add Business Limits columns to saas_tenants table in Master DB

ALTER TABLE saas_tenants
ADD COLUMN plan_tier ENUM('STARTER', 'STANDARD', 'AGENCY') DEFAULT 'STARTER',
ADD COLUMN storage_limit_mb INT DEFAULT 1024, -- 1GB default
ADD COLUMN storage_used_mb FLOAT DEFAULT 0,
ADD COLUMN token_limit_monthly INT DEFAULT 100000, -- 100k default
ADD COLUMN tokens_used_month INT DEFAULT 0;

-- Optional: Update existing mock tenants to different plans for testing if they exist
-- UPDATE saas_tenants SET plan_tier = 'AGENCY', storage_limit_mb = 102400, token_limit_monthly = 2000000 WHERE id = 1;
