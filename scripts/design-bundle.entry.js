/**
 * Entry of the DESIGN bundle:  `components/bundle.js` of a claude.ai Design System (epic `claude-design`, P8), ONE
 * classic script defining `window.SpellUI`.
 * - Built by `yarn design:bundle` (`design-bundle.ts`, beside it);  edit THIS, never the bundle.
 * - Plain JS, not TS:  its first import is a module the build makes up (`spell-ui:icons`), which no type checker knows.
 * - spell-epic's docs entry (its `_assets/spell-ui.entry.js`) minus what only docs pages need:
 *   - no page runtime, no site header, no saver
 *   - no lazy engines or emoji scripts:  Claude Design refuses a relative `<script src>` (caveat C6), so the build
 *     INLINES the code and markdown engines (their `import()`s stay in the bundle, as code), and emoji names simply
 *     never load (their chunks are empty stand-ins, `<ui-emoji name>` draws nothing, nothing throws)
 *   - spell's colouring isn't Spell UI's since epic `repo-split` P2:  `language="spell"` shows plain here
 * - `spell-ui:icons` FIRST:  it registers EVERY Font Awesome Free icon (solid, regular, brands) under the names
 *   `fa7-free` / `fa7-brands` give them, then the widgets' and docs' own names on top (`close`, `info` ...).
 * - Then the brand's elements (P11, `@spell-app/brand/design`:  `src/brand-design.ts`, built by
 *   `vite.design.config.ts`):  its `accent` hue first, then every `<brand-*>`.  BEFORE Spell UI's families, so
 *   `color="accent"` is a hue when they define (issue I17).
 * - Exports become `window.SpellUI` (`UI`);  the `spell-brand` theme applies as soon as the bundle runs, as on every
 *   doc page:  the design system IS the brand (P11;  `tokens.json` is that theme's).
 */

import "spell-ui:icons"
import "@spell-app/brand/design"
import { UI } from "@spell-app/ui"

export { UI }

void UI.load()
  .then((ui) => ui.themes.apply("spell-brand"))
  .catch((error) => console.error("spell-ui:  the spell-brand theme", error))
