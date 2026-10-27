import { E } from "spell-ui/core"

import { brandComposerVocabulary } from "./BrandComposer.en"
import { BRAND, DEFAULT_ROWS, ENTER } from "./BrandComposer.types"

/****************
 * ### `BrandComposerFallback`
 * The native fallback of `<brand-composer>`:  what it shows when its component breaks,
 * so the spell is still typed in, cast and submitted with the form.
 *
 * - Its shadow DOM:  a native `<textarea part="textarea">` and a `<button part="cast">Cast spell</button>`,
 *   in the root (`<div class="composer brand" part="composer">`).
 * - Still a form control:  typing sets `domElement.value` and the DOM element's form value and validity
 *   (`required`), and sends a composed `ui-typed`;  leaving the box edited sends `ui-changed`.
 * - Still casts:  the button or Cmd / Ctrl+Enter send a cancelable `brand-cast` (not with blank text),
 *   then submit the form.
 * - Its starting value is the DOM element's `value` PROPERTY, else its attribute.
 * - `readonly`:  the text box's own, as the component's.
 * - Named by `label`, else `eyebrow`, else "Your spell".
 ****************/
export class BrandComposerFallback extends E.NativeFallback<typeof brandComposerVocabulary> {
  @E.proto static vocabulary = brandComposerVocabulary

  @E.proto static degraded = [
    "the card's look, the eyebrow, the tools slot and the hint",
    "`casting` (the button stays a plain button), growing with the text",
    "vetoing by re-setting `value`, form reset of the value"
  ]

  /** The text box, for `sync()` and the handlers. */
  private control?: HTMLTextAreaElement

  protected override build() {
    const domElement = this.domElement as HTMLElement & { value?: unknown }
    const disabled = this.flag("disabled")
    const control = this.create("textarea", {
      rows: this.attr("rows") ?? String(DEFAULT_ROWS),
      placeholder: this.attr("placeholder") ?? "Describe what you want to build…",
      required: this.flag("required"),
      disabled,
      readonly: this.flag("readonly"),
      "aria-label": this.attr("label") || this.attr("eyebrow") || "Your spell"
    })
    this.decorate(control, "textarea")
    control.value = typeof domElement.value === "string" ? domElement.value : (this.attr("value") ?? "")
    const button = this.create("button", { type: "button", disabled }, "Cast spell")
    this.decorate(button, "cast")
    this.listen(control, "input", (event) => {
      domElement.value = control.value
      this.sync()
      this.announce("ui-typed", event)
    })
    this.listen(control, "change", (event) => this.announce("ui-changed", event))
    this.listen<KeyboardEvent>(control, "keydown", (event) => {
      if (event.key !== ENTER || !(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      this.cast(event)
    })
    this.listen(button, "click", (event) => this.cast(event))
    this.control = control
    return [this.create("div", { class: this.classes(BRAND), part: "composer" }, control, button)]
  }

  /** Cast:  `brand-cast` (cancelable), then the form's submit;  never with blank text. */
  private cast(originalEvent: Event) {
    const value = this.control!.value
    if (!value.trim()) return
    if (this.send("brand-cast", { value, originalEvent })) this.form()?.requestSubmit()
  }

  /** Send event `name`, with the text. */
  private announce(name: E.EventName<typeof brandComposerVocabulary>, originalEvent: Event) {
    this.send(name, { value: this.control!.value, originalEvent })
  }

  /** The text, and the text box's validity (`required`). */
  protected override sync() {
    const { control } = this
    if (control) this.syncForm({ value: control.value, control })
  }
}
