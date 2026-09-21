import type { Locale } from '../lib/domainConstants.js'
import {
  demoCombinations,
  type DemoCombinationsDto,
} from '../lib/fixedDemoSamples.js'

/** 固定样例，不读统计表、不调用外部服务。 */
export function getDemoCombinations(locale: Locale): DemoCombinationsDto {
  return demoCombinations(locale)
}
