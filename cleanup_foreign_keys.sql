-- Clean up duplicate foreign key constraints
-- Execute this in Supabase SQL Editor

-- 1. First, let's see all existing foreign key constraints
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

-- 2. Drop the old/duplicate foreign key constraints
DO $$ 
BEGIN
    -- Drop old constraint from payment_history if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payment_history_subscription_id' 
        AND table_name = 'payment_history'
    ) THEN
        ALTER TABLE payment_history 
        DROP CONSTRAINT fk_payment_history_subscription_id;
        RAISE NOTICE 'Dropped old constraint: fk_payment_history_subscription_id';
    END IF;

    -- Drop old constraint from user_subscriptions if it exists  
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_subscriptions_plan_id' 
        AND table_name = 'user_subscriptions'
    ) THEN
        ALTER TABLE user_subscriptions 
        DROP CONSTRAINT fk_user_subscriptions_plan_id;
        RAISE NOTICE 'Dropped old constraint: fk_user_subscriptions_plan_id';
    END IF;

    -- Keep only the standardized constraint names we created
    RAISE NOTICE 'Cleanup completed - keeping only standard constraint names';
END $$;

-- 3. Verify we now have only one constraint per relationship
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

-- 4. Test queries to make sure relationships work correctly
SELECT 'Testing subscription query...' as test;

-- Test the subscription query (should work now)
SELECT 
    us.id,
    us.user_id,
    us.status,
    sp.name as plan_name,
    sp.display_name
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
LIMIT 1;

SELECT 'Testing payment history query...' as test;

-- Test the payment history query (should work now)  
SELECT 
    ph.id,
    ph.user_id,
    ph.amount,
    ph.status,
    us.id as subscription_id
FROM payment_history ph
LEFT JOIN user_subscriptions us ON ph.subscription_id = us.id
LIMIT 1;

SELECT 'Foreign key constraint cleanup completed successfully!' as status;