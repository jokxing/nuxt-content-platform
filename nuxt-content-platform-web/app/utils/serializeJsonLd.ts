/** Escape HTML delimiters even when JSON-LD includes user-authored content. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\u003C').replace(/>/g, '\u003E').replace(/&/g, '\u0026')
}
