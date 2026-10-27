import { resolve } from "node:path"
import { defineConfig, type TestProjectConfiguration } from "vite-plus"
import { playwright } from "vite-plus/test/browser-playwright"

import { baseConfig } from "spell/ui/vite.config.ts"

/**
 * vitest config for `spell-brand`, a component pack (`spell pack`):  two projects.
 * - `node` -- the tests of `src/`'s own files (`tests/*.test.ts`):
 *   - the pack's own checks, `pack.test.ts` among them:
 *     `spell pack check brand`, that `src/components/__pack/` and `docs/__data/` are current
 *   - the brand's colour math (`Palette.test.ts`)
 * - `browser` -- the elements' (`tests/components/**`), and every `*.browser.test.ts`, in a REAL browser, as Spell UI's are:
 *   - the `<brand-*>` elements
 *   - the brand pages' look on Spell UI's elements (`inspector.browser.test.ts`)
 *   - Vitest browser mode + Playwright, chromium
 *   - `baseConfig()`:  Spell UI's plugins (decorators BEFORE Solid), Solid dedupe, Lightning CSS
 *   - the test helpers come from the kit (`spell/test-helpers/...`), Spell UI's own from `spell/ui/test-helpers/...`
 */
/**
 * The tests live in the repo's tests/ folder, at the same paths as the code under `src/`:
 * `tests/components/brand-logo/` tests `src/components/brand-logo/`, `tests/Palette.test.ts` tests `src/Palette.ts`.
 */
const TESTS = resolve(import.meta.dirname, "./tests")

/** Tests of `src/`'s own files that need a browser (a page's CSS on real elements):  the `browser` project's, not `node`'s. */
const BROWSER_SRC = "*.browser.test.ts"

/** The two projects, `node` and `browser`. */
function brandProjects(): TestProjectConfiguration[] {
  return [
    {
      test: {
        name: "node",
        dir: TESTS,
        environment: "node",
        include: ["*.test.ts"],
        exclude: [BROWSER_SRC]
      }
    },
    {
      ...baseConfig(),
      test: {
        name: "browser",
        dir: TESTS,
        include: ["components/**/*.test.{ts,tsx}", BROWSER_SRC],
        // Spell UI's core first, as a page has it:  its settings for the kit's element (`spell/ui/test-helpers/setup`)
        setupFiles: ["spell/ui/test-helpers/setup.ts"],
        testTimeout: 10_000,
        browser: {
          enabled: true,
          provider: playwright(),
          headless: true,
          instances: [{ browser: "chromium" }]
        }
      }
    }
  ]
}

export default defineConfig({
  test: {
    projects: brandProjects()
  }
})
