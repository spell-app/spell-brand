import { defineConfig, type UserConfig } from "vite-plus"
import { fileURLToPath } from "node:url"

import { baseConfig, SOLID_EXTERNAL } from "spell-ui/vite.config.ts"

/** This repo, spell-brand. */
const ROOT = fileURLToPath(new URL("./", import.meta.url))

/** Where the build goes:  `dist/` (git-ignored), read by the design bundle (`yarn design:bundle`). */
export const DESIGN_OUT = `${ROOT}dist`

/**
 * The brand elements for the claude.ai design bundle (epic `claude-design`, P11):  `src/brand-design.ts` =>
 * `dist/brand-design.js`, ONE ES module, which `yarn design:bundle` (`scripts/design-bundle.ts`) bundles beside
 * Spell UI's `dist/` (it runs this build:  `vp build --config vite.design.config.ts`).
 * - Why a build of its own, not `src/` straight into that bundle:  the elements are Solid JSX, which only the Solid
 *   compiler (`baseConfig()`'s plugins) turns into code;  esbuild, which makes the bundle, can't.
 * - Spell UI, the kit's element and Solid stay EXTERNAL, by the names the elements import them by
 *   (`spell-ui/core`, `spell-kit/element`):  the design bundle resolves `spell-ui/core` / `spell-ui/forms` to Spell UI's
 *   `dist/core.js` / `dist/forms.js`, and `spell-kit/element` to `dist/core.js` (which carries it), the same modules
 *   its own elements use, so there's ONE `UIComponent`, one `ValueSets` (the `accent` hue reaches every element) and
 *   one Solid.
 * - Everything else (`spell-brand`, the sheets, `<brand-logo>`'s lazy paths) is inlined:  the bundle can't load a file.
 */
export default defineConfig(() => {
  const base = baseConfig()
  return {
    ...base,
    root: ROOT,
    publicDir: false,
    logLevel: "warn",
    build: {
      outDir: DESIGN_OUT,
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
      target: "esnext",
      cssTarget: ["chrome125", "safari26", "firefox147"],
      lib: { entry: { "brand-design": `${ROOT}src/brand-design.ts` }, formats: ["es"] },
      rolldownOptions: {
        external: (id: string) => SOLID_EXTERNAL.test(id) || /^spell-(ui|kit\/element)(\/|$)/.test(id),
        output: {
          // custom element class names are read by dev-time warnings (see ui's `vite.config.ts`)
          keepNames: true,
          codeSplitting: false
        }
      }
    }
  } satisfies UserConfig
})
