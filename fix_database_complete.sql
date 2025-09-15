-- First, let's check what tables actually exist in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Create the missing user_usage table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  daily_generations INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 0,
  hourly_generations INTEGER DEFAULT 0,
  hourly_limit INTEGER DEFAULT 0,
  last_generation_at TIMESTAMP WITH TIME ZONE,
  daily_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  hourly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('hour', NOW()) + INTERVAL '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_subscription_id ON user_usage(subscription_id);

-- Add RLS policy for user_usage table
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage data
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Users can update their own usage data  
CREATE POLICY "Users can update own usage" ON user_usage
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policy: System can insert usage data for any user
CREATE POLICY "System can insert usage" ON user_usage
  FOR INSERT WITH CHECK (true);

-- Now add the foreign key constraints (excluding user_usage since it's already created with FK)
DO $$ 
BEGIN
    -- 1. Add foreign key constraint from user_subscriptions to subscription_plans
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_subscriptions_plan_id_fkey' 
        AND table_name = 'user_subscriptions'
    ) THEN
        ALTER TABLE user_subscriptions 
        ADD CONSTRAINT user_subscriptions_plan_id_fkey 
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: user_subscriptions_plan_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint user_subscriptions_plan_id_fkey already exists';
    END IF;

    -- 2. Add foreign key constraint from payment_history to user_subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'payment_history_subscription_id_fkey' 
        AND table_name = 'payment_history'
    ) THEN
        ALTER TABLE payment_history 
        ADD CONSTRAINT payment_history_subscription_id_fkey 
        FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: payment_history_subscription_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint payment_history_subscription_id_fkey already exists';
    END IF;
END $$;

-- Verify all foreign key relationships
SELECT 
    tc.table_name, 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('user_subscriptions', 'payment_history', 'user_usage')
ORDER BY tc.table_name;

SELECT 'Database relationships fixed successfully!' as status;