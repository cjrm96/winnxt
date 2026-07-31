// Opens dist/self-vet.html from file:// and checks the scoring and the shipped
// page. The scoring is the product: if it tells somebody to sit on a severe
// item, the tool has done worse than nothing.
//
//   npm test
//
// Set PW_CHROMIUM to point at a Chromium binary if Playwright can't find one.
const { chromium } = require('playwright');
const path = require('path');

const FILE = 'file://' + path.resolve(__dirname, '..', 'dist', 'self-vet.html');
let fails = 0;
function check(name, cond, extra) {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? ' — ' + extra : ''));
  if (!cond) fails++;
}

// Walks to a named section, flags one prompt, and rates it.
async function flag(page, sectionId, itemId, desc, likelihood, severity) {
  const id = sectionId + '-' + itemId;
  await page.check('#chk-' + id);
  await page.waitForTimeout(180);
  if (desc) await page.fill('#desc-' + id, desc);
  if (likelihood) await page.check('#likelihood-' + id + '-' + likelihood);
  if (severity) await page.check('#severity-' + id + '-' + severity);
  await page.waitForTimeout(80);
}

async function toReport(page) {
  for (let i = 0; i < 12; i++) {
    if (await page.locator('#wizard').isHidden()) break;
    await page.click('#btn-next');
    await page.waitForTimeout(240);
  }
  await page.waitForTimeout(350);
}

async function start(page) {
  await page.goto(FILE);
  await page.waitForTimeout(450);
  await page.click('#btn-start');
  await page.waitForTimeout(350);
}

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

  // --- the scoring rules --------------------------------------------------
  //
  // Severity outranks likelihood. That is the whole argument of the tool and
  // it is the thing most likely to get quietly inverted in a refactor.

  const tier = (likelihood, severity) =>
    page.evaluate(a => window.SelfVetLogic.tierFor(a), { likelihood, severity });

  check('severe + likely => get ahead of it', await tier('high', 'severe') === 'ahead');
  check('severe + possible => get ahead of it', await tier('medium', 'severe') === 'ahead');
  check('severe + unlikely still => get ahead of it',
    await tier('low', 'severe') === 'ahead',
    'a severe item is worth pre-empting even when you think nobody will find it');
  check('serious + likely => draft a statement', await tier('high', 'serious') === 'draft');
  check('serious + possible => prepare an answer', await tier('medium', 'serious') === 'prepare');
  check('survivable + likely => prepare an answer', await tier('high', 'survivable') === 'prepare');
  check('survivable + unlikely => prepare an answer', await tier('low', 'survivable') === 'prepare');
  check('an unrated item scores nothing', await tier('high', '') === null);
  check('an unflagged item scores nothing', await tier('', '') === null);

  // --- the content --------------------------------------------------------

  const content = await page.evaluate(() => ({
    sections: window.SelfVetItems.SECTIONS.length,
    items: window.SelfVetItems.allItems().length,
    names: window.SelfVetItems.SECTIONS.map(s => s.full),
    ids: window.SelfVetItems.allItems().map(i => i.id),
    perSection: window.SelfVetItems.SECTIONS.map(s => s.items.length)
  }));
  check('seven sections, as specified', content.sections === 7, String(content.sections));
  check('a prompt list long enough to jog a memory',
    content.items >= 130 && content.items <= 160, String(content.items));
  check('every section is equally thorough',
    content.perSection.every(n => n === content.perSection[0]), content.perSection.join(','));
  check('no duplicate prompt ids',
    new Set(content.ids).size === content.ids.length);
  // Drawn from what has actually ended careers recently, not just the classic
  // categories. These are the ones a first-timer never thinks to write down.
  const labels = await page.evaluate(() =>
    window.SelfVetItems.allItems().map(i => i.label).join(' | ').toLowerCase());
  [
    ['affairs', /affair/],
    ['intimate images and messages', /intimate messages, photos/],
    ['photographs you would not want published', /photographs of you that you would not want/],
    ['costume and party photos', /costume, a party/],
    ['relationships with subordinates', /supervised, taught, or had authority over/],
    ['harassment allegations', /allegation of harassment/],
    ['settlements paid on your behalf', /settlement paid by an employer/],
    ['campaign money spent personally', /personal spending from a campaign/],
    ['resume fabrication', /claims about your family history/],
    ['a claimed charity', /charity or nonprofit you claim/],
    ['an event that became notorious later', /later became notorious/],
    ['pandemic positions', /during the pandemic/],
    ['plagiarism', /without credit/],
    ['burner accounts', /burner/]
  ].forEach(([name, re]) =>
    check('the list asks about ' + name, re.test(labels)));

  check('the standard vetting scope is covered',
    /Finances/.test(content.names.join()) && /Legal/.test(content.names.join()) &&
    /Past statements/.test(content.names.join()) && /Employment/.test(content.names.join()) &&
    /Personal/.test(content.names.join()) && /Affiliations/.test(content.names.join()) &&
    /Credentials/.test(content.names.join()),
    content.names.join(' | '));

  // Citations have to be real and findable. A fabricated source is worse than
  // no source, because it is the part a buyer would repeat in public.
  const cites = await page.evaluate(() =>
    Object.values(window.SelfVetEvidence.CITES).map(c => c.source));
  check('every citation names an author or an organisation and a year',
    cites.every(s => /\d{4}/.test(s) || /Governing|CampaignNow/.test(s)), cites.join(' | '));
  check('nothing hides behind "studies show"',
    !cites.some(s => /studies show|research suggests/i.test(s)));

  // --- the intro ----------------------------------------------------------

  const intro = await page.locator('#intro').textContent();
  check('the framing line leads',
    /forgive almost anything except being surprised/.test(intro));
  check('the privacy promise is stated',
    /Nothing you type here is saved anywhere/.test(intro));
  check('it tells you to go and look rather than answer from memory',
    /Do not answer from memory/.test(intro));
  check('it explains that severity outranks likelihood',
    /Severity is weighted ahead of likelihood/.test(intro));

  // The intro sets the stakes by describing what real vetting looks like, then
  // says plainly that this is not that. Overclaiming here is how a $34 download
  // earns a one-star review.
  check('it describes how vetting works at the top',
    /presidential campaign vets a running mate/.test(intro) &&
    /go through it line by line/.test(intro));
  check('the vetting claims are attributed so they can be checked',
    /New York Times published it in full/.test(intro), 'the 2008 transition questionnaire');
  check('it names the question underneath all of it',
    /source of embarrassment/.test(intro));
  check('it says plainly that this is the basic version',
    /basic version of that room/.test(intro));
  check('it discloses all four limits rather than overclaiming',
    /cannot pull your records/.test(intro) &&
    /cannot interview anyone/.test(intro) &&
    /does not know your disclosure law/.test(intro) &&
    /cannot make you honest/.test(intro));

  // --- a full run ---------------------------------------------------------

  await start(page);
  await page.fill('#race-name', 'Board Candidate');
  await page.fill('#race-city', 'Springfield, Illinois');
  await page.fill('#race-office', 'Board of Education, District 3');
  await page.fill('#race-days', '60');
  await page.click('#btn-next');
  await page.waitForTimeout(300);

  await flag(page, 'finances', 'bankruptcy', 'Chapter 7 in 2011', 'high', 'serious');
  await page.click('#btn-next');
  await page.waitForTimeout(300);
  await flag(page, 'legal', 'arrest', 'DUI in 2009, dismissed', 'low', 'severe');
  await toReport(page);

  check('the register renders', await page.locator('#report').isVisible());
  check('the headline counts what has to be pre-empted',
    /1 thing to get ahead of/.test(await page.locator('.verdict').textContent()),
    await page.locator('.verdict').textContent());

  const tiers = await page.locator('.tier-block h2').allTextContents();
  check('tiers appear in order of urgency',
    tiers[0] === 'Get ahead of it' && tiers[1] === 'Draft a statement',
    tiers.join(' > '));

  const ahead = await page.locator('.tier-ahead').textContent();
  check('the unlikely severe item is the one to pre-empt',
    /DUI in 2009/.test(ahead), ahead.slice(0, 120));
  const draft = await page.locator('.tier-draft').textContent();
  check('the likely serious item is the one to draft', /Chapter 7 in 2011/.test(draft));

  check('each item carries its own words, not the prompt',
    /Chapter 7 in 2011/.test(await page.locator('.reg-what').first().textContent()) ||
    /DUI in 2009/.test(await page.locator('.reg-what').first().textContent()));
  check('each item shows which section it came from',
    (await page.locator('.reg-section').first().textContent()).length > 0);
  check('each item shows both ratings', await page.locator('.chip').count() === 4);

  check('the timing advice uses the deadline',
    /60 days/.test(await page.locator('#plan, #read').first().textContent()) ||
    /60 days/.test(await page.locator('#read').textContent()));

  // The precedent is the persuasive part, same as the crisis tool.
  check('the register carries real cases',
    await page.locator('.case').count() >= 3);
  check('the cases expand',
    await page.locator('.case-more').count() === await page.locator('.case').count());
  check('citations are shown', await page.locator('.cite-source').count() >= 2);

  const handoff = await page.locator('#handoff-text').textContent();
  check('the handoff carries the flagged items', /Chapter 7 in 2011/.test(handoff));
  check('the handoff groups by what to do', /Get ahead of it/.test(handoff));
  check('the handoff asks for drafts rather than a verdict',
    /draft two or three sentences/i.test(handoff));
  check('the handoff asks what a researcher would find next',
    /opposition researcher/.test(handoff));
  check('the handoff warns that pasting it sends it somewhere',
    /leaves your browser/.test(await page.locator('.handoff-warn').textContent()));

  // --- the searches -------------------------------------------------------
  //
  // The register records what somebody remembered. This block is what finds
  // the rest, so it has to be specific, tailored, and run by the user rather
  // than by the page.

  const searchTitles = await page.locator('.search-group .search-title').allTextContents();
  check('the searches are tailored to the sections flagged',
    searchTitles.includes('Money') && searchTitles.includes('Legal') &&
    !searchTitles.includes('Affiliations'),
    searchTitles.join(' | '));
  check('the baseline searches always appear',
    searchTitles.some(t => /Start here/.test(t)));

  const queries = await page.locator('.search-q').allTextContents();
  check('the name is written into the queries',
    queries.some(q => /"Board Candidate"/.test(q)), queries[0]);
  check('the town is written into the queries',
    queries.some(q => /Springfield/.test(q)), queries[0]);
  check('real operators are used, not invented ones',
    queries.some(q => /filetype:pdf/.test(q)) && queries.some(q => /-site:/.test(q)));
  check('public registers are named, not just web searches',
    /pacer\.uscourts\.gov/.test(await page.locator('.search-block').textContent()));
  check('every search can be copied',
    await page.locator('.search-row .copy-mini').count() === queries.length);

  const searchText = await page.locator('.search-block').textContent();
  check('it says plainly that nothing is run for you',
    /Nothing here is run for you/.test(searchText));
  check('it tells you to search signed out',
    /private window while signed out/.test(searchText));
  check('the AI prompts warn that an assistant without search will invent results',
    /invent plausible results/.test(searchText));
  check('the AI prompts warn that pasting your name sends it somewhere',
    /sends it to somebody else's system/.test(searchText));

  // A blank name still has to produce a usable list, since both fields are
  // optional and a nervous first-timer may well skip them.
  await start(page);
  await toReport(page);
  const blank = await page.locator('.search-q').allTextContents();
  check('with no name given the searches fall back to placeholders',
    blank.some(q => /YOUR FULL NAME/.test(q)) && blank.some(q => /YOUR CITY/.test(q)),
    blank[0]);

  // --- flagging nothing ---------------------------------------------------
  //
  // The most dangerous run is the one that finds nothing, because that is
  // almost always an incomplete search rather than a clean record.

  await start(page);
  await toReport(page);
  check('an empty run is not congratulated',
    /most common way this exercise fails/.test(await page.locator('.verdict-line').textContent()),
    await page.locator('.verdict-line').textContent());
  check('an empty run shows no register', await page.locator('.tier-block').count() === 0);
  check('an empty run still shows the precedent',
    await page.locator('.why-block .case').count() === 2);

  // --- flagged but not rated ----------------------------------------------

  await start(page);
  await page.click('#btn-next');
  await page.waitForTimeout(300);
  await flag(page, 'finances', 'lien', 'Unpaid state taxes', null, null);
  await toReport(page);
  check('an unrated item is called out rather than silently dropped',
    /flagged but not rated/.test(await page.locator('#read').textContent()));
  check('an unrated item does not appear in the register',
    await page.locator('.reg-item').count() === 0);

  // --- adding your own ----------------------------------------------------

  await start(page);
  await page.click('#btn-next');
  await page.waitForTimeout(300);
  await page.click('.add-own');
  await page.waitForTimeout(200);
  check('you can add something the list did not think of',
    await page.locator('.flag-own').count() === 1);
  await page.fill('.flag-own .own-label', 'A dispute with the HOA');
  await page.check('#likelihood-finances-own-1-high');
  await page.check('#severity-finances-own-1-severe');
  await toReport(page);
  check('a hand-added item reaches the register',
    /A dispute with the HOA/.test(await page.locator('.tier-ahead').textContent()));

  // --- going back keeps your work -----------------------------------------

  await start(page);
  await page.click('#btn-next');
  await page.waitForTimeout(300);
  await flag(page, 'finances', 'bankruptcy', 'Chapter 7 in 2011', 'high', 'severe');
  await page.click('#btn-next');
  await page.waitForTimeout(300);
  await page.click('#btn-back');
  await page.waitForTimeout(350);
  check('going back keeps the flag', await page.isChecked('#chk-finances-bankruptcy'));
  check('going back keeps what you typed',
    await page.inputValue('#desc-finances-bankruptcy') === 'Chapter 7 in 2011');
  check('going back keeps the ratings',
    await page.isChecked('#severity-finances-bankruptcy-severe'));
  check('back from the first step returns to the intro',
    await (async () => {
      await page.click('#btn-back');
      await page.waitForTimeout(300);
      await page.click('#btn-back');
      await page.waitForTimeout(350);
      return page.locator('#intro').isVisible();
    })());

  // --- nothing is stored --------------------------------------------------

  await start(page);
  await page.click('#btn-next');          // race -> money
  await page.waitForTimeout(250);
  await page.click('#btn-next');          // money -> legal
  await page.waitForTimeout(250);
  await flag(page, 'legal', 'arrest', 'Something private', 'high', 'severe');
  const storage = await page.evaluate(() => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookie: document.cookie
  }));
  check('localStorage is untouched', storage.local === 0, JSON.stringify(storage));
  check('sessionStorage is untouched', storage.session === 0);
  check('no cookies are set', storage.cookie === '');
  check('the storage module is not bundled',
    await page.evaluate(() => typeof window.WinnxtStorage === 'undefined'));

  await page.reload();
  await page.waitForTimeout(400);
  check('a reload remembers nothing', await page.locator('#intro').isVisible());

  // --- presentation -------------------------------------------------------

  await start(page);
  const metaSplit = await page.evaluate(() => {
    const spans = document.querySelectorAll('.masthead-meta span');
    const a = spans[0].getBoundingClientRect();
    const b = spans[spans.length - 1].getBoundingClientRect();
    return b.left - a.right;
  });
  check('the masthead label and the studio credit sit at opposite ends',
    metaSplit > 40, metaSplit + 'px apart');

  const heroSize = await page.evaluate(async () => {
    document.getElementById('btn-start').click();
    return null;
  });
  await page.waitForTimeout(300);
  await toReport(page);
  const sizes = await page.evaluate(() => ({
    verdict: parseFloat(getComputedStyle(document.querySelector('.verdict')).fontSize),
    heading: parseFloat(getComputedStyle(document.querySelector('#plan h2, .report-block h2')).fontSize)
  }));
  check('the headline outranks section headings by a wide margin',
    sizes.verdict > sizes.heading * 2, JSON.stringify(sizes));

  for (const w of [375, 1280, 1920]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(150);
    check('no horizontal overflow at ' + w + 'px', !(await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  }
  await page.setViewportSize({ width: 1100, height: 900 });

  const logos = await page.evaluate(() =>
    [...document.querySelectorAll('.logo-link')].map(a => a.getAttribute('href')));
  check('every logo goes back to winnxt.com',
    logos.length === 2 && logos.every(h => h === 'https://www.winnxt.com/'), JSON.stringify(logos));
  check('outbound links open in a new tab so a run is never lost',
    await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="http"]')].every(a => a.target === '_blank')));

  await page.emulateMedia({ media: 'print' });
  check('buttons are hidden in print', await page.locator('#btn-print').isHidden());
  check('the cases are expanded in print', await page.evaluate(() => {
    const body = document.querySelector('.case-more:not([open]) .case-body');
    return !body || getComputedStyle(body).display !== 'none';
  }));
  await page.emulateMedia({ media: 'screen' });

  const unlabeled = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.type === 'hidden') return;
      const byFor = el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      const wrapped = el.closest('label');
      const aria = el.getAttribute('aria-label');
      if (!byFor && !wrapped && !aria) bad.push(el.id || el.name || el.type);
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
