/**
 * 时区工具函数
 * 用于处理北京时区（UTC+8）相关的时间计算
 */

// 北京时区偏移量（毫秒）
const BEIJING_OFFSET = 8 * 60 * 60 * 1000

/**
 * 获取北京时区的当前时间
 * @returns 北京时区的当前时间
 */
export function getBeijingTime(): Date {
  const now = new Date()
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
  return new Date(utcTime + BEIJING_OFFSET)
}

/**
 * 将日期字符串转换为北京时区的完整时间字符串
 * @param dateString 日期字符串（YYYY-MM-DD格式）
 * @param timeString 时间字符串（HH:mm:ss格式，默认为21:30:00）
 * @returns 北京时区的完整时间字符串
 */
export function toBeijingTimeString(dateString: string, timeString: string = '21:30:00'): string {
  try {
    // 解析日期字符串
    const parts = dateString.split('-').map(Number)
    if (parts.length !== 3) {
      throw new Error('Invalid date format')
    }

    const [year, month, day] = parts
    if (!year || !month || !day) {
      throw new Error('Invalid date components')
    }

    // 解析时间字符串
    const timeParts = timeString.split(':').map(Number)
    if (timeParts.length !== 3) {
      throw new Error('Invalid time format')
    }

    const [hour, minute, second] = timeParts
    if (hour === undefined || minute === undefined || second === undefined) {
      throw new Error('Invalid time components')
    }

    // 创建北京时区的日期时间
    const beijingDateTime = new Date(year, month - 1, day, hour, minute, second)

    // 格式化为 YYYY-MM-DD HH:mm:ss 格式
    const yearStr = beijingDateTime.getFullYear()
    const monthStr = String(beijingDateTime.getMonth() + 1).padStart(2, '0')
    const dayStr = String(beijingDateTime.getDate()).padStart(2, '0')
    const hourStr = String(beijingDateTime.getHours()).padStart(2, '0')
    const minuteStr = String(beijingDateTime.getMinutes()).padStart(2, '0')
    const secondStr = String(beijingDateTime.getSeconds()).padStart(2, '0')

    return `${yearStr}-${monthStr}-${dayStr} ${hourStr}:${minuteStr}:${secondStr}`
  }
  catch (error) {
    console.error('Error converting to Beijing time:', error)
    // 如果转换失败，返回原始格式
    return `${dateString} ${timeString}`
  }
}

/**
 * 格式化日期为本地时间字符串（用于显示）
 * @param dateString 日期字符串
 * @param locale 地区代码（默认为zh-HK）
 * @returns 格式化的日期字符串
 */
export function formatDateForDisplay(dateString: string, locale: string = 'zh-HK'): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Hong_Kong',
    })
  }
  catch (error) {
    console.error('Error formatting date for display:', error)
    return dateString
  }
}

/**
 * 获取当前北京时区的时间戳
 * @returns 北京时区的时间戳（毫秒）
 */
export function getBeijingTimestamp(): number {
  return getBeijingTime().getTime()
}

/**
 * 计算两个时间之间的差值（基于北京时区）
 * @param targetTime 目标时间字符串
 * @param nowMs 可选：覆盖「当前时间」（Mock 时钟，避免 SSR/CSR 水合不一致）
 * @returns 时间差值对象
 */
export function calculateTimeDifference(targetTime: string, nowMs?: number): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
} {
  const now = nowMs ?? getBeijingTimestamp()
  const target = new Date(targetTime).getTime()
  const diff = target - now

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
    }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
  }
}
