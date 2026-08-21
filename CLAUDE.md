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

### Next

1. **CREB client-side.** A benchmark block on the client page, and publish
   denormalisation into `public_cmas`. The client page is **unauthenticated and
   cannot read `users/{uid}`**, so `benchmarkPrice` and its sales count must be
   copied onto the published document at publish time. The display contract
   requires the count to render beside the price, so the two have to travel
   together in the same document.
2. **Editor status colours.** `#2563eb` is generic SaaS blue in a design system
   that rejects bright blues — see `.b-active` in `cma/edit.html`. Move active and
   pending onto the palette. `sold` (`--sage`) and `expired` (`--copper`) are
   already correct.
3. **Section toggles** — per-CMA, stored on the CMA doc as `sections:{}`. Plus
   "About Me" and "About My Brokerage" rendering from the profile.
4. **Comp map.** Designed, **blocked on reading Mapbox terms** on storing and
   redistributing static images. Manual pin placement, no geocoding — Tillotson is
   a 2026 build and Chestermere has no quadrant, both of which geocoders get
   wrong. Static image generated at publish, so the client page works offline.
5. **PDF export from the client page.** No `@media print` rules exist, and the
   "Download PDF" button already calls `window.print()` — it produces a poor
   artifact today.
6. **Offline demo path** — a pre-parsed CMA with cached images that renders with no
   network call, as insurance against conference wifi. Every image the client page
   shows now lives in Firebase Storage, so this needs a general solution (service
   worker or a pre-load pass), not a per-feature one.
7. **sqft / year-built parser collision.** Year and RMS SQFT can land on the same
   clustered row, and the parser reads the year as the square footage. Not yet
   reproduced — six listings across three PDFs on Aug 20 all parsed sqft correctly
   (including 4,513.15 on a sheet where `Year Built: 1986` and `RMS SQFT: 4,513.15`
   share a row). **Find a PDF that actually triggers it before attempting a fix.**
8. **Newsletter images go to Imgur, publicly.** `newsletter/index.html` POSTs five
   image inputs to Imgur with a hardcoded client ID. Imgur URLs are reachable by
   anyone with the link, with no auth and no expiry. `agentPhoto`, `agentLogo` and
   `brokerageLogo` are Kyle's own branding and fine; `eventImage` and `customBanner`
   could carry client or property content. Property photos from Matrix are Pillar 9
   licensed content, and a public third-party host is the wrong place for them —
   both on compliance and on positioning, given the luxury-presentation-layer pitch.
   Firebase Storage is already on Blaze and working elsewhere in the platform. Move
   these to Storage.

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
- **Comp re-import creates a duplicate, it does not update.** `mergeListings()`
  dedupes only within one import batch and never queries Firestore;
  `addSelectedComps()` calls `colRef.add()` unconditionally. So re-importing an
  MLS number yields two comps sharing it. Photo overwriting is already resolved
  (`49ad185` — manual wins), but whether import should match and update existing
  comps by MLS is still open.
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

**Deferred, do not build:** Stripe paywall, Social Studio expansion (8-post
sequences, carousel export), Buyer Checklist, Monthly Market Reports, CMA palette
selector, journey steps.

### Contact

403-252-5900 · kyleduiker@royallepage.ca · calendly.com/kyleduiker
