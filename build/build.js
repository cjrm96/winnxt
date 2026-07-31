#!/usr/bin/env node
// One build, driven by build/products.js.
//
//   node build/build.js            everything
//   node build/build.js vet-yourself   just that product
//
// Output layout, one folder per Etsy listing:
//
//   dist/crisis-triage/crisis-triage.html   the file the buyer downloads
//   dist/crisis-triage/quickstart.pdf       the one-page PDF they also get
//   dist/crisis-triage/listing/*.png        the 2000x2000 images for Etsy
//
// Upload the folder and the listing is complete. Nothing else in dist/ is for
// anyone but us.
const path = require('path');
const fs = require('fs');
const { inline } = require('./inline.js');
const PRODUCTS = require('./products.js');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function tmp(file, html) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return file;
}

async function main() {
  const only = process.argv[2];
  const products = only ? PRODUCTS.filter((p) => p.id === only) : PRODUCTS;
  if (!products.length) {
    console.error('build: no product called ' + only);
    console.error('       known: ' + PRODUCTS.map((p) => p.id).join(', '));
    process.exit(1);
  }

  let browser = null;
  const needsBrowser = products.some((p) => p.quickstart || p.listing);

  if (needsBrowser) {
    let chromium;
    try {
      ({ chromium } = require('playwright'));
    } catch (e) {
      console.error('build: playwright is not installed. Run npm install first.');
      process.exit(1);
    }
    try {
      browser = await chromium.launch(
        process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
      );
    } catch (e) {
      console.error('build: could not start a browser.');
      console.error('       Run "npx playwright install chromium", or set PW_CHROMIUM.');
      process.exit(1);
    }
  }

  for (const p of products) {
    const out = path.join(DIST, p.out);
    fs.mkdirSync(out, { recursive: true });

    // 1. the tool
    const toolOut = path.join(out, p.file);
    fs.writeFileSync(toolOut, inline(path.join(ROOT, p.tool)));
    report(toolOut);

    // 2. the quickstart, inlined then printed
    if (p.quickstart) {
      const staged = tmp(path.join(out, '.quickstart.html'), inline(path.join(ROOT, p.quickstart)));
      await renderPdf(browser, staged, path.join(out, 'quickstart.pdf'));
      fs.unlinkSync(staged);
      report(path.join(out, 'quickstart.pdf'));
    }

    // 3. the listing images
    if (p.listing) {
      await renderListing(browser, path.join(ROOT, p.listing), path.join(out, 'listing'));
    }
  }

  if (browser) await browser.close();
}

function report(file) {
  const kb = (fs.statSync(file).size / 1024).toFixed(0);
  console.log('  ' + path.relative(ROOT, file) + '  (' + kb + ' KB)');
}

async function renderPdf(browser, src, out) {
  const page = await browser.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file://')) requests.push(r.url()); });
  await page.goto('file://' + src, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (requests.length) fail('quickstart made network requests: ' + requests.join(', '));
  await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true });
  await page.close();
}

const SIZE = 500;
const SCALE = 4;

async function renderListing(browser, srcDir, outDir) {
  if (!fs.existsSync(srcDir)) return;
  const ads = fs.readdirSync(srcDir).filter((f) => /^ad-.*\.html$/.test(f)).sort();
  if (!ads.length) return;
  fs.mkdirSync(outDir, { recursive: true });

  const ctx = await browser.newContext({
    viewport: { width: SIZE, height: SIZE },
    deviceScaleFactor: SCALE
  });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file://')) requests.push(r.url()); });

  for (const file of ads) {
    const staged = tmp(path.join(outDir, '.' + file), inline(path.join(srcDir, file)));
    await page.goto('file://' + staged, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    // The frame is a fixed square with overflow hidden, so a layout that grew
    // too tall does not look broken, it silently loses its last line.
    const over = await page.evaluate(() => {
      const ad = document.querySelector('.ad');
      return ad.scrollHeight - ad.clientHeight;
    });
    if (over > 1) fail(file + ' overflows its frame by ' + over + 'px. Tighten it rather than letting it crop.');

    const name = file.replace(/^ad-/, '').replace(/\.html$/, '');
    const png = path.join(outDir, name + '.png');
    await page.locator('.ad').screenshot({ path: png });
    fs.unlinkSync(staged);

    const dim = size(png);
    if (dim.w !== SIZE * SCALE || dim.h !== SIZE * SCALE) {
      fail(name + ' rendered ' + dim.w + 'x' + dim.h + ', expected ' + SIZE * SCALE + ' square.');
    }
    report(png);
  }

  if (requests.length) fail('listing images made network requests: ' + requests.join(', '));
  await ctx.close();
}

// Width and height out of the PNG header, so this needs no image library.
function size(file) {
  const b = fs.readFileSync(file).subarray(16, 24);
  return { w: b.readUInt32BE(0), h: b.readUInt32BE(4) };
}

function fail(msg) {
  console.error('build: ' + msg);
  process.exit(1);
}

main();
