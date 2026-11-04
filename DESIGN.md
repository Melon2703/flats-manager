---
name: Rental Manager
description: A quiet, bilingual monthly rent ledger.
colors:
  ground: "#f6f7f9"
  surface: "#ffffff"
  ink: "#172033"
  muted: "#526174"
  rule: "#d3dbe3"
  teal: "#115e59"
  teal-hover: "#0c4945"
  teal-wash: "#eaf2f1"
  danger: "#a33128"
  field-border: "#8797a8"
  secondary-border: "#9aaab7"
  selection: "#c5e3de"
  loading: "#e4e9ed"
typography:
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "1.75rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.4
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "1rem"
    lineHeight: 1.5
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  control: "8px"
spacing:
  micro: "4px"
  small: "8px"
  compact: "12px"
  medium: "16px"
  field: "20px"
  section: "24px"
  record: "28px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.teal-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.teal}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.teal}"
    rounded: "{rounded.control}"
    padding: "10px 8px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    width: "100%"
  entry-form:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "24px"
---

# Design System: Rental Manager

## Overview

**Creative North Star: "A quiet monthly rent ledger"**

A quiet monthly rent ledger: familiar apartment names, aligned amounts, and receipt entry beside the record it changes. The approved direction extends the existing pale ground, dark text, and deep teal accent with generous internal spacing and fine separators.

System typography supports Russian and English. Financial meaning supplies the hierarchy: outstanding rent is bold, supporting labels remain readable, and status includes words as well as color.

**Key Characteristics:**
- One continuous ledger with fine separators.
- Deep teal actions and restrained brick-red overdue text.
- Inline entry, tabular amounts, and wrapping bilingual controls.

## Colors

The palette is pale and neutral, with one deep teal action accent and a restrained semantic danger color. Frontmatter values are normative; names below describe their use.

### Primary

- **Deep teal** (`teal`): primary actions, paid status, save feedback, caret, and keyboard focus. `teal-hover` deepens primary buttons; `teal-wash` marks quiet hover and selected language states.

### Neutral

- **Pale ground** (`ground`) and **white surface** (`surface`): page and inline form backgrounds.
- **Navy ink** (`ink`) and **slate supporting text** (`muted`): primary content and secondary labels.
- **Fine rule** (`rule`): record, header, and history separators. `field-border` and `secondary-border` define inputs and outlined actions.
- **Selection wash** (`selection`) and **loading grey** (`loading`): selected text and loading placeholders.

Brick red (`danger`) is semantic: overdue text and inline errors. It is not a second decorative accent.

## Typography

Use the frontmatter system sans-serif stack throughout, including Cyrillic. There is no display or monospace family.

- **Headline:** selected month and access heading; reduces to (1.5rem) at the small-phone breakpoint.
- **Title:** apartment names; wrap long names anywhere. The smaller app identity uses the same size/weight with tighter tracking (-0.02em).
- **Body:** content, controls, and mobile amounts. Desktop amounts grow to (1.125rem).
- **Label:** field labels are semibold; supporting labels, dates, context, and history use the same size at normal weight.
- **Financial emphasis:** outstanding amounts use weight (700). Amounts and remaining-rent previews use tabular numerals. Errors and remaining previews use (0.9375rem).

Rem-based sizing follows browser text settings. Do not fix the root font size.

## Layout

Center the shell at a maximum width of (1120px), with side padding (24px), reducing to (20px) at widths up to (420px). The continuous list uses record padding (28px) and internal gaps (20px); actions wrap naturally. The month header sticks to the top on the page ground, with a fine bottom separator and no shadow. Its controls occupy at most (440px).

From (900px), each record aligns identity and amounts into columns: `minmax(200px, 1fr) minmax(370px, 1.5fr)`, with a (40px) gutter; actions sit under the amounts. Below that, identity precedes amounts and actions.

Amounts auto-fit columns with a minimum of (7rem), bounded by available width, so enlarged text can reduce the column count. At widths up to (359px), amounts and two-column forms stack; the month title occupies its own first row with previous/next controls beneath it. Below (900px), unusually large expected amounts (at least 1,000,000 USD) explicitly stack the amount groups. Keep numeric values unbroken while allowing labels to wrap.

Forms use a (20px) gap and white inset surface, with (24px) padding, reducing to (20px 16px) on small phones. Two-field rows use a (1.4fr 1fr) ratio and (16px) gap. Apartment forms are capped at (560px), receipt forms/history at (680px), access at (420px), and empty-state copy at (480px).

## Elevation & Depth

No shadows or motion transitions are defined. Fine rules and white form surfaces establish structure on the pale ground. The sticky month header uses stacking order (10) for function, without decorative lift.

## Shapes

Controls, inputs, inline forms, and loading placeholders share gently rounded corners via the single radius token. Ledger records remain open sections separated by thin rules; they are not individual cards.

## Components

### Buttons

Solid teal primary actions, outlined secondary actions, and quiet teal text actions share semibold text, generous padding, and a minimum height of (44px). Icon buttons occupy (44px) width and use (20px) inline chevrons. Secondary, text, and icon buttons receive the teal wash on hover; primary buttons deepen. Keyboard focus uses a (2px) teal outline offset by (4px). Disabled buttons use opacity (0.55).

### Inputs / Fields

White fields have a (1px) field-border stroke, minimum height (48px), and visible labels above them. Textareas resize vertically. Inputs retain the shared focus outline; errors appear as adjacent brick-red text. Saving/uncertain submission states disable the relevant fields and preserve the entry context.

### Navigation

The selected month is the largest heading and a button opening the native month input. Keep previous/next chevrons labeled for assistive technology. The visible Russian/English switch wraps; the selected language has a teal wash and weight (650). Narrow-screen month rearrangement follows Layout.

### Cards / Containers

White surfaces identify inline entry and access forms. Do not turn the apartment list into a card grid. Receipt history uses fine top separators, dates and notes on the left, and bold tabular amounts on the right.

### Monthly ledger and receipt entry

Each record reads as identity/status/due date, then expected/received/outstanding amounts, then actions. Paid status is teal and overdue status brick red, both with explicit text. Receipt entry expands beneath the apartment across both desktop columns; its heading receives focus without automatically opening the amount keyboard. The form retains apartment/month context, an optional note, remaining-rent preview, primary save, and quiet cancel. Save feedback appears inline in teal and is announced; loading uses labeled placeholders instead of zero balances.

## Do's and Don'ts

### Do:

- **Do** keep outstanding rent bold and amounts tabular.
- **Do** retain explicit status text and visible keyboard focus.
- **Do** let translated controls and apartment names wrap.
- **Do** keep receipt entry beside its apartment and preserve the selected rental month context.

### Don't:

- **Don't** replace the continuous ledger with decorative metric cards or chart-led hierarchy.
- **Don't** use color as the only payment or overdue indicator.
- **Don't** truncate translated controls or force three amount columns when they no longer fit.
