# WINNXT Studios tools

Single-file HTML tools for local campaigns and small organisations, sold on
[WINNXTetsy](https://www.etsy.com/shop/WINNXTetsy).

## Where the files are

**Everything a buyer gets is in `dist/`, one folder per Etsy listing.** Upload
the folder and the listing is complete.

```
dist/
├── crisis-triage/                LIVE ON ETSY
│   ├── crisis-triage.html        the tool, the digital file the buyer downloads
│   ├── quickstart.pdf            one page, the other digital file
│   └── listing/                  the five 2000x2000 listing images
│       ├── 1-cover.png … 5-format.png
├── vulnerability-assessment/                 built, not listed yet
│   ├── candidate-vulnerability-assessment.html
│   ├── quickstart.pdf
│   └── listing/1-cover.png … 5-format.png
└── pre-filing-check/             free lead magnet, still on the old design
    └── pre-filing-check.html
```

**`dist/` is generated. Never edit anything in it.** Run `npm run build` and it
is rebuilt from `src/`.

## Where the source is

```
src/
├── tools/                        the products themselves
│   ├── crisis-triage/            index.html, app.js, logic.js, evidence.js,
│   ├── self-vet/                 statements.js / items.js / searches.js, tool.css
│   └── pre-filing-check/
├── quickstart/                   the one-page PDFs
│   ├── quickstart.css            shared by both
│   ├── crisis-triage/index.html
│   └── self-vet/index.html
├── marketing/listing/            the Etsy images, laid out as web pages
│   ├── listing.css               shared by both
│   ├── crisis-triage/ad-1-cover.html … ad-5-format.html
│   └── self-vet/ad-1-cover.html … ad-5-format.html
└── shared/                       used by every tool
    ├── styles.css                design tokens, base, print
    ├── fonts.css                 Barlow Condensed + JetBrains Mono, base64
    ├── brand/                    logo SVGs
    ├── export.js                 print, download, clipboard
    └── handoff.js                the "continue with AI" prompt builder
```

Listing copy, including titles, descriptions and tags, is in
`docs/etsy-listings/`.

## Build

```
npm install          # playwright, dev only
npm run build        # everything
node build/build.js vulnerability-assessment   # one product
npm test             # build, then drive every tool from file:// in a real browser
```

`build/products.js` is the manifest. One entry per product, and the whole build
is driven from it. Adding a product means adding an entry there, not editing
three scripts.

The build fails, rather than shipping something wrong, if a tool references
anything remote, if a quickstart or listing image makes a network request, or
if a listing image overflows its square frame.

## The rules every tool ships under

- **Zero network requests. No exceptions.** It is the privacy promise, and it is
  the thing that has to be literally true. Open any `dist/` file from `file://`
  with the network tab open and confirm it yourself before listing.
- **No storage.** No localStorage, no sessionStorage, no cookies. Somebody
  typing their worst moment into a shared family computer leaves nothing behind.
- **Only real, findable citations.** No paraphrased "studies show". If it cannot
  be looked up it does not ship.
- **Cases are public record**, described so their own subject would recognise
  them as accurate, and drawn from both parties deliberately.
- **Nonpartisan.** The brand is partisan. The tools are not.
- **Nothing that reads as legal advice**, and offence-oriented tactics never
  ship to a customer. Defence only.
- **No em dashes** in anything a buyer reads.

See `HANDOFF.md` for the full product spec and `docs/brand-voice.md` for tone.

## Tests

`tests/*.test.js` open each shipped file the way a buyer does, off the
filesystem with no server, and assert zero network requests, no console errors,
the decision logic, the copy that carries the promises, layout at several widths,
print styles, and labelled fields. Roughly 460 checks across the three tools.

If Playwright cannot find a browser, set `PW_CHROMIUM` to a Chromium binary.
