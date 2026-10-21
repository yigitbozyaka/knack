export interface Rgb {
  r: number
  g: number
  b: number
}

export type ParseResult =
  | { ok: true; rgb: Rgb; gamutMapped: boolean }
  | { ok: false; error: string }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const round = (value: number, digits: number) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

const NUMBER = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)`

function fail(error: string): ParseResult {
  return { ok: false, error }
}

function parseHex(input: string): ParseResult {
  const digits = input.replace(/^#/, '')
  if (!/^[0-9a-f]+$/i.test(digits)) return fail('Hex colors may only contain 0-9 and a-f.')
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((d) => d + d)
          .join('')
      : digits
  if (full.length !== 6) return fail('Hex colors need 3 or 6 digits, e.g. #1a2b3c.')
  return {
    ok: true,
    gamutMapped: false,
    rgb: {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    },
  }
}

function functionArgs(input: string, name: string): string[] | null {
  const match = new RegExp(String.raw`^${name}\(\s*([^)]*?)\s*\)$`, 'i').exec(input)
  if (!match?.[1]) return null
  const withoutAlpha = match[1].replace(/\s*\/.*$/, '')
  return withoutAlpha.split(/\s*,\s*|\s+/).filter(Boolean)
}

function toNumber(token: string, percentScale?: number): number | null {
  const isPercent = token.endsWith('%')
  const raw = isPercent ? token.slice(0, -1) : token
  if (!new RegExp(`^${NUMBER}$`).test(raw)) return null
  const value = parseFloat(raw)
  return isPercent && percentScale !== undefined ? (value / 100) * percentScale : value
}

function toAngle(token: string): number | null {
  const unit = /(deg|turn|grad|rad)$/i.exec(token)?.[1]?.toLowerCase()
  const raw = unit ? token.slice(0, -unit.length) : token
  if (!new RegExp(`^${NUMBER}$`).test(raw)) return null
  const value = parseFloat(raw)
  if (unit === 'turn') return value * 360
  if (unit === 'grad') return value * 0.9
  if (unit === 'rad') return (value * 180) / Math.PI
  return value
}

function parseRgbFunction(input: string): ParseResult {
  const args = functionArgs(input, 'rgba?')
  if (args?.length !== 3 && args?.length !== 4) return fail('Use rgb(255, 128, 0).')
  const channels = args.slice(0, 3).map((token) => toNumber(token, 255))
  if (channels.some((value) => value === null)) return fail('RGB channels must be numbers.')
  const [r = 0, g = 0, b = 0] = channels as number[]
  if ([r, g, b].some((value) => value < 0 || value > 255)) {
    return fail('RGB channels must be between 0 and 255.')
  }
  return { ok: true, rgb: { r, g, b }, gamutMapped: false }
}

function parseHslFunction(input: string): ParseResult {
  const args = functionArgs(input, 'hsla?')
  if (args?.length !== 3 && args?.length !== 4) return fail('Use hsl(210, 50%, 40%).')
  const hue = toAngle(args[0] ?? '')
  const saturation = toNumber(args[1] ?? '')
  const lightness = toNumber(args[2] ?? '')
  if (hue === null || saturation === null || lightness === null) {
    return fail('HSL needs a hue and two percentages.')
  }
  if (saturation < 0 || saturation > 100 || lightness < 0 || lightness > 100) {
    return fail('Saturation and lightness must be between 0% and 100%.')
  }
  return { ok: true, rgb: hslToRgb(hue, saturation, lightness), gamutMapped: false }
}

function parseOklchFunction(input: string): ParseResult {
  const args = functionArgs(input, 'oklch')
  if (args?.length !== 3) return fail('Use oklch(0.62 0.2 250).')
  const component = (token: string | undefined, read: (token: string) => number | null) =>
    token?.toLowerCase() === 'none' ? 0 : read(token ?? '')
  const lightness = component(args[0], (token) => toNumber(token, 1))
  const chroma = component(args[1], (token) => toNumber(token, 0.4))
  const hue = component(args[2], toAngle)
  if (lightness === null || chroma === null || hue === null) {
    return fail('OKLCH needs lightness, chroma and hue.')
  }
  if (lightness < 0 || lightness > 1)
    return fail('OKLCH lightness must be between 0 and 1 (or 0–100%).')
  if (chroma < 0) return fail('OKLCH chroma cannot be negative.')
  const { rgb, gamutMapped } = mapOklchToRgb(lightness, chroma, hue)
  return { ok: true, rgb, gamutMapped }
}

export function parseColor(input: string): ParseResult {
  const text = input.trim()
  if (text === '') return fail('Enter a color.')
  if (text.startsWith('#') || /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(text)) return parseHex(text)
  if (/^rgba?\(/i.test(text)) return parseRgbFunction(text)
  if (/^hsla?\(/i.test(text)) return parseHslFunction(text)
  if (/^oklch\(/i.test(text)) return parseOklchFunction(text)
  return fail('Unrecognised color. Try #1a2b3c, rgb(), hsl() or oklch().')
}

export function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const h = (((hue % 360) + 360) % 360) / 360
  const s = saturation / 100
  const l = lightness / 100
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h * 12) % 12
    return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255
  }
  return { r: channel(0), g: channel(8), b: channel(4) }
}

export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  const l = (max + min) / 2
  if (delta === 0) return { h: 0, s: 0, l: l * 100 }
  const s = delta / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === red) h = ((green - blue) / delta) % 6
  else if (max === green) h = (blue - red) / delta + 2
  else h = (red - green) / delta + 4
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 }
}

const toLinear = (channel: number) => {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const fromLinear = (linear: number) => {
  const c = linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055
  return clamp(c, 0, 1) * 255
}

export function rgbToOklch({ r, g, b }: Rgb): { l: number; c: number; h: number } {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const chroma = Math.hypot(a, bb)
  const hue = chroma < 1e-4 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360
  return { l: lightness, c: chroma, h: hue }
}

const GAMUT_EPSILON = 1e-6

function oklchToLinearRgb(
  lightness: number,
  chroma: number,
  hue: number,
): [number, number, number] {
  const radians = (hue * Math.PI) / 180
  const a = chroma * Math.cos(radians)
  const b = chroma * Math.sin(radians)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const isInGamut = (linear: [number, number, number]) =>
  linear.every((value) => value >= -GAMUT_EPSILON && value <= 1 + GAMUT_EPSILON)

export function mapOklchToRgb(
  lightness: number,
  chroma: number,
  hue: number,
): { rgb: Rgb; gamutMapped: boolean } {
  let linear = oklchToLinearRgb(lightness, chroma, hue)
  let gamutMapped = false
  if (!isInGamut(linear)) {
    gamutMapped = true
    let low = 0
    let high = chroma
    for (let step = 0; step < 24; step++) {
      const middle = (low + high) / 2
      if (isInGamut(oklchToLinearRgb(lightness, middle, hue))) low = middle
      else high = middle
    }
    linear = oklchToLinearRgb(lightness, low, hue)
  }
  return {
    rgb: { r: fromLinear(linear[0]), g: fromLinear(linear[1]), b: fromLinear(linear[2]) },
    gamutMapped,
  }
}

export function oklchToRgb(lightness: number, chroma: number, hue: number): Rgb {
  return mapOklchToRgb(lightness, chroma, hue).rgb
}

export function formatHex(rgb: Rgb): string {
  const part = (value: number) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, '0')
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`
}

export function formatRgb(rgb: Rgb): string {
  const part = (value: number) => String(Math.round(clamp(value, 0, 255)))
  return `rgb(${part(rgb.r)}, ${part(rgb.g)}, ${part(rgb.b)})`
}

export function formatHsl(rgb: Rgb): string {
  const { h, s, l } = rgbToHsl({
    r: Math.round(clamp(rgb.r, 0, 255)),
    g: Math.round(clamp(rgb.g, 0, 255)),
    b: Math.round(clamp(rgb.b, 0, 255)),
  })
  return `hsl(${String(round(h, 1) % 360)}, ${String(round(s, 1))}%, ${String(round(l, 1))}%)`
}

export function formatOklch(rgb: Rgb): string {
  const { l, c, h } = rgbToOklch({
    r: Math.round(clamp(rgb.r, 0, 255)),
    g: Math.round(clamp(rgb.g, 0, 255)),
    b: Math.round(clamp(rgb.b, 0, 255)),
  })
  return `oklch(${String(round(l, 4))} ${String(round(c, 4))} ${String(round(h, 2))})`
}

export function relativeLuminance(rgb: Rgb): number {
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b)
}

export function contrastRatio(first: Rgb, second: Rgb): number {
  const a = relativeLuminance(first)
  const b = relativeLuminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export interface WcagLevels {
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
}

export function wcagLevels(ratio: number): WcagLevels {
  const rounded = Math.floor(ratio * 100) / 100
  return {
    aaNormal: rounded >= 4.5,
    aaLarge: rounded >= 3,
    aaaNormal: rounded >= 7,
    aaaLarge: rounded >= 4.5,
  }
}
