-- Add columns to store historical plan information in payment_history table
-- Execute this in Supabase SQL Editor

-- Add new columns to store historical plan data
ALTER TABLE payment_history 
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS plan_display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS plan_price INTEGER;

-- Add comment to explain the purpose
COMMENT ON COLUMN payment_history.plan_name IS 'Historical plan name at time of payment (e.g., basic, pro)';
COMMENT ON COLUMN payment_history.plan_display_name IS 'Historical plan display name at time of payment (e.g., Basic Plan, Pro Plan)';
COMMENT ON COLUMN payment_history.plan_price IS 'Historical plan price at time of payment in cents';

-- Update existing records with current plan information if available
UPDATE payment_history 
SET 
  plan_name = COALESCE(
    CASE 
      WHEN amount = 999 THEN 'basic'
      WHEN amount = 1999 THEN 'pro'  
      ELSE 'unknown'
    END, 
    plan_name
  ),
  plan_display_name = COALESCE(
    CASE 
      WHEN amount = 999 THEN 'Basic Plan'
      WHEN amount = 1999 THEN 'Pro Plan'
      ELSE 'Unknown Plan'
    END,
    plan_display_name
  ),
  plan_price = COALESCE(amount, plan_price)
WHERE plan_name IS NULL;

-- Verify the update
SELECT 
  id,
  amount,
  plan_name,
  plan_display_name,
  plan_price,
  description,
  created_at
FROM payment_history
ORDER BY created_at DESC
LIMIT 10;

SELECT 'Payment history table updated with historical plan information!' as status;