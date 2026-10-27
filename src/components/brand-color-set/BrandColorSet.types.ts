/**
 * Constants and types of the `brand-color-set` family.
 * - Data only:  nothing here runs.
 */

import type { brandColorSetVocabulary } from "./BrandColorSet.en"

/** `brandColorSetVocabulary`'s type. */
export type BrandColorSetVocabulary = typeof brandColorSetVocabulary

/** The tag of the chips it holds. */
export const CHIP_TAG = "brand-color"

/** Chip attributes a set reads:  what keys it (`name`, `value`), and what it starts chosen (`selected`). */
export const CHIP_ATTRIBUTES = ["name", "value", "selected"] as const

/** Keys that choose the focused chip. */
export const CHOOSE_KEYS = new Set(["Enter", " "])

/** One chip, as the set keys it. */
export type SetChip = {
  /** the chip's DOM element */
  readonly chip: HTMLElement
  /** `name`, or `""` */
  readonly name: string
  /** `value` as `#RRGGBB`, or as written when it isn't a colour */
  readonly color: string
  /** has a `selected` attribute */
  readonly selected: boolean
}
