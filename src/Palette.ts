import * as Color from "spell/util/color"
import { clamp } from "spell/util/number"

import {
  CHROMA,
  LADDER,
  STEPS,
  type ColorFormat,
  type ColorSet,
  type Hsl,
  type Oklch,
  type Rgb,
  type Scale,
  type ScaleOptions,
  type Step
} from "./brand.types"

/****************
 * ### `Palette`
 * The brand's colour math (`brand/spell-design-system/lib/palette.mjs`, by Claude Design), in TypeScript:  sRGB <-> OKLCH,
 * contrast, and 17-step LADDERS made from one seed colour.
 * - OKLCH:  Lightness (0-1), Chroma (colourfulness, 0-~0.37) and Hue (degrees), a model where equal L LOOKS equally
 *   light;  every ladder is built in it.
 * - `generateScale()`:  the seed lands EXACTLY on its anchor step (auto:  the step nearest in lightness);  lightness
 *   bends smoothly toward the seed, fixed at the ends;  chroma follows `CHROMA` relative to the anchor's;  hue drifts
 *   by `hueShift` toward the dark end.  Out-of-gamut colours are pulled in by chroma, never by lightness.
 * - `buildPalette()`:  the brand's 20 sets, as `lib/palette.json` has them (`Palette.test.ts` pins it).
 * - The conversions and contrast are the kit's (`spell/util/color`);  Palette keeps the brand's shapes:
 *   `[r, g, b]` tuples and upper-case hex.
 * - Pure:  no DOM, no Solid;  every member static.
 ****************/
export class Palette {
  ////////////////
  // ## Conversions
  ////////////////

  /** `#abc` / `#aabbcc` -> sRGB, each channel 0-1. */
  static hexToRgb(hex: string): Rgb {
    return channelsOf(Color.hexToRgb(hex))
  }

  /** sRGB (each 0-1, clamped) -> `#AABBCC`, upper-case. */
  static rgbToHex(rgb: Rgb | readonly number[]): string {
    return Color.rgbToHex(rgbOf(rgb)).toUpperCase()
  }

  /** sRGB -> OKLCH;  a grey's hue is `0`. */
  static rgbToOklch(rgb: Rgb | readonly number[]): Oklch {
    const { l, c, h } = Color.rgbToOklch(rgbOf(rgb))
    return { l, c, h }
  }

  /** OKLCH -> sRGB, NOT clamped:  a channel outside 0-1 means out of gamut (`inGamut()`). */
  static oklchToRgbRaw(color: Oklch): Rgb {
    return channelsOf(Color.oklchToRgb(color))
  }

  /** Is `rgb` displayable in sRGB (each channel 0-1, a hair of slack)? */
  static inGamut(rgb: Rgb | readonly number[]): boolean {
    return Color.inGamut(rgbOf(rgb))
  }

  /**
   * OKLCH -> `#AABBCC`.
   * - Out of gamut:  the largest chroma that fits, same lightness and hue (`toGamut()` in `spell/util/color`).
   */
  static oklchToHex(color: Oklch): string {
    return Color.oklchToHex(color, { fit: "chroma" }).toUpperCase()
  }

  /** `#AABBCC` -> OKLCH. */
  static hexToOklch(hex: string): Oklch {
    return Palette.rgbToOklch(Palette.hexToRgb(hex))
  }

  /** sRGB (each 0-1) -> HSL:  hue in degrees (`0` for a grey), saturation and lightness 0-1. */
  static rgbToHsl([red, green, blue]: Rgb | readonly number[]): Hsl {
    const r = clamp(red!, 0, 1)
    const g = clamp(green!, 0, 1)
    const b = clamp(blue!, 0, 1)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    const delta = max - min
    if (delta === 0) return { h: 0, s: 0, l }
    const s = delta / (1 - Math.abs(2 * l - 1))
    const sector = max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
    return { h: (sector * 60) % 360, s: Math.min(1, s), l }
  }

  /** HSL -> sRGB (each 0-1);  the hue wraps, saturation and lightness are clamped to 0-1. */
  static hslToRgb({ h, s, l }: Hsl): Rgb {
    const saturation = clamp(s, 0, 1)
    const lightness = clamp(l, 0, 1)
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
    const sector = (((h % 360) + 360) % 360) / 60
    const x = chroma * (1 - Math.abs((sector % 2) - 1))
    const m = lightness - chroma / 2
    const amounts: Record<string, number> = { c: chroma, x, "0": 0 }
    const [r, g, b] = HUE_SECTORS[Math.floor(sector)]!.split("").map((channel) => amounts[channel]! + m)
    return [r!, g!, b!]
  }

  /** `#AABBCC` -> HSL. */
  static hexToHsl(hex: string): Hsl {
    return Palette.rgbToHsl(Palette.hexToRgb(hex))
  }

  /** HSL -> `#AABBCC`:  always in gamut (HSL is sRGB's own cylinder). */
  static hslToHex(color: Hsl): string {
    return Palette.rgbToHex(Palette.hslToRgb(color))
  }

  /** HSL as CSS text:  `hsl(227 21% 63%)`, whole degrees and percentages. */
  static formatHsl({ h, s, l }: Hsl): string {
    return `hsl(${Math.round(h) % 360} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`
  }

  /**
   * A colour as text, as the brand's tools show them:  `#AABBCC`, `oklch(67.7% 0.047 274)` or `hsl(227 21% 63%)`.
   * - `oklch`:  L as a percentage (one decimal), C to 3 places, H whole degrees
   * - `hsl`:  `formatHsl()`;  a grey's hue is `0`
   */
  static format(hex: string, as: ColorFormat = "hex"): string {
    if (as === "hex") return hex.toUpperCase()
    if (as === "hsl") return Palette.formatHsl(Palette.hexToHsl(hex))
    const { l, c, h } = Palette.hexToOklch(hex)
    return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${Math.round(h)})`
  }

  /**
   * Parse what a person types as a colour:  `#abc`, `#aabbcc`, `aabbcc`, `142 150 181` (RGB 0-255),
   * `hsl(227 21% 63%)` (commas and `deg` too), or `oklch(67.7% 0.047 274)` / `67.7% 0.047 274`;  `undefined` if it
   * isn't one.
   */
  static parse(text: string): string | undefined {
    const value = text.trim()
    const hex = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(value)
    if (hex) return Palette.rgbToHex(Palette.hexToRgb(hex[1]!))
    const rgb = /^(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})$/.exec(value)
    if (rgb) {
      const channels = rgb.slice(1, 4).map(Number)
      if (channels.every((channel) => channel <= 255)) return Palette.rgbToHex(channels.map((channel) => channel / 255))
    }
    const hsl = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*\)$/i.exec(value)
    if (hsl) {
      const [h, s, l] = hsl.slice(1, 4).map(Number) as [number, number, number]
      if (s <= 100 && l <= 100) return Palette.hslToHex({ h, s: s / 100, l: l / 100 })
    }
    const oklch = /^(?:oklch\()?\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)?$/i.exec(value)
    if (oklch) {
      const l = Number(oklch[1]) / (oklch[2] ? 100 : 1)
      if (l >= 0 && l <= 1) return Palette.oklchToHex({ l, c: Number(oklch[3]), h: Number(oklch[4]) % 360 })
    }
    return undefined
  }

  ////////////////
  // ## Contrast
  ////////////////

  /** WCAG relative luminance of `#AABBCC`. */
  static luminance(hex: string): number {
    return Color.luminance(hex)
  }

  /** WCAG contrast ratio of two colours, 1-21. */
  static contrast(a: string, b: string): number {
    return Color.contrast(a, b)
  }

  /** Text colour for `background`:  white, or the brand's ink (`#1A1C27`), whichever contrasts more. */
  static ink(background: string): string {
    return Palette.contrast(background, WHITE) >= Palette.contrast(background, INK) ? WHITE : INK
  }

  ////////////////
  // ## Ladders
  ////////////////

  /** The ladder step whose target lightness is nearest `l`. */
  static nearestStep(l: number): Step {
    return STEPS.reduce((best, step) => (Math.abs(LADDER[step] - l) < Math.abs(LADDER[best] - l) ? step : best), 500)
  }

  /** A 17-step ladder from `seedHex` (see the class). */
  static generateScale(seedHex: string, options: ScaleOptions = {}): { anchor: Step; seed: string; scale: Scale } {
    const seed = Palette.hexToOklch(seedHex)
    const anchor = options.anchor || Palette.nearestStep(seed.l)
    const lightShift = seed.l - LADDER[anchor]
    const anchorChroma = CHROMA[anchor]
    const chromaScale = options.chromaScale ?? 1
    const hueShift = options.hueShift ?? 0
    const scale = {} as Scale
    for (const step of STEPS) {
      if (step === anchor) {
        scale[step] = seedHex.toUpperCase()
        continue
      }
      const t = step < anchor ? step / anchor : (1000 - step) / (1000 - anchor)
      const weight = Math.sin((clamp(t, 0, 1) * Math.PI) / 2) ** 1.4
      const l = clamp(LADDER[step] + lightShift * weight, 0.08, 0.995)
      const c = seed.c * (CHROMA[step] / anchorChroma) * chromaScale
      const h = seed.h + hueShift * ((step - anchor) / 1000)
      scale[step] = Palette.oklchToHex({ l, c, h })
    }
    return { anchor, seed: seedHex.toUpperCase(), scale }
  }

  /** The brand's 20 colour sets, in `lib/palette.json`'s order. */
  static buildPalette(): ColorSet[] {
    const { brand, accent } = BRAND
    const sets: ColorSet[] = [
      { name: "brand", label: brand.label, note: brand.note, ...Palette.generateScale(brand.hex, { anchor: 500 }) },
      { name: "accent", label: accent.label, note: accent.note, ...Palette.generateScale(accent.hex) }
    ]
    for (const [name, [l, c, h]] of Object.entries(TAILWIND_SEEDS)) {
      if (name === "violet") {
        const note = "Tuned: Spell Purple at 600, Aubergine at 925"
        sets.push({ name, label: "Violet", note, ...Palette.generateScale(SPELL_PURPLE, { anchor: 600 }) })
        continue
      }
      const label = name.charAt(0).toUpperCase() + name.slice(1)
      // `note: ""`:  as `palette.json` has it
      sets.push({ name, label, note: "", ...Palette.generateScale(Palette.oklchToHex({ l, c, h }), { anchor: 500 }) })
    }
    const houseOfOwen = Palette.hexToOklch(BRAND.brand.hex)
    const greySeed = Palette.oklchToHex({ l: 0.63, c: 0.014, h: houseOfOwen.h })
    const note = "Neutral, tinted toward brand hue"
    sets.push({ name: "grey", label: "Grey", note, ...Palette.generateScale(greySeed, { anchor: 500 }) })
    return sets
  }
}

/**
 * HSL's six 60° hue sectors (red ... magenta):  which of R, G, B get the chroma (`c`), the ramp (`x`) or nothing (`0`).
 * - `hslToRgb()` reads sector `floor(h / 60)`.
 */
const HUE_SECTORS = ["cx0", "xc0", "0cx", "0xc", "x0c", "c0x"] as const

/** The brand's `[r, g, b]` tuple as `spell/util/color`'s `{ r, g, b }`. */
function rgbOf([r, g, b]: Rgb | readonly number[]): Color.Rgb {
  return { r: r!, g: g!, b: b! }
}

/** `spell/util/color`'s `{ r, g, b }` as the brand's `[r, g, b]` tuple. */
function channelsOf({ r, g, b }: Color.Rgb): Rgb {
  return [r, g, b]
}

/** White, as `ink()` offers it. */
const WHITE = "#FFFFFF"

/** The brand's ink on light chips (`palette.css`'s darkest neutral, as the Color Palette page uses it). */
const INK = "#1A1C27"

/** Spell Purple:  the violet set's seed, at 600 (hue nudged 292 -> 286 toward House of Owen). */
const SPELL_PURPLE = "#6550CA"

/** The brand's two named seeds:  House of Owen (neutrals) and Polished Ivory (the warm accent). */
const BRAND = {
  brand: { hex: "#8E96B5", label: "Brand", note: "House of Owen · Valspar 8003-47D" },
  accent: { hex: "#F1E7D4", label: "Accent", note: "Polished Ivory · Valspar 7006-6" }
} as const

/** Tailwind v4's 500-step seeds (OKLCH `[l, c, h]`), regenerated on the brand's 17-step ladder. */
const TAILWIND_SEEDS: Record<string, readonly [number, number, number]> = {
  red: [0.637, 0.237, 25.3],
  orange: [0.705, 0.213, 47.6],
  amber: [0.769, 0.188, 70.1],
  yellow: [0.795, 0.184, 86.0],
  lime: [0.768, 0.233, 130.9],
  green: [0.723, 0.219, 149.6],
  emerald: [0.696, 0.17, 162.5],
  teal: [0.704, 0.14, 182.5],
  cyan: [0.715, 0.143, 215.2],
  sky: [0.685, 0.169, 237.3],
  blue: [0.623, 0.214, 259.8],
  indigo: [0.585, 0.233, 277.1],
  violet: [0.606, 0.25, 292.7],
  purple: [0.627, 0.265, 303.9],
  fuchsia: [0.667, 0.295, 322.2],
  pink: [0.656, 0.241, 354.3],
  rose: [0.645, 0.246, 16.4]
}
