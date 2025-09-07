// 临时调试脚本 - 在浏览器控制台中运行
// 用于手动设置订阅状态

function setSubscriptionForTesting(planName) {
  const userId = 'test-user-id'; // 这里需要实际的用户ID
  const subscriptionData = {
    userId: userId,
    planName: planName,
    status: 'active',
    subscribedAt: new Date().toISOString(),
    sessionId: `debug_${Date.now()}`
  };
  
  localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscriptionData));
  localStorage.setItem(`global_subscription_${userId}`, JSON.stringify(subscriptionData));
  
  console.log('Set subscription to:', planName);
  console.log('Data:', subscriptionData);
  
  // 刷新页面以查看更改
  window.location.reload();
}

// 使用方法：
// setSubscriptionForTesting('pro')
// setSubscriptionForTesting('basic')
// setSubscriptionForTesting('free')

function clearSubscriptionForTesting() {
  const userId = 'test-user-id';
  localStorage.removeItem(`subscription_${userId}`);
  localStorage.removeItem(`global_subscription_${userId}`);
  console.log('Cleared subscription data');
  window.location.reload();
}