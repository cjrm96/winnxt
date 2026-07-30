// Opens dist/pre-filing-check.html the way a buyer does — straight off the
// filesystem — and asserts it works and makes no network requests at all.
//
//   npm test
//
// Set PW_CHROMIUM to point at a Chromium binary if Playwright can't find one.
const { chromium } = require('playwright');
const path = require('path');

const FILE = 'file://' + path.resolve(__dirname, '..', 'dist', 'pre-filing-check.html');
let fails = 0;
function check(name, cond, extra) {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? ' — ' + extra : ''));
  if (!cond) fails++;
}

(async () => {
  const browser = await chromium.launch(
    process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
  );
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const requests = [];
  page.on('request', r => { if (!r.url().startsWith('file://')) requests.push(r.url()); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(FILE);
  await page.waitForTimeout(400);

  check('no non-file network requests', requests.length === 0, requests.join(', '));
  check('no page errors', errors.length === 0, errors.join(' | '));

  // Checklist rendered
  const items = await page.locator('.item').count();
  check('all 22 checklist items render', items === 22, 'got ' + items);

  const blockers = await page.locator('.tag-blocker').count();
  check('blocker tags render', blockers === 15, 'got ' + blockers);

  // Initial verdict
  const verdict = await page.locator('.verdict').textContent();
  check('starts as not clear to spend', /Not yet\. 15 of 15/.test(verdict), verdict);

  // Race fields drive the timeline
  await page.fill('#race-office', 'Board of Education, District 3');
  await page.fill('#race-jurisdiction', 'Fairview County');
  await page.fill('#race-filingDeadline', '2026-09-15');
  await page.fill('#race-electionDate', '2026-11-03');
  await page.waitForTimeout(200);

  const milestones = await page.locator('.timeline-list li').count();
  check('timeline builds from both dates', milestones === 9, 'got ' + milestones);

  const firstWhen = await page.locator('.timeline-list li .when').first().textContent();
  check('earliest milestone is filing-56d (Jul 21 2026)', /Jul 21, 2026/.test(firstWhen), firstWhen);

  const countdown = await page.locator('.countdown').textContent();
  check('countdown shows days to filing', /\d+ days until your filing deadline/.test(countdown), countdown);

  // Answer a blocker as written
  await page.check('#office-title-written');
  await page.fill('#office-title-note', 'Member, Board of Education, District 3');
  await page.waitForTimeout(150);

  const v2 = await page.locator('.verdict').textContent();
  check('confirming a blocker decrements the count', /14 of 15/.test(v2), v2);

  const cardStatus = await page.getAttribute('.item[data-item="office-title"]', 'data-status');
  check('item marked written', cardStatus === 'written', cardStatus);

  // Verbal does not clear a blocker
  await page.check('#residency-verbal');
  await page.waitForTimeout(150);
  const v3 = await page.locator('.verdict').textContent();
  check('verbal does not clear a blocker', /14 of 15/.test(v3), v3);
  const verbalNote = await page.locator('#readiness li', { hasText: 'Residency requirement' }).textContent();
  check('verbal item nudges toward writing', /Get it in writing/.test(verbalNote), verbalNote);

  // Call script drops answered questions
  const qCount = await page.locator('.questions li').count();
  check('call script drops confirmed question', qCount === 21, 'got ' + qCount);

  // Handoff block
  const handoff = await page.locator('#handoff-text').textContent();
  check('handoff has race context', /Office: Board of Education, District 3/.test(handoff));
  check('handoff lists confirmed item', /Member, Board of Education, District 3/.test(handoff));
  check('handoff flags verbal-only', /someone told me, but I did not write down/.test(handoff));
  check('handoff lists unknowns', /What I still do not know/.test(handoff));
  check('handoff has asks', /What I need from you/.test(handoff));
  check('handoff branded', /winnxt\.com/.test(handoff));

  // Storage off by default
  const savedBefore = await page.evaluate(() => localStorage.getItem('winnxt:pre-filing-check'));
  check('nothing saved while storage is off', savedBefore === null, String(savedBefore));

  // Turn storage on, reload, expect persistence
  await page.check('#storage-toggle');
  await page.fill('#race-office', 'Board of Education, District 3');
  await page.waitForTimeout(200);
  const savedAfter = await page.evaluate(() => localStorage.getItem('winnxt:pre-filing-check'));
  check('saves once storage is on', savedAfter !== null);

  await page.reload();
  await page.waitForTimeout(300);
  const officeVal = await page.inputValue('#race-office');
  check('state survives reload', officeVal === 'Board of Education, District 3', officeVal);
  const v4 = await page.locator('.verdict').textContent();
  check('answers survive reload', /14 of 15/.test(v4), v4);

  // Erase
  page.on('dialog', d => d.accept());
  await page.click('#btn-erase');
  await page.waitForTimeout(250);
  const cleared = await page.evaluate(() => localStorage.getItem('winnxt:pre-filing-check'));
  check('erase clears storage', cleared === null, String(cleared));
  const consent = await page.evaluate(() => localStorage.getItem('winnxt:pre-filing-check:consent'));
  check('erase clears consent', consent === null, String(consent));
  const v5 = await page.locator('.verdict').textContent();
  check('erase resets the form', /15 of 15/.test(v5), v5);
  const officeAfter = await page.inputValue('#race-office');
  check('erase clears race fields', officeAfter === '', officeAfter);

  // Mobile
  await page.setViewportSize({ width: 375, height: 720 });
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check('no horizontal overflow at 375px', !overflow);

  // Print stylesheet
  await page.emulateMedia({ media: 'print' });
  const btnHidden = await page.locator('#btn-print').isHidden();
  check('buttons hidden in print', btnHidden);
  await page.emulateMedia({ media: 'screen' });

  // Labels
  const unlabeled = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.type === 'radio' || el.type === 'checkbox') {
        if (!el.closest('label')) bad.push(el.id || el.name);
      } else if (!document.querySelector('label[for="' + el.id + '"]')) {
        bad.push(el.id || el.name);
      }
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
