import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 12

/** 密码哈希；调用方不得记录明文或哈希。 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/** 校验密码；不区分账号是否存在由上层用假哈希对齐耗时。 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash)
}

/**
 * 模块加载时预计算的假哈希，仅用于未知用户名路径上的耗时对齐。
 * 不得用于真实账号。
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  'contentpulse-dummy-password-not-a-real-account',
  BCRYPT_ROUNDS,
)
