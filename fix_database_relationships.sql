-- Fix Database Foreign Key Relationships
-- Execute this SQL in Supabase SQL Editor to establish proper table relationships

-- 1. Add foreign key constraint from user_subscriptions to subscription_plans
DO $$ 
BEGIN
    -- Check if constraint already exists
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
END $$;

-- 2. Add foreign key constraint from payment_history to user_subscriptions
DO $$ 
BEGIN
    -- Check if constraint already exists
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

-- 3. Add foreign key constraint from user_usage to user_subscriptions  
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_usage_subscription_id_fkey' 
        AND table_name = 'user_usage'
    ) THEN
        ALTER TABLE user_usage 
        ADD CONSTRAINT user_usage_subscription_id_fkey 
        FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint: user_usage_subscription_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint user_usage_subscription_id_fkey already exists';
    END IF;
END $$;

-- 4. Verify all foreign key relationships are properly established
SELECT 
    tc.table_name, 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('user_subscriptions', 'payment_history', 'user_usage')
ORDER BY tc.table_name, tc.constraint_name;

-- 5. Test the relationships with a simple query
SELECT 
    COUNT(*) as subscription_plans_count,
    'subscription_plans' as table_name
FROM subscription_plans
UNION ALL
SELECT 
    COUNT(*) as user_subscriptions_count,
    'user_subscriptions' as table_name  
FROM user_subscriptions
UNION ALL
SELECT 
    COUNT(*) as payment_history_count,
    'payment_history' as table_name
FROM payment_history;

-- Success message
SELECT 'Foreign key relationships have been established successfully!' as status;