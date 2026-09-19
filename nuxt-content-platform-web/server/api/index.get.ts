import { mockGetApiInfo } from '../../app/mock'

/** 明确处理 GET /api 与 /api/ */
export default defineEventHandler(async () => {
  return await mockGetApiInfo()
})
