/**
 * `yarn design:bundle [--out <dir>] [--skip-ui-build]` (in spell-brand;  also `spell dev design bundle`):  the claude.ai
 * Design System's `components/bundle.js` (epic `claude-design` P8;  spell-epic's until epic `repo-split` P10, Q32).
 * - ONE minified classic script (IIFE) defining `window.SpellUI`:  Spell UI, the brand's `<brand-*>` elements and the
 *   `spell-brand` theme, from `design-bundle.entry.js` (beside this).
 * - Written to `<dir>/bundle.js`;  default `DESIGN_BUNDLE`, in the folder `spell dev design build` writes
 *   (`design-paths.ts`).  `--out` is relative to the folder it was run from.
 * - First builds, from their working trees:
 *   - Spell UI (`yarn build`, `tsc && vite build`);  if `tsc` fails on in-progress work, `vite build` alone, saying so
 *   - the brand's elements, `dist/brand-design.js` (`vite.design.config.ts`):  Solid JSX needs the Solid compiler,
 *     which esbuild isn't
 *   - `--skip-ui-build`:  neither;  reuse both builds as they are
 * - Exactly ONE of each shared module:
 *   - every `solid-js` / `@solidjs/*` import resolves from UI's root, so a linked package can't bring its own copy
 *   - the brand build's `$/ui/<entry>` / `$/spell-element` imports resolve to UI's `dist/` (`core.js` carries
 *     spell-element), the modules UI's own elements use:  one `UIComponent`, one `ValueSets`
 *   - checked against the metafile (`checkOneSolid()`, `checkEachFileOnce()`, `checkNoElementSource()`)
 * - Everything inlined:  Claude Design refuses a relative `<script src>` (caveat C6).
 *   - every string-literal `import()` (the runtime chunk, the code and markdown engines, the Temporal polyfill)
 *   - `supported: { "dynamic-import": false }` turns any computed `import()` (an icon pack's `pack.js`) into a
 *     rejected promise
 *   - UI's emoji name chunks are empty stand-ins:  emoji names draw nothing
 * - Icons:  EVERY Font Awesome Free icon, registered by the made-up module `spell-ui:icons` (`iconsModule()`).
 * - Readers INLINE the file, so `escapeForInlining()` rewrites each `<!--` / `</script` as `\x3C...`.
 *   The build FAILS if one survives, if any `import()` / `import.meta` does, or if it's over `MAX_BYTES`.
 * - No `bundle.css`:  every element adopts its own sheets and the theme its page sheet;  page typography is UI's
 *   opt-in `class="ui-typography"` on `<body>`.
 * - spell-epic's docs bundle (`_assets/spell-ui.js`) is built the same way, by its own `bundle-spell-ui.js`:  the
 *   resolver and the checks here are a copy of its, kept in step by hand (spell-brand can't import spell-epic).
 */
import { build, type Metafile, type Plugin } from "esbuild"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { parseArgs } from "node:util"
import { Script } from "node:vm"
import { gzipSync } from "node:zlib"

import { BRAND_DIR, DESIGN_BUNDLE, ELEMENT_DIR, INVOKED_FROM, UI_DIR, realPath } from "./design-paths.ts"

const { values } = parseArgs({ options: { out: { type: "string" }, "skip-ui-build": { type: "boolean" } } })

/** The bundle's entry. */
const ENTRY = path.join(import.meta.dirname, "design-bundle.entry.js")
/** Where the bundle goes. */
const OUTFILE = values.out ? path.join(path.resolve(INVOKED_FROM, values.out), "bundle.js") : DESIGN_BUNDLE
/** The brand's build of its elements, `spell-brand/design` (`vite.design.config.ts`). */
const BRAND_DESIGN = path.join(BRAND_DIR, "dist/brand-design.js")
/** Claude Design's cap on a design system's `bundle.js` (6 MB, counted in decimal to be safe). */
const MAX_BYTES = 6_000_000

/** UI's icon packs. */
const ICON_PACKS = path.join(UI_DIR, "src/icons/icon-packs")
/**
 * Packs the bundle inlines WHOLE, in order:  the first to give a name keeps it (`iconsModule()`).
 * - `fa7-free`:  solid + regular (`… outline`) + its few brand extras, UI's default pack
 * - `fa7-brands`:  every brand;  only fills names `fa7-free` doesn't give, so a name means what it means on any page
 */
const PACKS = ["fa7-free", "fa7-brands"]

/**
 * Names the packs don't give, or give to another icon, as `<pack>/<style>/<file name>` => its names:  registered on
 * top of the packs' (`iconsModule()`), so a name means what it means on a docs page.
 * - Spell UI's widgets' own (`info`), and Fomantic's older names the docs pages use (`warning sign`).
 * - The docs bundle's `ICONS` (spell-epic's `bundle-spell-ui.js`) less every name the packs already give to the same
 *   icon, which changed nothing (epic `repo-split` P10):  a name added there is NOT added here by itself.
 */
const NAMES: Record<string, string[]> = {
  "fa7-free/solid/circle-info": ["info"],
  "fa7-free/solid/triangle-exclamation": ["warning sign"],
  "fa7-free/solid/circle-exclamation": ["warning circle"],
  "fa7-free/solid/check": ["checkmark"],
  "fa7-free/solid/circle-notch": ["notched circle"],
  "fa7-free/solid/wand-magic-sparkles": ["magic"],
  "fa7-free/solid/puzzle-piece": ["puzzle"],
  "fa7-free/regular/comment-dots": ["comment dots"],
  "fa7-free/solid/up-right-from-square": ["external alternate"],
  "fa7-free/solid/right-to-bracket": ["sign in"],
  "fa7-free/solid/rotate-left": ["undo alternate"],
  "fa7-free/solid/ellipsis": ["ellipsis horizontal"],
  "fa7-free/regular/circle-right": ["circle right"],
  "fa7-brands/brands/git-alt": ["git"]
}

/** Bare specifiers that MUST resolve from UI's root:  Solid, all subpaths. */
const SOLID = /^(solid-js|@solidjs\/[\w-]+)(\/.*)?$/

/** An emoji data chunk of UI's `dist/` (`emoji/cldr/a-UMC54g9e.js`), as imported by the emoji family. */
const EMOJI_CHUNK = /(?:^|\/)emoji\/[\w-]+\/\w+-[\w-]+\.js$/

if (!values["skip-ui-build"]) {
  buildUI()
  buildBrand()
}
const warnings = await bundle()
report(warnings)

////////////////
// ## Builds
////////////////

/**
 * Builds UI from its working tree:  "latest UI" is whatever is checked out there.
 * - `yarn build` type-checks first;  in-progress UI work may not, so fall back to `vite build` rather than fail.
 */
function buildUI(): void {
  if (!existsSync(path.join(UI_DIR, "package.json"))) fail(`no UI checkout at ${UI_DIR} (set SPELL_UI_DIR)`)
  if (run("yarn", ["build"], "build spell-ui (tsc + vite)", { allowFailure: true })) return
  console.warn("!! UI's tsc failed:  building with `vite build` alone (the bundle may carry type errors)")
  run("yarn", ["vite", "build"], "build spell-ui (vite only)")
}

/** Builds the brand's elements for the bundle, `BRAND_DESIGN`, from this repo's working tree (P11). */
function buildBrand(): void {
  run("yarn", ["vp", "build", "--config", "vite.design.config.ts"], "build the brand elements (spell-brand)", {
    cwd: BRAND_DIR
  })
}

/**
 * Runs `command` in UI's folder (or `cwd`), quietly;  prints its output only if it fails.
 * - Returns whether it succeeded;  exits unless `allowFailure`.
 */
function run(
  command: string,
  args: string[],
  label: string,
  { allowFailure = false, cwd = UI_DIR }: { allowFailure?: boolean; cwd?: string } = {}
): boolean {
  console.log(`-- ${label}`)
  const result = spawnSync(command, args, { cwd, encoding: "utf8", shell: false })
  if (result.status === 0) return true
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}${result.error ?? ""}`.trim()
  console.error(output.split("\n").slice(-40).join("\n"))
  if (!allowFailure) fail(`${command} ${args.join(" ")} failed in ${cwd}`)
  return false
}

////////////////
// ## Bundle
////////////////

/**
 * Bundles `ENTRY` into `OUTFILE`, escapes it for inlining, then checks it's fit for a claude.ai design system.
 * - Returns esbuild's warnings, as text.
 */
async function bundle(): Promise<string[]> {
  const dist = path.join(UI_DIR, "dist/index.js")
  if (!existsSync(dist)) fail(`${dist} is missing:  run without --skip-ui-build`)
  mkdirSync(path.dirname(OUTFILE), { recursive: true })
  const result = await build({
    entryPoints: [ENTRY],
    outfile: OUTFILE,
    bundle: true,
    format: "iife",
    globalName: "SpellUI",
    platform: "browser",
    // UI targets current browsers only (anchor positioning, `light-dark()`):  lower nothing but `import()`
    target: "esnext",
    supported: { "dynamic-import": false },
    // `BuiltInPacks.base` is only read to load a pack, and `spell-ui:icons` drops them all first
    define: { "import.meta.url": "undefined" },
    minify: true,
    legalComments: "eof",
    metafile: true,
    logLevel: "silent",
    plugins: [designResolver()]
  })
  checkOneSolid(result.metafile)
  checkEachFileOnce(result.metafile)
  checkNoElementSource(result.metafile)
  escapeForInlining()
  checkBundle()
  return result.warnings.map((warning) => `${warning.location?.file ?? ""}: ${warning.text}`)
}

/**
 * esbuild plugin wiring the entry to UI's `dist/` and the brand's build:
 * - `spell-ui` ~== `dist/index.js`, `spell-ui/<entry>` ~== `dist/<entry>.js` (mirrors UI's `exports`)
 * - `spell-brand/design` ~== `BRAND_DESIGN`;  the `$/ui/<entry>` it imports ~== UI's `dist/<entry>.js`, and
 *   `$/spell-element` ~== `dist/core.js`, which carries it
 * - Solid imports resolve from UI's root (`SOLID`), whoever imports them
 * - `spell-ui:icons`:  the generated icon registrations (`iconsModule()`)
 * - UI's emoji data chunks:  an empty stand-in each
 */
function designResolver(): Plugin {
  return {
    name: "design-resolver",
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^spell-ui:icons$/ }, () => ({ path: "icons", namespace: "spell-ui" }))
      pluginBuild.onResolve({ filter: EMOJI_CHUNK }, () => ({ path: "emoji-chunk", namespace: "spell-ui" }))
      pluginBuild.onLoad({ filter: /.*/, namespace: "spell-ui" }, async (loaded) => {
        if (loaded.path === "icons") return { contents: await iconsModule(), resolveDir: UI_DIR, loader: "js" }
        return { contents: "export default {}", loader: "js" }
      })
      pluginBuild.onResolve({ filter: /^spell-ui(\/.*)?$/ }, ({ path: specifier }) => ({
        path: uiDistPath(specifier.slice("spell-ui".length))
      }))
      pluginBuild.onResolve({ filter: /^spell-brand\/design$/ }, () => {
        if (!existsSync(BRAND_DESIGN)) fail(`${BRAND_DESIGN} is missing:  run without --skip-ui-build`)
        return { path: BRAND_DESIGN }
      })
      pluginBuild.onResolve({ filter: /^\$\/spell-element$/ }, () => ({ path: uiDistPath("/core") }))
      pluginBuild.onResolve({ filter: /^\$\/ui(\/.*)?$/ }, ({ path: specifier }) => {
        const file = uiDistPath(specifier.slice("$/ui".length))
        if (!existsSync(file)) fail(`${specifier} (a brand element's import) has no ${file}`)
        return { path: file }
      })
      pluginBuild.onResolve({ filter: SOLID }, async ({ path: specifier, kind, pluginData }) => {
        if (pluginData?.fromUiRoot) return undefined
        const resolved = await pluginBuild.resolve(specifier, {
          kind,
          resolveDir: UI_DIR,
          pluginData: { fromUiRoot: true }
        })
        return resolved.errors.length ? { errors: resolved.errors } : { path: resolved.path }
      })
    }
  }
}

/** File in UI's `dist/` for what follows a Spell UI specifier's package name (`""`, `/core`). */
function uiDistPath(sub: string): string {
  return path.join(UI_DIR, "dist", `${sub.replace(/^\//, "") || "index"}.js`)
}

/**
 * Source of `spell-ui:icons`:  every icon of `PACKS`, so any Font Awesome Free name draws, with no pack to load.
 * - Names as UI's packs give them (`IconName.claim()` on each index:  file name, `… outline`, FA's aliases);  across
 *   packs the FIRST to give a name keeps it;  then `NAMES` on top.
 * - The SVGs travel as ONE string, an `<svg>` holding each icon's `<svg>` in order, parsed once (one `DOMParser`
 *   call, not ~2,200).
 *   - `NAMES[i]` (in the bundle) are the names of its `i`th child.
 *   - Each is `register()`ed under each name in the first `UI.load()` callback:  every element `await`s that same
 *     promise before drawing an icon, so the names are in place first.
 *   - `reset()` first:  drop every pack, so the default pack's index is never requested (it can't load here).
 * - Imports `UI` from `spell-ui/core`, the same module `index.js` uses, so this runs BEFORE any family defines
 *   (and so upgrades) its elements.
 * - Each file's licence comment is stripped (they're all one text, and `<!--` can't be in the bundle anyway):  the
 *   text goes ONCE into a `/*!` legal comment, which esbuild keeps at the end.
 * - Their `xmlns` too:  the outer `<svg>` gives it.
 * - NOTE:  `register()`ed icons answer plain names only:  `fa7-free:bell` (a `prefix:` name) draws nothing here.
 */
async function iconsModule(): Promise<string> {
  const { IconName } = await import(pathToFileURL(path.join(UI_DIR, "src/icons/IconName.ts")).href)
  /** normalized name -> SVG file */
  const files = new Map<string, string>()
  for (const pack of PACKS) {
    const folder = path.join(ICON_PACKS, pack)
    const index = (await import(pathToFileURL(path.join(folder, "pack.js")).href)).default as {
      icons: Record<string, { alias?: string[] }>
    }
    const claimed: Map<string, string> = IconName.claim(
      Object.entries(index.icons).map(([key, entry]) => [key, entry.alias])
    )
    for (const [name, key] of claimed) if (!files.has(name)) files.set(name, path.join(folder, `${key}.svg`))
  }
  for (const [file, names] of Object.entries(NAMES)) {
    for (const name of names) files.set(IconName.normalize(name), path.join(ICON_PACKS, `${file}.svg`))
  }
  /** SVG file -> its names, in first-claimed order */
  const namesOf = new Map<string, string[]>()
  for (const [name, file] of files) namesOf.set(file, [...(namesOf.get(file) ?? []), name])
  const licenses = new Set<string>()
  const svgs = [...namesOf.keys()].map((file) => {
    if (!existsSync(file)) fail(`no icon ${file}`)
    const svg = readFileSync(file, "utf8")
      .trim()
      .replace(/<!--!?\s*([\s\S]*?)\s*-->/g, (_comment, text: string) => (licenses.add(text), ""))
      .replace(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, "<svg")
    if (!svg.startsWith("<svg") || svg.includes("<!--")) fail(`${file}:  not one plain <svg>`)
    return svg
  })
  console.log(`-- icons:  ${svgs.length} SVGs, ${files.size} names`)
  return [
    ...[...licenses].map((text) => `/*! ${text.replaceAll("*/", "* /")} */`),
    `import { UI } from "spell-ui/core"`,
    `const SHEET = ${JSON.stringify(`<svg xmlns="http://www.w3.org/2000/svg">${svgs.join("")}</svg>`)}`,
    `const NAMES = ${JSON.stringify([...namesOf.values()])}`,
    `UI.load().then((ui) => {`,
    `  ui.icons.reset()`,
    `  const icons = new DOMParser().parseFromString(SHEET, "image/svg+xml").documentElement.children`,
    `  NAMES.forEach((names, at) => { for (const name of names) ui.icons.register(name, icons[at]) })`,
    `})`
  ].join("\n")
}

////////////////
// ## Checks
////////////////

/** Fails if two copies of a Solid package made it into the bundle, e.g. from a linked package's own `node_modules`. */
function checkOneSolid(metafile: Metafile): void {
  const copies = new Map<string, Set<string>>()
  for (const input of Object.keys(metafile.inputs)) {
    const match = input.match(/node_modules\/((?:@[\w-]+\/)?[\w-]+)\//)
    if (!match || !SOLID.test(match[1]!)) continue
    const root = input.slice(0, match.index! + match[0].length)
    copies.set(match[1]!, new Set([...(copies.get(match[1]!) ?? []), root]))
  }
  for (const [name, roots] of copies) {
    if (roots.size > 1) fail(`${name} bundled ${roots.size} times:\n  ${[...roots].join("\n  ")}`)
  }
  if (!copies.has("solid-js")) fail("solid-js isn't in the bundle:  check the resolver")
}

/**
 * Fails if one file made it into the bundle under two paths (a link's and its real one):  two module instances, so two
 * of UI's `UIComponent`, `ShadowEvents` ... (epic `epic-engine` I18).
 */
function checkEachFileOnce(metafile: Metafile): void {
  const seen = new Map<string, string>()
  for (const input of Object.keys(metafile.inputs)) {
    if (input.includes(":")) continue
    const real = realPath(path.resolve(input))
    const other = seen.get(real)
    if (other) fail(`${real} bundled twice, as ${other} and ${input}:  resolve both through its real path`)
    seen.set(real, input)
  }
}

/**
 * Fails if the kit element's SOURCE made it into the bundle:  a second copy beside the one Spell UI's `dist/core.js`
 * carries, so two `UIComponent`s and two `ShadowEvents` (the brand's `$/spell-element` import, unless the resolver
 * sends it to `dist/core.js`;  epic `epic-engine` P9).
 */
function checkNoElementSource(metafile: Metafile): void {
  const sources = Object.keys(metafile.inputs).filter((input) => {
    const real = realPath(path.resolve(input))
    return real === ELEMENT_DIR || real.startsWith(`${ELEMENT_DIR}/`)
  })
  if (sources.length) fail(`spell-element bundled from its source, a second copy:\n  ${sources.join("\n  ")}`)
}

/**
 * Rewrites every `<!--` and `</script` in the bundle as `\x3C!--` / `\x3C/script` (caveat C5):  readers INLINE a
 * design system's `bundle.js` into a `<script>`, where either would end it or change how it parses.
 * - Same meaning wherever minified code has them:  in a string, a template or a regex `\x3C` IS `<`;  in a comment
 *   it's just text.
 * - An odd run of backslashes before the `<` already escaped it (`\<`):  one is dropped.
 * - SIDE EFFECT:  rewrites `OUTFILE`;  `checkBundle()` then proves none survive and it still parses.
 */
function escapeForInlining(): void {
  let count = 0
  const code = readFileSync(OUTFILE, "utf8").replace(/(\\*)<(?=!--|\/script)/gi, (_match, slashes: string) => {
    count++
    return `${slashes.length % 2 ? slashes.slice(1) : slashes}\\x3C`
  })
  writeFileSync(OUTFILE, code)
  console.log(`-- escaped ${count} <!-- / </script for inlining`)
}

/**
 * Fails unless the bundle is fit for a claude.ai design system:
 * - no `<!--` or `</script` left
 * - a CLASSIC script:  no top-level `import` / `export`, no `import.meta`
 *   - parsed, not searched, since the elements carry program text in their strings
 * - no runtime `import()`, which parses fine and fails only once it runs, so that one is searched for:
 *   - esbuild always prints it as `import(`, no space
 *   - a call, not a METHOD called `import` (`x.import(y)`, `import(...rules) {`)
 * - at most `MAX_BYTES`
 */
function checkBundle(): void {
  const code = readFileSync(OUTFILE, "utf8")
  if (/<!--|<\/script/i.test(code)) fail(`${OUTFILE} still has a <!-- or </script`)
  try {
    new Script(code, { filename: OUTFILE })
  } catch (error) {
    fail(`${OUTFILE} doesn't parse as a classic script (${(error as Error).message})`)
  }
  if (/(?<![.\w$])import\((?![^)]*\)\s*\{)/.test(code)) fail(`${OUTFILE} still has a runtime import()`)
  const bytes = Buffer.byteLength(code)
  if (bytes > MAX_BYTES) fail(`${OUTFILE} is ${bytes} bytes:  over Claude Design's ${MAX_BYTES}`)
}

////////////////
// ## Output
////////////////

/** Prints the bundle's size (raw, gzip) and any esbuild warnings. */
function report(warnings: string[]): void {
  const code = readFileSync(OUTFILE)
  const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`
  console.log(`-- ${OUTFILE}  ${kb(code.length)}  (gzip ${kb(gzipSync(code).length)})`)
  for (const warning of warnings) console.warn(`!! ${warning}`)
}

/** Prints `message` and exits with an error. */
function fail(message: string): never {
  console.error(`!! ${message}`)
  process.exit(1)
}
