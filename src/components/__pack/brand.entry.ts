/* GENERATED -- do not edit:  `spell pack build brand` */
/**
 * The `brand` pack's script:  registers with the page's Spell UI, which adds the catalog and calls `define()`.
 * - `define()` imports every family barrel, which defines its tags:  inlined in the script, run only when called.
 * - `families`:  each family's sources' hash, so a page swapping in a rebuilt pack re-renders only what changed.
 */
import { CATALOG } from "./brand.catalog"

/** The docs bundle's global (`spell-ui.entry.js`). */
const { SpellUI } = globalThis as unknown as { SpellUI: { registerPack(pack: object): void } }

SpellUI.registerPack({
  name: "brand",
  prefix: "brand-",
  catalog: CATALOG,
  families: {
    "brand-blob": "6b264cee09e5e854",
    "brand-checklist": "50fc184a26041eb5",
    "brand-color": "1df7f252c168d32b",
    "brand-color-picker": "23e5015b15a25284",
    "brand-color-range": "1186ba1b1989b070",
    "brand-color-set": "dd60f532381e69ba",
    "brand-composer": "5c91bd42036df660",
    "brand-flourish": "1779a045779a3765",
    "brand-logo": "8a819b74a10b535b",
    "brand-phone": "1b9f860eea394bdc"
  },
  define: () =>
    Promise.all([
      import("../brand-blob"),
      import("../brand-checklist"),
      import("../brand-color"),
      import("../brand-color-picker"),
      import("../brand-color-range"),
      import("../brand-color-set"),
      import("../brand-composer"),
      import("../brand-flourish"),
      import("../brand-logo"),
      import("../brand-phone")
    ]).then(() => undefined)
})
