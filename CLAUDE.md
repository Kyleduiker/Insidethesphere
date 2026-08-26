# Inside The Sphere

Luxury real estate platform for SE Calgary agents. Built and maintained by Kyle Duiker,
Broker Associate at Royal LePage Solutions (Duiker Properties brand).

Live at insidethesphere.com via GitHub Pages.

---

## Strategic positioning

This product is a **presentation layer**, not a data product. Agents supply their own
data; the value is in the workflow and the vessel.

This framing matters for compliance: Alberta's harmonized MLS Rules prohibit populating
third-party databases with MLS data. Because agents upload their own Matrix exports and
the platform never ingests or redistributes a feed, the product stays clean. Do not
propose features that would pull, cache, or redistribute MLS data automatically.

Ruled out already: the DDF feed (active listings only, no solds since 2018 — useless
for CMA comps).

---

## Tech stack — locked

- **Vanilla HTML / CSS / JS.** No frameworks. React was tried and abandoned. Do not
  reintroduce it, do not suggest a build step, do not add a bundler.
- **Firebase** v9 compat SDK — Auth, Firestore, Storage. Project: `inside-the-sphere`, Blaze plan.
- **PDF.js** for parsing — `pdfjs-dist@3.4.120`, with `workerSrc=''` to avoid CORS
  issues with web workers. This is deliberate; don't "fix" it.
- **GitHub Pages** hosting, deploys on push to main.
- **Stripe** planned for the paywall but not built. The `plan` field is scaffolded in Firestore.

---

## Design system — locked

### Platform UI palette (2026 Luxury)

| Token       | Hex       | Usage                     |
|-------------|-----------|---------------------------|
| Obsidian    | `#0F0F0F` | Primary dark              |
| Espresso    | `#2C2420` | Hero backgrounds          |
| Warm Stone  | `#8C8479` | Secondary text            |
| Parchment   | `#EDE8E0` | Alternate sections        |
| Ivory       | `#F7F4EF` | Page background           |
| Border      | `#D9D3CB` | All borders               |
| Champagne   | `#C9A96E` | Gold accents, prices      |
| Copper      | `#A0714F` | Primary platform accent   |
| Deep Sage   | `#4A5C4E` | Sparingly                 |
| Oxblood     | `#6B2737` | Rare accent only          |

### Royal LePage red

`#E31837` — **client-facing CMA pages only.** Never in platform UI. This separation is
strict: the platform is its own brand, not a Royal LePage product.

### Typography

- **Cormorant Garamond** — serif, display and headings
- **Inter** — sans, body and UI

### Rules

- `border-radius: 2px` everywhere. Never rounded corners.
- Every section title gets a Copper eyebrow label above it plus a 40px accent line.
- Client page sections use 80px vertical padding.
- Sidebar is 220px fixed left, with identical CSS on every platform page.

### Aesthetic direction

Warm, editorial, high-end. If something reads as generic SaaS — bright blues, rounded
cards, drop shadows, emoji in UI copy, cheerful microcopy — it's wrong. Push back rather
than shipping it.

---

## Architecture

### Firestore

```
users/{uid}                              profile, plan, profileComplete
users/{uid}/cmas/{cmaId}                 slug, clientPassword, propPhotoUrl,
                                         presentationType, commission settings
users/{uid}/cmas/{cmaId}/comps/{compId}  address, community, status, price, listPrice,
                                         beds, baths, sqft, dom, year, garage,
                                         photoUrl, notes
users/{uid}/clients/{clientId}           client profiles
public_cmas/{slug}                       public mirror for the client-facing page
```

`clients` is a **sibling** of `cmas`, deliberately flat — not nested under a CMA. Nesting
would break existing CMA paths and published slugs.

### Repo layout

Tools live at repo root: `cma/`, `clients/`, `process-hub/`, `social/`.
`smarttools/` is the dashboard only.

### Shared JS

- `js/firebase-config.js` — Firebase init
- `js/profile.js` — shared profile loader. Exposes `window.sphereProfile`, fires a
  `sphereProfileReady` event, auto-populates elements with `data-sphere` attributes.
- `js/header.js` — shared sidebar nav
- `js/market-import.js` — CREB 360 workbook parser, the thin-data display contract,
  and the Firestore document builders. Exposes `window.SphereMarketImport`.
  Requires SheetJS (`xlsx`) to be loaded first.
- `js/city-stats-import.js` — City of Calgary Monthly Statistics Package parser
  (pages 5 and 6). Exposes `window.SphereCityStats`. Requires PDF.js.

**Rule:** every platform page includes `header.js` after `firebase-config.js` and sets
`window.sphereActivePage`. `profile.js` is loaded only by pages that consume profile
data — **currently none**; `header.js` reads Firestore itself for the sidebar footer.
`market-import.js` and `city-stats-import.js` are loaded **only by the pages that
import market data** — `market-data/index.html` and `cma/edit.html` — not by every
platform page. Both are pure data modules: they read no page state, take `uid`, `meta`
and `sourceFile` as arguments, and touch only the `db` and `firebase` app globals.
**Client-facing pages do NOT use `header.js`.**

`header.js` migration is **complete** as of Aug 21, 2026. `js/header.js` is the single
source of truth for platform nav — edit `navItems` there and every page follows on the
next deploy. No baked-in sidebars remain.

Migrating any new page takes five edits: add `sphereActivePage` and the `header.js`
include, swap the `<nav class="sidebar">` for `<div id="sphere-header">`, delete the
`.sidebar` / `.sb-*` CSS, drop `.sidebar{display:none}` from the 900px media query, and
remove the JS that writes to `sb-name` / `sb-role` / `sb-initials`. Keep the page's own
`.main{margin-left:220px}` — `header.js` does not supply it. And delete any
`getElementById('sidebar').style.display` line: the injected element is
`#sphere-sidebar`, so that returns `null` and throws.

---

## Device targets

- **Backend / agent pages** (`cma/edit.html`, `smarttools/`, `clients/`, `social/`) —
  desktop only. Kyle builds on desktop and laptop. No responsive work needed. Dense,
  information-heavy layouts are fine and preferred.
- **Client-facing pages** (`cma/client/index.html`, presentation views) — must be
  flawless on iPad in portrait. Touch targets, no hover-dependent interactions,
  readable at arm's length. These get presented live in front of sellers.

---

## Working conventions

- **One step at a time.** Kyle signals when he's ready for the next one. Don't batch
  multiple unrelated changes into a single pass.
- **Always give explicit numbered steps.** Kyle is self-taught and deploying to a live
  site, so ambiguity is expensive. One action per step. State what he should see after
  each step so he can tell success from a silent no-op. Give an explicit stop point
  rather than a long unbroken list. Never hand him a paragraph of prose for something
  he has to execute.
- **Surface errors visibly.** Silent failures are the recurring bug pattern in this
  codebase — functions called but never defined, wrong CSS class names, wrong element
  types, Firestore rejecting sentinel values inside arrays. Never wrap something in a
  try/catch that swallows the error. Log it, or render it on the page.
- **Rate pages before shipping.** Target 9/10 for client-facing, 8/10 for backend.
  Be honest about the number and say what's holding it back.
- **Hard refresh after deploy** — Cmd+Shift+R — to bypass GitHub Pages caching.
- **Nothing brokerage-specific in the presentation layer.** The platform is sold to
  agents at other brokerages, so brokerage details must be agent-editable, never
  hardcoded to Royal LePage. A "My Brokerage" profile section is planned for exactly
  this. Charitable affiliation — the Shelter Foundation block on the client page — is
  a **toggle, not an assumption**. The one deliberate exception stays the Royal
  LePage red on client-facing CMA pages, which is Kyle's own brand expression.

## Local development workflow

Established Aug 20, 2026. Every change follows this loop:

1. **Edit locally** in `C:\Users\KyleDuiker\Documents\GitHub\Insidethesphere`.
2. **Test on localhost.** In a separate PowerShell window, from the repo root:
   `python -m http.server 8000`, then open `http://localhost:8000/login.html`.
   Leave that window open; closing it stops the server.
3. **Commit** — Claude Code does this automatically. See Git workflow below.
4. **Push** — Kyle only, and only after the change has been tested on localhost.
5. **Verify live** at insidethesphere.com after the Pages build goes green
   (~40–60s), with a hard refresh.

Two things that bite:

- **Never open pages via `file://`.** Firebase Auth rejects that origin, so you get
  a sign-in failure that has nothing to do with your code. Always use localhost.
- **Commit is local; push publishes.** GitHub Pages does not rebuild until commits
  reach `origin/main`. Check GitHub Desktop's top bar — a numbered "Push origin"
  badge means the change is still only on this machine. This step gets forgotten
  more than any other. When Kyle reports something as fixed, confirm it was pushed.

Test PDFs live in `test-pdfs/`, which is gitignored. **Keep it that way** — the repo
is public, and Matrix exports contain real client data: addresses, prices, LINC
numbers, tax amounts.

---

## Git workflow

Established Aug 21, 2026.

### Commit — automatic

- **Commit after each discrete change, without being asked.** Don't wait for Kyle to
  request it. Use a conventional-commit subject line: `fix:`, `feat:`, `refactor:`,
  `docs:`.
- **One commit per page or file** during any multi-page pass — a migration, a rename,
  a palette change. Never batch unrelated changes into a single commit. The point of a
  commit is that it's a revertible unit; batching destroys that.
- **Report the short hash and subject** after committing, so there's a revert handle if
  the change turns out to be wrong.

### Push — never automatic

**Never run `git push`.** Not as a convenience, not as the second half of "commit and
push," not because the change looks obviously safe. Kyle pushes, or explicitly says
"push."

This repo deploys to a live site on every push to `main`. Commit is local and
reversible; push is public in practice.

The sequence is always: commit → Kyle tests on localhost → Kyle says push.

### What is actually at risk on a push

Recorded Aug 21, 2026, because the rule above was being justified by a broader fear
than the facts support.

`insidethesphere.com` is live but **has no users other than Kyle**. There is no
audience to break. Pushing a half-finished backend page costs nothing.

- **Backend / agent pages** — `smarttools/`, `cma/edit.html`, `clients/`, `social/`,
  `market-data/`, `newsletter/`, `profile.html`. Pushing these mid-build is fine.
  Nobody but Kyle will ever load them, and a broken state is visible only to him.
- **Client-facing pages** — `cma/client/index.html` and any presentation view a
  seller sees. This is where the caution belongs, and it is not about the general
  public: a published CMA link sits in a real seller's inbox, and they may open it
  at any moment, including during or right after a listing appointment. A broken or
  wrong-looking client page is a credibility problem in front of the one audience
  that matters.

So the risk is concentrated, not diffuse. Treat a client-page change as the thing
that needs testing before it ships; treat backend pages as cheap to iterate on.

**This does not relax the push rule itself.** Claude still never runs `git push`
without being told — that is about who decides, not about how risky the change is.

### Session start

**Run `git status` before starting work** and report anything uncommitted or unpushed
from a previous session. Kyle works across sessions and machines; stale local state is
easy to build on top of by accident, and finding out three days later is expensive.

---

## Domain notes

- **MLS:** Matrix (Pillar 9 / CREB). **CRM:** BoldTrail.
- **PDF parsing target format:** Matrix **"Client Full"** reports. These include both
  list price and sale price on solds, and carry no competitor branding. Not Agent Full,
  not Agent Summary.
- **Market data:** CREB community "360" reports (e.g. Cranston 360) rather than
  city-wide stats. Community-level benchmarks are the differentiator — no competitor
  (Cloud CMA, RealScout, Percy.ai, BoldTrail Present, Moxi Present, Highnote) integrates them.
- **Thin data must be flagged.** Example: the Cranston semi-detached benchmark of
  $495,600 rests on a single sale. Any benchmark drawn from a handful of transactions
  gets flagged in the review UI rather than quoted as fact. Getting caught quoting a
  one-sale benchmark in front of a client is a credibility problem.
- **Target communities:** Mahogany, Auburn Bay, Seton, Cranston, Legacy, Chestermere.
  Chestermere is a **separate city** from Calgary and has no quadrant in its addresses —
  a frequent source of parser bugs.
- **Caption engine** in Social Studio is a deterministic template system, not an AI API
  call. This is deliberate: the site is static, so an API key would be exposed client-side.

### Commission structure

Tiered: 7% on the first $100,000, 3% on the balance, GST on top.
Stored as `commissionType: tiered`, `commTier1: 7`, `commTier2: 3`, `commCap: 100000`.

---

## CMA presentation architecture

Design spec from a planning session, Aug 24 2026. **Nothing here is built unless
marked BUILT.** This is the target shape of the client-facing CMA, not a
description of the current page.

### Section order — client page, in scroll order

```
Gate · Cover · Roadmap · Market Overview · Comparable Sales · Reasoning ·
Pricing Strategy · Net Sheet · What Happens Next · Your Agent ·
About My Brokerage · Client Reviews · CTA Footer · Preferred Suppliers (Nov)
```

### Gate

Property photo behind, dimmed. Address. "Private market evaluation". Prepared
exclusively for [name]. Password field. One line on confidentiality. Agent name
and brokerage small at the bottom. Friendly wrong-password message.

The gate is part of the impression, not friction — **a locked document reads as a
document worth reading.**

### Cover

Property photo full bleed. Address large. Community. Specs strip
(beds · baths · sqft · built). Prepared for [name]. Prepared [month year]. Agent
name / title / brokerage on one small line. Scroll cue. Download PDF.

**No price on the cover.** The sticky bar must stay empty until the seller has
scrolled past pricing.

Deferred: photo crossfade, a "how to read this" line, a personal note per CMA.

### Roadmap — section 01

Nine steps, from profile defaults. Agent-editable but **not per-CMA**.

```
1 Decide to sell          6 Market and showings
2 Meet with [agent]       7 Receive and negotiate offers
3 Market analysis,        8 Conditions to closing
  pricing and strategy    9 Possession
  (current)
4 Listing paperwork
5 Prepare your home
```

Step 3 marked strongly as current; steps 1–2 read as complete. Horizontal on
desktop, vertical on iPad portrait and mobile. Orientation only — no explanatory
text.

### Market Overview

**Hero — BUILT.** Benchmark price with its sales count attached, Y/Y, median,
DOM, thin-data suppression applied at publish.

**Comparison table — new.** Rows for detached / semi / row / apartment / all
types; columns for community · South East district · Calgary. **Y/Y is the
primary figure**, benchmark price small beneath it. The subject's property type
row is highlighted. Thin cells are marked with their sales count.

No auto-generated "strongest type" claim — show the table, let Kyle make the
point out loud.

**Manual override reshaped** to mirror the community fields exactly: benchmark
price, sales count (required), Y/Y, median, DOM, community name, property type.
Same rendering, same thin-data rule. Replaces the current six fields.
`marketSource` is visible in the editor only.

Requires the Calgary city import to be wired up — the ingest is built, nothing
reads it.

### Comparable Sales

Existing and working: photos, subject card, status grouping, MLS sheets, $/sqft.

**Fix:** sold cards must read **SOLD AT**, not "Listed at". When sale price
equals list price, drop the redundant strikethrough.

**New — adjustment tool.** Values set at **agent level, not per-CMA**: bedrooms,
bathrooms (full and half separately), finished basement, garage by type,
per-sqft, lot size, age.

Adjustments are computed from the comp-vs-subject difference with the **sign
handled automatically** — if the comp has more, subtract from the comp.
Overridable per comp with a reason field.

The sold price stays the headline. Adjustments live in an expandable "how this
was adjusted". **The adjusted price is evidence, not an input to the
recommendation.**

### Reasoning — new section, between Comparables and Pricing

Summary table by status: Sold, Pending, Active, Expired, Terminated, Withdrawn.
Per status: count, median sqft, median $/sqft, median price, median DOM. Empty
statuses do not render.

**$/sqft means different things per status** — SP/SF for sold and pending, LP/SF
for the rest. These must be distinguished, never silently mixed.

The subject sits **beneath** the table as the conclusion, not as a row in it:
"Your home, 1,650 sq.ft. → indicated range at the sold median."

**Expired and Terminated median DOM against Sold median DOM is the real
overpricing evidence** — make it prominent.

Per-status note field so Kyle can explain what he is discounting. Then his
commentary, then the range.

### Pricing Strategy

Computed: sold median $/sqft × subject sqft = indicated value; the 25th–75th
percentile spread = suggested range, rounded. Shown as a **suggestion in the
editor** — Kyle confirms or overrides. He always presents a range, never a single
number.

**Pyramid graphic.** Three tiers — Maximum / Recommended / Conservative — with
Recommended as the visual hero.

**No percentages.** The buyer-pool percentages on the standard industry pyramid
are invented and indefensible. Arrows and block width imply the pool instead.

Colours inherit from profile branding (`--sphere-accent`, `--sphere-gold`),
defaulting to the platform palette. **Do not default to Royal LePage red** — the
palette is too thin for three tiers, and red carries meaning on a pricing
graphic.

Open: whether the pyramid replaces the current three-column layout.

### Net Sheet

Existing and working. Add a collapsible commission breakdown.

```
collapsed   Commission + GST — $34,094
expanded    7% on first $100,000
            3% on balance
            subtotal · GST · total
            listing side · buyer's agent side
```

**Office split is not shown** — that is between Kyle and the brokerage.

Must render from whatever commission structure is configured. Do not assume
tiered, and do not assume a 50/50 co-op split.

Open: whether the breakdown recalculates live with the slider.

### What Happens Next

Roadmap steps 4–9, with the marketing content **woven into the relevant steps
rather than standing alone**. This **replaces** the current six-item marketing
plan section.

- **Listing paperwork** — describe the shape, not a list. Contents differ for
  condo, house and farm. "The agreement, disclosures and consents needed to
  market your home — I'll walk you through each one."
- **Prepare your home** — staging, what to fix, pre-list walkthrough
- **Market and showings** — photography, Matterport, digital advertising, sphere
  outreach, RLP network. **This is where marketing lives.**
- **Receive and negotiate offers** — the `offerStrategy` field
- **Conditions to closing** — financing, inspection, condo documents explained
- **Possession**

Default text is agent-editable in the profile, with per-CMA fields where it
varies (`shotList` and `offerStrategy` already exist). Depth of explanation still
undecided.

### Your Agent

Built and working. **Needs content, not code** — `homesSold`, `listToSaleRatio`,
the tagline and Calendly are all empty in Kyle's profile.

### About My Brokerage — new

A new profile section feeding a new client-page section. Fields: brokerage name,
logo, office address, phone, website, short blurb, network credentials (years
established, agent count, offices, reach), and an **optional charitable
affiliation** (name, logo, description) which absorbs the current Shelter
Foundation block.

**Nothing hardcoded to Royal LePage** — the platform is sold to agents at other
brokerages.

Open: whether the charitable content keeps its current dark full-width treatment
inside the brokerage section.

### Client Reviews

Built. **All reviews visible — no auto-rotating carousel.** People do not finish
reading before it advances, and on an iPad mid-presentation that undermines the
impression.

The `result` field ("102% · 8 days") is the differentiator; most testimonials are
vague warmth.

Needs reviews saved in the profile — nothing renders today.

Open: whether two or three reviews sit inside the agent section instead.

### Cross-cutting principles

- **Agent-level settings, not per-CMA**, for anything that is the same every
  time: roadmap steps, adjustment values, brokerage details, marketing defaults.
  **This is what makes the product licensable.**
- **Anything the client page needs must be denormalised onto `public_cmas` at
  publish.** It cannot read `users/{uid}`.
- **Suppress at publish, never at render.** A value that never reaches the public
  document cannot leak.
- **No invented numbers anywhere.** This is why the pyramid percentages are out
  and why "554 contacts" was removed.

---

## Current priorities (Oct 25, 2026 conference deadline)

### Done — Aug 20, 2026

- **Chestermere address parsing.** `ADDR_RE` was anchored on the Calgary quadrant
  (SE/SW/NE/NW), so listings in Chestermere, Okotoks and every other quadrant-less
  town never opened a chunk and were silently dropped — or worse, absorbed into the
  preceding Calgary listing and corrupted its fields. Re-anchored on the
  `, AB <postal code>` tail. Address extraction now reads the sheet's own `City:`
  field and strips that exact string, falling back to a city-name list, then to the
  original quadrant logic. Also added a visible warning panel listing any
  address-like line the parser skipped. Verified against Chestermere, Okotoks and
  Calgary sheets — quadrants still survive on Calgary addresses.
- **Live Google sign-in.** `insidethesphere.com` was missing from the Firebase
  authorized-domains list, so OAuth was blocked on the live site. Added.
- **Defensive `firebase-config.js`.** It called `firebase.auth()`,
  `firebase.firestore()` and `firebase.storage()` unconditionally, so a single
  missing compat `<script>` tag threw and aborted the rest of the file — taking out
  every service declared after it. Each service is now probed individually and logs
  a named, actionable console error instead of throwing.
- **Google sign-up profile write.** `login.html` declared its own
  `firebase.firestore()` inside the Google handler, which threw inside a `.then()`
  and surfaced only as a rejected promise. Google sign-ups were creating an Auth
  account with **no `users/{uid}` document and no `profileComplete` flag**. Fixed,
  with a visible error on the write.

### Done — Aug 21, 2026

- **`header.js` migration complete.** Every platform page now renders its sidebar
  from `js/header.js`; no baked-in copies remain. Migrated in order:
  `clients/view.html` (`8530d07`), `clients/index.html` (`a6418a1`),
  `smarttools/index.html` (`8d345ba`), `cma/edit.html` (`9691b19`), each a
  self-contained revertible commit. The nav is now genuinely single-source — edit
  `navItems` in `header.js` and every page follows on the next deploy.

  Each page needed the same five edits: add `sphereActivePage` + the `header.js`
  include, swap the `<nav class="sidebar">` for `<div id="sphere-header">`, delete
  the `.sidebar` / `.sb-*` CSS, drop `.sidebar{display:none}` from the 900px media
  query, and strip the JS that wrote to `sb-name` / `sb-role` / `sb-initials`.

  **Every page also carried `document.getElementById('sidebar').style.display =
  'flex'`.** The injected element is `#sphere-sidebar`, so post-migration that line
  returns `null` and throws, killing every statement after it in the same callback.
  On `cma/edit.html` it sat between the spinner hide and the editor reveal — it
  would have left a blank page with no visible error. Removed in the same pass on
  all four. If any page is migrated later, remove this line with it.

  Two things fixed in passing: `cma/edit.html`'s hardcoded nav had no Clients link,
  so the CMA editor was the one page you couldn't reach Clients from — `header.js`
  renders the full list. And `smarttools/index.html`'s sidebar writes were the only
  consumers of four locals in `loadDashboard` (`lastName`, `title`, `initials`,
  `headshot`), removed with them.

  `mobile-nav.js` needed no change — it already targets `.sidebar, #sphere-sidebar`
  and `header.js` sets `className='sidebar'` on the injected nav.
  `cma/client/index.html` is untouched and must stay that way.

- **`profile.html` layout under the injected sidebar** (`1b4d462`). The page loaded
  `header.js` from the original pilot but never had the `margin-left:220px` the
  fixed rail requires, so content rendered underneath it. Its own unscoped
  `.sidebar` rule also bled onto the injected nav — `header.js` sets
  `className='sidebar'` — leaking two properties it does not itself declare:
  `padding:20px 0` and `height:calc(100vh - 113px)`. Together those rendered the
  rail 113px short with extra padding, clipping the Log out button off the bottom.
  Scoped the page's rule to `.layout .sidebar` and added the offset, reset below
  900px to match where `header.js` hides its own rail.

- **Client page correctness pass.** Three bugs, all client-facing.

  `buildReviews()` and `defaultReviews()` were called at line 1462 and defined
  nowhere (`78c19a6`). `populateReport()` threw there on every load, inside a
  `setTimeout` with no catch, so it only reached the console — and killed every
  statement after it: reviews, the `shelterText` profile override, and the
  sticky-bar scroll listener. No published CMA had ever shown its sticky bar.
  `defaultReviews()` returns `[]` deliberately; sample quotes on that section
  would be fabricated testimony in front of a seller.

  The client net sheet omitted `taxAdj` and `otherCosts` (`48d9764`), so it
  disagreed with the editor's `recalcNet()`. With other costs set it
  **overstated** the seller's net — the wrong direction. Rounding differed too
  (`round(base)+round(gst)` vs summing unrounded), and the two `calcCommission()`
  copies read `p.gstPct` and `p.gst` despite a comment claiming they mirror.

  Breakpoint inversion (`9b3aff5`): `.stats-row` was one column at 860px and two
  at 560px, so iPad portrait got a narrower layout than a phone. `.value-cols`
  also collapsed at 860px, turning the three-column pricing comparison into a
  list on the presentation device. Both now hold three columns to 700px with the
  type scaling instead — at 768px a `.value-col` cell leaves 175px against ~176px
  needed for a seven-figure price, so the scaling is load-bearing.

- **Comp photos render as a 110px left rail** (`eaed612`). The `photoUrl` field,
  the editor input and the paste-a-URL toggle all already existed; only the
  output was missing. Opt-in per comp via `.has-photo`, so a card without a photo
  lays out exactly as before — verified identical at every width.

- **Marketing plan is data-driven from editor section 07** (`7703c59`). Removed
  "Sphere database — 554 contacts", "30-day retargeting campaign", the whole
  open-house item, and the asserted "Listed Thursday / Offers Tuesday" schedule.
  `shotList` and `offerStrategy` now render verbatim and are labelled
  "shown to client, verbatim" in the editor. The test applied was "could this be
  defended if a seller challenged it", not "is there a field for it".

- **CREB 360 community import — complete.** Standalone `/market-data/` page
  (`069f5f2`, `b06fd0c`), shared parser in `js/market-import.js` (`a25c925`), and
  an import modal in `cma/edit.html` section 03 (`ab162f4`). Section 02 gained a
  community + market-cut picker (`4d3eb07`); section 03 reads the store and the
  six manual fields became a collapsed override (`375e632`).

  Thin-data rule (`cefc515`): at or below **5 sales** in a month,
  `medianPrice`/`averagePrice`/`dom`/`spToLp` are **absent** from client-facing
  output — not caveated, absent. `benchmarkPrice` and `hpiIndex` always render,
  with the sales count beside them. Benchmark is HPI-model-derived and holds at
  low n; the others are computed from that month's sales and are meaningless at
  n=2. Cranston semi-detached is thin in **110 of 115 months**, so this is the
  normal case, not an edge case.

- **City of Calgary Monthly Stats ingest — complete** (`9fc4f7d`). Pages 5 and 6
  into `users/{uid}/market/city-calgary/months/{YYYY-MM}`. **Nothing reads it yet.**

- **Subject property on the client page** (`8c1f49e`). Cover strip under the
  address, plus a "Your home" card at the top of the comps grid. $/sq.ft. renders
  in the money column labelled "At recommended price" — comps show *achieved*
  dollars per foot, the subject can only show asking, and unlabelled in the same
  slot that reads as evidence for the recommendation it was derived from.

- **Matrix listing photo extraction** (`49ad185`). One `/DCTDecode` XObject per
  listing, copied out as raw JPEG. Keyed on page association, never document
  order. `test-pdfs/Client_Full1541.pdf` is the regression case — ten listings,
  page 5 has no photo. Manual wins: `fillCompForm()` writes the photo field only
  when one was extracted **and** the field is empty, which also fixed a live bug
  where re-parsing into an open comp wiped a hand-uploaded photo.

- **Firestore rules** gained `users/{uid}/communities/{communityId}` and
  `.../types/{typeId}`. Rules enumerate subcollections explicitly, so **any new
  path needs adding or the catch-all denies it.**

### Key learnings — Aug 21, 2026

- **CREB City of Calgary page 2 is rasterized.** 1.38 MB of content, five text
  operators, twelve images — every figure is pixels. Page 3 has zero text. And
  page 2's format has already changed once: press release in Mar 2025 and May
  2026, visual dashboard in Jul 2026. **Do not build on page 2.** Pages 5 and 6
  carry the real tables.
- **Property-type block order on page 6 varies between editions.** Jul 2026 is
  Detached / Apartment / Semi / Row; May 2026 page 3 is Detached / Semi / Row /
  Apartment. Blocks must be matched to types **by benchmark value**, cross-checked
  against a page that names types in its text layer — never by position.
- **Test parsers against every available edition, not one.** A greedy `[\d,]*`
  consumed `"$570,0500.05%"` as a single number and silently dropped median and
  average price. Only visible when Mar 2025 was tested alongside Jul 2026.
- **CREB offers an Excel export of the 360 report** — link on page 3 of the PDF.
  Always prefer it to PDF parsing: real types, no row clustering, no text-layer
  fragility.
- **Annual rollup rows in the 360 workbook are dated like January.** Row 15 is the
  2017 annual, dated `2017-01-01` — identical to row 3, Jan 2017. Key on position
  within the 13-row block, never on date.
- **Empty months in the 360 workbook hold the string `" "`, not blank cells.**
  `Number(" ")` is `0`, so a naive parse writes a $0 benchmark price and never
  throws.
- **Test layout with DevTools closed or docked to the bottom.** Right-docking
  shrinks the viewport below `header.js`'s 900px breakpoint and makes a working
  sidebar look broken.

### Done — Aug 24, 2026

- **Comp re-import matches on MLS and updates in place** (`3bd5ca3`).
  `addSelectedComps()` called `colRef.add()` unconditionally, so re-importing a
  sheet produced a second comp sharing the same MLS. It now finds the existing
  comp and updates it, which is what the common case wants — a listing goes
  Active to Sold and the sale price lands on the comp already in the CMA.

  Matching is on `mls` and nothing else. No MLS means new comp; an address
  fallback would silently merge two different listings at the same address.
  Updating in place keeps the document id and `createdAt`, so the editor's
  `orderBy('createdAt')` does not scramble.

  `manualFields` on the comp doc records fields changed by hand, measured
  against `importedValues` — a snapshot of what the last import wrote. Import
  refreshes everything except those, so a correction made once stays made. The
  review shows "Updates existing comp — status active → sold · price …" against
  "New comp" before anything is written, names any hand-edited field it will
  skip, and flags a sold → active regression loudly: legitimate when a deal
  collapses, and also exactly what a mis-parse looks like.

- **Agent profile denormalised onto `public_cmas`** (`62d1db7`). This fixed a
  **live bug on every published CMA**. `cma/client/index.html` fetched
  `users/{agentId}` to load the profile, and that read is denied to an
  unauthenticated reader, so it failed every time. `agentProfile` stayed null and
  every field fell through to a hardcoded default — no headshot (rendered as "KD"
  initials), generic bio, default Shelter text, and the **entire Client reviews
  section hidden**, because it hides when the reviews array is empty.

  It was invisible because the fallbacks are Kyle's own real details. Sixteen
  profile fields now travel on the published document; `plan`, `planStarted`,
  `profileComplete` and the account email stay private.

  Chosen over moving `agentProfile` to a world-readable subcollection, which
  looked like four files and turned out to be eight readers and nine write sites
  across five files including `signup.html` and `login.html`.

- **CREB benchmark renders on the client page** (`69481a0`, `34f3682`). Nine
  fields denormalised at publish. **Thin-data suppression is applied at publish**,
  so a withheld median or DOM never reaches a publicly readable document — the
  client page renders what it was given and never suppresses anything itself.
  The sale count sits inside the same bordered block as the price, so no code
  path can render one without the other. Section 01 falls back to the three
  manual fields when no benchmark travelled, and the title names what is on
  screen — "Cranston · detached homes" rather than "SE Calgary lake communities".

- **Emoji removed from `cma/client/index.html`** (`31cd996`). Six button labels
  became plain text; the Shelter Foundation house is now drawn in CSS, following
  the `.comp-sheet-icon` idiom. Left in place: the check marks in journey
  milestones and the stars in review cards — typographic dingbats used as UI
  furniture, not emoji in copy.

- **`cma/profile.html` deleted** (`15c4f07`). Orphaned: every profile link in the
  codebase points at the root `profile.html`. It predated the `header.js`
  migration and wrote `agentProfile` through a path that no longer matches how
  the profile is edited or read.

- **Reasoning section — weeks 1–2 of the build order, complete**
  (`753452b`, `e926a6b`, `ab97407`). Summary table by status, subject as the
  conclusion beneath it, per-status notes, agent commentary. Every figure is
  computed from comps already on the published document; only the notes travel.

  **$/sqft is two measures, never one.** Sold and pending are priced on what was
  achieved, so the basis is the sale price; active, expired and terminated on
  what is asked. Each row carries SP/SF or LP/SF beneath the figure and the
  section states the difference in words.

  A comp that cannot produce a figure is excluded from that median rather than
  counted as zero, and the exclusion is named — "sold: median $/sq.ft. from 2 of
  3 with square footage recorded". Narrowing the basis silently would be the same
  defect as quoting a benchmark drawn from two sales.

  Five statuses, not six. Withdrawn is mapped to `terminated` by the Matrix
  parser and the comp form offers no such option, so no comp can carry it.

  Editor gained six fields in section 04 beside the comps they describe:
  `reasonNoteSold` / `Pending` / `Active` / `Expired` / `Terminated`, and
  `reasoningCommentary`. `priceRationale` stays in Pricing Strategy — they are
  different arguments.

- **Client page section numbers come from a CSS counter** (`753452b`) on
  `.eyebrow[data-section]`, not from the markup. **Inserting a section renumbers
  everything below it automatically — no manual edits.** A counter rather than a
  script: nothing to fail, and the numbers are right before any JS runs on a page
  that renders behind a password gate. An eyebrow without `data-section` — the
  journey strip — neither counts nor is counted.

  Section backgrounds alternate the same way, recomputed by `restripeSections()`
  from what is actually visible, since a hidden section would otherwise leave two
  of the same colour touching.

### Key learnings — Aug 24, 2026

- **`users/{uid}` is DENIED to unauthenticated readers**, subcollections
  included. Verified against the live rules: every `users/**` path returns
  `PERMISSION_DENIED` while `public_cmas` returns `NOT_FOUND`. **Anything the
  client page needs must be denormalised onto `public_cmas` at publish.**
- **A hardcoded fallback that matches real data hides the failure completely.**
  The client page fell back to Kyle's own name, title, brokerage and phone, so a
  read that never once succeeded looked correct for months. Prefer rendering
  nothing, or a visible gap, over a plausible default.
- **Moving a field means finding every reader AND writer first.** The
  `agentProfile` move was scoped at four files from a partial grep; it was
  actually eight readers and nine write sites across five files, two of them
  auth paths. Count both sides before proposing the change, not after.
- **`cta-book`'s `textContent` is overwritten from JS** at what is now
  `cma/client/index.html:1497`. A markup-only edit to that button does nothing —
  it looks fixed in the source and still renders the old text to a seller.
- **A computed section can state a fact and still assert a cause the data
  disproves.** The Reasoning section paired a true days-on-market comparison with
  the claim that expired listings "were priced ahead of the market", both gated on
  one condition. On real Cranston data the sold and expired median $/sqft were
  both $384 — the page asserted overpricing directly above a table showing the
  asking price matched what sold, and the seller can read both.

  The two are now gated **independently**: the DOM comparison renders whenever the
  stale figure is higher; the price explanation only when the asking $/sqft is
  genuinely above the sold median, with at least a dollar of separation. When the
  medians are level the sentence is **dropped, not softened** — a listing that sat
  at a competitive price did so for reasons that are not in the data (condition,
  photography, access, timing), and that is what the per-status note is for.

  **State what the numbers say; never infer a cause they do not support.** This
  generalises to every computed claim on the client page, and it is the same test
  that removed "554 contacts" and the pyramid percentages.

### Build order — nine weeks to Oct 25

Set Aug 24, 2026. Reconciles the presentation spec above with what was already
queued. See **CMA presentation architecture** for the design of each section.

**Weeks 1–2 · Reasoning section — COMPLETE**
Shipped Aug 24 (`753452b`, `e926a6b`, `ab97407`). See Done — Aug 24 above. The
range itself stays in Pricing Strategy; Reasoning ends with the agent's
conclusion.

**Weeks 3–5 · Adjustment tool — NEXT**
The largest build. Agent-level settings for adjustment values, computed
adjustments with automatic sign handling, per-comp override with a reason field,
expandable breakdown on the card. Also fixes SOLD AT versus LISTED AT and the
redundant strikethrough when sale price equals list price.

**Week 6 · Pricing strategy**
Computed range suggestion from the 25th–75th percentile of sold $/sqft. Pyramid
graphic, no percentages, colours from profile branding. Depends on weeks 1–5.

**Week 7 · What Happens Next + About My Brokerage**
Both content-shaped, both use the profile-defaults pattern, so they are cheaper
built together than separately. What Happens Next replaces the current marketing
plan section.

**Week 8 · Market Overview comparison table**
Community versus South East district versus Calgary, Y/Y primary. The Calgary
ingest is built and unread. **First to cut if anything slips** — the Reasoning
section already makes the pricing argument with data already in hand.

**Week 9 · Conference readiness — reserved, not overflow**
- **`public_cmas` write rules. Not optional.** Any authenticated user can
  currently overwrite any published CMA. Harmless while Kyle is the only account;
  live the moment someone signs up after the demo.
- PDF export from the client page. No `@media print` rules exist and the
  "Download PDF" button already calls `window.print()`, so it produces a poor
  artifact today.
- Offline demo path. Every image the client page shows lives in Firebase Storage,
  so this needs a general solution — service worker or a pre-load pass — not a
  per-feature one.
- Section toggles, if there is room.

**The assumption this order depends on:** week 9 is rehearsal, not overflow. It
will not be if weeks 1–8 slip, and they will. **Cut week 8 first.**

### Deferred past October

- **Comp map.** Designed, blocked on reading Mapbox terms covering storing and
  redistributing static images. Manual pin placement, no geocoding — Tillotson is
  a 2026 build and Chestermere has no quadrant, both of which geocoders get wrong.
- **Preferred Suppliers tool.**
- **Editor status colours.** `#2563eb` is generic SaaS blue in a design system
  that rejects bright blues — `.b-active` in `cma/edit.html`. `sold` (`--sage`)
  and `expired` (`--copper`) are already correct.
- **sqft / year-built parser collision.** Year and RMS SQFT can land on the same
  clustered row and the parser reads the year as the square footage. Still
  unreproduced — six listings across three PDFs on Aug 20 all parsed correctly,
  including 4,513.15 on a sheet where `Year Built: 1986` and `RMS SQFT: 4,513.15`
  share a row. **Find a PDF that actually triggers it before attempting a fix.**
- **Newsletter images go to Imgur, publicly.** `newsletter/index.html` POSTs five
  image inputs with a hardcoded client ID; those URLs are reachable by anyone with
  the link, with no auth and no expiry. `eventImage` and `customBanner` could carry
  client or property content, and Matrix property photos are Pillar 9 licensed —
  a public third-party host is the wrong place for them, on compliance and on
  positioning. Move to Firebase Storage.
- Stripe paywall · Social Studio expansion (8-post sequences, carousel export) ·
  Buyer Checklist · Monthly Market Reports · CMA palette selector · journey step
  editing.

### Required before the demo — not a build item

Kyle's profile is missing `homesSold`, `listToSaleRatio`, `reviews`, the
specialisation tagline and the Calendly link. The client page renders truth now,
so the agent section under-sells until these are filled in. **This is data entry,
not development.** Do it before the demo.

### Loose ends

- **`public_cmas` allows write to ANY authenticated user**, not just the owner. Any
  agent could overwrite another agent's published CMA. Harmless while Kyle is the
  only account; **must be fixed before anyone else is on the platform.**
- **Nothing reads `users/{uid}/market/city-calgary/` yet.** Whether city-wide
  figures belong in section 03 alongside community data, or somewhere else,
  is undecided.
- **`.about-grid` and `.comp-card` both stack at 860px but fit two-column at
  768px.** Comp cards have 460px of body width there, About has 420px. A design
  call, not a bug — needs judging on the actual iPad.
- **Audit for orphaned accounts.** Any Google sign-up before Aug 20 may have an Auth
  user with no Firestore profile. Check Firebase Console → Authentication → Users
  against the `users` collection.
- **Kyle's profile is incomplete, and the client page now shows that.** Missing:
  `homesSold`, `listToSaleRatio`, `reviews`, the specialisation tagline, and the
  Calendly link. Until `62d1db7` the page rendered hardcoded fallbacks that
  happened to look right, so nothing was obviously absent. It renders the truth
  now, which means the agent section is under-selling until these are filled in
  at `profile.html`. **Fill these before the Oct 25 demo.**
- **`manualFields` currently wins over the always-refresh set** on comp
  re-import, so a hand-edited price is not replaced by a later sheet. Every
  skipped field is named in the review and counted in the result toast, so a kept
  edit is visible rather than silent. The alternative reading — that volatile
  fields always win because the MLS is authoritative — is defensible. Revisit
  after more real use; the switch is one `indexOf()`.
- **`profile.html` still carries stale topbar offset math.** The page predates the
  `header.js` pilot, when a 60px horizontal topbar sat above a 53px subheader.
  `header.js` replaced that with a left rail, but the arithmetic survived:
  `.page-subheader{position:sticky;top:60px}`, `.layout{min-height:calc(100vh -
  113px)}` and `.layout .sidebar{top:113px;height:calc(100vh - 113px)}`. The visible
  symptom is a 60px dead band above the subheader once the page is scrolled. The
  `1b4d462` fix deliberately left this alone — it addressed the overlap and the CSS
  bleed only. Cosmetic, but it's the one page where the migration still shows.
- **`social/index.html` sets `sphereActivePage = 'social'`**, which matches no key in
  `navItems`, so no item highlights. Social Studio has no nav entry at all — decide
  whether it should get one, or point the page at an existing key.
- **`profile.js` has zero consumers repo-wide.** Decide whether it's superseded by
  `header.js` or scaffolding for planned work. **Do not delete before the Oct 25
  demo.**

  The measurable symptom: `profile.html` fetches `users/{uid}` **three times** on
  load — once by `profile.js`, once by `header.js`, once by its own `loadProfile()`.
  Same document, three round trips. `header.js` reimplements the read `profile.js`
  already does, and `profile.html` writes with a direct `.set()` rather than
  `sphereSaveProfile()`, so the abstraction is bypassed from both ends. Harmless at
  current scale, but it's what makes the call obvious later.
- **`favicon.ico` returns 404** site-wide. Cosmetic.
- Five pages (`index.html`, `dashboard.html`, `signup.html`, `newsletter/`,
  `background-customization/`) lack the Storage compat tag, but **none of them use
  Firebase Storage** — verified Aug 20. The console note is noise, not a bug. Either
  silence it or ignore it; there is nothing to repair.

Everything not in the build order above is deferred past October — see
**Deferred past October** for the full list and why each is parked.

### Contact

403-252-5900 · kyleduiker@royallepage.ca · calendly.com/kyleduiker
