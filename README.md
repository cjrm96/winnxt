# WINNXT Campaign Tools

Interactive, single-file HTML tools for DIY local political campaigns. Sold standalone on [WINNXTetsy](https://www.etsy.com/shop/WINNXTetsy).

See `HANDOFF.md` for full product spec, market research, and guardrails.

## Delivery format

Every shipped product is a **single, self-contained `.html` file** — no zip, no dependencies, works from `file://` with zero network requests. That guarantee (see `HANDOFF.md` §6) is the product's privacy promise and its Etsy delivery mechanic. Optionally paired with a one-page PDF quickstart.

## Repo structure

```
winnxt-campaign-tools/
├── README.md                     # this file
├── HANDOFF.md                    # full project handoff/spec
├── docs/
│   ├── market-research.md
│   ├── brand-voice.md            # WINNXT tone rules for all copy
│   ├── crisis-framework.md       # defense-only crisis comms IP
│   └── etsy-listings/            # title, description, tags, images per SKU
├── src/
│   ├── shared/
│   │   ├── styles.css            # design tokens, print styles
│   │   ├── storage.js            # opt-in localStorage wrapper + erase
│   │   ├── export.js             # print + blob download
│   │   └── handoff.js            # Claude prompt block generator
│   └── tools/
│       ├── self-vet-audit/       # build first
│       ├── crisis-triage/
│       ├── endorsement-engine/
│       └── pre-filing-check/     # free lead magnet
├── skills/
│   ├── message-foundation/SKILL.md
│   └── call-time-ask/SKILL.md
├── build/
│   └── inline.js                 # bundles src → single-file dist
└── dist/                         # shippable artifacts, one .html each
```

## Build

Develop each tool in `src/tools/<name>/` as separate HTML/CSS/JS files (normal dev workflow). `build/inline.js` inlines everything into one `dist/<name>.html` file — no CDN links, no ES modules, no fetch, vanilla JS only, so it runs standalone from `file://`.

**Before shipping any `dist/` file:** open it via `file://`, open devtools network tab, confirm **zero requests**. That's a checklist item, not a hope.

## Guardrails (see `HANDOFF.md` §8 for full list)

- Offense-oriented crisis tactics never ship to customers — defense only.
- No state-specific compliance dollar figures.
- Zero network requests, zero telemetry, no exceptions — the privacy claim must be literally true.
- Any Claude-subscription dependency (skills products) disclosed in listing title, first line, first image.

## What ships to a buyer

| File | Built from | Notes |
|---|---|---|
| `dist/crisis-triage.html` | `src/tools/crisis-triage/` | The product. One file, zero requests. |
| `dist/quickstart.pdf` | `src/quickstart/` | One page. How to open it, what the five verdicts mean, when to stop and call someone. |

The quickstart is generated, not hand-maintained, so it cannot drift from the
tool: `npm run quickstart` inlines it and renders the PDF through headless
Chromium. The renderer fails the build if the page makes a network request,
which is the same guarantee the tools carry, and the reason the brand fonts are
embedded rather than linked.

## Test

```
npm install          # playwright, dev only
npm test             # builds dist/, then drives it from file:// in a real browser
```

`tests/pre-filing-check.test.js` opens the shipped file the way a buyer does — off the filesystem, no server — and asserts zero network requests, no console errors, correct blocker logic, timeline math, storage opt-in and erase, mobile layout, print styles, and labeled fields. If Playwright can't find a browser, set `PW_CHROMIUM` to a Chromium binary path.
