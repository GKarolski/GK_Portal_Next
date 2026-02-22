-- GK Portal SaaS - Stripe Upgrade Migration
-- Adds columns to track Stripe customers, subscriptions, and plan tiers.

ALTER TABLE `saas_tenants` 
ADD COLUMN `stripe_customer_id` VARCHAR(255) DEFAULT NULL AFTER `status`,
ADD COLUMN `stripe_subscription_id` VARCHAR(255) DEFAULT NULL AFTER `stripe_customer_id`,
ADD COLUMN `plan_tier` ENUM('STARTER', 'STANDARD', 'AGENCY') DEFAULT 'STARTER' AFTER `stripe_subscription_id`;

-- Add business limit columns if they don't exist (previously in saas_limits.sql)
ALTER TABLE `saas_tenants`
ADD COLUMN `storage_limit_mb` INT DEFAULT 1024 AFTER `plan_tier`,
ADD COLUMN `storage_used_mb` FLOAT DEFAULT 0 AFTER `storage_limit_mb`,
ADD COLUMN `token_limit_monthly` INT DEFAULT 100000 AFTER `storage_used_mb`,
ADD COLUMN `tokens_used_month` INT DEFAULT 0 AFTER `token_limit_monthly`;
