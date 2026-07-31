// Opens dist/crisis-triage.html from file:// and checks both the decision
// logic and the shipped page. The decision tree is the product — if it routes
// a crisis wrong, the tool is worse than nothing.
//
//   npm test
//
// Set PW_CHROMIUM to point at a Chromium binary if Playwright can't find one.
const { chromium } = require('playwright');
const path = require('path');

const FILE = 'file://' + path.resolve(__dirname, '..', 'dist', 'crisis-triage.html');
const window_words = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;
let fails = 0;
function check(name, cond, extra) {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? ' — ' + extra : ''));
  if (!cond) fails++;
}

const base = {
  what: 'Something happened',
  where: 'facebook-group',
  spread: 'many-groups',
  truth: 'false',
  harm: 'some',
  fault: 'victim',
  proof: 'yes',
  safety: 'no',
  daysOut: '60'
};

(async () => {
  const browser = await chromium.launch(
    process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
  );
  const page = await browser.newPage();

  const requests = [];
  page.on('request', r => { if (!r.url().startsWith('file://')) requests.push(r.url()); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(FILE);
  await page.waitForTimeout(650);

  check('no non-file network requests', requests.length === 0, requests.join(', '));
  check('no page errors', errors.length === 0, errors.join(' | '));

  const assess = (over) =>
    page.evaluate(a => window.CrisisLogic.assess(a), Object.assign({}, base, over));

  // --- the quadrant -------------------------------------------------------

  let r = await assess({ truth: 'false', harm: 'none' });
  check('false + no harm => say nothing', r.call.verdict === 'Say nothing', r.call.verdict);
  check('false + no harm quadrant', r.quadrantKey === 'false-doesnt', r.quadrantKey);

  r = await assess({ truth: 'false', harm: 'serious' });
  check('false + harm => truth sandwich', /Truth sandwich/.test(r.skeleton.title), r.skeleton.title);
  check('false + harm => respond today', r.call.verdict === 'Respond, today', r.call.verdict);

  r = await assess({ truth: 'true', harm: 'serious', spread: 'many-groups' });
  check('true + harm => admit and fix', /Admit/.test(r.skeleton.title), r.skeleton.title);

  r = await assess({ truth: 'true', harm: 'none', spread: 'many-groups' });
  check('true + no harm => answer if asked', r.call.verdict === 'Answer it plainly if asked', r.call.verdict);

  r = await assess({ truth: 'partly', harm: 'some' });
  check('partly true is treated as true', r.quadrantKey === 'true-does', r.quadrantKey);

  // --- amplification restraint --------------------------------------------

  r = await assess({ spread: 'few', harm: 'some', truth: 'false' });
  check('barely spread => hold, do not publish', /Do not publish yet/.test(r.call.verdict), r.call.verdict);

  r = await assess({ spread: 'few', harm: 'serious', truth: 'false' });
  check('serious harm overrides hold even when barely spread', r.call.verdict === 'Respond, today', r.call.verdict);

  // --- get ahead of it ----------------------------------------------------

  r = await assess({ truth: 'true', harm: 'serious', spread: 'few' });
  check('true + serious + contained => get ahead of it', r.call.verdict === 'Get ahead of it', r.call.verdict);
  check('get-ahead cites the surprise line', /forgive almost anything except being surprised/.test(r.call.line));

  // --- SCCT ---------------------------------------------------------------

  r = await assess({ truth: 'true', fault: 'preventable' });
  check('preventable => rebuild', r.scct.strategy === 'Rebuild', r.scct.strategy);

  r = await assess({ truth: 'true', fault: 'accidental' });
  check('accidental => excuse', r.scct.strategy === 'Excuse', r.scct.strategy);

  r = await assess({ truth: 'false', fault: 'preventable' });
  check('false claim => victim regardless of stated fault', r.scct.strategy === 'Diminish', r.scct.strategy);

  // --- risk grid ----------------------------------------------------------

  r = await assess({ harm: 'none', spread: 'few', truth: 'false', proof: 'yes', daysOut: '200', safety: 'no' });
  check('quiet false rumor => low risk', r.riskKey === 'low', r.riskKey);

  r = await assess({ harm: 'serious', spread: 'beyond', truth: 'true', proof: 'no', daysOut: '7', safety: 'no' });
  check('worst case => extreme risk', r.riskKey === 'extreme', r.riskKey);

  const near = await assess({ daysOut: '7' });
  const far = await assess({ daysOut: '200' });
  check('closer to election raises risk', near.riskKey !== far.riskKey, near.riskKey + ' vs ' + far.riskKey);

  // --- safety -------------------------------------------------------------

  // Safety used to replace the verdict, so a candidate being threatened got a
  // warning instead of a communications plan. It is an interruption now.
  r = await assess({ safety: 'yes' });
  check('safety no longer suppresses the communications read',
    !/safety/i.test(r.call.verdict), r.call.verdict);
  check('the read is still a real call', r.call.verdict.length > 0 && !!r.call.line, r.call.verdict);
  check('safety escalates risk', r.riskKey === 'high' || r.riskKey === 'extreme', r.riskKey);
  check('safety step is still first in the plan', /Document everything/.test(r.sequence[0].what), r.sequence[0].what);

  // --- donts --------------------------------------------------------------

  r = await assess({ truth: 'false', harm: 'serious' });
  check('false+harm warns against repeating the claim', r.donts.some(d => /Repetition/.test(d)));

  r = await assess({ truth: 'true', harm: 'serious', spread: 'many-groups' });
  check('true+harm warns against partial denial', r.donts.some(d => /Partial denials/.test(d)));

  r = await assess({ truth: 'partly', harm: 'some' });
  check('partly true warns against hiding behind the wrong detail', r.donts.some(d => /inaccurate detail/.test(d)));

  const allDonts = (await assess({})).donts;
  check('never delete advice always present', allDonts.some(d => /Do not delete/.test(d)));

  // --- brand type ----------------------------------------------------------
  //
  // The site loads Barlow Condensed and JetBrains Mono from Google. This file
  // cannot make requests, so they are embedded as base64. Assert both that the
  // faces are actually in use and that embedding them did not reintroduce a
  // network call.

  const faces = await page.evaluate(() =>
    [...document.fonts].map(f => f.family + ' ' + f.weight));
  check('brand faces are embedded, not linked', faces.length >= 3, faces.join(' | '));
  check('the condensed display face is present',
    faces.some(f => /Barlow Condensed/.test(f)), faces.join(' | '));
  check('the mono label face is present',
    faces.some(f => /JetBrains Mono/.test(f)), faces.join(' | '));

  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('900 3rem "Barlow Condensed"');
  });
  check('the display face actually loads and renders', loaded);

  check('headlines are set in the display face',
    /Barlow Condensed/.test(await page.locator('#intro h1').evaluate(e => getComputedStyle(e).fontFamily)));
  check('headlines are uppercase, as the brand sets them',
    (await page.locator('#intro h1').evaluate(e => getComputedStyle(e).textTransform)) === 'uppercase');
  check('the headline uses the outlined second line',
    await page.locator('#intro h1 .outline').count() === 1);
  check('the scrolling band is present',
    await page.locator('.band-scroll').count() === 1);
  check('the live indicator is present',
    await page.locator('.masthead .blink').count() === 1);

  const csp = await page.evaluate(() =>
    (document.querySelector('meta[http-equiv="Content-Security-Policy"]') || {}).content || '');
  check('the policy permits data: fonts, or they would be blocked',
    /font-src data:/.test(csp), csp);
  check('the policy still forbids everything remote', /default-src 'none'/.test(csp));

  // A hair off the site's pure #000: at report length, light text on true
  // black visibly halates. Still reads as black, and must stay that dark.
  const pageBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const bgChannels = pageBg.match(/\d+/g).map(Number);
  check('the page is black, within a shade of the site',
    bgChannels.every(c => c <= 16), pageBg);

  // --- the logo -----------------------------------------------------------
  //
  // The logo is inlined as real SVG markup, not a data: URI, so CSS can reach
  // its fills. That is the only way it survives dark mode without shipping a
  // second file — and it must not reintroduce a network request.

  check('lockup is inlined as real svg', await page.locator('svg.logo-lockup').count() === 1);
  check('mark is inlined in the footer', await page.locator('svg.logo-mark').count() === 1);
  check('no img tags remain', await page.locator('img').count() === 0);
  check('logo carries an accessible name',
    (await page.locator('svg.logo-lockup').getAttribute('aria-label') || '').indexOf('WINNXT') === 0);
  check('logo is exposed as an image to assistive tech',
    (await page.locator('svg.logo-lockup').getAttribute('role')) === 'img');

  const logoInk = await page.evaluate(() => {
    const paths = document.querySelectorAll('svg.logo-lockup [fill]');
    let cur = 0, accent = 0;
    paths.forEach(p => {
      const f = p.getAttribute('fill');
      if (f === 'currentColor') cur++;
      if (/var\(--accent/.test(f)) accent++;
    });
    return { cur, accent };
  });
  check('logo ink follows the theme', logoInk.cur > 0, JSON.stringify(logoInk));
  check('logo flame uses the brand token', logoInk.accent > 0, JSON.stringify(logoInk));

  // It has to actually be visible on a dark background, not just theoretically.
  const darkPage = await browser.newPage({ colorScheme: 'dark' });
  const darkReqs = [];
  darkPage.on('request', r => { if (!r.url().startsWith('file://')) darkReqs.push(r.url()); });
  await darkPage.goto(FILE);
  await darkPage.waitForTimeout(300);
  const darkInk = await darkPage.evaluate(() =>
    getComputedStyle(document.querySelector('svg.logo-lockup')).color);
  check('logo ink is light in dark mode', /2[0-9]{2}|1[5-9][0-9]/.test(darkInk), darkInk);
  const box = await darkPage.locator('svg.logo-lockup').boundingBox();
  check('logo is a sensible size', box.height > 80 && box.width > 80,
    JSON.stringify(box));
  check('dark mode made no network requests', darkReqs.length === 0, darkReqs.join(', '));
  await darkPage.close();

  // --- defense only -------------------------------------------------------

  const html = await page.content();
  const offense = /amplif\w* unverified|anonymous(ly)? retweet|surrogate attack|oppo(sition)? attack|discredit the opponent/i.test(html);
  check('no offense-side content in the shipped page', !offense);

  // --- the wizard ---------------------------------------------------------

  // Walks the wizard the way a buyer does: one question at a time.
  async function runWizard(page, a) {
    await page.click('#btn-start');
    await page.waitForTimeout(400);
    await page.check('#context-' + (a.context || 'political'));
    await page.waitForTimeout(650);
    await page.fill('#what', a.what || 'A doctored screenshot is going around.');
    await page.click('#btn-next');
    await page.waitForTimeout(300);
    await page.selectOption('#where', a.where || 'facebook-group');
    await page.click('#btn-next');
    await page.waitForTimeout(300);
    await page.check('#spread-' + (a.spread || 'many-groups'));
    await page.waitForTimeout(650);            // auto-advance on click
    await page.check('#truth-' + (a.truth || 'false'));
    await page.waitForTimeout(650);
    if ((a.truth || 'false') === 'partly') {
      await page.fill('#truePart', a.truePart || 'The core is right.');
      await page.click('#btn-next');
      await page.waitForTimeout(300);
    }
    await page.check('#harm-' + (a.harm || 'serious'));
    await page.waitForTimeout(650);
    await page.check('#fault-' + (a.fault || 'victim'));
    await page.waitForTimeout(650);
    await page.check('#proof-' + (a.proof || 'yes'));
    await page.waitForTimeout(650);
    await page.check('#safety-' + (a.safety || 'no'));
    await page.waitForTimeout(650);
    await page.fill('#daysOut', String(a.daysOut === undefined ? 21 : a.daysOut));
    await page.click('#btn-next');
    await page.waitForTimeout(300);
  }

  check('starts on the intro, not the questions', await page.locator('#intro').isVisible());
  check('wizard hidden before start', await page.locator('#wizard').isHidden());
  check('report hidden before start', await page.locator('#report').isHidden());

  await page.click('#btn-start');
  await page.waitForTimeout(400);
  check('start opens the wizard', await page.locator('#wizard').isVisible());
  check('the masthead credits WINNXT Studios',
    /A WINNXT Studios tool/.test(await page.locator('.masthead').textContent()),
    await page.locator('.masthead').textContent());
  check('the first question is the political-or-business filter',
    /what kind of crisis/i.test(await page.locator('.q-label').textContent()),
    await page.locator('.q-label').textContent());
  check('progress starts at question 1',
    /Question 1/.test(await page.locator('#progress-label').textContent()));
  await page.check('#context-political');
  await page.waitForTimeout(650);
  check('one question at a time', await page.locator('.question').count() === 1, 
    'got ' + await page.locator('.question').count());
  await page.fill('#what', 'placeholder');
  const q1 = await page.locator('.question').textContent();
  check('first question still suggests dictation', /microphone/i.test(q1));
  check('the dictation caveat is gone', !/send the audio off/i.test(q1));

  check('answering the filter moves to question 2',
    /Question 2/.test(await page.locator('#progress-label').textContent()),
    await page.locator('#progress-label').textContent());
  check('progress knows the total',
    /of 10/.test(await page.locator('#progress-count').textContent()),
    await page.locator('#progress-count').textContent());

  // Required questions block progress.
  await page.fill('#what', 'A doctored screenshot is going around.');
  await page.click('#btn-next');            // past the optional free-text
  await page.waitForTimeout(400);
  await page.click('#btn-next');            // "where" is required and unanswered
  await page.waitForTimeout(400);
  check('required question blocks continue', await page.locator('#step-error').isVisible());
  check('still on the same question', (await page.locator('.q-label').textContent()).indexOf('surface') !== -1);

  await page.selectOption('#where', 'facebook-group');
  await page.click('#btn-next');
  await page.waitForTimeout(400);
  check('answering clears the error', await page.locator('#step-error').isHidden());

  // --- no flash of Continue -----------------------------------------------
  //
  // Selecting an option makes an answer exist, which briefly satisfied the
  // "show Continue once answered" rule before the auto-advance moved the page
  // on. The button appeared and vanished. Sample it continuously rather than
  // checking once, since the whole defect is that it is transient.

  async function toThirdQuestion() {
    await page.reload();
    await page.waitForTimeout(300);
    await page.click('#btn-start');
    await page.waitForTimeout(400);
    await page.check('#context-political');
    await page.waitForTimeout(650);
    await page.fill('#what', 'x');
    await page.click('#btn-next');
    await page.waitForTimeout(450);
    await page.selectOption('#where', 'facebook-group');
    await page.click('#btn-next');
    await page.waitForTimeout(450);
  }

  await toThirdQuestion();
  check('continue starts hidden on an unanswered radio question',
    await page.locator('#btn-next').isHidden());

  await page.evaluate(() => {
    window.__flashed = false;
    window.__iv = setInterval(function () {
      var b = document.getElementById('btn-next');
      if (b && !b.hasAttribute('hidden')) window.__flashed = true;
    }, 10);
  });
  await page.check('#spread-many-groups');
  await page.waitForTimeout(800);
  const flashed = await page.evaluate(() => { clearInterval(window.__iv); return window.__flashed; });
  check('continue never flashes while auto-advancing', !flashed);
  check('the page did advance', /Is it true/.test(await page.locator('.q-label').textContent()));

  await toThirdQuestion();

  // --- Continue only appears when it does something ------------------------

  check('continue is hidden on an unanswered radio question',
    await page.locator('#btn-next').isHidden());
  check('a hint explains what to do instead',
    await page.locator('#step-hint').isVisible());
  check('back is still available with continue hidden',
    await page.locator('#btn-back').isVisible());

  // Keyboard users select with arrow keys, which must NOT auto-advance — so
  // Continue has to appear for them.
  await page.locator('#spread-few').focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(500);
  check('arrow keys do not auto-advance',
    /How far has it actually gone/.test(await page.locator('.q-label').textContent()),
    await page.locator('.q-label').textContent());
  check('continue appears once an answer exists',
    await page.locator('#btn-next').isVisible());
  check('the hint goes away once answered',
    await page.locator('#step-hint').isHidden());
  check('continue works for keyboard users', await (async () => {
    await page.click('#btn-next');
    await page.waitForTimeout(400);
    return /Is it true/.test(await page.locator('.q-label').textContent());
  })());
  await page.click('#btn-back');
  await page.waitForTimeout(400);

  // Clicking a radio advances on its own.
  await page.check('#spread-many-groups');
  await page.waitForTimeout(650);
  check('clicking an option advances automatically',
    (await page.locator('.q-label').textContent()).indexOf('true') !== -1,
    await page.locator('.q-label').textContent());

  // Back works.
  await page.click('#btn-back');
  await page.waitForTimeout(400);
  check('back returns to the previous question',
    (await page.locator('.q-label').textContent()).indexOf('gone') !== -1);
  check('previous answer is still selected', await page.isChecked('#spread-many-groups'));

  // The conditional question only exists for "partly true".
  await page.click('#btn-next');
  await page.waitForTimeout(400);
  await page.check('#truth-partly');
  await page.waitForTimeout(650);
  check('partly true inserts the follow-up question', await page.locator('#truePart').count() === 1);
  check('total step count grows with it',
    /of 11/.test(await page.locator('#progress-count').textContent()),
    await page.locator('#progress-count').textContent());

  await page.click('#btn-back');
  await page.waitForTimeout(400);
  await page.check('#truth-false');
  await page.waitForTimeout(650);
  check('follow-up disappears again', await page.locator('#truePart').count() === 0);

  await page.check('#harm-serious');
  await page.waitForTimeout(650);
  await page.check('#fault-victim');
  await page.waitForTimeout(650);
  await page.check('#proof-yes');
  await page.waitForTimeout(650);
  await page.check('#safety-no');
  await page.waitForTimeout(650);
  check('last question is reached', await page.locator('#daysOut').count() === 1);
  check('last button says see my read',
    /See my read/.test(await page.locator('#btn-next').textContent()));

  await page.fill('#daysOut', '21');
  await page.click('#btn-next');
  await page.waitForTimeout(300);

  // --- back always works (regression) -------------------------------------
  //
  // Bug: choosing an option queued an auto-advance in two chained timers, and
  // Back only cancelled the first. Pressing Back in the window between them
  // dragged the user forward again — so Back appeared broken on every radio
  // question, which is every question after the second.

  await page.reload();
  await page.waitForTimeout(300);
  await page.click('#btn-start');
  await page.waitForTimeout(400);
  check('back on the first question is available',
    !(await page.locator('#btn-back').isDisabled()));
  check('back on the first question is labelled for the intro',
    /Back to start/.test(await page.locator('#btn-back').textContent()));
  await page.click('#btn-back');
  await page.waitForTimeout(400);
  check('back from the first question reaches the intro',
    await page.locator('#intro').isVisible());

  // Walk to a radio question and race Back against the pending advance.
  // 100ms and 300ms both land while the advance is still pending (it commits at
  // 260ms + 170ms). Anything closer to 430ms is genuinely ambiguous: by then
  // the advance may have legitimately completed, and going back one step is the
  // correct answer rather than a bug.
  for (const waitMs of [100, 250, 300]) {
    await page.click('#btn-start');
    await page.waitForTimeout(350);
    await page.check('#context-political');
    await page.waitForTimeout(650);
    await page.click('#btn-next');
    await page.waitForTimeout(400);
    await page.selectOption('#where', 'facebook-group');
    await page.click('#btn-next');
    await page.waitForTimeout(400);

    await page.check('#spread-many-groups');
    await page.waitForTimeout(waitMs);
    await page.click('#btn-back');
    await page.waitForTimeout(900);         // long enough for any orphan timer
    check('back wins over a pending auto-advance (' + waitMs + 'ms)',
      /Question 3/.test(await page.locator('#progress-label').textContent()),
      await page.locator('#progress-label').textContent());

    await page.reload();
    await page.waitForTimeout(300);
  }

  // Back all the way out from deep in the flow.
  await runWizard(page, {});
  await page.locator('.summary-list button.link').last().click();
  await page.waitForTimeout(400);
  let guard = 0;
  while (await page.locator('#wizard').isVisible() && guard++ < 15) {
    await page.click('#btn-back');
    await page.waitForTimeout(300);
  }
  check('back repeatedly walks all the way out to the intro',
    await page.locator('#intro').isVisible(), 'gave up after ' + guard);

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, {});

  // --- the report ---------------------------------------------------------

  check('report replaces the wizard', await page.locator('#report').isVisible());
  check('wizard is hidden in the report', await page.locator('#wizard').isHidden());

  const verdictText = await page.locator('.verdict').textContent();
  check('report leads with the verdict', /Respond, today/.test(verdictText), verdictText);

  // A catch-all prose rule once outranked .verdict and painted it body-grey.
  const colours = await page.evaluate(() => ({
    verdict: getComputedStyle(document.querySelector('.verdict')).color,
    body: getComputedStyle(document.querySelector('.report-block p:not(.verdict):not(.eyebrow)')).color,
    accentDeep: getComputedStyle(document.documentElement).getPropertyValue('--accent-deep').trim()
  }));
  check('the verdict is not the same colour as body text',
    colours.verdict !== colours.body, JSON.stringify(colours));
  check('the verdict is rendered in the brand flame',
    colours.verdict === 'rgb(224, 65, 60)', colours.verdict);

  check('at-a-glance tiles render', await page.locator('.tile').count() === 3);
  const tileText = await page.locator('.tiles').textContent();
  const readText = await page.locator('#read').textContent();
  const tileValue = await page.locator('.tile-value').first().textContent();
  check('the tile value is not repeated as a heading below it',
    !(await page.locator('#read h2').allTextContents()).some(h => h.trim() === tileValue.trim()),
    tileValue);
  const tileBoxes = await page.locator('.tile').evaluateAll(els =>
    els.map(e => { const r = e.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height) }; }));
  check('tiles are the same height even when one wraps',
    new Set(tileBoxes.map(t => t.h)).size === 1, JSON.stringify(tileBoxes));
  check('tiles sit on the same line',
    new Set(tileBoxes.map(t => t.y)).size === 1, JSON.stringify(tileBoxes));
  check('tile contents are left aligned, as the brand sets them',
    (await page.locator('.tile').first().evaluate(e => getComputedStyle(e).textAlign)) === 'start',
    await page.locator('.tile').first().evaluate(e => getComputedStyle(e).textAlign));
  check('risk meter has four segments', await page.locator('.meter-seg').count() === 4);
  check('exactly one risk segment is lit', await page.locator('.meter-seg.is-on').count() === 1);
  check('lit segment matches the risk level',
    /High/.test(await page.locator('.meter-seg.is-on').textContent()),
    await page.locator('.meter-seg.is-on').textContent());

  check('plan renders steps', await page.locator('.sequence li').count() >= 6);
  check('what-not-to-do renders', await page.locator('.donts li').count() >= 4);
  check('summary of answers renders', await page.locator('.summary-list dt').count() >= 8);
  // The evidence and the answer log close out the read itself, so the last
  // thing before "save this" is what the advice was built on.
  check('the receipt sits after the advice and before the actions',
    await page.evaluate(() => {
      var plan = document.querySelector('#plan');
      var sum = document.querySelector('.summary');
      var actions = document.querySelector('.actions');
      return !!(plan.compareDocumentPosition(sum) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        !!(sum.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING);
    }));

  // Editing an answer from the report goes back to that question.
  await page.locator('.summary-list button.link').first().click();
  await page.waitForTimeout(250);
  check('change takes you back to the wizard', await page.locator('#wizard').isVisible());

  // Walk forward again to get back to the report.
  for (let i = 0; i < 12 && await page.locator('#wizard').isVisible(); i++) {
    await page.click('#btn-next');
    await page.waitForTimeout(400);
  }
  check('can walk back to the report', await page.locator('#report').isVisible());

  // --- evidence -----------------------------------------------------------

  check('citations render on the read', await page.locator('.cite').count() >= 2,
    'got ' + await page.locator('.cite').count());
  check('every citation names a source',
    (await page.locator('.cite-source').count()) === (await page.locator('.cite').count()));
  check('the open-any-one instruction is gone',
    !/Open any one for the full story/.test(await page.locator('.cases-block').textContent()));
  check('historical cases render', await page.locator('.case').count() >= 1,
    'got ' + await page.locator('.case').count());
  check('each case has a lesson',
    (await page.locator('.case-lesson').count()) === (await page.locator('.case').count()));
  check('sources list renders', await page.locator('.sources li').count() >= 3,
    'got ' + await page.locator('.sources li').count());

  const sourcesText = await page.locator('.sources').textContent();
  check('cites the SCCT paper by name', /Coombs/.test(sourcesText));
  check('cites a real journal', /Public Relations Review|Political Behavior|Corporate Reputation Review/.test(sourcesText));

  const caseText = await page.locator('.cases').textContent();
  check('false-and-damaging shows the slow-response case', /Kerry/.test(caseText), caseText.slice(0, 80));

  // Evidence follows the outcome, not the page.
  const quiet = await page.evaluate(() => {
    const r = window.CrisisLogic.assess({ where: 'facebook-group', spread: 'many-groups',
      truth: 'false', harm: 'none', fault: 'victim', proof: 'yes', safety: 'no', daysOut: '60' });
    return window.CrisisEvidence.forAssessment(r, { where: 'facebook-group', safety: 'no' });
  });
  check('say-nothing cites the Streisand research',
    quiet.citations.some(c => /Streisand/.test(c.source)));
  check('say-nothing shows the Streisand case',
    quiet.cases.some(c => /Streisand/.test(c.who)));

  const preempt = await page.evaluate(() => {
    const r = window.CrisisLogic.assess({ where: 'private', spread: 'few',
      truth: 'true', harm: 'serious', fault: 'preventable', proof: 'no', safety: 'no', daysOut: '60' });
    return window.CrisisEvidence.forAssessment(r, { where: 'private', safety: 'no' });
  });
  check('get-ahead cites the stealing thunder study',
    preempt.citations.some(c => /Stealing Thunder/i.test(c.source)));
  check('get-ahead shows a pre-emption case',
    preempt.cases.some(c => /Clinton|Johnson/.test(c.who)));

  const unsafe = await page.evaluate(() => {
    const r = window.CrisisLogic.assess({ where: 'social', spread: 'many-groups',
      truth: 'false', harm: 'some', fault: 'victim', proof: 'yes', safety: 'yes', daysOut: '30' });
    return window.CrisisEvidence.forAssessment(r, { where: 'social', safety: 'yes' });
  });
  check('safety case is surfaced first when someone is unsafe',
    /school board/i.test(unsafe.cases[0].who), unsafe.cases[0].who);

  // Cases span both parties and business — the tool ships nonpartisan.
  const everyone = await page.evaluate(() =>
    Object.values(window.CrisisEvidence.CASES).flat().map(c => c.who).join(' | '));
  check('cases include both parties', /Nixon|Sanford/.test(everyone) && /Clinton|Weiner|Kerry/.test(everyone));
  check('cases include business', /Johnson|Domino/.test(everyone));

  // --- precedent placement and depth --------------------------------------
  //
  // The cases are the most persuasive thing on the page, so they sit with the
  // advice rather than at the bottom under the citations.

  // Read across the whole report, not one container: the sections now live in
  // several slots and what matters is the order a person meets them in.
  const order = await page.evaluate(() =>
    [...document.querySelectorAll('#report h2')].map(h => h.textContent || ''));
  const iPlan = order.findIndex(t => /What to do, in order/.test(t));
  const iCases = order.findIndex(t => /How this has gone before/.test(t));
  const iSources = order.findIndex(t => /Why this is the advice/.test(t));
  const iDraft = order.findIndex(t => /Your statement|publish it later|Do not publish/.test(t));
  const iSummary = order.findIndex(t => /What you told it/.test(t));
  check('quadrant and blame are stated once, not twice',
    order.filter(t => /True, and it hurts|False, and it hurts|minimal blame|low blame|high blame/.test(t)).length === 0,
    order.join(' > '));
  check('precedent follows the advice', iCases > iPlan && iPlan !== -1, order.join(' > '));
  check('precedent comes before the citations', iCases < iSources, order.join(' > '));
  // Be told whether to speak, see that it worked for other people, then write.
  check('drafting comes after the precedent', iDraft > iCases && iDraft !== -1, order.join(' > '));
  // Receipts after the advice. Nobody arrives at a crisis report wanting to
  // re-read their own answers first.
  check('the answer log follows the advice', iSummary > iDraft && iSummary > iSources, order.join(' > '));

  check('each case has an expandable history',
    (await page.locator('.case-more').count()) === (await page.locator('.case').count()),
    (await page.locator('.case-more').count()) + ' of ' + (await page.locator('.case').count()));
  check('histories start collapsed', await page.locator('.case-more[open]').count() === 0);

  const firstCase = page.locator('.case-more').first();
  check('history is hidden before opening', await firstCase.locator('.case-body').isHidden());
  await firstCase.locator('summary').click();
  await page.waitForTimeout(250);
  check('opening a case reveals the history', await firstCase.locator('.case-body').isVisible());

  const subs = await firstCase.locator('.case-sub').allTextContents();
  check('history covers background, reaction, handling and outcome',
    subs.length === 4, subs.join(' / '));
  const bodyLen = (await firstCase.locator('.case-body').textContent()).length;
  check('history has real depth', bodyLen > 600, bodyLen + ' chars');
  await firstCase.locator('summary').click();

  // --- the intro ----------------------------------------------------------

  await page.reload();
  await page.waitForTimeout(300);
  const introText = await page.locator('#intro').textContent();
  check('intro says who WINNXT is', /political communications firm/i.test(introText));
  check('intro explains the rules-based model', /decision model|Rules, not vibes/i.test(introText));
  check('intro explains the use of real cases', /Real cases|already ran this experiment/i.test(introText));
  check('intro asks for honest answers', /Answer honestly/i.test(introText));
  check('intro still leads with the do-not-post warning',
    /don't post while you're angry/.test(introText));
  check('intro keeps the privacy promise', /Nothing you type here is saved anywhere/.test(introText));
  await page.click('#btn-start');
  await page.waitForTimeout(400);
  check('intro still starts the flow', await page.locator('#wizard').isVisible());
  await page.reload();
  await page.waitForTimeout(300);
  const startTop = await page.evaluate(() =>
    Math.round(document.getElementById('btn-start').getBoundingClientRect().top + window.scrollY));
  check('start is reachable without reading the brochure', startTop < 900, startTop + 'px down');
  check('there is one start, not two', await page.locator('#btn-start-2').count() === 0);
  // The band closes the intro rather than interrupting it: everything a
  // first-timer has to read comes first, and the real footer still follows, so
  // the band never becomes the last thing on the page.
  check('the explanation comes before the scrolling band',
    await page.evaluate(() => {
      var band = document.querySelector('.band-scroll');
      var blocks = document.querySelectorAll('#intro .intro-block');
      var last = blocks[blocks.length - 1];
      return blocks.length === 3 &&
        !!(last.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING);
    }));
  check('the band is not the last thing on the page',
    await page.evaluate(() => {
      var band = document.querySelector('.band-scroll');
      var foot = document.querySelector('.site-foot');
      return !!(band.compareDocumentPosition(foot) & Node.DOCUMENT_POSITION_FOLLOWING);
    }));
  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, {});

  // --- the draft -----------------------------------------------------------
  //
  // The tool assembles a statement from the user's own words in the structure
  // the read prescribed. Two things must hold: it never invents substance, and
  // when the read says stay quiet it produces nothing publishable.

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, {});   // false + serious + spread => respond today

  check('the draft section renders', await page.locator('.draft-block').count() === 1);
  check('it asks for the truth and the claim on a false story',
    await page.locator('#draft-truth').count() === 1 &&
    await page.locator('#draft-claim').count() === 1);
  check('it says the voice is neutral and must be replaced',
    /neutral voice on purpose/.test(await page.locator('.draft-warning').textContent()) &&
    /sound like you/.test(await page.locator('.draft-warning').textContent()));
  check('it points at a lawyer for legal questions',
    /lawyer/.test(await page.locator('.draft-warning').textContent()));

  check('three lengths are offered', await page.locator('.draft-out').count() === 3);
  check('required gaps are called out before they are filled',
    await page.locator('#draft-missing').isVisible());

  // --- what they typed has to go somewhere --------------------------------
  //
  // A tester wrote the whole story into the wizard, never saw it again, and
  // was then asked to type it a second time into the draft.

  const situation = await page.locator('.situation').textContent();
  check('the report quotes the description back',
    /doctored screenshot is going around/.test(situation), situation.slice(0, 120));
  check('the situation block carries the surrounding facts',
    /Spread/.test(situation) && /Surfaced on/.test(situation), situation.slice(0, 200));
  const situationTop = await page.evaluate(() => {
    const s = document.querySelector('.situation');
    const p = document.querySelector('#plan');
    return s.getBoundingClientRect().top < p.getBoundingClientRect().top;
  });
  check('it sits with the read, not at the bottom of the page', situationTop);

  const seededClaim = await page.inputValue('#draft-claim');
  check('a false story prefills the claim from what they typed',
    /doctored screenshot/.test(seededClaim), seededClaim);
  check('a prefilled field says it needs editing',
    /Carried over/.test(await page.locator('.draft-field[data-seeded]').first().textContent()));

  await page.fill('#draft-claim', 'that I doctored the minutes');
  await page.waitForTimeout(200);
  check('editing a prefilled field clears the carried-over marker',
    await page.locator('.draft-field[data-seeded]').count() === 0);

  await page.fill('#draft-truth', 'I voted for the after-school programme in full');
  await page.fill('#draft-claim', 'that I voted to cut after-school funding');
  await page.waitForTimeout(300);

  const shortDraft = await page.locator('#draft-text-short').textContent();
  check('the draft uses the words the user typed',
    /after-school programme in full/.test(shortDraft), shortDraft.slice(0, 80));
  check('the false claim is stated once and then contradicted',
    (shortDraft.match(/voted to cut after-school funding/g) || []).length === 1 &&
    /That is not true/.test(shortDraft));
  check('the fact leads, not the denial',
    shortDraft.indexOf('I voted for') < shortDraft.indexOf('A claim is circulating'));
  check('a word count is shown',
    /\d+ words/.test(await page.locator('#count-short').textContent()),
    await page.locator('#count-short').textContent());
  check('the gap warning clears once the required parts are in',
    await page.locator('#draft-missing').isHidden());

  const holdingDraft = await page.locator('#draft-text-holding').textContent();
  check('the holding line is shorter than the statement',
    window_words(holdingDraft) < window_words(shortDraft),
    window_words(holdingDraft) + ' vs ' + window_words(shortDraft));

  // Nothing invented: an empty optional slot must leave no filler behind.
  check('empty optional slots produce no filler',
    !/\[|\{|TBD|xxx/i.test(shortDraft), shortDraft);

  const handoffWithDraft = await page.locator('#handoff-text').textContent();
  check('the handoff carries the draft once it is usable',
    /My draft so far/.test(handoffWithDraft));

  // The blame type changes the responsibility clause rather than the order.
  const clauses = await page.evaluate(() => {
    const mk = (fault) => {
      const a = { context: 'political', where: 'facebook-group', spread: 'many-groups',
        truth: 'true', harm: 'serious', fault: fault, proof: 'yes', safety: 'no', daysOut: '30' };
      const r = window.CrisisLogic.assess(a);
      return window.CrisisStatements.build(r, { happened: 'I missed the vote', fix: 'I will be there next time' }, 'short');
    };
    return { preventable: mk('preventable'), victim: mk('victim'), accidental: mk('accidental') };
  });
  check('a preventable failure apologises', /I am sorry/.test(clauses.preventable));
  check('being the victim of something does not apologise',
    !/I am sorry/.test(clauses.victim), clauses.victim);
  check('an accident explains without pretending it did not happen',
    /not what I intended/.test(clauses.accidental));

  // Stay quiet must yield nothing postable.
  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, { truth: 'false', harm: 'none' });
  check('a stay-quiet read offers no statement to publish',
    await page.locator('#draft-text-short').count() === 0 &&
    await page.locator('#draft-text-long').count() === 0);
  check('it offers only the line for when someone asks',
    await page.locator('#draft-text-holding').count() === 1);
  check('and says so plainly',
    /Do not publish anything/.test(await page.locator('.draft-block').textContent()));
  check('a stay-quiet read does not ask for statement material',
    await page.locator('.draft-fields').count() === 0);

  // A true story runs down the other side of the shape: the description
  // becomes what happened, and the part they said was true becomes context.
  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, {
    truth: 'partly', harm: 'serious', fault: 'preventable',
    what: 'I posted about the school budget in 2016.',
    truePart: 'I did write the post.'
  });
  check('a true story prefills what happened',
    /school budget in 2016/.test(await page.inputValue('#draft-happened')));
  // Deliberately not seeded into the context slot: "which part is true" is a
  // different question from "the context that matters", and putting it there
  // built a statement that argued with itself. It surfaces in the report, the
  // answer log and the handoff instead.
  check('the true part is not forced into the context slot',
    (await page.inputValue('#draft-context')) === '');
  check('both quotes appear in the report',
    /school budget in 2016/.test(await page.locator('.situation').textContent()) &&
    /I did write the post/.test(await page.locator('.situation').textContent()));
  const seededShort = await page.locator('#draft-text-short').textContent();
  check('the statement is usable straight away from the wizard answers',
    /school budget in 2016/.test(seededShort), seededShort.slice(0, 140));

  // Hold: write it, do not publish it.
  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, { spread: 'few', harm: 'some' });
  check('a hold read frames the draft as prepared, not published',
    /publish it later/i.test(await page.locator('.draft-block h2').textContent()),
    await page.locator('.draft-block h2').textContent());

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, {});

  // --- the safety interstitial --------------------------------------------

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, { safety: 'no' });
  check('no interruption when nobody is unsafe',
    !(await page.evaluate(() => document.getElementById('safety-modal').open)));

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, { safety: 'yes' });
  check('an unsafe answer interrupts on arrival',
    await page.evaluate(() => document.getElementById('safety-modal').open));
  const modalText = await page.locator('#safety-modal').textContent();
  check('the interruption says to document and report',
    /Document everything/.test(modalText) && /law enforcement/.test(modalText));
  check('the interruption disclaims legal advice', /not legal advice/.test(modalText));

  // The report is underneath, complete, not replaced.
  await page.click('#btn-safety-ack');
  await page.waitForTimeout(400);
  check('acknowledging closes the interruption',
    !(await page.evaluate(() => document.getElementById('safety-modal').open)));
  check('the communications read is underneath it',
    await page.locator('.verdict').count() === 1);
  const safeVerdict = await page.locator('.verdict').textContent();
  check('the read is a real call, not a safety warning',
    !/safety/i.test(safeVerdict), safeVerdict);
  check('the plan survived', await page.locator('.sequence li').count() >= 6);
  check('the safety guidance is not repeated in the report body',
    await page.locator('#read .safety').count() === 0);
  check('the safety step leads the plan',
    /Document everything/.test(await page.locator('.sequence li').first().textContent()));

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, {});

  // --- the sticky verdict -------------------------------------------------
  //
  // The report runs to several screens. The answer has to stay reachable.

  check('verdict bar is hidden while the hero is visible',
    await page.locator('#verdict-bar').isHidden());

  await page.evaluate(() => window.scrollTo(0, 1800));
  await page.waitForTimeout(500);
  check('verdict bar appears once the hero scrolls away',
    await page.locator('#verdict-bar').isVisible());
  check('verdict bar carries the verdict',
    /Respond, today/.test(await page.locator('#verdict-bar-text').textContent()));
  check('verdict bar carries the risk level',
    /risk/i.test(await page.locator('#verdict-bar-risk').textContent()));
  check('verdict bar is labelled for screen readers',
    /Back to top/.test(await page.locator('#verdict-bar').getAttribute('aria-label')));

  await page.click('#verdict-bar');
  await page.waitForTimeout(700);
  check('verdict bar returns you to the top',
    (await page.evaluate(() => window.scrollY)) < 60,
    String(await page.evaluate(() => window.scrollY)));
  await page.waitForTimeout(300);
  check('verdict bar hides again at the top',
    await page.locator('#verdict-bar').isHidden());

  // --- focus is not dropped ------------------------------------------------

  await page.evaluate(() => window.scrollTo(0, 0));
  const focused = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
  check('focus lands on the report heading, not the body',
    focused === 'report-heading', focused);

  // --- legibility ----------------------------------------------------------
  //
  // Body copy was set in the site's #888888 tagline grey. Over a long report on
  // black that is tiring, and the ramp was inverted: "faint" was brighter than
  // body. Guard both the brightness and the ordering.

  const ramp = await page.evaluate(() => {
    const val = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const lum = hex => {
      const c = hex.replace('#','').match(/../g).map(x => {
        const v = parseInt(x,16)/255;
        return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
      });
      return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
    };
    return {
      body: lum(val('--ink-soft')),
      secondary: lum(val('--ink-faint')),
      micro: lum(val('--ink-ghost')),
      ink: lum(val('--ink'))
    };
  });
  check('the text ramp descends: ink, body, secondary, micro',
    ramp.ink > ramp.body && ramp.body > ramp.secondary && ramp.secondary > ramp.micro,
    JSON.stringify(ramp));

  const proseContrast = await page.evaluate(() => {
    const el = document.querySelector('.case-what') || document.querySelector('#plan p');
    const parse = c => c.match(/\d+/g).map(Number);
    const lin = v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    const lum = ([r,g,b]) => 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
    const fg = lum(parse(getComputedStyle(el).color));
    const bg = lum(parse(getComputedStyle(document.body).backgroundColor));
    return (Math.max(fg,bg)+0.05) / (Math.min(fg,bg)+0.05);
  });
  check('body copy is comfortably above the AA floor, not sitting on it',
    proseContrast > 9, proseContrast.toFixed(1) + ':1');

  const sizes = await page.evaluate(() => ({
    verdict: parseFloat(getComputedStyle(document.querySelector('.verdict')).fontSize),
    heading: parseFloat(getComputedStyle(document.querySelector('#plan h2')).fontSize)
  }));
  check('the verdict outranks section headings by a wide margin',
    sizes.verdict > sizes.heading * 2, JSON.stringify(sizes));

  // --- one job for red -----------------------------------------------------

  // The brand sets section labels in flame red with a 40px rule, so red here
  // is correct. What still matters is that they are rationed.
  // Scoped to the report: the safety interstitial deliberately uses the danger
  // red rather than the brand flame.
  const eyebrowColour = await page.locator('#plan .eyebrow').first().evaluate(e => getComputedStyle(e).color);
  check('eyebrows use the brand flame', eyebrowColour === 'rgb(201, 48, 44)', eyebrowColour);
  const rule = await page.locator('#plan .eyebrow').first().evaluate(e =>
    getComputedStyle(e, '::before').backgroundColor + ' ' + getComputedStyle(e, '::before').width);
  check('eyebrows carry the brand rule', /rgb\(201, 48, 44\) 40px/.test(rule), rule);
  const eyebrowCount = await page.locator('#report .eyebrow').count();
  // One per act, and the report has six: the situation, the plan, the
  // precedent, the drafting, the evidence, and taking it with you.
  check('eyebrows are rationed to act boundaries', eyebrowCount <= 6, 'got ' + eyebrowCount);

  // --- the plan reads as a schedule ---------------------------------------

  const bands = await page.locator('.band').allTextContents();
  check('plan groups steps under time bands', bands.length >= 3, bands.join(' | '));
  check('no time band repeats', new Set(bands).size === bands.length, bands.join(' | '));
  // CSS counters can't be read back through getComputedStyle — it returns the
  // unresolved counter() — so assert the mechanism: the counter resets once on
  // the block, never on the per-band lists, which is what keeps numbering
  // continuous across bands rather than restarting at each one.
  const counters = await page.evaluate(() => ({
    block: getComputedStyle(document.querySelector('.plan-block')).counterReset,
    lists: [...document.querySelectorAll('.sequence')].map(l => getComputedStyle(l).counterReset)
  }));
  check('the step counter resets once, on the block', /step/.test(counters.block), counters.block);
  check('per-band lists do not restart the count',
    counters.lists.every(c => !/step/.test(c)), JSON.stringify(counters.lists));
  check('there is exactly one plan block',
    await page.locator('.plan-block').count() === 1);

  // --- citations are stated once ------------------------------------------

  check('source list is references only, no repeated claims',
    await page.locator('.source-claim').count() === 0);
  check('sources still listed', await page.locator('.sources li').count() >= 3);

  // --- a primary action ----------------------------------------------------

  check('the json download is gone', await page.locator('#btn-download').count() === 0);
  check('print is the primary action',
    (await page.locator('#btn-print').getAttribute('class') || '').indexOf('btn-lg') !== -1);
  check('start over is demoted out of the button row',
    (await page.locator('#btn-restart').getAttribute('class') || '').indexOf('link') !== -1);

  // --- house style --------------------------------------------------------

  const pageHtml = await page.content();
  check('no em dashes anywhere in the shipped file', pageHtml.indexOf('\u2014') === -1,
    pageHtml.indexOf('\u2014') === -1 ? '' : pageHtml.slice(Math.max(0, pageHtml.indexOf('\u2014') - 70), pageHtml.indexOf('\u2014') + 40));
  check('the report does not say "Your read"',
    !/Your read/.test(await page.locator('#report').textContent()));

  // --- political or business ----------------------------------------------

  const politicalCopy = await page.locator('#report').textContent();
  check('political run talks about voters', /voters/i.test(politicalCopy));

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, { context: 'business' });
  const businessCopy = await page.locator('#report').textContent();
  check('business run reaches a report', await page.locator('#report').isVisible());
  check('business run never says voters', !/\bvoters\b/i.test(businessCopy),
    (businessCopy.match(/.{0,60}voters.{0,40}/i) || [''])[0]);
  check('business run talks about customers', /customers/i.test(businessCopy));
  check('business run avoids election language', !/\belection\b/i.test(businessCopy),
    (businessCopy.match(/.{0,60}election.{0,40}/i) || [''])[0]);
  check('business run gets a business case, not four political ones',
    /Tesla|Pepsi/.test(businessCopy), (businessCopy.match(/.{0,40}(Tesla|Pepsi).{0,40}/) || [''])[0]);

  // Precedent must never argue with the verdict above it. Cases were being
  // selected by the call and by the quadrant independently and concatenated,
  // so a report headed "do not publish yet" carried four cases about
  // disclosing everything at once.
  const coherence = await page.evaluate(() => {
    const disclosureNow = ['Johnson & Johnson', 'Richard Nixon', 'Anthony Weiner',
      'Mitt Romney', 'Maple Leaf Foods', 'BP', 'Bud Light', 'John Kerry'];
    const run = (over) => {
      const a = Object.assign({ context: 'political', where: 'facebook-group', spread: 'few',
        truth: 'true', harm: 'some', fault: 'accidental', proof: 'yes', safety: 'no',
        daysOut: '60' }, over);
      const r = window.CrisisLogic.assess(a);
      return {
        publish: r.call.publish,
        who: window.CrisisEvidence.forAssessment(r, a).cases.map(c => c.who)
      };
    };
    const quiet = [
      run({}),                                                   // hold
      run({ truth: 'false', harm: 'none', spread: 'many-groups' }), // say nothing
      run({ context: 'business' }),                              // hold, business
      run({ truth: 'false', spread: 'few', harm: 'some' })       // hold
    ];
    return {
      quiet,
      leaked: quiet.filter(x => x.who.some(w => disclosureNow.indexOf(w) !== -1))
    };
  });
  check('a hold or stay-quiet call never cites a disclose-now case',
    coherence.leaked.length === 0, JSON.stringify(coherence.leaked));
  check('quiet calls still cite something', coherence.quiet.every(x => x.who.length > 0),
    JSON.stringify(coherence.quiet.map(x => x.who)));

  const volume = await page.evaluate(() => {
    const a = { context: 'political', where: 'facebook-group', spread: 'many-groups',
      truth: 'true', harm: 'serious', fault: 'accidental', proof: 'yes', safety: 'no', daysOut: '60' };
    return window.CrisisEvidence.forAssessment(window.CrisisLogic.assess(a), a).cases.length;
  });
  check('the precedent list stays a set of examples, not an anthology',
    volume <= 4, String(volume));

  // The business case is chosen by the same decision the political ones are.
  const bizCases = await page.evaluate(() => {
    const pick = (over) => {
      const a = Object.assign({ where: 'social', spread: 'many-groups', truth: 'false',
        harm: 'serious', fault: 'victim', proof: 'yes', safety: 'no', daysOut: '30',
        context: 'business' }, over);
      return window.CrisisEvidence.forAssessment(window.CrisisLogic.assess(a), a)
        .cases.map(c => c.who);
    };
    return { falseDoes: pick({}), trueDoes: pick({ truth: 'true', fault: 'accidental' }) };
  });
  check('a false damaging claim shows the false-claim business case',
    bizCases.falseDoes.some(w => /Pepsi/.test(w)), bizCases.falseDoes.join(' | '));
  const bigCases = await page.evaluate(() => {
    const pick = (over) => {
      const a = Object.assign({ where: 'social', spread: 'many-groups', truth: 'true',
        harm: 'serious', fault: 'preventable', proof: 'yes', safety: 'no', daysOut: '60' }, over);
      return window.CrisisEvidence.forAssessment(window.CrisisLogic.assess(a), a)
        .cases.map(c => c.who);
    };
    return {
      bizPreventable: pick({ context: 'business' }),
      campaign: pick({ context: 'political' })
    };
  });
  check('a preventable business failure shows both the model and the cautionary case',
    bigCases.bizPreventable.some(w => /Maple Leaf/.test(w)) &&
    bigCases.bizPreventable.some(w => /BP/.test(w)), bigCases.bizPreventable.join(' | '));
  check('campaigns get a national-scale example, not only local ones',
    bigCases.campaign.some(w => /Romney/.test(w)), bigCases.campaign.join(' | '));

  // The vacuum case is about the response, not the underlying decision, and it
  // must never reach the political context where it would read as a signal
  // rather than as guidance.
  const vacuum = await page.evaluate(() => {
    const pick = (over) => {
      const a = Object.assign({ where: 'social', spread: 'many-groups', truth: 'true',
        harm: 'serious', fault: 'accidental', proof: 'yes', safety: 'no', daysOut: '60' }, over);
      const found = window.CrisisEvidence.forAssessment(window.CrisisLogic.assess(a), a).cases;
      const one = found.filter(c => /Bud Light/.test(c.who));
      return { names: found.map(c => c.who), one: JSON.stringify(one) };
    };
    return { business: pick({ context: 'business' }), political: pick({ context: 'political' }) };
  });
  check('business gets the vacuum case for a true damaging story',
    vacuum.business.names.some(w => /Bud Light/.test(w)), vacuum.business.names.join(' | '));
  check('the vacuum case never reaches the political context',
    !vacuum.political.names.some(w => /Bud Light/.test(w)), vacuum.political.names.join(' | '));
  check('the vacuum case is written about the response, not the partnership',
    /two weeks|fortnight/.test(vacuum.business.one) &&
    !/\btrans\b|\bLGBT|\bwoke\b|\bgender\b/i.test(vacuum.business.one),
    vacuum.business.one.slice(0, 90));

  check('a true damaging one shows a different business case',
    !bizCases.trueDoes.some(w => /Pepsi/.test(w)), bizCases.trueDoes.join(' | '));
  check('business handoff briefs a corporate advisor',
    /corporate communications advisor/.test(await page.locator('#handoff-text').textContent()));

  // The deadline question adapts rather than asking a company about polling day.
  await page.reload();
  await page.waitForTimeout(300);
  await page.click('#btn-start');
  await page.waitForTimeout(400);
  await page.check('#context-business');
  await page.waitForTimeout(650);
  await page.fill('#what', 'x');
  await page.click('#btn-next'); await page.waitForTimeout(450);
  await page.selectOption('#where', 'facebook-group');
  await page.click('#btn-next'); await page.waitForTimeout(450);
  for (const id of ['#spread-many-groups', '#truth-false', '#harm-serious', '#fault-victim', '#proof-yes', '#safety-no']) {
    await page.check(id); await page.waitForTimeout(650);
  }
  const deadlineQ = await page.locator('.q-label').textContent();
  check('business deadline question is not about the election',
    /next big moment/i.test(deadlineQ), deadlineQ);

  // The worked example in the first field has to belong to the reader's world.
  await page.reload();
  await page.waitForTimeout(300);
  await page.click('#btn-start');
  await page.waitForTimeout(400);
  await page.check('#context-business');
  await page.waitForTimeout(700);
  const bizPlaceholder = await page.locator('#what').getAttribute('placeholder');
  check('business example is a business example',
    /live demo/i.test(bizPlaceholder) && !/parents group/i.test(bizPlaceholder), bizPlaceholder);

  await page.reload();
  await page.waitForTimeout(300);
  await page.click('#btn-start');
  await page.waitForTimeout(400);
  await page.check('#context-political');
  await page.waitForTimeout(700);
  const polPlaceholder = await page.locator('#what').getAttribute('placeholder');
  check('political example is a political example',
    /parents group/i.test(polPlaceholder), polPlaceholder);

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, {});

  // --- copy and CTA -------------------------------------------------------

  const handoffHeading = await page.locator('.handoff h2').textContent();
  check('handoff section is AI-generic, not Claude-specific',
    handoffHeading === 'Continue with AI', handoffHeading);

  check('closing CTA points to a professional', await page.locator('.cta').count() === 1);
  const ctaHref = await page.locator('.cta-link').getAttribute('href');
  check('CTA links to winnxt.com', /winnxt\.com/.test(ctaHref), ctaHref);
  check('take it with you section kept', await page.locator('.actions').count() === 1);

  const handoff = await page.locator('#handoff-text').textContent();
  check('handoff carries the description', /doctored screenshot/.test(handoff));
  check('handoff carries the read', /Quadrant: False, and it hurts/.test(handoff));
  // The ask changed when the tool started producing a draft of its own: the
  // model is now rewriting rather than starting from nothing.
  check('handoff asks the model to rewrite the draft, not invent one',
    /rough draft/.test(handoff) && /sounds like a real person/.test(handoff),
    handoff.slice(handoff.indexOf('What I need from you'), handoff.indexOf('What I need from you') + 160));
  check('handoff branded', /winnxt\.com/.test(handoff));

  // --- stores nothing -----------------------------------------------------
  //
  // "Nothing is saved anywhere" is printed on the intro screen, so it is a
  // claim the product makes to a buyer. Assert it rather than trust it.

  const stored = await page.evaluate(() => ({
    local: Object.keys(localStorage).length,
    session: Object.keys(sessionStorage).length,
    cookie: document.cookie
  }));
  check('localStorage is untouched after a full run', stored.local === 0, JSON.stringify(stored));
  check('sessionStorage is untouched after a full run', stored.session === 0, JSON.stringify(stored));
  check('no cookies are set', stored.cookie === '', stored.cookie);

  check('no storage panel is shown', await page.locator('#storage-panel').count() === 0);
  check('the storage module is not bundled',
    !(await page.evaluate(() => typeof window.WinnxtStorage !== 'undefined')));

  await page.reload();
  await page.waitForTimeout(650);
  check('reload returns to the intro, remembering nothing', await page.locator('#intro').isVisible());
  check('the report is gone after reload', await page.locator('#report').isHidden());

  // Start over clears an in-progress run.
  page.on('dialog', d => d.accept());
  await runWizard(page, {});
  check('report is up before start over', await page.locator('#report').isVisible());
  await page.click('#btn-restart');
  await page.waitForTimeout(300);
  check('start over returns to the intro', await page.locator('#intro').isVisible());

  await page.click('#btn-start');
  await page.waitForTimeout(300);
  check('start over reset the progress',
    /Question 1/.test(await page.locator('#progress-label').textContent()));
  check('start over cleared the filter answer',
    !(await page.isChecked('#context-political')));
  await page.check('#context-political');
  await page.waitForTimeout(650);
  check('start over cleared the answers', (await page.inputValue('#what')) === '',
    await page.inputValue('#what'));

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, {});
  check('a fresh run works after starting over', await page.locator('#report').isVisible());

  // --- presentation -------------------------------------------------------

  await page.setViewportSize({ width: 375, height: 720 });
  await page.waitForTimeout(200);
  check('no horizontal overflow at 375px', !(await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));

  // The paired sections break out of the reading column on a big screen, which
  // is exactly the kind of thing that ends up two pixels wider than the window.
  for (const w of [1280, 1440, 1920]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(150);
    check('no horizontal overflow at ' + w + 'px', !(await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  }
  const columns = await page.evaluate(() => {
    const p = document.querySelector('#plan .duo-panel .duo');
    const cols = [...p.children];
    return cols[0].getBoundingClientRect().top === cols[1].getBoundingClientRect().top;
  });
  check('paired sections sit side by side on a wide screen', columns);

  // --- two things that were invisible or transparent ----------------------

  // The closing block inverts to a white panel, and the generic report-block
  // paragraph rule is heavy enough to win and paint light grey onto it.
  const ctaContrast = await page.evaluate(() => {
    const p = document.querySelector('.cta p');
    const lum = (c) => {
      const [r, g, b] = c.match(/\d+/g).slice(0, 3).map(Number).map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const a = lum(getComputedStyle(p).color);
    const b = lum(getComputedStyle(document.querySelector('.cta')).backgroundColor);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  check('the closing block reads against its own background',
    ctaContrast >= 4.5, ctaContrast.toFixed(1) + ':1');

  // The bar is a <button>, and the shared button:hover rule blanks the
  // background. On something fixed over the report, that is text on text.
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(300);
  await page.locator('#verdict-bar').hover();
  await page.waitForTimeout(200);
  const barBg = await page.locator('#verdict-bar').evaluate(e => getComputedStyle(e).backgroundColor);
  check('the sticky verdict bar stays opaque on hover',
    barBg !== 'transparent' && !/rgba\([^)]*,\s*0\)/.test(barBg), barBg);
  await page.evaluate(() => window.scrollTo(0, 0));

  const logoLinks = await page.evaluate(() =>
    [...document.querySelectorAll('.logo-link')].map(a => a.getAttribute('href')));
  check('every logo goes back to winnxt.com',
    logoLinks.length === 2 && logoLinks.every(h => h === 'https://www.winnxt.com/'),
    JSON.stringify(logoLinks));
  check('outbound links open in a new tab so a run is never lost',
    await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="http"]')].every(a => a.target === '_blank')));
  await page.setViewportSize({ width: 375, height: 720 });
  await page.waitForTimeout(150);

  await page.emulateMedia({ media: 'print' });
  check('buttons hidden in print', await page.locator('#btn-print').isHidden());
  await page.emulateMedia({ media: 'screen' });

  const unlabeled = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.type === 'radio' || el.type === 'checkbox') {
        if (!el.closest('label')) bad.push(el.id || el.name);
      } else if (!document.querySelector('label[for="' + el.id + '"]')) bad.push(el.id || el.name);
    });
    return bad;
  });
  check('every field has a label', unlabeled.length === 0, unlabeled.join(', '));

  // --- motion -------------------------------------------------------------

  check('forward and back animate in opposite directions', await page.evaluate(() => {
    const host = document.getElementById('step');
    return host.getAttribute('data-dir') !== null;
  }));

  check('buttons acknowledge a press', await page.evaluate(() => {
    const b = document.getElementById('btn-print');
    b.click();
    return b.classList.contains('tapped');
  }));

  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  const reducedReqs = [];
  reduced.on('request', r => { if (!r.url().startsWith('file://')) reducedReqs.push(r.url()); });
  await reduced.goto(FILE);
  await reduced.waitForTimeout(300);
  const dur = await reduced.evaluate(() =>
    getComputedStyle(document.getElementById('btn-start')).transitionDuration);
  check('reduced motion is respected', parseFloat(dur) < 0.01, dur);
  await reduced.close();

  check('still zero network requests at end', requests.length === 0, requests.join(', '));
  check('still no errors at end', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
