# `$/brand` -- Spell's brand, and its `<brand-*>` elements

Spell's brand in code:
- the colour math the Brand tab's pages use
- the bundle their Spell UI copies load
- the `<brand-*>` elements those copies are built from
- The elements are a COMPONENT PACK:  a page loads them on demand through `<ui-root>`, as it loads the epics pack's.
- Their docs pages, Brand UI, live here too (`docs/`), served at `/components/brand/`.
- The Brand tab's pages themselves are SHARED, in the repo root's `brand/`:  see [AGENTS.md](AGENTS.md).

```html
<ui-root>
  <ui-components source="/packages/brand/components/__pack/brand.pack.js"></ui-components>
  <brand-logo variant="lockup"></brand-logo>
</ui-root>
```

The page must load Spell UI's [docs bundle](../epics/tools/_assets/spell-ui.js), or a set's site bundle, first:
- the pack registers there (`SpellUI.registerPack()`)
- and takes Solid and Spell UI's shared code from it (`SpellUI.packModules`)

## This repo

- `spell-brand`:  Spell's brand:  Claude Design's pages and tokens, their Spell UI copies, and the brand-* component pack.
- Cut from [spell-app](https://github.com/spell-app/spell-app) with its history (epic `repo-split` P8);
  the repo IS the package, at its root.
- It may use:  spell-ui (Spell UI, which it's built on) and the kit:  its `element/` (its elements are written on it);
  and, as Spell UI does, its `server/` for the site, and util's json5 and the toolchain.
- A child repo of the kit `spell-kit` (`~/www/spell`), which holds the ONE install for every repo:
  `yarn install` there.  No `yarn.lock` here, for now.

## The DRY rule (one of each)

If you find yourself writing a second copy of any of these, stop and reuse.

- the pack's build, catalog and staleness check:  the kit's, `spell-pack`
  ([ComponentPack.ts](../element/tools/ComponentPack.ts))
- reading a vocabulary's tag and skeleton:  the kit's [`RootCatalog`](../element/tools/RootCatalog.ts)
- the brand's logo, fonts and reference images:  [`assets/`](assets/)
- the docs data, in [site-data.ts](scripts/site-data.ts):  Spell UI's builders
  - `SiteDataBuilder`, `SiteSearchBuilder`, `ElementManifests`
- the element authoring API:  `spell-kit/element`, and Spell UI's `@spell-app/ui/core`
- the brand's colour math:  [`Palette`](src/Palette.ts)

## Files

| Path | What |
| --- | --- |
| `components/<tag>/` | one element family:  component, vocabulary, sheet, barrel |
| `components/index.ts` | `$/brand/components`:  every family barrel (defines every tag:  SIDE EFFECT) |
| `components/__pack/` | GENERATED, committed:  `brand.catalog.ts`, `brand.entry.ts`, `brand.pack.js` |
| `docs/` | Brand UI:  `index.html` and one page per family, `<tag>.html` |
| `docs/__parts/` | every docs page's frame:  `layout.html` (loads the pack), `footer.html` |
| `docs/__data/` | `pages.json5` (hand-kept);  `components.json5`, `search.json5`, the editor manifests (generated) |
| `src/index.ts` | `$/brand`:  `Palette`, the brand's types |
| `src/brand-ui.ts` | the Brand tab copies' bundle entry, `_assets/ui/brand-ui.js` (git-ignored) |
| `src/brand-design.ts` | the elements for the claude.ai design bundle (`yarn design:bundle`) |
| `src/hues.ts` | the brand's `accent` hue |
| `_assets/` | the Brand tab's own script and sheet (`brand-pages.*`);  `ui/`, the built bundle |
| `assets/` | the brand's source files people link or download:  `logo/`, `fonts/`, `reference/`;  a copy of the content repo's `brand/spell-design-system/assets/`, served from every set at `/_brand/assets/...` |
| `scripts/` | `build.ts`, `compare.ts`, `site-data.ts`, `rename-shared.ts`;  the claude.ai design bundle's `design-bundle.ts` and `design-check.ts` |
| `vendor/claude-design/` | Claude Design's artboard runtime, for `yarn design:check`:  never edited |
| `vitest.config.ts` | `node` (`src/`) and `browser` (`components/`) projects |
| `_data/` | *(none -- `docs/__data/`, since epic `people-and-orgs` P18)* |

## Adding a new element

1. `spell dev pack element brand brand-<name>`:
   - writes the family's folder, `components/brand-<name>/`, and its test
   - adds it to [the barrel](components/index.ts)
   - rebuilds `components/__pack/`
2. Fill in its vocabulary (description, `topics`, `aka`, attributes, parts, skeleton), its class and sheet
3. Copy a page in `docs/` to `brand-<name>.html`.
   File the tag in the `groups` of [the hand-kept facts](docs/__data/pages.json5).
4. `yarn pack:build`, then `yarn review`
5. Commit the pack and the docs data (`components/__pack/`, `docs/__data/`) with the change

## Deferred

- The Theming tab's token tables:
  Spell UI's token readers find only `--ui-*` tokens, and the brand's are `--brand-*`.
- Generic elements (the field, the colour chips) move into Spell UI later (epic `design-system`, D2).
