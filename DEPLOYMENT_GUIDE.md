# 部署配置指南

## Vercel 环境变量配置

在 Vercel 部署时，需要在 Vercel Dashboard 中添加以下环境变量：

### 必须配置的环境变量

1. **NEXT_PUBLIC_SITE_URL**
   - 值：`https://your-app-name.vercel.app` (替换为你的实际 Vercel 域名)
   - 用途：用于邮件验证链接的重定向

2. **NEXTAUTH_URL**
   - 值：`https://your-app-name.vercel.app` (替换为你的实际 Vercel 域名)
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

## Supabase 配置

### 1. 站点 URL 配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **General**
4. 在 **Configuration** 部分找到 **Site URL**
5. 设置为：`https://your-app-name.vercel.app`

### 2. 认证重定向 URL 配置

1. 在 Supabase Dashboard 中进入 **Authentication** → **URL Configuration**
2. 在 **Redirect URLs** 中添加：
   - `https://your-app-name.vercel.app/auth/callback`
   - `https://your-app-name.vercel.app/auth/reset-password`

### 3. 邮件模板配置（可选）

如果你想自定义邮件模板：

1. 进入 **Authentication** → **Email Templates**
2. 编辑 **Confirm signup** 模板
3. 确保链接使用 `{{ .SiteURL }}/auth/callback`

## 部署后验证

1. 部署到 Vercel 后，尝试注册新账户
2. 检查邮件中的验证链接是否使用正确的域名
3. 点击验证链接应该能正确跳转到你的 Vercel 应用

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