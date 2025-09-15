#!/bin/bash

echo "🧪 AI Image Generator - 支付功能测试脚本"
echo "========================================="

# 检查依赖
echo "📦 检查依赖..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装"
    exit 1
fi

cd ai-image-generator

# 检查Stripe依赖
if ! npm list stripe > /dev/null 2>&1; then
    echo "❌ Stripe依赖未安装"
    exit 1
else
    echo "✅ Stripe依赖已安装"
fi

# 检查环境变量
echo "🔧 检查环境变量..."
if [ ! -f .env.local ]; then
    echo "❌ .env.local文件不存在"
    exit 1
fi

# 检查必要的环境变量
env_vars=("STRIPE_SECRET_KEY" "STRIPE_PUBLISHABLE_KEY" "STRIPE_WEBHOOK_SECRET")
for var in "${env_vars[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        echo "⚠️  $var 未在.env.local中设置"
    else
        if grep -q "^$var=.*your_.*_here" .env.local; then
            echo "⚠️  $var 仍然是占位符值，需要更新为实际的Stripe密钥"
        else
            echo "✅ $var 已设置"
        fi
    fi
done

# 检查文件结构
echo "📁 检查文件结构..."
files=(
    "src/app/api/subscription/route.ts"
    "src/app/api/subscription/plans/route.ts"
    "src/app/api/webhooks/stripe/route.ts"
    "src/app/api/payment-history/route.ts"
    "src/app/subscription/page.tsx"
    "src/app/subscription/success/page.tsx"
    "src/app/subscription/cancel/page.tsx"
    "src/components/SubscriptionManager.tsx"
    "src/components/PaymentHistory.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 缺失"
    fi
done

# 检查数据库schema文件
echo "🗄️ 检查数据库schema..."
if [ -f "../subscription-schema.sql" ]; then
    echo "✅ subscription-schema.sql 存在"
else
    echo "❌ subscription-schema.sql 缺失"
fi

# 编译检查
echo "🔨 编译检查..."
if npm run build > /dev/null 2>&1; then
    echo "✅ 项目编译成功"
else
    echo "❌ 项目编译失败，请检查代码错误"
    npm run build
fi

echo ""
echo "📋 测试总结"
echo "========================================="
echo "✅ 基本功能检查完成"
echo ""
echo "📝 后续步骤："
echo "1. 配置真实的Stripe API密钥"
echo "2. 运行subscription-schema.sql初始化数据库"
echo "3. 设置Stripe webhook端点"
echo "4. 使用测试卡号测试支付流程"
echo ""
echo "📖 详细配置指南请查看: ../STRIPE_SETUP_GUIDE.md"