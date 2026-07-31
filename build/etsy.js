#!/usr/bin/env node
// Renders the Etsy listing images.
//
//   node build/etsy.js
//
// Each ad is an ordinary HTML page laid out at 500x500 and screenshotted at a
// device scale of 4, so the file Etsy receives is 2000x2000. Etsy resamples
// everything anyway; giving it four times the pixels is the difference between
// crisp condensed type and mush.
//
// Same reasoning as the quickstart PDF: generated, not hand-made, so the ads
// cannot quietly drift from the product they are advertising. The render fails
// on any network request, which is also how we know the brand fonts really are
// embedded rather than linked.

const path = require('path');
const fs = require('fs');
const { inline } = require('./inline.js');

const SRC = path.join(__dirname, '..', 'src', 'marketing', 'etsy');
const OUT = path.join(__dirname, '..', 'dist', 'etsy');
const SIZE = 500;
const SCALE = 4;

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('etsy: playwright is not installed. Run npm install first.');
    process.exit(1);
  }

  const ads = fs.readdirSync(SRC).filter((f) => /^ad-.*\.html$/.test(f)).sort();
  if (!ads.length) {
    console.error('etsy: no ad-*.html found in ' + SRC);
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch(
      process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
    );
  } catch (e) {
    console.error('etsy: could not start a browser.');
    console.error('      Run "npx playwright install chromium", or set PW_CHROMIUM.');
    console.error('      (' + String(e.message).split('\n')[0] + ')');
    process.exit(1);
  }

  const ctx = await browser.newContext({
    viewport: { width: SIZE, height: SIZE },
    deviceScaleFactor: SCALE
  });
  const page = await ctx.newPage();

  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file://')) requests.push(r.url()); });

  for (const file of ads) {
    // Through the same inliner the products use, so the logo resolves to real
    // SVG that can pick up currentColor, and a remote reference fails the build.
    const built = path.join(OUT, file);
    fs.writeFileSync(built, inline(path.join(SRC, file)));

    await page.goto('file://' + built, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    // The frame is a fixed square with overflow hidden, so a layout that grew
    // too tall does not look broken, it just silently loses its last line.
    // scrollHeight still reports the truth.
    const over = await page.evaluate(() => {
      const ad = document.querySelector('.ad');
      return { over: ad.scrollHeight - ad.clientHeight, slack: 0 };
    });
    if (over.over > 1) {
      console.error('etsy: ' + file + ' overflows its frame by ' + over.over +
        'px. Tighten the spacing rather than letting it crop.');
      await browser.close();
      process.exit(1);
    }

    const name = file.replace(/^ad-/, '').replace(/\.html$/, '');
    const png = path.join(OUT, name + '.png');
    await page.locator('.ad').screenshot({ path: png });

    // Belt and braces: Etsy silently rejects anything that is not what it says
    // it is, and a layout that overflowed by a pixel would ship crooked.
    const dim = size(png);
    if (dim.w !== SIZE * SCALE || dim.h !== SIZE * SCALE) {
      console.error('etsy: ' + name + ' rendered ' + dim.w + 'x' + dim.h +
        ', expected ' + SIZE * SCALE + ' square. Something overflowed the frame.');
      await browser.close();
      process.exit(1);
    }

    fs.unlinkSync(built);
    console.log('built dist/etsy/' + name + '.png (' + dim.w + 'x' + dim.h + ', ' +
      (fs.statSync(png).size / 1024).toFixed(0) + ' KB)');
  }

  if (requests.length) {
    console.error('etsy: page made network requests: ' + requests.join(', '));
    await browser.close();
    process.exit(1);
  }

  await browser.close();
}

// Width and height out of the PNG header, so this needs no image library.
function size(file) {
  const b = fs.readFileSync(file).subarray(16, 24);
  return { w: b.readUInt32BE(0), h: b.readUInt32BE(4) };
}

main();
