# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, and others)
when working with code in this package, `spell-brand`.

**Root conventions apply:  READ the repo root's `AGENTS.md` and [WWOD](agents/wwod/WWOD.md) FIRST.**
- the root's:  the repo's layout
- WWOD:  the house style every package shares (comments, functions, types / exports, imports ...)
- Only what DIFFERS is below.

## This repo:  `spell-brand`

- `github.com/spell-app/spell-brand`, public;  cut from spell-app with its history (epic `repo-split` P8).
- It holds `spell-brand` itself, at the repo's root:
  - its code, all in ONE `src/`:  the `<brand-*>` elements (a component pack, `src/components/`), the palette and hues
  - outside it, Brand UI's docs pages (`docs/`)
- It may use:
  - spell-ui (Spell UI), which it's built on
  - the kit:  `spell-kit/element` (its elements are written on it);
    and, as Spell UI does, `spell-kit/server` for the site, util's json5 and the toolchain
  - Every arrow points DOWN:  no repo below this one may import it.
- It lives inside the kit `spell-kit`, at `~/www/spell/spell-brand/`:
  - the kit holds the ONE install for every repo (no `yarn.lock` here)
  - [its AGENTS.md](../AGENTS.md) has the rules across repos
- Every file is imported by its package name and its path under `src/` ("Imports", below):
  the brand's own (`spell-brand/components/brand-color`), and other repos' (`spell-kit/element`, `spell-ui/core`).
- `agents/` (WWOD and the three logs):  a link to the kit's `agents/` (git-ignored here).
  - Every `yarn install` at the kit makes it (its `postinstall`).

## Overview

- This package is Spell's brand, and the work of bringing it into Spell UI.
  - epic `design-system`:  [its epic page](../spell.epics/epics/design-system/design-system.plan.html)
  - its elements in Claude Design:  epic `claude-design`, P11
- READ FIRST for the big picture:  the guide, [the design system guide](../spell.epics/guides/design-system/design-system.html).
  - the Brand tab and Compare
  - the `spell-brand` theme and its brand roles
  - every element, making a copy, its limits
- A COMPONENT PACK (epic `people-and-orgs` P18, Q26):  its elements are `<brand-*>`.
  - A page loads them through `<ui-root>`, as it loads the epics pack's
    ([ui's AGENTS.md](../spell-ui/AGENTS.md), "Component packs").
  - They were `<ui-brand-*>`, Spell UI's prefix, before P18.
  - Made one by `spell pack create brand --prefix brand-`.
  - Its build and check are the kit's pack tooling, which the brand uses as any pack does:
    `spell-pack`, and [ComponentPack](../src/element-tools/ComponentPack.ts).
    - Its families are in `src/components/`, not the default `components/`:
      `"spellPack": { "components" }` in [package.json](package.json).
    - A bin of `spell-kit`, a dependency here:  the brand reaches the kit's tool, never spell-app's CLI.
    - Spell UI's `spell-ui-pack` from epic `repo-split` P5 to P10.
- Two halves (epic `claude-design`, P11, 2026-10-05):
  - The Brand tab's PAGES are shared:  the content repo's `brand/`, `spell.epics/brand/` beside the kit's checkout.
    - The page server serves the content folder after the checkout, so they're at `/brand/...`.
    - Edit them at their real path, `~/www/spell/spell.epics/brand/`.
    - Never commit them here.
  - The CODE stays here, tracked:
    - `src/` (the elements, `src/components/<tag>/`), `scripts/`, `_assets/`, `assets/`, configs
    - the elements' own docs pages, `docs/` (P18:  they live with the code they describe, per branch)
  - A Brand tab page links this package's files through the page server's `/packages/brand/` routes
    (spell-app's `engineRoutes`), relative to its own folder:

    ```text
    from brand/                       ../packages/brand/_assets/...
    from brand/spell-design-system/   ../../packages/brand/_assets/...
    ```
- `brand/spell-design-system/` (shared):  Claude Design's output, AS EXPORTED.
  - `readme.md` (the brand rules), tokens, logo assets, and 13 top-level `*.dc.html` pages
  - NEVER edit Claude Design's files.
    - They're the reference the copies are measured against.
    - Claude Design may export over them.
  - A `.dc.html` page is a Claude Design template, compiled into React as it loads.
    - The template:  an `<x-dc>` element.
    - The compiler:  `support.js`, Claude Design's runtime, generated.
    - React and Font Awesome come from CDNs.
    - Four pages also fetch local files, so they need the page server.
  - Used only by the specimen cards, never by the 13 pages (all inline styles):
    - the `sp-*` classes, in its components sheet (`components.css`, in `components/`)
    - the React wrappers, in `components/*/`
- The copies on Spell UI (shared):  beside each `.dc.html`, its `.spell.html`, same name.
  - e.g. `Brand Montage.dc.html` -> `Brand Montage.spell.html`
- [The Brand tab's home page](../spell.epics/brand/index.html) (shared):
  - every page, with Original / Spell / Compare links
  - the elements
  - every other page in `brand/`, e.g. ones pulled from Claude Design (written by `epic pages index`)
- `brand/compare.html?page=<Name>` (shared):  an original and its copy, side by side, or one over the other.
- `_assets/`:  the brand pages' own assets.
  - `brand-pages.js` / `.css`:  the index and Compare (a classic script, on the docs bundle).
    - Its `PAGES` list is THE list of pages.
    - In the change that adds a page's `.spell.html`, flip its `built` to `true`.
  - `ui/`:  GENERATED, NOT committed.
    - Git-ignored since 2026-10-07:  its hashed chunk names churned every diff.
    - It's the copies' bundle (`yarn build`):  `brand-ui.js`, its CSS and lazy chunks.
    - `icon-packs` is a symlink to Spell UI's.
    - The page server builds it when it starts, if stale (`spell bundle --stale`).
      - That's the kit's `SRV.Bundle` (`spell-kit/server`):  `.bundle.json` records the sources' hash.
    - NEVER edit.
- `assets/`:  the brand's SOURCE files, which people link or download (epic `repo-split` P10).
  - `logo/`:  the mark and the lockups as SVG and PNG, in each colour;  `logo/explore/`, the variants tried
  - `fonts/`:  the P052 serif (`.otf`), and its licence (URW base35)
  - `reference/`:  the reference images the brand was drawn from
  - A COPY of the content repo's `brand/spell-design-system/assets/`, Claude Design's export:
    the content repo's stays for now (`repo-split` T15).
  - Served from every component set at `/_brand/assets/...` (`/_brand/assets/logo/spell-lockup.svg`):
    an engine route in spell-app's root `package.json`'s `"pageServer"` (`engineRoutes`).
  - `assets/`, not `_assets/`:  `_assets/` holds the brand pages' scripts and their built bundle;
    `assets/` holds files people use as they are.
  - The component sets' page frames (each set's `__parts/` layout) draw the lockup inline;
    their comments name this copy as its source.
  - NEVER edit them by hand:  they're Claude Design's.
- `docs/`:  Brand UI, the elements' docs set, served at `/components/brand/`.
  - A COMPONENT SET:  the kit's [server AGENTS.md](../src/server/AGENTS.md), "And the COMPONENT SETS".
  - One flat folder, in Spell UI's component page shape (Examples / Usage / API / Theming):
    - `index.html`:  the set's home, with the specimen that was the shared `components.spell.html`
    - one page per family, `<tag>.html`
    - Copied from the shared `brand/components/` at P18 (`ui-brand-<x>.html`).
  - `__parts/`:  `layout.html` and `footer.html`.
    - The layout is every page's frame, as Epic UI's:  it loads the pack through `<ui-components source>`.
  - The page server lays Spell UI's site bundle over the folder at `_assets/`:  a page loads its `site.js`.
    - The site swaps only a page's `main` between pages.
      So what an example needs, styles and scripts, goes INSIDE `main`.
    - A script adds its listeners once (`window.<flag>`), as the site runs it again.
  - `__data/`:
    - `pages.json5`:  HAND-KEPT.
      - Spell UI's per-family facts (title, summary, status)
      - the set's own `groups` (the side column's) and `nav` (its own links)
    - GENERATED, committed (`yarn site:data`):
      - `components.json5`:  the pages' API and tokens, and the design system's Brand cards
      - `search.json5`:  every page's sections, for the side column's search
      - VS Code autocomplete for `<brand-*>`, loaded by [spell-app's VS Code settings](../spell-app/.vscode/settings.json):
        `custom-elements.json` and `html-custom-data.json`
- `src/` (`spell-brand`, self-namespace `B`):  every file of the package.
  - `Palette`:  the brand's colour math, ported from Claude Design's palette script.
    - its source:  `palette.mjs`, in Claude Design's `lib/`
    - sRGB <-> OKLCH, contrast
    - `generateScale()`:  17-step ladders
    - `buildPalette()`
    - Its test pins it to Claude Design's palette data (`palette.json`, in `lib/`).
      - copied as `Palette.fixture.json`, beside the test in `tests/`
      - why:  a test can't read the shared folder
  - `brand.types.ts`
  - the bundles' entries, each saying what's in it, and why:
    - `brand-ui.ts`, with the inspector's fields' look (`inspector.css`)
    - `brand-design.ts`
    - `hues.ts`
    - The old docs pages' bundle went at P18 (`brand-docs.ts`, with its `brand-docs.css`):
      the docs set loads Spell UI's site bundle and the pack instead.
- `src/components/` (`spell-brand/components`):  the `<brand-*>` elements, one folder per family.
  - Written exactly like a Spell UI family ([ui's AGENTS.md](../spell-ui/AGENTS.md), "Solid authoring").
  - Written on the kit's element:  `import { E } from "spell-kit/element"`.
    - Spell UI's shared code comes from `spell-ui/core` / `spell-ui/forms`.
    - A file using Spell UI's own pieces (`E.IconGlyph` ...) takes `E` from `spell-ui/core` instead,
      which carries the kit's element's names too ([its AGENTS.md](../src/element/AGENTS.md), "Imports").
  - `yarn lint` holds them to it:  the `spell-ui/*` rules (ui's "Solid authoring", "The lint guard").
  - Generic ones move into Spell UI later (epic decision D2).
  - `__pack/`:  GENERATED and committed, by `spell pack build brand` (or `yarn pack:build`).
    NEVER edit its files:
    - `brand.catalog.ts`:  tag => family folder + skeleton, read from the vocabularies
      - its second line records the sources' hash
    - `brand.entry.ts`:  `SpellUI.registerPack({ name, prefix, catalog, define })`
    - `brand.pack.js`:  the CLASSIC script a page loads
      - Solid, the kit's element and Spell UI's shared modules are NOT in it (`SpellUI.packModules`)
  - A pack's events keep their own names:
    - the composer's own:  `brand-cast`
    - the ones Spell UI's controls send too keep Spell UI's (`ui-change`, `ui-input`, `ui-copy`),
      so a form and a page hear them the same way
- `scripts/`:
  - `build.ts`:  the bundle
  - `compare.ts`:  screenshot diffs
  - `site-data.ts`:  `docs/__data/`
  - the claude.ai design bundle (see "The design bundle"):
    - `design-bundle.ts` and its entry (`design-bundle.entry.js`)
    - `design-check.ts`
    - where both look (`design-paths.ts`)
- `vite.design.config.ts`:  the elements, built for the claude.ai design bundle.
  - The output:  `brand-design.js`, in `dist/` (git-ignored).
  - The design bundle's build runs it first:  `yarn design:bundle` ([design-bundle.ts](scripts/design-bundle.ts)).
- `vendor/claude-design/`:  Claude Design's artboard runtime, `dc-runtime.js`, for `yarn design:check`.
  - copied from claude.ai (2026-10-05)
  - NEVER edit;  not linted, formatted or type-checked.
- `brand/leonardo/` (shared):  the original reference images and brief, from before Claude Design.

## A `.spell.html` copy

- It sits beside its original, with the same name.
- It loads the copies' bundle, from the page server only, not `file://`:
  its CSS, and its script as a MODULE.

  ```html
  <link rel="stylesheet" href="../../packages/brand/_assets/ui/brand-ui.css" />
  <script type="module" src="../../packages/brand/_assets/ui/brand-ui.js"></script>
  ```

- It starts its `<body>` with `<spell-site-header root="../..">`.
- Colours, fonts, radii and shadows come ONLY from the theme's tokens, so dark mode works:
  - `--ui-*`
  - the brand roles, `--spell-*`:  `spell-brand.css`, "Brand roles"
    - e.g. `--spell-surface-warm`, `--spell-type-eyebrow`
- Dark mode:  Spell UI's `color-scheme` (`ui-dark` on `<html>`).
  Never the brand's `data-theme`.
- Anything the theme can't do:  the epic page's "What the theme can't do today" table, and an issue.
- Spell UI's "UI rules" ([ui's AGENTS.md](../spell-ui/AGENTS.md))
  apply to the pages and the `<brand-*>` elements too.
  - e.g. numeric fields right-aligned against their unit

## Commands

- `yarn build`:  the copies' bundle, `_assets/ui/` (git-ignored).
  - `spell bundle brand` runs it, and records the sources' hash.
  - The page server rebuilds it when it starts, if any of these changed:
    `src/`, or the Spell UI source it reads.
  - While the page server runs, rerun it by hand (or restart the page server).
- `yarn pack:build` ~== `spell-pack build` ~== `spell pack build brand`:  the pack, in `src/components/__pack/`.
  - then `yarn site:data`
  - `yarn pack:check` ~== `spell-pack check` ~== `spell pack check brand`:
    exits 1 while the pack or the docs data is stale.
  - [The pack's test](./tests/pack.test.ts) runs the check, so `yarn test` fails on a stale pack.
- `yarn site:data [--check]`:  the docs set's data, `docs/__data/` (see "Overview").
  - It's Spell UI's `SiteDataBuilder`, reading `src/components/`, made the set's:
    - flat page links
    - the set's groups as topics
    - its `nav`
  - It also writes the search file (the pages' sections) and the editor manifests (`ElementManifests`).
  - `--check`:  writes nothing, exits 1 while a file is stale.
  - Rerun it after a vocabulary, a sheet's tokens or a page's sections change, and commit what it writes.
  - Then `spell design build` picks the change up for claude.ai.
- `yarn design:bundle [--out <dir>] [--skip-ui-build]` ~== `spell design bundle`:
  the claude.ai design bundle (see "The design bundle").
- `yarn design:check [bundle.js] [outDir]` ~== `spell design check`:
  proves it the two ways Claude Design runs it.
  - Run it after touching the bundle, its entry, the elements' design entry or their design build's Vite config.
- `yarn compare [<page>...] [--width 1280] [--height 900] [--dark] [--full]`:
  screenshots of each original and its copy, and a diff % per page.
  - into `.compare/` (git-ignored):  `dc.png`, `spell.png`, `side.png`, `diff.png`, `report.md`
  - A rough guide:  LOOK at `side.png`, or the Compare view (`/brand/compare.html`).
- `yarn test`:  two projects, set up in [vitest.config.ts](vitest.config.ts).
  - The tests live in the repo's `tests/`, at the same paths as the code under `src/`.
  - e.g. `BrandLogo`'s test:  [BrandLogo.test.tsx](./tests/components/brand-logo/BrandLogo.test.tsx)
  - `node`:  the tests of `src/`'s own files, at the top of `tests/`:  `Palette.test.ts`, `pack.test.ts` ...
  - `browser`:  in Vitest browser mode, chromium
    - the elements
    - the `*.browser.test.ts` files:  the inspector's look
    - with the kit's test helpers:  `spell-kit/test-helpers/ElementFixture`, `spell-kit/test-helpers/A11y`;
      Spell UI's own, `spell-ui/test-helpers/MemberClashes`, and its setup
  - The kit's `yarn test` runs this repo's `yarn test`, after the repos below it.
- `yarn ts`, `yarn lint`, `yarn format`, `yarn review`.

## The design bundle

The claude.ai Design System's bundle (epic `claude-design` P8, P11):
ONE classic script of Spell UI, the `<brand-*>` elements and the `spell-brand` theme, defining `window.SpellUI`.
- Its file there:  `components/bundle.js`.
- spell-epic built it until epic `repo-split` P10 (Q32):  spell-epic needed spell-brand only for this.
- `yarn design:bundle` ([design-bundle.ts](scripts/design-bundle.ts)), also `spell design bundle`:
  - builds Spell UI (`yarn build`) and the brand's elements (`vite.design.config.ts`) from their working trees,
    unless `--skip-ui-build`
  - bundles [design-bundle.entry.js](scripts/design-bundle.entry.js) with esbuild, everything inlined:
    Claude Design refuses a relative `<script src>`
  - every Font Awesome Free icon, under its own names and the widgets' (`NAMES`)
  - `<!--` / `</script` escaped, since readers inline it;  fails over 6 MB
  - writes it into the design system's folder that `spell design build` writes, or `--out <dir>`
    - the file:  `project/components/bundle.js`
    - the folder:  Spell UI's `build/design-system/`, git-ignored
- `yarn design:check` ([design-check.ts](scripts/design-check.ts)), also `spell design check`, with Playwright:
  - the bundle inlined into an `about:srcdoc` frame, as a preview card runs it:
    icons, code colours, markdown, the brand's elements and theme, no errors
  - then a Design board under Claude Design's own runtime (`vendor/claude-design/`), whose `<ui-button onClick>`
    must count
- spell-epic's docs bundle is built the same way, by its own `bundle-spell-ui.js`:
  the resolver and checks here are a copy of its, kept in step by hand.

## The elements

- Each family has a page in the docs set, `docs/`, named for its tag:  `/components/brand/<tag>.html`.
  - Spell UI's components page shape:  masthead, then Examples / Usage / API / Theming tabs.
  - A new family:
    1. `spell pack add brand brand-<name>`
    2. fill in its vocabulary, `<Name>.en.ts` (topics, aka, description)
    3. `yarn pack:build`
    4. copy a page, and file it in the `groups` of [the hand-kept facts](docs/__data/pages.json5)
  - The set's home and side column list them.
  - NOTE:  its Theming tab's token table is EMPTY for now.
    - Spell UI's token readers (`FamilyTokens`, `ComponentTokens`) find only `--ui-*` tokens.
    - The brand's are `--brand-*` since P18 (people-and-orgs issue, at P18).
- The claude.ai design system shows each family as a card in its "Brand" group
  ([DesignBrand.ts](../spell-ui/src/tools/DesignBrand.ts), epic `claude-design` P11).
  - Spell UI reads this folder only where it's GIVEN it:
    `yarn design:build --brand <folder>`, which `spell design build` passes (epic `repo-split` P5).
  - its API:  from `components.json5` in `docs/__data/`
  - its examples:  from its docs page's Examples tab
    - each `<ui-docs-example>`, titled by its section, with the page's own styles
  - So an example there must work on its own:  no page script, no file to load.

- The inspector panel is Spell UI's now:  `<ui-panel>`, a `<ui-section>` subclass.
  - Its source:  [ui-panel](../spell-ui/src/components/ui-panel/), moved from `<ui-brand-panel>` 2026-10-05.
  - Its docs page is Spell UI's:  `/components/ui/ui-panel.html`.
  - Its tokens are `--ui-panel-*`.
  - `color="accent"` works on the brand pages:  [hues.ts](src/hues.ts) + `spell-brand`.
- The inspector's fields are Spell UI's too:  `<ui-field>`.
  - It replaced `<brand-field>` (epic `property-editor` P1).
  - a label row (label, actions, output, info tip), the control, the hint and errors
  - Its docs are Spell UI's:  `/components/ui/ui-form.html`.
  - The brand pages draw it in the inspector's look:  [inspector.css](src/inspector.css), in the copies' bundle.
    - a 20px label row, a 13px medium label;  compact slotted inputs, selects, dropdowns and segmented menus
    - only `<ui-field>`s in a `<ui-panel>`:  every other Spell UI form keeps its own look
    - its tip's colours are the `spell-brand` theme's (`--ui-field-tip-*`)
- [`<brand-composer>`](src/components/brand-composer/):  write a spell, and cast it.
  - a form element:  the text under `name`
  - `brand-cast` (cancelable), from the button or Cmd / Ctrl+Enter
  - `casting`, set by the page
  - `size="large"`, for a hero
- `<brand-checklist>` + `<brand-check>`:  round-marked lines, in one folder, `brand-checklist/`.
  - `step` drives build progress:  done / active / pending, announced
  - `checkable` makes each a checkbox
- [`<brand-phone>`](src/components/brand-phone/):  a phone frame around a live preview.
  - a status bar;  `dimmed`
- Page art, brand-only (never moves into Spell UI):
  - `<brand-logo>`:  the logo outlined from P052, so it needs no font.
    - Its paths:  `logoPaths.ts`, `import()`ed on first use.
      Copied from Claude Design's `lockupPaths.js`, in `components/brand/`.
    - Use it, never an `<img>` of the SVGs.
  - `<brand-flourish>`:  drawn by `Flourish.ts`, a port of Claude Design's flourish script.
    - its source:  `spell-flourish.js`, in Claude Design's `lib/`
    - same variants, same seeded shapes
    - It fills its positioned parent.
  - `<brand-blob>`:  a corner blob.
    The parent must be positioned, and clip.

## Imports

As WWOD §4, plus:

- ONE name per file, the same in every repo (epic `repo-split` P14, Q47):
  the package name and its path under `src/`, no extension, inside this repo too.
  - `spell-brand`:  [the barrel](src/index.ts)
  - `spell-brand/components`:  every element
  - `spell-brand/components/brand-color`, `spell-brand/components/brand-flourish/Flourish`
  - `spell-brand/inspector.css`
  - Same-folder peers stay `./BrandColor.types`;  NEVER a `../` climb, NEVER an alias.
  - Files outside `src/` (`scripts/`, `tests/`, the configs) import `src/` the same way.
    What code imports from OUTSIDE `src/` has an explicit `exports` key:
    `spell-brand/vite.config.ts`, whose `BRAND_ASSETS` [the build script](scripts/build.ts) reads.
- How every tool finds them:  [package.json](package.json)'s `exports`, no alias table anywhere.
  - TypeScript:  the `spell-brand-source` condition reads the brand's own SOURCE
    (`customConditions` in [tsconfig.json](tsconfig.json) and [tsconfig.node.json](tsconfig.node.json)).
    - Another repo would read its built declarations (`types`, `dist-types/src/...`, `spell-types`).
  - Vite, Vitest, `tsx`:  `default`, the source, adding the extension themselves.
  - Every folder barrel has an explicit key (`"./components"`, `"./components/brand-color"` ...):
    `tsx`, run from another repo through `node_modules`, finds a file without its extension but not a folder's
    `index`.
  - esbuild (the design bundle) reads none of the brand's names through them:
    its own resolver sends each of its imports to a built file.
- Spell UI and the kit by the same names, entries of their `exports`:
  - `spell-ui/core` (and `spell-ui/forms`):
    Spell UI's half of the element authoring API, beside `spell-kit/element`'s.
    - Imported as a `ui` family imports it, through its namespaces:

      ```ts
      import { E, UI, UIT } from "spell-ui/core"
      import { F } from "spell-ui/forms"
      ```

    - then `E.IconGlyph`, `UI.browser`, `F.FormComponent` ...
    - `E.UIComponent` and `@E.state` are the kit's element's:
      a file that needs nothing more takes `E` from `spell-kit/element`
  - the bundle entries (`src/`), as Spell UI's site entry does:
    - `spell-ui/runtime`, `spell-ui/icons`, `spell-ui/styles`
    - its stylesheet, `spell-ui/styles/ui.css`
  - [site-data.ts](scripts/site-data.ts):  Spell UI's site-data tools, and the site data's types
    - `spell-ui/tools/SiteDataBuilder`
    - `spell-ui/tools/SiteSearchBuilder`
    - `spell-ui/tools/ElementManifests`
    - `spell-ui/docs-components/docs-components.types`
  - `spell-ui/test-helpers/...` (`MemberClashes`, `setup.ts`), in tests
    - the generic helpers are the kit's:  `spell-kit/test-helpers/...`
- NEVER the other way:  `ui` imports nothing of `brand`.
  - Its design export (`DesignBrand`) READS the docs set's `components.json5` and its pages, as data.
- The pack's script may import only what a page shares (`PACK_MODULES` in the kit's
  [pack modules](../src/element-tools/packModules.ts), each by the name the source imports it by):
  - `spell-kit/element`, `spell-ui/core`, `spell-ui/forms`, Solid
  - the brand's own files (`spell-brand/...`) are bundled into it

## Serving

- spell-app's page server serves the brand (its settings:  the `"pageServer"` block of spell-app's `package.json`):
  - the Brand tab's pages at `/brand/...`, from the shared content folder
  - this package's `_assets/` and pack at `/packages/brand/...`, its `assets/` at `/_brand/assets/...`
    (`engineRoutes`)
  - The site header's Brand tab opens `/brand/index.html`, and lights on every page under `/brand/`.
    - Its entry:  the Brand tab in the settings' `siteTabs` (the kit's [site.types.ts](../src/server/site/site.types.ts)
      has its shape, `SiteTab`).
  - The docs set, `docs/`, at `/components/brand/` (the page server's `componentSets` setting).
    - Spell UI's site bundle is laid over it at `_assets/`, as over every set's.
    - `/brand/components/` (the old element pages) answers "not found".
- Live reload:
  - the Brand tab's pages:  the page server watches the whole shared content folder
  - this repo (the bundles, the pack and the docs set):  in the settings' `watch` list,
    as `../spell-brand` and its `src/components/__pack`
- File names with spaces are fine:  links write them `Brand%20Montage.spell.html`.
