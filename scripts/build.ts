/**
 * `yarn build` (in spell-brand):  build the brand pages' bundle, `_assets/ui/` (git-ignored), from
 * `src/brand-ui.ts` with `vite.config.ts`, then report its sizes.
 * - Run by `spell bundle brand` (the kit's `SRV.Bundle`), which the page server runs when it starts and
 *   the sources changed;  it then records their hash in `_assets/ui/.bundle.json`.
 * - Its steps are the kit's `Bundle`'s, as Spell UI's site bundle (its `scripts/site-bundle.ts`):
 *   - `clearOutput()`:  `_assets/ui/` emptied first (everything but `icon-packs`, the record too),
 *     so a removed chunk doesn't linger
 *   - `linkIconPacks()`:  `_assets/ui/icon-packs` a LINK to Spell UI's packs, never a second copy;
 *     Spell UI found as a package, wherever its repo is
 *   - `sizeReport()`:  its scripts and sheets, raw and gzipped;  eager is `brand-ui.css` + `brand-ui.js` and the
 *     chunks it imports statically
 * - Fails if the bundle holds two copies of a Solid package (`solid-js`, `@solidjs/web`):  two would split signals
 *   and break every element.  The docs bundle checks the same (`bundle-spell-ui.js` `checkOneSolid()`).
 */
import path from "node:path"
import { build, type Rolldown } from "vite-plus"

import { SRV } from "spell/server"
import { Terminal } from "spell/element-tools/Terminal"
import { BRAND_ASSETS } from "spell-brand/vite.config.ts"

/** A Solid package's folder in a module id:  `.../node_modules/solid-js/...`, `.../node_modules/@solidjs/web/...`. */
const SOLID_MODULE = /node_modules\/(solid-js|@solidjs\/[\w-]+)\//

/** What the size report counts:  the scripts and sheets, not the fonts. */
const COUNTED = /\.(js|css)$/

SRV.Bundle.clearOutput(BRAND_ASSETS)
const started = performance.now()
const output = await build({ configFile: path.resolve(import.meta.dirname, "../vite.config.ts") })
checkOneSolid(output as Rolldown.RolldownOutput)
SRV.Bundle.linkIconPacks(BRAND_ASSETS)
const seconds = (performance.now() - started) / 1000
const entries = ["brand-ui.css", "brand-ui.js"]
for (const line of SRV.Bundle.sizeReport({ name: "brand", folder: BRAND_ASSETS, seconds, entries, only: COUNTED }))
  Terminal.out(line)

/** Fails if a Solid package was bundled from more than one folder, or `solid-js` not at all. */
function checkOneSolid(result: Rolldown.RolldownOutput): void {
  const copies = new Map<string, Set<string>>()
  for (const chunk of result.output) {
    if (chunk.type !== "chunk") continue
    for (const id of chunk.moduleIds) {
      const match = SOLID_MODULE.exec(id)
      if (!match) continue
      const root = id.slice(0, match.index + match[0].length)
      copies.set(match[1]!, new Set([...(copies.get(match[1]!) ?? []), root]))
    }
  }
  for (const [name, roots] of copies) {
    if (roots.size > 1) throw new Error(`${name} bundled ${roots.size} times:\n  ${[...roots].join("\n  ")}`)
  }
  if (!copies.has("solid-js")) throw new Error("solid-js isn't in the bundle:  check the aliases")
}
