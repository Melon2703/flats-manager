# Rental Manager — Product Brief v0.1

**Document type:** Product Context / Initial Requirements  
**Status:** First working iteration — product concept  
**Audience:** AI coding agent and technical founder  
**Application UI language:** Russian  
**Primary priorities:** Simplicity, real user value, financial accuracy, and minimal manual effort.

---

## 1. Product Vision

Rental Manager is a simple, mobile-first application for individuals who independently manage a small portfolio of long-term residential rental properties.

It helps property owners track rent payments, maintain financial records, distribute rental income, store property information, and understand what requires their attention.

**Core value proposition:**

> Keep rental properties, payments, and finances organized in one simple place — without paper notebooks or complicated spreadsheets.

The first iteration is designed for one real user, not as a generic Property Management System (PMS).

### Product Principles

1. **Simplicity over feature count.** No accounting expertise or complex workflows should be required.
2. **Minimal manual work.** Frequent operations should take as few actions as possible.
3. **Transparency.** Users must understand how every financial amount was calculated.
4. **User control.** Financial records can be reviewed and corrected without losing their history.
5. **Real workflows over assumptions.** Features must address observed user behavior rather than hypothetical AI capabilities.
6. **Avoid premature B2B complexity.** Future reusability is desirable, but it must not increase the scope of the first iteration.

---

## 2. Primary User

### User Profile

The initial user is a woman who independently manages approximately 10 long-term rental apartments.

She owns all the properties herself. This is her personal investment portfolio, not a portfolio managed on behalf of external property owners.

She handles rent collection tracking, tenants, documents, certain expenses, and internal family income allocation.

### Current Workflow

- Each apartment has a dedicated section in a paper notebook.
- The notebook records dates, payment amounts, and income distribution.
- Physical documents are stored in folders.
- Tenant and agent communications happen through messaging apps.
- Rent due dates need to be monitored manually.
- Tenants sometimes require payment reminders.
- Payments involve bank transfers, cash, and occasional manual banking operations.
- Certain apartments have individual financial arrangements, deductions, or exceptions.

### Confirmed User Needs

- Know who is expected to pay and when.
- Track upcoming and overdue rent payments.
- Record actual payments received.
- Calculate and record income allocation between family members.
- Track expenses and nonstandard financial arrangements.
- Keep essential property information and documents in one place.

### Important Constraint

The user is not experiencing severe operational chaos. Her existing paper-based workflow generally works.

The application therefore needs to be **meaningfully easier than the notebook**.

If recording a payment digitally takes more effort than writing a line on paper, the product will likely fail to deliver value.

---

## 3. Core Job-to-be-Done

**When I manage several rented apartments, I want to quickly understand which payments are expected, which payments have been received, how the money should be distributed, and what needs my attention, so I don't have to remember everything or manually review my notes.**

### Primary User Journey

1. Open the application.
2. See upcoming and overdue rent payments.
3. Select an expected payment.
4. Confirm the amount actually received.
5. Review the automatically calculated family income allocation.
6. Adjust the allocation if necessary.
7. Save the transaction.

Recording a regular monthly payment should require minimal user interaction.

---

## 4. First Iteration Scope

### P0 — Must Have

### 4.1. Properties

A list of all apartments with individual property detail pages.

Each property should contain:

- Name or unit identifier.
- Address.
- Status: occupied / vacant.
- Current tenant and contact details.
- Monthly rent amount and currency.
- Regular rent due date.
- Lease start and end dates.
- Security deposit and prepaid rent, where applicable.
- Notes about individual terms or arrangements.

Historical tenants and leases must remain accessible when tenants change.

### 4.2. Rent Obligations

The application automatically generates expected monthly rent obligations based on active lease terms.

Each obligation contains:

- Property.
- Rental period.
- Due date.
- Expected amount and currency.
- Total amount received.
- Outstanding balance.
- Payment status.

**Statuses:**

- Upcoming / Awaiting Payment.
- Partially Paid.
- Paid.
- Overdue.

Required behavior:

- Full payments.
- Partial payments.
- Multiple receipts against one rent obligation.
- One-time adjustments to rent amounts.
- Separation between rental period and actual payment date.
- Correct handling of prepaid rent and final-month payments without double-counting.

**Critical rule:** An expected payment is not the same as money actually received.

### 4.3. Payment Recording

Users manually confirm received payments.

Minimum required inputs:

- Amount received.
- Actual receipt date.
- Payment method: bank transfer / cash / other.
- Optional note.

Known values should be prefilled wherever possible.

No banking integrations are required in the first iteration.

### 4.4. Financial Records and Expenses

For each property, users can:

- View rent receipts.
- Record expenses.
- Specify expense date, amount, category, and optional notes.
- Indicate whether an expense affects family income allocation.
- Correct records while preserving a history of meaningful changes.

**Initial expense categories:**

- Repairs.
- Cleaning.
- Utilities.
- Other.

The application displays financial summaries based on recorded transactions. These summaries must not be presented as verified bank balances.

### 4.5. Family Income Allocation

This is an essential part of the actual user's current workflow.

Her notebook contains records similar to the following:

| Date | Income | Family Share 1 | Pavel | Anya |
|---|---:|---:|---:|---:|
| Mar 24 | 1,500 | 450 | 450 | 600 |
| Apr 25 | 945 | 290 | 290 | 365 |
| May 24 | 1,000 | 300 | 300 | 400 |

These examples come from the actual notebook. The currency and exact meaning of certain entries still need clarification.

Required behavior:

- Configurable default allocation rules per property.
- Automatic preliminary allocation calculations.
- Manual overrides for individual allocations.
- Support for deductions and exceptional adjustments.
- Optional explanation for nonstandard calculations.
- Validation that allocation totals match the distributable amount.
- Clear distinction between calculated shares and money actually transferred to family members.

**Do not assume** allocation is always 30% / 30% / 40%.

The example involving 945 and a cleaning expense of 55 must be clarified with the user before finalizing the calculation rules.

We must also confirm whether notebook amounts represent money already distributed or amounts merely owed to family members.

### 4.6. Dashboard

The dashboard should immediately display:

- Rent payments due soon.
- Overdue payments.
- Partially paid obligations.
- Total rent received during the current month.
- Total outstanding rent.
- Quick access to individual properties.

The dashboard should answer one question:

**"What needs my attention right now?"**

No complex analytics dashboard is necessary.

### 4.7. Basic Documents

Users should be able to attach and access:

- Lease agreements.
- Cadastral/property registration documents.
- Other files or photographs.

Files should be associated with the relevant property or lease.

A full document management system is not required.

---

## 5. P1 — Future Enhancements

These features are explicitly excluded from the initial working iteration unless real usage demonstrates an immediate need.

- Full calendar interface.
- Telegram or push notifications.
- Tenant reminder message templates.
- Detailed utility tracking.
- Maintenance and repair history.
- Advanced financial analytics.
- CSV/Excel export.
- More detailed tracking of actual family payouts.
- Preparation of records for tax reporting.

### Out of Scope

- AI assistant.
- Automated tenant communications.
- Bank integrations.
- Payment processing or money transfers.
- Full accounting functionality.
- Automatic tax calculation.
- Realtor CRM.
- Tenant portal.
- Contractor management.
- Professional property management company workflows.
- Complex permissions or employee roles.
- Multi-tenant B2B SaaS infrastructure.
- Product subscriptions and billing.

---

## 6. Primary Screens and Navigation

**Preferred format:** Mobile-first web application.

PWA installation can be considered if it does not meaningfully complicate the initial implementation.

### Home

A concise overview of upcoming payments, overdue rent, received income, and items requiring attention.

### Properties

A list of all apartments.

Each property contains:

- Overview.
- Tenant and lease information.
- Payment history.
- Financial transactions.
- Documents and notes.

### Finances

- Expected rent payments.
- Actual receipts.
- Expenses.
- Family income allocations.
- Monthly summary.

### UX Principle

Preserve the familiar structure of the user's existing notebook:

**Property → Date → Amount → Allocation → Note**

The interface does not need to visually replicate the notebook if a different layout makes the same operation faster and easier.

---

## 7. Core User Flows

### Flow 1 — Regular Monthly Payment

User opens an expected rent payment → confirms full receipt → reviews automatically calculated allocation → saves.

**Success criterion:** No unnecessary re-entry of known information.

### Flow 2 — Partial Payment

Expected: 1,000.

Received: 600.

Outstanding: 400.

Later, another 400 is received.

The outstanding balance becomes zero, and both receipts remain in transaction history.

### Flow 3 — Payment With an Expense

Rent received: 1,000.

Applicable expense: 55.

The application determines the distributable amount based on the configured rule.

The user reviews or adjusts the family allocation.

**The system must not invent an expense allocation rule.**

### Flow 4 — Nonstandard Allocation

Payment received → default allocation calculated → user adjusts individual shares → totals validated → explanation saved.

### Flow 5 — Reviewing Overdue Rent

User opens dashboard → sees outstanding obligations → selects an apartment → reviews tenant details and payment history.

### Flow 6 — Finding Information

User opens a property → finds the relevant lease, tenant contact, notes, or payment records.

---

## 8. Domain Model and Terminology

This section establishes a shared vocabulary for domain modeling.

| Term | Meaning |
|---|---|
| Property | An individual rental apartment |
| Tenant | A person renting a property |
| Lease | The contractual rental arrangement for a particular period |
| Rent Obligation | An expected rent payment for a specified rental period |
| Receipt | A recorded instance of actually receiving money |
| Outstanding Balance | The unpaid portion of an obligation |
| Expense | A recorded cost |
| Allocation | Calculation of how received income should be divided between family members |
| Payout | Actual transfer or delivery of money to an allocation recipient |
| Adjustment | A change to a financial calculation or record |
| Supporting Document | A file associated with a property, lease, expense, or receipt |

### Critical Domain Distinctions

- Rent obligation ≠ actual receipt.
- Rental period ≠ payment receipt date.
- Expense ≠ automatic deduction from distributable income.
- Calculated allocation ≠ actual payout.
- Security deposit ≠ rental income.
- Prepaid rent ≠ additional income every month it covers.

Family income allocations must not be treated as equivalent to professional owner accounting performed by third-party property management companies.

---

## 9. Nonfunctional Requirements

- Comfortable mobile usability.
- Clear Russian-language interface.
- Accurate monetary calculations without floating-point rounding errors.
- Currency explicitly associated with monetary values.
- No implicit aggregation or conversion of different currencies.
- Persistent storage across sessions.
- Ability to correct erroneous records.
- History of meaningful financial changes.
- Private user authentication.
- Protection of documents and personal data.
- Reliable data backup or recovery mechanism.
- No unnecessary transmission of private documents to external AI services.
- No real personal or financial information in public repositories or demo fixtures.

The initial product serves one user.

Complex multi-user permissions and B2B tenancy models are unnecessary.

---

## 10. Acceptance Criteria

The first working iteration is ready for actual use when:

1. All 10 properties can be added and accessed.
2. Each property can have an active lease with rental terms.
3. Expected rent obligations are generated correctly.
4. Full and partial receipts can be recorded.
5. Outstanding balances are calculated accurately.
6. Overdue obligations appear on the dashboard.
7. Expenses can be recorded and their allocation impact understood.
8. Family income allocations can be calculated and manually adjusted.
9. Financial record history remains available.
10. Lease documents can be attached and retrieved.
11. Data persists reliably between sessions.
12. Regular payment recording requires minimal manual input.
13. The application is comfortable to use on a mobile device.

### Required Test Cases

- Regular full rent payment.
- Multiple partial payments.
- Partially paid overdue rent.
- Late full payment.
- One-time rent amount adjustment.
- Expense affecting family allocation.
- Expense not affecting family allocation.
- Manual allocation override.
- Prepayment for the final rental month.
- Tenant change without losing history.
- Fractional monetary amounts.
- Multiple currencies without automatic aggregation.

Critical financial behavior should be covered by automated tests.

---

## 11. Open Questions

Do not invent answers or silently assume business rules.

### Critical Financial Questions

1. How exactly are family allocations calculated, including the 945 payment and 55 cleaning expense?
2. Do the notebook entries represent amounts owed or money already distributed?
3. How are security deposits, advance payments, and final-month rent handled?
4. Which currencies and payment methods are actually used?
5. Under what conditions do expenses reduce the distributable amount?

### Lower-Priority Questions

- Are external notifications needed immediately?
- What property naming convention is most intuitive?
- Which documents should be migrated first?
- Is separate payout history necessary in v0.1?
- What monthly summary format is most familiar to the user?

Do not block all development on lower-priority details. Critical financial rules must be clarified before implementation.

---

## 12. Product Validation

This is a product for a real user, not a portfolio demo or proof of technical capability.

Observe:

- Does she actually use the application instead of the notebook?
- Can she complete daily tasks independently?
- How long does a normal payment entry take?
- Which actions require repeated manual input?
- Which calculations does she still verify on paper?
- Which features remain unused?
- Where is the digital workflow worse than the existing process?

The primary success indicator is **consistent real-world use without needing the paper notebook for core financial operations**.

Evaluate the product after two complete rent collection cycles.

---

## 13. Strategic Context — Not Implementation Scope

The founder is considering three potential long-term business directions.

### A. B2C Rental Management

A simple tool for independent owners managing small residential rental portfolios, including those managing properties remotely.

### B. B2B Property Operations

Specialized software or managed operational services for professional property management companies.

### C. AI-native Property Management

A potential technology-enabled property management company, gradually automating recurring operational processes.

These remain separate business hypotheses.

The first iteration must not introduce enterprise capabilities, AI agents, or infrastructure intended for a hypothetical future property management company.

Shared domain concepts and reusable implementation patterns are welcome where they naturally arise.

**The initial user's actual needs always take priority over speculative B2B requirements.**

---

## 14. Instructions for the AI Coding Agent

This document is the initial product context, not the final implementation specification.

Use the installed Matt Pocock skills according to their actual instructions and availability.

### Suggested Workflow

**Step 1 — Repository Familiarization**

Inspect the existing repository, development environment, and previously established decisions.

Do not replace the chosen tech stack without a concrete reason.

If necessary and available, use `/setup-matt-pocock-skills` to establish the repository's working conventions.

**Step 2 — Requirements Clarification**

Use `/grill-with-docs` to clarify ambiguous product requirements, particularly financial calculations and user flows.

Maintain a shared domain glossary (`GLOSSARY.md`) where useful.

Record meaningful architectural decisions in ADRs when necessary.

Ask questions that materially affect product behavior. Avoid overanalyzing low-impact implementation details.

**Step 3 — Focused Prototyping**

When appropriate, use the available prototyping skill to validate a disputed interaction or calculation.

Keep disposable experiments separate from production code unless explicitly approved.

**Step 4 — Implementation Specification**

After requirements are clarified, use `/to-spec` to translate this brief into an implementation-ready specification grounded in the actual repository.

**Step 5 — Vertical Task Breakdown**

Use `/to-tickets` to split work into small, independently verifiable vertical slices.

**Preferred first end-to-end slice:**

Create property → configure lease → generate rent obligation → record receipt → calculate family allocation → view the result.

Additional functionality can then be introduced incrementally.

**Step 6 — Implementation and Verification**

Use `/implement` and any relevant testing or code review skills.

Prioritize externally observable product behavior and financial correctness over internal implementation complexity.

### Do Not Do Without Approval

- Expand scope into B2B.
- Add AI simply because it is available.
- Introduce heavy architecture for hypothetical future scale.
- Add unnecessary abstractions or frameworks.
- Invent financial business rules.
- Assume a visually polished interface is functionally correct.
- Execute real financial transactions.

### Expected Outcome of the Next Session

Before building the full application:

1. Resolve critical financial ambiguities.
2. Validate the minimum user journey.
3. Establish a shared domain vocabulary.
4. Agree on the simplest implementation using the existing environment.
5. Produce an implementation specification and small, testable tasks.

**Overall priority: build a simple, accurate, reliable application that a real person can use independently.**
