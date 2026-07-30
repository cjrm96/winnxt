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
