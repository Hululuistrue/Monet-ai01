-- 扩展数据库以支持订阅和付费功能
-- 在现有 supabase-schema.sql 基础上添加以下表

-- 订阅计划表
CREATE TABLE public.subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_period TEXT DEFAULT 'monthly', -- monthly, yearly
  daily_generations INTEGER NOT NULL,
  hourly_limit INTEGER NOT NULL,
  max_batch_size INTEGER DEFAULT 1,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 用户订阅表
CREATE TABLE public.user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  status TEXT NOT NULL, -- active, canceled, past_due, unpaid
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 支付历史表
CREATE TABLE public.payment_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- succeeded, failed, pending
  payment_method TEXT, -- card, paypal, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 使用配额表（扩展现有 user_credits）
ALTER TABLE public.user_credits ADD COLUMN subscription_plan TEXT DEFAULT 'free';
ALTER TABLE public.user_credits ADD COLUMN hourly_count INTEGER DEFAULT 0;
ALTER TABLE public.user_credits ADD COLUMN hourly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 插入默认订阅计划
INSERT INTO public.subscription_plans (name, display_name, price, daily_generations, hourly_limit, max_batch_size, features) VALUES
('free', 'Free', 0.00, 3, 2, 1, '["Basic generation", "Standard quality", "PNG/JPG download"]'),
('basic', 'Basic', 9.99, 50, 10, 4, '["Batch generation (2-4)", "HD quality", "All formats", "Favorites", "Priority support"]'),
('pro', 'Professional', 19.99, 200, 25, 4, '["Priority generation", "Advanced parameters", "API access", "Commercial license", "Dedicated support"]');

-- RLS 策略
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- 订阅计划：所有人可读
CREATE POLICY "Subscription plans are viewable by everyone" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- 用户订阅：用户只能查看自己的订阅
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 支付历史：用户只能查看自己的支付记录
CREATE POLICY "Users can view own payment history" ON public.payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- 函数：获取用户当前有效订阅
CREATE OR REPLACE FUNCTION public.get_user_active_subscription(user_uuid UUID)
RETURNS TABLE(
  subscription_id UUID,
  plan_name TEXT,
  plan_display_name TEXT,
  daily_generations INTEGER,
  hourly_limit INTEGER,
  max_batch_size INTEGER,
  features JSONB,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    sp.name,
    sp.display_name,
    sp.daily_generations,
    sp.hourly_limit,
    sp.max_batch_size,
    sp.features,
    us.status,
    us.current_period_end
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid 
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > now())
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函数：重置每小时配额
CREATE OR REPLACE FUNCTION public.reset_hourly_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.user_credits 
  SET hourly_count = 0, 
      hourly_reset_at = timezone('utc'::text, now()) + interval '1 hour'
  WHERE hourly_reset_at <= timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建索引以提高性能
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_subscription_plans_name ON public.subscription_plans(name);