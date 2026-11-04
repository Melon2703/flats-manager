# Monthly rent workflow — approved design brief

Status: approved by the founder on 2026-11-03. The founder subsequently authorized implementing Issue #2 against this brief, building on the Issue #8 foundation.

Target: [GitHub Issue #2 — Record rent and see monthly debt](https://github.com/Melon2703/flats-manager/issues/2).

## Job, audience, and outcome

Mode: Operate. One owner manages approximately ten long-term rental apartments on her phone. She needs to identify unpaid rent for a selected rental month and record full or partial receipts with less effort than her notebook.

Use [PRODUCT.md](../../PRODUCT.md), the [approved specification](https://github.com/Melon2703/flats-manager/issues/1), [requirements decisions](../requirements-decisions.md), and [GLOSSARY.md](../../GLOSSARY.md) as product authority. This brief captures the approved design, without changing financial rules. Reported practices come through the founder; independent owner usability remains to be validated.

Success: expected, received, and outstanding rent and due status are visible without opening every apartment; an ordinary full receipt needs two taps and no typing when suggested values are correct. Both dated entries remain visible after two partial receipts. Saved records survive reopening, and repeated confirmation does not duplicate a receipt.

## Selected direction

A quiet monthly rent ledger: familiar apartment names, aligned amounts, and receipt entry directly beside the record it changes. Extend the existing shell's pale background, dark text, and deep teal accent. Avoid generic SaaS dashboard composition, including decorative metric cards and chart-led hierarchy.

Use one continuous apartment list with fine separators, generous spacing within each record, minimal shadows, and little decoration. The focal information is outstanding rent; the primary action is recording money actually received.

## Monthly overview

- The selected month is the main heading. Previous/next controls enable quick browsing; tapping the month opens a month/year picker.
- A compact sticky header retains the selected month while scrolling. Show the language controls visibly and identify the reporting context as rent for the selected rental month in USD.
- Each apartment shows its recognizable name, due date, payment state, and three labeled amounts: expected, received, and outstanding rent. Outstanding rent receives the strongest emphasis.
- Keep apartment order stable after saving a receipt so the owner does not lose her place.
- Payment completeness and overdue status are separate. A partly paid apartment can also be overdue. Paid records keep their amounts and history accessible with quieter emphasis.
- Place “Add apartment” after the list. The first-use empty state makes it the clear primary action.

Illustrative mobile composition with synthetic data:

```text
Управление арендой          Русский · English

‹              Ноябрь 2026              ›
Аренда за выбранный месяц · USD

Квартира у парка
Частично оплачено · Просрочено
Срок оплаты: 1 ноября

Начислено          Получено          Осталось
1 200 $              600 $             600 $

[ Записать получение ]       Поступления (1)
──────────────────────────────────────────
Квартира на набережной
Срок оплаты: 10 ноября

Начислено          Получено          Осталось
  900 $                0 $             900 $

[ Записать получение ]
──────────────────────────────────────────
Квартира в центре
Оплачено · Срок оплаты: 1 ноября

Начислено          Получено          Осталось
1 000 $            1 000 $               0 $

Поступления (1)

                    + Добавить квартиру
```

## Receipt entry and history

“Записать получение / Record receipt” expands a compact form directly beneath the apartment's amounts. Retain the surrounding record and the owner's place in the list.

- Show the inherited apartment and rental month clearly.
- Prefill the amount with outstanding rent and the actual receipt date with today. Both remain editable.
- Do not automatically focus the amount field and summon the mobile keyboard. Tapping it selects the suggested amount for quick replacement.
- Reveal the optional note through “Добавить примечание / Add note.”
- Provide “Save receipt” and “Cancel.” Opening or editing the form never records money.
- Preview the resulting outstanding rent. Against 1,200 due, entering 600 shows “Останется к оплате: 600 $ / Remaining rent: $600.”
- Open only one entry form at a time. Preserve unfinished input until it is saved or explicitly discarded.

A normal full receipt takes two taps: open the form, then save. After confirmed persistence, close the form, update the row, retain its position, and briefly show success feedback.

“Поступления / Receipts” expands a dated list beneath the apartment. Against 1,200 due, two receipts of 600 produce 1,200 received and zero outstanding; both dated entries remain individually visible.

## Apartment setup

Use a short form for a recognizable name, monthly rent in USD, and regular due day. No lease wizard or mandatory tenant details. Saving returns to the monthly overview with the apartment visible.

## Visual system and responsiveness

- Typography: one system sans-serif family with Cyrillic support. Approximate hierarchy: 28px month heading, 18px apartment names, 16px controls, and 14px supporting labels. Use aligned, tabular numerals for financial figures.
- Reading order: apartment identity, amounts, then action. Outstanding amounts are bold; supporting information stays legible.
- Color: near-white background, dark navy text, deep teal for primary actions. Overdue rent uses restrained brick-red text and an explicit status label.
- Structure: fine rules between records, generous internal spacing, minimal shadows and decoration.
- On narrow phones, keep the three labeled amounts across the record when they fit. Stack them when enlarged text requires it. At wider sizes, align the same information into ledger columns.
- Touch targets are at least 44px. Provide visible keyboard focus, labeled fields, announced save feedback, and textual status rather than color alone.

## Localization

Russian is the initial default. Support complete Russian and English layouts, validation messages, and accessible labels through the existing shared dictionary approach. Keep a visible, accessible language switch and remember the browser preference.

Allow translated controls to wrap rather than truncate. Format dates and numbers for the selected language while preserving underlying actual dates, assigned rental months, USD currency, financial values, apartment names, and notes.

## Material states

- Saving: indicate progress on the save button and prevent repeated submission. Show success only after persistence is confirmed.
- Save failure: retain entered values and provide an inline retry message. Reconcile an uncertain submission result before retrying so one receipt is not recorded twice.
- No apartments: explain the first step briefly and offer “Добавить квартиру / Add apartment.”
- No receipts: “Поступлений пока нет / No receipts yet.”
- Month loading: show labeled placeholders rather than temporary zero balances.
- Fully paid: show “Оплачено / Paid” and retain access to receipt history.

## Scope and implementation boundaries

Use the existing Next.js App Router, TypeScript, Tailwind CSS, and bilingual foundation. Persistent data/authentication follow the approved Supabase direction; do not introduce another backend or redesign the stack. This is a planning artifact, not application code or a direction contract.

Issue #2 includes apartment setup, month selection, expected/received/outstanding rent and due status, full and partial receipts, persistence, duplicate-submission protection, and mobile-browser acceptance checks using synthetic data.

Expenses, family shares, entry corrections, advances, cross-month scenarios, and monthly rent exceptions belong to later slices. Do not add placeholder controls for these features to this slice. No document uploads, notifications, charts, or separate dashboard/finance navigation are included.

Keep obligations distinct from receipts and assigned rental months distinct from actual receipt dates. Financial summaries describe the selected rental month rather than calendar-month cash movement. Preserve exact money arithmetic and all existing product rules.

Unresolved deposit, advance, allocation rounding, negative-share, and exceptional-allocation behavior remains unresolved. This brief establishes no new financial rules. Use synthetic trial data; authentication, data protection, durable storage, and recovery requirements still apply before real use.

## Verification for a future implementation

Verify the owner-facing mobile flow for adding an apartment, selecting a month, reviewing visible amounts and due status, recording full and partial receipts, retaining separate dated entries, reopening saved records, and preventing duplicate saves. Check both languages, long names, enlarged text, narrow screens, and wider ledger layouts for clipping and readability.

Independent use and improvement over the notebook require an observed owner trial. Design approval and automated checks do not establish that validation.

## Implementation notes

The implementation retains the approved layout and inline entry model. Month changes use document navigation so browser Back/Forward can honor the native unsaved-entry guard. The initial month resolves from the browser's local calendar before obligations load. Uncertain saves keep the original payload and submission identity for safe retry.

Regular due days 1–28 are supported. Handling days 29–31 in short months remains a product decision; no rollover rule has been added. [Validation and review evidence](../validation/issue-2.md) records the tested scope and practical limits.
