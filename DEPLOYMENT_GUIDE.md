# 部署配置指南

## 🚀 快速部署检查清单

**✅ 准备就绪！你的项目已具备生产环境部署条件**

### 部署前确认项目状态

- [x] **Creem 支付集成**：已完成并测试通过
- [x] **本地测试**：支付流程、数据库存储均正常
- [x] **环境变量**：已准备好所有必需的配置
- [x] **代码提交**：最新更改已提交到 Git

### 立即可用的配置

以下配置**已经测试通过**，可直接在 Vercel 中使用：

**Creem 支付（测试环境）**：
```env
CREEM_API_KEY=creem_test_nRyQoEFDBfi6hxgDAs5u3
CREEM_WEBHOOK_SECRET=whsec_4k4omxtGanE3UyyVLk3pUY
CREEM_ENV=test
CREEM_API_URL=https://test-api.creem.io
CREEM_PRODUCT_ID_BASIC_MONTHLY=prod_68RCCpPV7pDrpiWprfnyJh
CREEM_PRODUCT_ID_PRO_MONTHLY=prod_2SA5XwDRuBe2IymM9hrWlh
```

**Supabase + AI（生产环境）**：
```env
NEXT_PUBLIC_SUPABASE_URL=https://bcfeyfjrcapxrtcuacur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZmV5ZmpyY2FweHJ0Y3VhY3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5OTQ1NzEsImV4cCI6MjA3MjU3MDU3MX0.IvQ_G_FeZD2PnrPque_iMJFgtAmZol3vgFP0ZaNeZy8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZmV5ZmpyY2FweHJ0Y3VhY3VyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk5NDU3MSwiZXhwIjoyMDcyNTcwNTcxfQ.miaEFNPVlQ6QvlGvbI44nkAl8Pqo1v3pJlKbpdtkJsE
GOOGLE_AI_API_KEY=AIzaSyBBzJBGqACCW8PpXTVUzqCWMEk5kLECxJU
```

### ⚠️ 需要你生成的环境变量

只有一个变量需要你自己生成：

```bash
# 生成 NextAuth Secret（需要至少32个字符）
NEXTAUTH_SECRET=your_generated_secret_here
```

**生成方法**：
```bash
# 方法1：使用 OpenSSL
openssl rand -base64 32

# 方法2：在线生成
# 访问 https://generate-secret.vercel.app/32
```

### 部署步骤概览

1. **生成 NextAuth Secret**（见上方）
2. **推送代码到 GitHub**
3. **在 Vercel 中导入项目**
4. **添加所有环境变量**（包括生成的 Secret）
5. **部署到 Vercel**
6. **配置 Cloudflare 域名解析**（`www.monet-ai.top`）
7. **更新所有服务的域名配置**
8. **测试完整流程**

### 🌐 自定义域名：www.monet-ai.top

**你的域名**：`www.monet-ai.top`  
**CDN**：Cloudflare  
**部署平台**：Vercel

---

## Vercel 环境变量配置

在 Vercel 部署时，需要在 Vercel Dashboard 中添加以下环境变量：

### 必须配置的环境变量

1. **NEXT_PUBLIC_SITE_URL**
   - 值：`https://www.monet-ai.top`
   - 用途：用于邮件验证链接的重定向和OAuth回调

2. **NEXTAUTH_URL**
   - 值：`https://www.monet-ai.top`
   - 用途：NextAuth 配置

### 其他必要的环境变量

从 `.env.local` 文件复制以下变量到 Vercel：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXTAUTH_SECRET=your_nextauth_secret

# Creem Payment Configuration (已测试可用!)
CREEM_API_KEY=creem_test_nRyQoEFDBfi6hxgDAs5u3
CREEM_WEBHOOK_SECRET=whsec_4k4omxtGanE3UyyVLk3pUY
CREEM_ENV=test
CREEM_API_URL=https://test-api.creem.io
CREEM_PRODUCT_ID_BASIC_MONTHLY=prod_68RCCpPV7pDrpiWprfnyJh
CREEM_PRODUCT_ID_PRO_MONTHLY=prod_2SA5XwDRuBe2IymM9hrWlh
CREEM_PRODUCT_ID_BASIC_YEARLY=prod_basic_yearly_placeholder
CREEM_PRODUCT_ID_PRO_YEARLY=prod_pro_yearly_placeholder
```

### ⚠️ 重要：Google AI API Key 配置

确保 `GOOGLE_AI_API_KEY` 正确配置：

1. **获取 API Key**：
   - 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 创建新的 API Key
   - 确保启用了 Gemini API 访问权限

2. **API Key 权限检查**：
   - 确保 API Key 有访问 `gemini-2.0-flash-exp` 模型的权限
   - 某些地区可能需要申请 Gemini 2.0 的早期访问权限

3. **配额和限制**：
   - 检查 API 配额是否足够
   - 确认没有地区限制

## ⚠️ 重要：Creem 支付配置

### 1. Creem API 配置

1. **获取 API 凭据**：
   - 访问 [Creem Dashboard](https://dashboard.creem.io)
   - 创建账户并验证
   - 获取 API Key 和 Webhook Secret

2. **创建产品**：
   - 在 Creem 控制台中创建以下产品：
     - Basic Monthly Plan ($9.99)
     - Pro Monthly Plan ($19.99)
     - Basic Yearly Plan ($99.99) - 可选
     - Pro Yearly Plan ($199.99) - 可选
   - 记录每个产品的 Product ID

3. **配置 Webhook**：
   - Webhook URL: `https://your-domain.com/api/webhooks/creem`
   - 确保启用 `checkout.completed` 事件

### 2. 实际的 Creem 环境变量值

**✅ 当前测试环境值**（复制到 Vercel）：
```env
CREEM_API_KEY=creem_test_nRyQoEFDBfi6hxgDAs5u3
CREEM_WEBHOOK_SECRET=whsec_4k4omxtGanE3UyyVLk3pUY
CREEM_ENV=test
CREEM_API_URL=https://test-api.creem.io
CREEM_PRODUCT_ID_BASIC_MONTHLY=prod_68RCCpPV7pDrpiWprfnyJh
CREEM_PRODUCT_ID_PRO_MONTHLY=prod_2SA5XwDRuBe2IymM9hrWlh
CREEM_PRODUCT_ID_BASIC_YEARLY=prod_basic_yearly_placeholder
CREEM_PRODUCT_ID_PRO_YEARLY=prod_pro_yearly_placeholder
```

### 3. 部署后更新 Webhook URL

1. 部署完成后，获取 Vercel 域名（如：`https://your-app.vercel.app`）
2. 在 Creem 控制台更新 Webhook URL：
   ```
   https://your-app.vercel.app/api/webhooks/creem
   ```

### 4. 切换到生产环境（可选）

如果要使用真实支付：
```env
CREEM_ENV=production
CREEM_API_URL=https://api.creem.io
# 使用生产环境的 API Key 和 Product IDs
```

## 🔧 域名配置：Cloudflare + Vercel

### 详细配置步骤

#### 1. 首先在 Vercel 中部署项目

1. **基础部署**：
   ```bash
   # 推送代码
   git add .
   git commit -m "feat: ready for production deployment"
   git push origin main
   ```

2. **Vercel 配置**：
   - 在 Vercel Dashboard 导入 GitHub 仓库
   - 添加所有环境变量（见上方列表）
   - 点击 "Deploy"
   - 获得临时域名（如：`https://your-app-123.vercel.app`）

#### 2. 配置 Cloudflare 域名解析

1. **在 Cloudflare Dashboard 中**：
   - 进入域名 `monet-ai.top` 的 DNS 设置
   - 添加 CNAME 记录：
     ```
     Type: CNAME
     Name: www
     Target: cname.vercel-dns.com
     Proxy status: 代理（橙色云朵）
     TTL: Auto
     ```

2. **Cloudflare 设置优化**：
   - **SSL/TLS**：设置为 "Full (strict)"
   - **Speed → Optimization**：启用 Auto Minify (JS, CSS, HTML)
   - **Security → Bot Fight Mode**：可选启用
   - **Caching**：保持默认设置

#### 3. 在 Vercel 中添加自定义域名

1. **添加域名**：
   - 在 Vercel 项目设置中点击 "Domains"
   - 添加 `www.monet-ai.top`
   - Vercel 会自动检测并配置

2. **等待 DNS 传播**：
   - 通常需要 5-30 分钟
   - 可以使用 `dig www.monet-ai.top` 检查

#### 4. 验证域名配置

```bash
# 检查域名解析
nslookup www.monet-ai.top

# 检查 SSL 证书
curl -I https://www.monet-ai.top

# 测试网站访问
curl https://www.monet-ai.top
```

## 🔄 更新所有服务配置

域名配置完成后，需要更新所有相关服务：

### 1. 更新 Vercel 环境变量

确保以下变量使用正确的域名：
```env
NEXT_PUBLIC_SITE_URL=https://www.monet-ai.top
NEXTAUTH_URL=https://www.monet-ai.top
```

### 2. 更新 Creem Webhook URL

1. 登录 [Creem Dashboard](https://dashboard.creem.io)
2. 进入项目设置
3. 更新 Webhook URL：
   ```
   https://www.monet-ai.top/api/webhooks/creem
   ```
4. 测试 Webhook 连接

### 3. 验证支付回调 URL

确认 Creem 支付成功后的回调 URL：
```
Success URL: https://www.monet-ai.top/subscription/success
Cancel URL: https://www.monet-ai.top/subscription?cancelled=true
```

## Supabase 配置

### 1. 站点 URL 配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **General**
4. 在 **Configuration** 部分找到 **Site URL**
5. 设置为：`https://www.monet-ai.top`

### 2. 认证重定向 URL 配置

1. 在 Supabase Dashboard 中进入 **Authentication** → **URL Configuration**
2. 在 **Redirect URLs** 中添加：
   - `https://www.monet-ai.top/auth/callback`
   - `https://www.monet-ai.top/auth/reset-password`
   - `https://www.monet-ai.top/auth/confirm`

### 3. 邮件模板配置

1. 进入 **Authentication** → **Email Templates**
2. 确保所有邮件模板使用 `{{ .SiteURL }}` 变量
3. 验证邮件链接格式正确

### 3. 邮件模板配置（可选）

如果你想自定义邮件模板：

1. 进入 **Authentication** → **Email Templates**
2. 编辑 **Confirm signup** 模板
3. 确保链接使用 `{{ .SiteURL }}/auth/callback`

## 🧪 部署后完整测试流程

### 1. 基础功能测试

```bash
# 1. 访问网站
curl -I https://www.monet-ai.top

# 2. 检查 API 状态
curl https://www.monet-ai.top/api/health

# 3. 检查认证页面
curl https://www.monet-ai.top/auth/login
```

### 2. 用户注册与认证测试

1. **注册新账户**：
   - 访问 `https://www.monet-ai.top/auth/register`
   - 使用真实邮箱注册
   - 检查邮件中的验证链接是否使用 `www.monet-ai.top`

2. **邮件验证**：
   - 点击邮件中的验证链接
   - 应该跳转到 `https://www.monet-ai.top/auth/callback`
   - 验证成功后跳转到仪表板

### 3. AI 图片生成测试

1. **登录后测试**：
   - 访问 `/generate` 页面
   - 输入提示词生成图片
   - 验证 Gemini API 正常工作

### 4. 🔥 Creem 支付完整测试

**这是最重要的测试！**

1. **访问订阅页面**：
   ```
   https://www.monet-ai.top/subscription
   ```

2. **支付流程测试**：
   - 选择 Basic Plan ($9.99) 或 Pro Plan ($19.99)
   - 点击 "Creem Payment"
   - 验证跳转到 Creem 支付页面
   - 使用测试银行卡：`4242 4242 4242 4242`
   - 完成支付流程

3. **支付成功验证**：
   - 支付完成后应跳转到：
     ```
     https://www.monet-ai.top/subscription/success?session_id=xxx&plan=basic&interval=monthly
     ```
   - Success 页面应显示正确的计划信息
   - 返回订阅页面确认状态更新

4. **数据库验证**：
   - 登录 Supabase Dashboard
   - 检查 `user_subscriptions` 表
   - 检查 `payment_history` 表
   - 确认记录正确创建

### 5. Webhook 测试

1. **检查 Webhook 状态**：
   - 在 Creem Dashboard 查看 Webhook 日志
   - 确认 Webhook 成功发送到：
     ```
     https://www.monet-ai.top/api/webhooks/creem
     ```

2. **手动测试 Webhook**：
   ```bash
   # 测试 Webhook 端点可访问性
   curl -X POST https://www.monet-ai.top/api/webhooks/creem \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

## 故障排除

### 生图功能无法工作

如果部署后生图功能无法正常工作，请按以下步骤检查：

#### 1. 检查环境变量
访问 `https://your-app.vercel.app/api/debug/gemini` 来检查 Google AI API 配置：

```bash
# 正常返回应该包含：
{
  "success": true,
  "debug": {
    "hasApiKey": true,
    "testTextGeneration": { "success": true },
    ...
  }
}
```

#### 2. 测试生图功能
访问 `https://your-app.vercel.app/api/test-generate` (POST) 来测试简化的生图流程。

#### 3. 常见问题及解决方案

**问题**: API Key 无效或无权限
- **解决**: 重新生成 Google AI Studio 中的 API Key
- 确保在 Google Cloud Console 中启用了 Generative AI API
- 检查 API Key 是否有 Gemini 2.0 访问权限

**问题**: Gemini 2.0 Flash 模型不可用
- **解决**: 在 `src/lib/gemini.ts` 中临时改用 `gemini-1.5-flash` 模型
- 申请 Gemini 2.0 早期访问权限

**问题**: 函数超时
- **解决**: Vercel Hobby 计划有 10 秒超时限制，考虑升级到 Pro 计划

**问题**: 地区限制
- **解决**: 某些地区可能无法访问 Gemini API，检查地区支持情况

#### 4. 临时修复：使用 Gemini 1.5
如果 Gemini 2.0 不可用，可以修改 `src/lib/gemini.ts` 第 18 行：

```typescript
// 从:
model: 'gemini-2.0-flash-exp'
// 改为:
model: 'gemini-1.5-flash'
```

注意：Gemini 1.5 不支持原生图像生成，会返回文本描述。

### 邮件链接仍然使用 localhost

1. 检查 Vercel 环境变量 `NEXT_PUBLIC_SITE_URL` 是否正确设置
2. 检查 Supabase 的 Site URL 配置
3. 重新部署应用

### Google OAuth 无法工作

1. 在 Google Cloud Console 中添加 Vercel 域名到授权重定向 URI
2. 检查 Supabase 的 Google OAuth 配置

### 邮件发送失败

1. 检查 Supabase 项目的邮件发送配置
2. 确认邮件发送限制没有被触发

## 🔄 Creem 支付测试

### 部署后支付功能测试

1. **基础测试**：
   - 访问 `/subscription` 页面
   - 确认 Basic 和 Pro 计划正确显示
   - 价格显示为 $9.99 和 $19.99

2. **支付流程测试**：
   - 选择一个计划，点击 "Creem Payment"
   - 应该跳转到 Creem 支付页面
   - 使用测试银行卡完成支付
   - 支付成功后跳转回 `/subscription/success`

3. **数据验证**：
   - Success 页面应显示正确的计划信息
   - 检查 Supabase 数据库中的记录：
     - `user_subscriptions` 表应有新记录
     - `payment_history` 表应有支付记录

### Creem 支付故障排除

#### 问题：支付创建失败

**症状**：点击 Creem 支付按钮后显示 "Payment creation failed"

**解决步骤**：
1. 检查 Vercel Functions 日志
2. 确认 Creem API Key 正确配置
3. 验证 Product IDs 存在：
   ```bash
   # 检查产品是否存在
   curl -H "x-api-key: YOUR_API_KEY" https://test-api.creem.io/v1/products/prod_68RCCpPV7pDrpiWprfnyJh
   ```

#### 问题：支付成功但订阅未激活

**症状**：支付完成但用户仍显示免费计划

**解决步骤**：
1. 检查 Webhook 是否正确配置
2. 查看 Creem 控制台的 Webhook 日志
3. 确认 Webhook URL 可访问：
   ```bash
   # 测试 Webhook 端点
   curl https://your-app.vercel.app/api/webhooks/creem
   ```

#### 问题：Webhook 接收失败

**症状**：Creem 发送 Webhook 但应用未处理

**解决步骤**：
1. 检查 Webhook Secret 是否正确
2. 确认 Webhook URL 配置正确
3. 查看 Vercel Functions 日志中的错误
4. 临时禁用 Webhook 签名验证进行调试

### 测试银行卡信息

使用以下测试卡信息进行支付测试：

```
卡号: 4242 4242 4242 4242
到期日: 任何未来日期
CVC: 任何3位数字
姓名: 任何名字
```

### 生产环境注意事项

1. **域名配置**：确保在 Creem 控制台中配置正确的域名
2. **HTTPS 要求**：Webhook URL 必须使用 HTTPS
3. **API 限制**：注意 Creem API 的调用频率限制
4. **监控**：设置支付失败的告警通知