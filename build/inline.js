#!/usr/bin/env node
// Inlines <link rel=stylesheet> and <script src> into one self-contained HTML file.
//
//   node build/inline.js src/tools/self-vet-audit/index.html dist/self-vet-audit.html
//   node build/inline.js --all
//
// Refuses to emit anything that would make a network request at runtime.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOOLS = path.join(ROOT, 'src', 'tools');
const DIST = path.join(ROOT, 'dist');

const REMOTE = /^(https?:)?\/\//i;

function fail(msg) {
  console.error('inline: ' + msg);
  process.exit(1);
}

function inline(entry) {
  const dir = path.dirname(entry);
  let html = fs.readFileSync(entry, 'utf8');

  html = html.replace(
    /<link\b[^>]*\brel=["']?stylesheet["']?[^>]*>/gi,
    (tag) => {
      const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1];
      if (!href) fail('stylesheet link with no href in ' + entry);
      if (REMOTE.test(href)) fail('remote stylesheet not allowed: ' + href);
      return '<style>\n' + read(dir, href) + '\n</style>';
    }
  );

  // <img data-inline-svg src="…"> becomes the SVG markup itself. A data: URI
  // would also be self-contained, but CSS can't reach inside one, and the
  // logo needs currentColor and var(--accent) to resolve so it works on dark.
  html = html.replace(
    /<img\b[^>]*\bdata-inline-svg\b[^>]*>/gi,
    (tag) => {
      const src = (tag.match(/\bsrc=["']([^"']+)["']/i) || [])[1];
      if (!src) fail('data-inline-svg with no src in ' + entry);
      if (REMOTE.test(src)) fail('remote svg not allowed: ' + src);
      if (!/\.svg$/i.test(src)) fail('data-inline-svg expects an .svg: ' + src);

      const cls = (tag.match(/\bclass=["']([^"']*)["']/i) || [])[1] || '';
      const alt = (tag.match(/\balt=["']([^"']*)["']/i) || [])[1] || '';

      let svg = read(dir, src).replace(/<\?xml[^>]*\?>/i, '').trim();
      svg = svg.replace(/<svg\b/i, '<svg' +
        (cls ? ' class="' + cls + '"' : '') +
        (alt ? ' role="img" aria-label="' + alt + '"' : ' role="presentation" aria-hidden="true"'));
      return svg;
    }
  );

  html = html.replace(
    /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi,
    (tag, src) => {
      if (REMOTE.test(src)) fail('remote script not allowed: ' + src);
      if (/type=["']module["']/i.test(tag)) fail('ES modules break on file://: ' + src);
      return '<script>\n' + read(dir, src) + '\n</script>';
    }
  );

  verify(html, entry);
  return html;
}

function read(dir, ref) {
  const file = path.resolve(dir, ref.split('?')[0].split('#')[0]);
  if (!fs.existsSync(file)) fail('missing asset: ' + file);
  return fs.readFileSync(file, 'utf8');
}

// Static backstop for the zero-network promise. The real check is still opening
// the dist file from file:// with the network tab open.
function verify(html, entry) {
  const banned = [
    [/<link\b[^>]*\brel=["']?stylesheet/i, 'unresolved stylesheet link'],
    [/<script\b[^>]*\bsrc=/i, 'unresolved script src'],
    [/\bfetch\s*\(/, 'fetch() call'],
    [/XMLHttpRequest/, 'XMLHttpRequest'],
    [/new\s+WebSocket/, 'WebSocket'],
    [/new\s+Worker\s*\(\s*["']/, 'Worker loaded from a separate file'],
    [/\bsrc=["']https?:/i, 'remote src'],
    [/data-inline-svg/i, 'unresolved data-inline-svg'],
    [/<img\b(?![^>]*\bsrc=["']data:)/i, 'img that is not a data: URI'],
    [/@import\s+url\(/i, 'CSS @import'],
    [/https?:\/\/fonts\./i, 'remote font']
  ];
  for (const [re, label] of banned) {
    if (re.test(html)) fail(label + ' found in output for ' + entry);
  }
}

function build(entry, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, inline(entry));
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log('built ' + path.relative(ROOT, out) + ' (' + kb + ' KB)');
}

const args = process.argv.slice(2);

if (args[0] === '--all') {
  const tools = fs.existsSync(TOOLS)
    ? fs.readdirSync(TOOLS).filter((d) => fs.existsSync(path.join(TOOLS, d, 'index.html')))
    : [];
  if (!tools.length) fail('no tools with an index.html under src/tools/');
  tools.forEach((t) => build(path.join(TOOLS, t, 'index.html'), path.join(DIST, t + '.html')));
} else if (args.length === 2) {
  build(path.resolve(ROOT, args[0]), path.resolve(ROOT, args[1]));
} else {
  fail('usage: inline.js <entry.html> <out.html> | --all');
}
