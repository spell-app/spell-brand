import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vite-plus/test"

import type { SiteDataFile } from "spell-ui/docs-components/docs-components.types"
import { ElementManifests } from "spell-ui/tools/ElementManifests"
import { readJSON5File } from "spell-kit/util/node/json5"

/**
 * The brand's element manifests are current, as Spell UI's tools write them.
 * - the files, in `docs/__data/`:  `custom-elements.json`, `html-custom-data.json`, `css-custom-data.json`
 * - Moved here from Spell UI's `ElementManifests.test.ts` (epic `repo-split` P8):
 *   Spell UI never reads this repo, which is above it.
 */

/** This package's folder. */
const PACKAGE = fileURLToPath(new URL("../", import.meta.url))

/** Its committed docs-set data. */
const DATA = readJSON5File<SiteDataFile>(join(PACKAGE, "docs/__data/components.json5"))

test("leaves the brand's manifests current (else `yarn site:data`)", () => {
  const manifests = new ElementManifests({ data: DATA, packageFolder: PACKAGE, componentsPath: "src/components" })
  const [[elements], [custom], [css]] = manifests.outputs(join(PACKAGE, "docs/__data"))
  const written = JSON.parse(readFileSync(elements!, "utf8")) as { modules: unknown[] }
  expect(written.modules).toEqual(manifests.customElements().modules)
  expect(readFileSync(custom!, "utf8")).toBe(JSON.stringify(manifests.htmlCustomData(), null, 2) + "\n")
  expect(readFileSync(css!, "utf8")).toBe(JSON.stringify(manifests.cssCustomData(), null, 2) + "\n")
})
