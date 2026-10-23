import { defineConfig, type UserConfig } from "vite-plus"
import { fileURLToPath } from "node:url"

import { fmtConfig, packageLint } from "spell/toolchain/lint"
import { baseConfig } from "spell-ui/vite.config.ts"

/** This repo, spell-brand. */
const ROOT = fileURLToPath(new URL("./", import.meta.url))

/** Where the bundle goes:  `_assets/ui/`, git-ignored, built by the page server when stale (`spell bundle`). */
export const BRAND_ASSETS = `${ROOT}_assets/ui`

/** The pages' entry:  `src/brand-ui.ts`. */
export const BRAND_ENTRY = `${ROOT}src/brand-ui.ts`

/**
 * The brand pages' bundle (`yarn build`, run by `scripts/build.ts`):
 * `src/brand-ui.ts` => `_assets/ui/brand-ui.js`, with `brand-ui.css` and lazy chunks.
 * - What's in it:  see the entry.
 * - Only the Brand tab's own pages load it.
 *   The docs set's pages (`docs/`) load Spell UI's site bundle and the brand pack instead (`docs/__parts/layout.html`).
 * - Modelled on Spell UI's site bundle (its `vite.site.config.ts`):
 *   `baseConfig()` (decorators BEFORE Solid, Solid dedupe, Lightning CSS targets),
 *   an APP build of one entry, code-split, `base: "./"` so chunk URLs are relative to the chunk that imports them.
 * - An ES module, so a page loads it from the page server, not `file://`
 *   (judgement J4:  a classic script would inline every theme, engine and emoji chunk).
 * - No aliases:  every file is imported by its package name (`spell-brand/components`, `spell-ui/core`), which Vite
 *   finds through each package's `exports` (epic `repo-split` P14).
 * - Also `vp lint` / `vp fmt`:  the toolchain's settings, as the brand's own package's (`packageLint({ name: "brand" })`);
 *   the built bundles (this one, the pack, the design build) are not ours to lint.
 */
export default defineConfig(() => {
  const base = baseConfig()
  return {
    fmt: fmtConfig,
    lint: packageLint({
      name: "brand",
      ignorePatterns: ["_assets/ui", "src/components/__pack", "dist", ".compare", ".vitest"]
    }),
    ...base,
    root: ROOT,
    base: "./",
    publicDir: false,
    logLevel: "warn",
    build: {
      outDir: BRAND_ASSETS,
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
      target: "esnext",
      cssTarget: ["chrome125", "safari26", "firefox147"],
      modulePreload: { polyfill: false },
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1500,
      rolldownOptions: {
        input: { "brand-ui": BRAND_ENTRY },
        preserveEntrySignatures: "allow-extension",
        output: {
          // custom element class names are read by dev-time warnings and the manifest (see ui's `vite.config.ts`)
          keepNames: true,
          entryFileNames: "[name].js",
          chunkFileNames: "[name]-[hash].js",
          assetFileNames: "[name][extname]"
        }
      }
    }
  } satisfies UserConfig
})
