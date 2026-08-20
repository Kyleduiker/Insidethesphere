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

## Local development workflow

Established Aug 20, 2026. Every change follows this loop:

1. **Edit locally** in `C:\Users\KyleDuiker\Documents\GitHub\Insidethesphere`.
2. **Test on localhost.** In a separate PowerShell window, from the repo root:
   `python -m http.server 8000`, then open `http://localhost:8000/login.html`.
   Leave that window open; closing it stops the server.
3. **Commit and push** — via GitHub Desktop or Claude Code.
4. **Verify live** at insidethesphere.com after the Pages build goes green
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

### Next

1. **sqft / year-built parser collision.** Year and RMS SQFT can land on the same
   clustered row, and the parser reads the year as the square footage. Not yet
   reproduced — six listings across three PDFs on Aug 20 all parsed sqft correctly
   (including 4,513.15 on a sheet where `Year Built: 1986` and `RMS SQFT: 4,513.15`
   share a row). **Find a PDF that actually triggers it before attempting a fix.**
2. **Complete the `header.js` migration.** Piloted on `cma/index.html`; the sidebar
   is still baked into every other page.
3. **Newsletter images go to Imgur, publicly.** `newsletter/index.html` POSTs five
   image inputs to Imgur with a hardcoded client ID. Imgur URLs are reachable by
   anyone with the link, with no auth and no expiry. `agentPhoto`, `agentLogo` and
   `brokerageLogo` are Kyle's own branding and fine; `eventImage` and `customBanner`
   could carry client or property content. Property photos from Matrix are Pillar 9
   licensed content, and a public third-party host is the wrong place for them —
   both on compliance and on positioning, given the luxury-presentation-layer pitch.
   Firebase Storage is already on Blaze and working elsewhere in the platform. Move
   these to Storage.
4. **CREB 360 community data into the CMA tool** — Mahogany, Auburn Bay, Cranston,
   Legacy. The single biggest differentiator; still unbuilt.
5. **PDF export from the client page.**
6. **Client page polish to 9/10.**
7. **Offline demo path** — a pre-parsed CMA with cached images that renders with no
   network call, as insurance against conference wifi.

### Loose ends

- **Audit for orphaned accounts.** Any Google sign-up before Aug 20 may have an Auth
  user with no Firestore profile. Check Firebase Console → Authentication → Users
  against the `users` collection.
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
