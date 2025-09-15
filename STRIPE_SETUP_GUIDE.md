# Stripe支付集成配置指南

## 🚀 快速开始

您的用户购买功能已经基本完成！现在需要配置Stripe来启用支付功能。

## 📋 必需的Stripe配置

### 1. 创建Stripe账户
1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 注册或登录您的账户
3. 完成账户验证（对于生产环境必需）

### 2. 获取API密钥
在Stripe Dashboard中：

#### 测试环境密钥（开发用）：
1. 进入 **Developers** → **API keys**
2. 确保选择了 **Test mode**
3. 复制以下密钥：
   - **Publishable key** (以 `pk_test_` 开头)
   - **Secret key** (以 `sk_test_` 开头)

#### 配置环境变量
将以下内容添加到您的 `.env.local` 文件：

```bash
# Stripe配置 (测试环境)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. 设置Webhook端点
1. 在Stripe Dashboard中，进入 **Developers** → **Webhooks**
2. 点击 **Add endpoint**
3. 输入webhook URL：`https://yourdomain.com/api/webhooks/stripe`
4. 选择以下事件：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. 保存后，复制 **Signing secret** 并更新环境变量中的 `STRIPE_WEBHOOK_SECRET`

### 4. 创建产品和价格
在Stripe Dashboard中：
1. 进入 **Products** 页面
2. 创建以下产品：

#### Basic Plan
- 名称: "AI Image Generator - Basic"
- 价格: $9.99/月，recurring
- 描述: "50 generations per day, batch generation, HD quality"

#### Pro Plan  
- 名称: "AI Image Generator - Pro"
- 价格: $19.99/月，recurring
- 描述: "200 generations per day, priority generation, advanced parameters"

## 🗄️ 数据库设置

### 运行数据库迁移
确保您的Supabase数据库已经运行了订阅相关的schema：

1. 在Supabase Dashboard中，进入 **SQL Editor**
2. 运行 `subscription-schema.sql` 文件中的SQL语句
3. 验证以下表已创建：
   - `subscription_plans`
   - `user_subscriptions`  
   - `payment_history`

### 更新订阅计划数据
运行以下SQL来插入/更新订阅计划：

```sql
-- 清理现有数据（如果需要）
DELETE FROM subscription_plans WHERE name IN ('free', 'basic', 'pro');

-- 插入最新的订阅计划
INSERT INTO subscription_plans (name, display_name, price, daily_generations, hourly_limit, max_batch_size, features) VALUES
('free', 'Free', 0.00, 3, 2, 1, '["Basic generation", "Standard quality", "PNG/JPG download"]'),
('basic', 'Basic', 9.99, 50, 10, 4, '["Batch generation (2-4)", "HD quality", "All formats", "Favorites", "Priority support"]'),
('pro', 'Professional', 19.99, 200, 25, 4, '["Priority generation", "Advanced parameters", "API access", "Commercial license", "Dedicated support"]');
```

## 🧪 测试支付流程

### 使用测试卡号
Stripe提供测试卡号来测试不同场景：

- **成功支付**: `4242 4242 4242 4242`
- **失败支付**: `4000 0000 0000 0002`
- **需要验证**: `4000 0025 0000 3155`

任何未来日期和CVC都可以使用。

### 测试步骤
1. 启动应用：`npm run dev`
2. 访问 `/subscription` 页面
3. 选择一个付费计划
4. 使用测试卡号完成支付
5. 验证：
   - 支付成功页面显示
   - Stripe Dashboard中显示支付记录
   - 数据库中创建了订阅记录
   - 用户配额正确更新

## 🚀 生产环境部署

### 1. 切换到生产模式
1. 在Stripe Dashboard中切换到 **Live mode**
2. 获取生产环境的API密钥
3. 更新环境变量

### 2. 更新Webhook URL
确保webhook URL指向您的生产域名。

### 3. 验证合规性
- 确保有合适的服务条款和隐私政策
- 实施适当的数据保护措施
- 遵守当地的支付和税务法规

## 🔧 故障排除

### 常见问题

**问题1**: "No such customer" 错误
**解决方案**: 确保在创建订阅前先创建或获取Stripe客户

**问题2**: Webhook验证失败
**解决方案**: 检查webhook密钥是否正确，确保使用原始请求体

**问题3**: 订阅状态不同步
**解决方案**: 检查webhook是否正确处理了所有事件类型

### 调试技巧
1. 检查Stripe Dashboard中的日志
2. 查看Supabase日志中的错误信息
3. 使用Stripe CLI进行本地webhook测试：
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## 📞 支持

如果遇到问题：
1. 查看Stripe文档：https://stripe.com/docs
2. 检查Supabase文档：https://supabase.com/docs
3. 在GitHub上提交issue

---

🎉 **恭喜！您的AI图片生成器现在具有完整的订阅和支付功能！**