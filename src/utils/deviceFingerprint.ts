/**
 * 设备指纹生成工具
 * 用于游客用户的唯一识别，避免刷量
 */

interface DeviceInfo {
  userAgent: string
  language: string
  platform: string
  screenResolution: string
  timezone: string
  colorDepth: number
  cookieEnabled: boolean
  doNotTrack: string | null
}

/**
 * 生成浏览器设备指纹
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    // 服务端渲染时返回默认值
    return 'server-side'
  }

  const deviceInfo: DeviceInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorDepth: screen.colorDepth,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack
  }

  // 将设备信息序列化并生成哈希
  const fingerprint = btoa(JSON.stringify(deviceInfo))
    .replace(/[+/=]/g, '')
    .substring(0, 32)

  return fingerprint
}

/**
 * 获取客户端IP（从请求头中提取）
 */
export function getClientIP(request: Request): string {
  const headers = request.headers
  
  // 按优先级检查各种IP头
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip', 
    'cf-connecting-ip',
    'x-client-ip',
    'x-cluster-client-ip'
  ]

  for (const header of ipHeaders) {
    const value = headers.get(header)
    if (value) {
      // x-forwarded-for 可能包含多个IP，取第一个
      return value.split(',')[0].trim()
    }
  }

  return 'unknown'
}

/**
 * 生成游客用户的唯一标识
 * 结合设备指纹和IP地址
 */
export function generateGuestIdentifier(deviceFingerprint: string, ip: string): string {
  const combined = `${deviceFingerprint}_${ip}`
  
  // 生成短哈希
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  
  return `guest_${Math.abs(hash).toString(36)}`
}

/**
 * 验证设备指纹有效性
 */
export function isValidDeviceFingerprint(fingerprint: string): boolean {
  return fingerprint && 
         fingerprint.length >= 16 && 
         fingerprint !== 'server-side' &&
         !/[^a-zA-Z0-9]/.test(fingerprint)
}