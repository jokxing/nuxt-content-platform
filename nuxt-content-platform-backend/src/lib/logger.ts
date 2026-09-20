type LogLevel = 'info' | 'warn' | 'error'

function write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const payload = {
    level,
    message,
    // 日志 time 不属于业务 API，保留 ISO 字符串便于阅读。
    time: new Date().toISOString(),
    ...meta,
  }
  const line = JSON.stringify(payload)
  if (level === 'error') {
    console.error(line)
    return
  }
  if (level === 'warn') {
    console.warn(line)
    return
  }
  console.log(line)
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    write('info', message, meta)
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    write('warn', message, meta)
  },
  error(message: string, meta?: Record<string, unknown>): void {
    write('error', message, meta)
  },
}
