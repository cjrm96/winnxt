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
  await page.waitForTimeout(400);

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

  // --- the UI -------------------------------------------------------------

  const q = await page.locator('.question').count();
  check('questions render', q === 9, 'got ' + q);

  const readEmpty = await page.locator('#read').textContent();
  check('read starts incomplete', /Answer these and this fills in/.test(readEmpty));

  await page.selectOption('#where', 'facebook-group');
  await page.check('#spread-many-groups');
  await page.check('#truth-false');
  await page.check('#harm-serious');
  await page.check('#fault-victim');
  await page.check('#proof-yes');
  await page.check('#safety-no');
  await page.fill('#daysOut', '21');
  await page.fill('#what', 'A doctored screenshot is going around.');
  await page.waitForTimeout(300);

  const verdictText = await page.locator('.verdict').textContent();
  check('UI shows a verdict', /Respond, today/.test(verdictText), verdictText);

  const seq = await page.locator('.sequence li').count();
  check('plan renders steps', seq >= 6, 'got ' + seq);

  // Conditional question appears only for "partly true"
  await page.check('#truth-partly');
  await page.waitForTimeout(200);
  check('partly true reveals the follow-up', await page.locator('#truePart').count() === 1);
  await page.check('#truth-false');
  await page.waitForTimeout(200);
  check('follow-up hides again', await page.locator('#truePart').count() === 0);

  const handoff = await page.locator('#handoff-text').textContent();
  check('handoff carries the description', /doctored screenshot/.test(handoff));
  check('handoff carries the read', /Quadrant: False, and it hurts/.test(handoff), handoff.slice(0, 60));
  check('handoff asks for a draft', /Draft a short statement/.test(handoff));
  check('handoff branded', /winnxt\.com/.test(handoff));

  // "Say nothing" changes what the handoff asks for
  await page.check('#harm-none');
  await page.check('#spread-many-groups');
  await page.waitForTimeout(250);
  const quietHandoff = await page.locator('#handoff-text').textContent();
  check('say-nothing handoff asks Claude to challenge the call', /Push back on me/.test(quietHandoff));
  check('say-nothing handoff does not ask for a statement', !/Draft a short statement/.test(quietHandoff));

  // --- storage ------------------------------------------------------------

  const before = await page.evaluate(() => localStorage.getItem('winnxt:crisis-triage'));
  check('nothing saved while storage is off', before === null, String(before));

  await page.check('#storage-toggle');
  await page.check('#harm-serious');
  await page.waitForTimeout(200);
  check('saves once storage is on',
    (await page.evaluate(() => localStorage.getItem('winnxt:crisis-triage'))) !== null);

  await page.reload();
  await page.waitForTimeout(300);
  check('state survives reload', await page.isChecked('#harm-serious'));

  page.on('dialog', d => d.accept());
  await page.click('#btn-reset');
  await page.waitForTimeout(250);
  check('erase clears storage',
    (await page.evaluate(() => localStorage.getItem('winnxt:crisis-triage'))) === null);
  check('erase clears consent',
    (await page.evaluate(() => localStorage.getItem('winnxt:crisis-triage:consent'))) === null);
  check('erase resets the form', /Answer these and this fills in/.test(await page.locator('#read').textContent()));

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

  check('still zero network requests at end', requests.length === 0, requests.join(', '));
  check('still no errors at end', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
