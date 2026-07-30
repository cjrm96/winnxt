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

  r = await assess({ safety: 'yes' });
  check('safety comes before messaging', /safety/i.test(r.call.verdict), r.call.verdict);
  check('safety escalates risk', r.riskKey === 'high' || r.riskKey === 'extreme', r.riskKey);
  check('safety step is first in the plan', /Document everything/.test(r.sequence[0].what), r.sequence[0].what);

  // --- donts --------------------------------------------------------------

  r = await assess({ truth: 'false', harm: 'serious' });
  check('false+harm warns against repeating the claim', r.donts.some(d => /Repetition/.test(d)));

  r = await assess({ truth: 'true', harm: 'serious', spread: 'many-groups' });
  check('true+harm warns against partial denial', r.donts.some(d => /Partial denials/.test(d)));

  r = await assess({ truth: 'partly', harm: 'some' });
  check('partly true warns against hiding behind the wrong detail', r.donts.some(d => /inaccurate detail/.test(d)));

  const allDonts = (await assess({})).donts;
  check('never delete advice always present', allDonts.some(d => /Do not delete/.test(d)));

  // --- defense only -------------------------------------------------------

  const html = await page.content();
  const offense = /amplif\w* unverified|anonymous(ly)? retweet|surrogate attack|oppo(sition)? attack|discredit the opponent/i.test(html);
  check('no offense-side content in the shipped page', !offense);

  // --- the wizard ---------------------------------------------------------

  // Walks the wizard the way a buyer does: one question at a time.
  async function runWizard(page, a) {
    await page.click('#btn-start');
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
  check('one question at a time', await page.locator('.question').count() === 1, 
    'got ' + await page.locator('.question').count());
  check('progress starts at question 1',
    /Question 1/.test(await page.locator('#progress-label').textContent()));
  check('progress knows the total',
    /of 9/.test(await page.locator('#progress-count').textContent()));

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
    /of 10/.test(await page.locator('#progress-count').textContent()),
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
  // 260ms + 170ms). Anything closer to 430ms is genuinely ambiguous — by then
  // the advance may have legitimately completed, and going back one step is the
  // correct answer rather than a bug.
  for (const waitMs of [100, 250, 300]) {
    await page.click('#btn-start');
    await page.waitForTimeout(350);
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
      /Question 2/.test(await page.locator('#progress-label').textContent()),
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

  check('at-a-glance tiles render', await page.locator('.tile').count() === 3);
  check('risk meter has four segments', await page.locator('.meter-seg').count() === 4);
  check('exactly one risk segment is lit', await page.locator('.meter-seg.is-on').count() === 1);
  check('lit segment matches the risk level',
    /High/.test(await page.locator('.meter-seg.is-on').textContent()),
    await page.locator('.meter-seg.is-on').textContent());

  check('plan renders steps', await page.locator('.sequence li').count() >= 6);
  check('what-not-to-do renders', await page.locator('.donts li').count() >= 4);
  check('summary of answers renders', await page.locator('.summary-list dt').count() >= 8);

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
  check('handoff asks for a draft', /Draft a short statement/.test(handoff));
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
  await page.waitForTimeout(250);
  check('start over cleared the answers', (await page.inputValue('#what')) === '',
    await page.inputValue('#what'));
  check('start over reset the progress',
    /Question 1/.test(await page.locator('#progress-label').textContent()));

  await page.reload();
  await page.waitForTimeout(300);
  await runWizard(page, {});
  check('a fresh run works after starting over', await page.locator('#report').isVisible());

  // --- presentation -------------------------------------------------------

  await page.setViewportSize({ width: 375, height: 720 });
  await page.waitForTimeout(200);
  check('no horizontal overflow at 375px', !(await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));

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
