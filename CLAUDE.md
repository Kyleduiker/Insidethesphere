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

**Rule:** every platform page includes `profile.js` and `header.js` after
`firebase-config.js`, and sets `window.sphereActivePage`.
**Client-facing pages do NOT use `header.js`.**

`header.js` migration is in progress — piloted on `cma/index.html`. Until it's complete,
the baked-in sidebar on each page is the source of truth.

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

1. Parser reliability — Chestermere address parsing, sqft/year collision on shared
   PDF lines, multi-listing upload
2. Complete the `header.js` migration
3. CREB 360 community data into the CMA tool — Mahogany, Auburn Bay, Cranston, Legacy
4. PDF export from the client page
5. Client page polish to 9/10
6. Offline demo path — a pre-parsed CMA with cached images that renders without network

**Deferred, do not build:** Stripe paywall, Social Studio expansion (8-post sequences,
carousel export), Buyer Checklist, Monthly Market Reports, CMA palette selector,
journey steps.

### Contact

403-252-5900 · kyleduiker@royallepage.ca · calendly.com/kyleduiker
