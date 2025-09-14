const fs = require('fs');

// 手动读取 .env.local 文件
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key.trim()] = value.trim();
      }
    }
  }
} catch (error) {
  console.error('无法读取 .env.local 文件:', error.message);
}

const Stripe = require('stripe');

async function testStripeConfig() {
  console.log('🧪 测试Stripe配置...\n');
  
  // 检查环境变量
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log('🔑 API Keys 检查:');
  console.log('✅ Secret Key:', secretKey ? secretKey.substring(0, 12) + '...' : '❌ 未设置');
  console.log('✅ Publishable Key:', publishableKey ? publishableKey.substring(0, 12) + '...' : '❌ 未设置');
  console.log('✅ Webhook Secret:', webhookSecret && webhookSecret !== 'whsec_your_webhook_secret_here' ? webhookSecret.substring(0, 12) + '...' : '⚠️  使用默认值，需要配置');
  
  if (!secretKey) {
    console.error('\n❌ STRIPE_SECRET_KEY 未设置');
    console.log('\n🔧 解决方案:');
    console.log('1. 访问 https://dashboard.stripe.com/test/apikeys');
    console.log('2. 复制 Secret key (sk_test_...)');
    console.log('3. 更新 .env.local 中的 STRIPE_SECRET_KEY');
    return;
  }
  
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });
    
    console.log('\n🔗 测试Stripe API连接...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe账户连接成功');
    console.log('📧 账户邮箱:', account.email || '未设置');
    console.log('🏢 账户类型:', account.type);
    console.log('🌍 国家:', account.country);
    
    // 测试产品
    console.log('\n📦 检查产品配置...');
    const products = await stripe.products.list({ limit: 10 });
    console.log('当前产品数量:', products.data.length);
    
    if (products.data.length === 0) {
      console.log('⚠️  没有找到产品，需要创建');
      console.log('💡 建议: 按照 STRIPE_SETUP_GUIDE.md 创建产品');
    } else {
      products.data.forEach(product => {
        console.log(`  - ${product.name} (ID: ${product.id})`);
        console.log(`    状态: ${product.active ? '✅ 激活' : '❌ 未激活'}`);
      });
    }
    
    // 测试价格
    console.log('\n💰 检查价格配置...');
    const prices = await stripe.prices.list({ limit: 10 });
    console.log('当前价格数量:', prices.data.length);
    
    if (prices.data.length === 0) {
      console.log('⚠️  没有找到价格，需要创建');
    } else {
      prices.data.forEach(price => {
        const amount = price.unit_amount ? (price.unit_amount / 100) : 0;
        const interval = price.recurring ? price.recurring.interval : '一次性';
        console.log(`  - $${amount} ${price.currency.toUpperCase()} / ${interval} (ID: ${price.id})`);
        console.log(`    状态: ${price.active ? '✅ 激活' : '❌ 未激活'}`);
      });
    }
    
    // 测试Webhook配置
    console.log('\n🔗 检查Webhook配置...');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    console.log('当前Webhook端点数量:', webhooks.data.length);
    
    if (webhooks.data.length === 0) {
      console.log('⚠️  没有配置Webhook端点');
      console.log('💡 建议: 按照指南配置Webhook端点');
    } else {
      webhooks.data.forEach(webhook => {
        console.log(`  - ${webhook.url}`);
        console.log(`    状态: ${webhook.status}`);
        console.log(`    事件: ${webhook.enabled_events.slice(0, 3).join(', ')}${webhook.enabled_events.length > 3 ? '...' : ''}`);
      });
    }
    
    console.log('\n📊 配置状态总结:');
    console.log(`✅ API连接: 正常`);
    console.log(`${products.data.length > 0 ? '✅' : '⚠️'} 产品配置: ${products.data.length > 0 ? '正常' : '需要设置'}`);
    console.log(`${prices.data.length > 0 ? '✅' : '⚠️'} 价格配置: ${prices.data.length > 0 ? '正常' : '需要设置'}`);
    console.log(`${webhooks.data.length > 0 ? '✅' : '⚠️'} Webhook配置: ${webhooks.data.length > 0 ? '正常' : '需要设置'}`);
    
    // 测试创建客户
    console.log('\n🧪 测试创建测试客户...');
    try {
      const testCustomer = await stripe.customers.create({
        email: 'test@example.com',
        name: 'Test Customer',
        metadata: {
          test: 'true'
        }
      });
      console.log('✅ 测试客户创建成功:', testCustomer.id);
      
      // 删除测试客户
      await stripe.customers.del(testCustomer.id);
      console.log('🗑️  测试客户已删除');
    } catch (error) {
      console.log('❌ 创建测试客户失败:', error.message);
    }
    
    console.log('\n🎉 Stripe配置测试完成！');
    
  } catch (error) {
    console.error('\n❌ Stripe测试失败:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n🔧 认证错误解决方案:');
      console.log('1. 检查 STRIPE_SECRET_KEY 是否正确');
      console.log('2. 确认API key以 sk_test_ 开头（测试环境）');
      console.log('3. 检查API key是否已激活');
    }
    
    if (error.type === 'StripePermissionError') {
      console.log('\n🔧 权限错误解决方案:');
      console.log('1. 确认Stripe账户已完成设置');
      console.log('2. 检查API key权限');
    }
  }
}

console.log('🚀 Monet-AI Stripe配置测试工具');
console.log('=' * 50);
testStripeConfig().catch(console.error);