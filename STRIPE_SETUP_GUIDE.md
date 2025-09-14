# Stripe 配置完整指南

## 🎯 概述

本指南将帮你完整配置Stripe付费系统，包括创建产品、设置Webhook、测试支付等。

## 📋 当前状态分析

### ✅ 已有的配置
- Stripe API密钥已配置 (测试环境)
- 订阅计划已在代码中定义
- Webhook处理逻辑已完成
- 支付流程代码已实现

### ⚠️ 需要配置的部分
- Stripe Dashboard中的产品和价格
- Webhook端点设置
- 正确的Webhook Secret
- Supabase数据库表结构

## 🚀 步骤1: Stripe Dashboard 设置

### 1.1 登录Stripe Dashboard
访问: https://dashboard.stripe.com/
使用你的Stripe账户登录

### 1.2 创建产品和价格

#### 创建Basic计划产品:
1. 进入 **Products** → **Add product**
2. 设置产品信息:
   - **Name**: `Basic Plan`
   - **Description**: `Enhanced AI image generation with 100 daily generations`
   - **Image**: 可选上传产品图片

3. 设置价格:
   - **Price**: `$9.99`
   - **Currency**: `USD`
   - **Billing period**: `Monthly`
   - **Price ID**: 记录生成的价格ID (例如: `price_xxxxx`)

#### 创建Pro计划产品:
1. 再次点击 **Add product**
2. 设置产品信息:
   - **Name**: `Pro Plan`
   - **Description**: `Premium AI image generation with 500 daily generations`
   
3. 设置价格:
   - **Price**: `$19.99`
   - **Currency**: `USD`
   - **Billing period**: `Monthly`
   - **Price ID**: 记录生成的价格ID (例如: `price_yyyyy`)

### 1.3 获取API密钥
1. 进入 **Developers** → **API keys**
2. 复制以下密钥:
   - **Publishable key**: `pk_test_...` (前端使用)
   - **Secret key**: `sk_test_...` (后端使用)

## 🔗 步骤2: 配置Webhook

### 2.1 添加Webhook端点
1. 进入 **Developers** → **Webhooks**
2. 点击 **Add endpoint**
3. 设置端点URL:
   - **开发环境**: `http://localhost:3000/api/webhooks/stripe`
   - **生产环境**: `https://yourdomain.com/api/webhooks/stripe`

### 2.2 选择事件类型
选择以下事件:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `payment_intent.succeeded`

### 2.3 获取Webhook Secret
创建Webhook后，点击进入详情页面，复制 **Signing secret** (以 `whsec_` 开头)

## 🔧 步骤3: 更新环境变量

编辑 `.env.local` 文件:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_你的实际密钥
STRIPE_PUBLISHABLE_KEY=pk_test_你的实际密钥
STRIPE_WEBHOOK_SECRET=whsec_你的实际webhook密钥

# 其他配置保持不变...
```

## 🗄️ 步骤4: Supabase数据库设置

### 4.1 创建必要的数据库表

在Supabase SQL编辑器中执行以下SQL:

```sql
-- 创建订阅计划表
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  daily_generations INTEGER NOT NULL,
  hourly_limit INTEGER NOT NULL,
  max_batch_size INTEGER NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES subscription_plans(id),
  subscription_id VARCHAR(255), -- Stripe订阅ID
  status VARCHAR(50) NOT NULL DEFAULT 'free',
  cancel_at_period_end BOOLEAN DEFAULT false,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建支付历史表
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  amount INTEGER NOT NULL, -- 以分为单位
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  description TEXT,
  receipt_url TEXT,
  plan_name VARCHAR(50),
  plan_display_name VARCHAR(100),
  plan_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认订阅计划
INSERT INTO subscription_plans (name, display_name, price, daily_generations, hourly_limit, max_batch_size, features) 
VALUES 
  ('free', 'Free Plan', 0.00, 3, 2, 1, 
   '["Basic AI image generation", "3 generations per day", "Standard quality", "Community support"]'),
  ('basic', 'Basic Plan', 9.99, 100, 20, 4, 
   '["Enhanced AI image generation", "100 generations per day", "High quality output", "Priority support", "Multiple styles available"]'),
  ('pro', 'Pro Plan', 19.99, 500, 50, 8, 
   '["Premium AI image generation", "500 generations per day", "Ultra high quality", "Premium support", "All styles and models", "Commercial license", "API access"]')
ON CONFLICT (name) DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);

-- 设置RLS (Row Level Security)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Anyone can read subscription plans" ON subscription_plans FOR SELECT USING (true);

CREATE POLICY "Users can read own subscription" ON user_subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own payment history" ON payment_history 
  FOR SELECT USING (auth.uid() = user_id);
```

## 🧪 步骤5: 测试配置

### 5.1 创建测试脚本

创建 `test-stripe.js`:

```javascript
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

async function testStripeConfig() {
  console.log('🧪 测试Stripe配置...\n');
  
  // 检查环境变量
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log('✅ Secret Key:', secretKey ? secretKey.substring(0, 12) + '...' : '❌ 未设置');
  console.log('✅ Publishable Key:', publishableKey ? publishableKey.substring(0, 12) + '...' : '❌ 未设置');
  console.log('✅ Webhook Secret:', webhookSecret ? webhookSecret.substring(0, 12) + '...' : '❌ 未设置');
  
  if (!secretKey) {
    console.error('\n❌ STRIPE_SECRET_KEY 未设置');
    return;
  }
  
  try {
    const stripe = new Stripe(secretKey);
    
    // 测试API连接
    const account = await stripe.accounts.retrieve();
    console.log('\n✅ Stripe账户连接成功');
    console.log('📧 账户邮箱:', account.email);
    console.log('🏢 账户类型:', account.type);
    
    // 列出产品
    const products = await stripe.products.list({ limit: 10 });
    console.log('\n📦 当前产品数量:', products.data.length);
    
    products.data.forEach(product => {
      console.log(`  - ${product.name} (ID: ${product.id})`);
    });
    
    // 列出价格
    const prices = await stripe.prices.list({ limit: 10 });
    console.log('\n💰 当前价格数量:', prices.data.length);
    
    prices.data.forEach(price => {
      const amount = price.unit_amount ? (price.unit_amount / 100) : 0;
      console.log(`  - $${amount} ${price.currency.toUpperCase()} (ID: ${price.id})`);
    });
    
    console.log('\n✅ Stripe配置测试完成');
    
  } catch (error) {
    console.error('\n❌ Stripe测试失败:', error.message);
  }
}

testStripeConfig();
```

### 5.2 运行测试

```bash
node test-stripe.js
```

## 📝 步骤6: 使用Stripe CLI进行本地Webhook测试 (可选)

### 6.1 安装Stripe CLI
访问 https://stripe.com/docs/stripe-cli 下载安装

### 6.2 登录和设置
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 6.3 获取本地Webhook Secret
CLI会显示webhook secret，复制到 `.env.local`

## 🎯 常见问题排查

### 问题1: 支付失败
- 检查API密钥是否正确
- 确认产品和价格ID是否存在
- 查看Stripe Dashboard的日志

### 问题2: Webhook不触发
- 确认Webhook URL可访问
- 检查选择的事件类型
- 验证Webhook Secret

### 问题3: 数据库连接问题
- 确认Supabase配置正确
- 检查RLS策略设置
- 验证数据库表是否创建成功

## 🔄 定期维护

### 每月检查:
- 支付统计和收入
- 失败支付处理
- 用户订阅状态

### 每季度检查:
- 价格策略调整
- 新功能对应的计划更新
- 安全性审查

---

完成以上配置后，你的Stripe支付系统就可以正常工作了！记得在生产环境中使用正式的API密钥替换测试密钥。