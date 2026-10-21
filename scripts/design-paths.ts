/**
 * Where the claude.ai design bundle's two tools (`design-bundle.ts`, `design-check.ts`) find what they read and write,
 * and the ONE place they read `process.env` (WWOD §11).
 * - Spell UI and the kit are found as packages, through `node_modules` (each folder up, as node does), wherever their
 *   repos are:  beside this one in the kit `spell-kit` since epic `repo-split` P8.
 * - Node only:  imports node built-ins and nothing of ours.
 */
import { existsSync, realpathSync } from "node:fs"
import path from "node:path"

/** This repo, spell-brand:  `spell-brand`. */
export const BRAND_DIR = path.resolve(import.meta.dirname, "..")

/**
 * Spell UI, the `spell-ui` package, by its REAL path;  `SPELL_UI_DIR` says otherwise.
 * - Real, since esbuild resolves UI's own imports (`dist/` chunk to chunk) to real paths:  had the entry's
 *   `spell-ui/*` gone through a link, the bundle held TWO of UI's modules (`core.js` ...), so two of
 *   spell-element's `ShadowEvents`, and a `<ui-button>`'s page `onClick` ran twice (epic `epic-engine` I18).
 */
export const UI_DIR = process.env.SPELL_UI_DIR
  ? realPath(path.resolve(process.env.SPELL_UI_DIR))
  : packageFolder("spell-ui")

/** The kit's element, `spell-kit/element`, by its real path:  its SOURCE must never be bundled. */
export const ELEMENT_DIR = path.join(packageFolder("spell-kit"), "element")

/**
 * The design bundle, where `yarn design:bundle` writes it by default:  `project/components/bundle.js` in the
 * design system's folder that `spell design build` writes (Spell UI's `build/design-system/`, git-ignored),
 * which that command leaves in place.
 */
export const DESIGN_BUNDLE = path.join(UI_DIR, "build/design-system/project/components/bundle.js")

/**
 * The folder the tool was run from:  where a relative `--out` or bundle path starts.
 * - `yarn` runs a script in the package's folder, and says where it was called from in `INIT_CWD`.
 */
export const INVOKED_FROM = process.env.INIT_CWD ?? process.cwd()

/** The real folder of package `name`, as this folder finds it in `node_modules` (each folder up, as node does). */
export function packageFolder(name: string): string {
  for (let at = import.meta.dirname; ; at = path.dirname(at)) {
    const link = path.join(at, "node_modules", name)
    if (existsSync(path.join(link, "package.json"))) return realpathSync(link)
    if (path.dirname(at) === at)
      throw new Error(`design bundle:  ${name} isn't installed (\`yarn install\` in the kit)`)
  }
}

/** `file`'s real path (links resolved);  `file` itself when it isn't there (a later check says so). */
export function realPath(file: string): string {
  return existsSync(file) ? realpathSync(file) : file
}
