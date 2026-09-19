/** Query values must be scalar positive decimal integers; omitted values alone use defaults. */
export function positiveInteger(value: unknown, name: string, fallback: number, maximum = 1_000_000) {
  if (value === undefined)
    return fallback
  if ((typeof value !== 'string' && typeof value !== 'number')
    || !/^\d+$/.test(String(value))
    || !Number.isSafeInteger(Number(value))
    || Number(value) < 1
    || Number(value) > maximum) {
    throw Object.assign(new Error(`Invalid ${name}: expected an integer between 1 and ${maximum}`), {
      statusCode: 400,
      statusMessage: `Invalid ${name}`,
    })
  }
  return Number(value)
}

export function pagination(params: Record<string, unknown>, defaultSize: number, maxSize: number) {
  const page = positiveInteger(params.page, 'page', 1)
  // A valid oversized size is capped; invalid values are never silently treated as defaults.
  const pageSize = Math.min(positiveInteger(params.page_size !== undefined ? params.page_size : params.limit, 'page_size', defaultSize), maxSize)
  return { page, pageSize }
}
