/**
 * `scripts/links.mjs`:  what spell-brand's `yarn install` runs after (`postinstall`):  its `agents` link, to the
 * house style and the logs in the `spell` it uses (`node_modules/spell/agents`:  the kit, through the portal), so
 * its instructions find `agents/wwod/WWOD.md`, `agents/PAPERCUTS.md` ... (epic `repo-split` P20).
 * - A project beside the kit, with its own install:  the kit's install made the link until then.
 * - Replaces a link pointing anywhere else;  leaves a real folder alone.
 * - Plain node, node's modules only.
 */
import { existsSync, lstatSync, readlinkSync, rmSync, symlinkSync } from "node:fs"
import { join } from "node:path"

const ROOT = join(import.meta.dirname, "..")
const LINK = join(ROOT, "agents")
const TARGET = "node_modules/spell/agents"

const isLink = (() => {
  try {
    return lstatSync(LINK).isSymbolicLink()
  } catch {
    return false
  }
})()
if (isLink && readlinkSync(LINK) !== TARGET) rmSync(LINK)
if (!existsSync(LINK) && !(isLink && readlinkSync(LINK) === TARGET)) {
  symlinkSync(TARGET, LINK)
  console.log(`agents -> ${TARGET}  (the kit's WWOD and the logs)`)
}
