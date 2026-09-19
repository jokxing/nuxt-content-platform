declare module 'chinese-simple2traditional' {
  export function toTraditional(text: string, enhance?: boolean): string
  export function toSimplified(text: string, enhance?: boolean): string
  export function setupEnhance(): void
}

declare module 'chinese-simple2traditional/enhance' {
  export function setupEnhance(): void
}
