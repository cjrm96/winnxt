#!/usr/bin/env node
// Renders a built HTML page to a real PDF.
//
//   node build/pdf.js dist/quickstart.html dist/quickstart.pdf
//
// Etsy buyers get a .pdf, not an .html, for the quickstart: it is the one file
// in the package that should open the same way everywhere and print without
// argument. Playwright is a build-time dependency only; nothing ships with it.

const path = require('path');
const fs = require('fs');

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error('usage: pdf.js <in.html> <out.pdf>');
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('pdf: playwright is not installed. Run npm install first.');
    process.exit(1);
  }

  const src = path.resolve(input);
  if (!fs.existsSync(src)) {
    console.error('pdf: missing ' + src);
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch(
      process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
    );
  } catch (e) {
    console.error('pdf: could not start a browser to render the PDF.');
    console.error('     Run "npx playwright install chromium", or set PW_CHROMIUM');
    console.error('     to an existing Chromium binary.');
    console.error('     (' + String(e.message).split('\n')[0] + ')');
    process.exit(1);
  }
  const page = await browser.newPage();

  const requests = [];
  page.on('request', (r) => { if (!r.url().startsWith('file://')) requests.push(r.url()); });

  await page.goto('file://' + src, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  // The same rule the tools live by: if this needed the network to render, the
  // fonts are not embedded properly and the PDF would differ machine to machine.
  if (requests.length) {
    console.error('pdf: page made network requests: ' + requests.join(', '));
    await browser.close();
    process.exit(1);
  }

  await page.pdf({
    path: path.resolve(output),
    printBackground: true,
    preferCSSPageSize: true
  });

  await browser.close();

  const kb = (fs.statSync(path.resolve(output)).size / 1024).toFixed(0);
  console.log('built ' + output + ' (' + kb + ' KB)');
}

main();
