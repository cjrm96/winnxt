// Opens dist/self-vet.html from file:// and checks the scoring and the shipped
// page. The scoring is the product: if it tells somebody to sit on a severe
// item, the tool has done worse than nothing.
//
//   npm test
//
// Set PW_CHROMIUM to point at a Chromium binary if Playwright can't find one.
const { chromium } = require('playwright');
const path = require('path');

const FILE = 'file://' + path.resolve(__dirname, '..', 'dist', 'vet-yourself', 'vet-yourself.html');
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

  // --- the cold open ------------------------------------------------------
  //
  // The page opens on a transcript with the answer lines blank, because the
  // answers are the reader's. It is the mood-setting part and it is also the
  // part most likely to break a screen reader or somebody who asked for less
  // motion, so both are checked.

  check('the page opens on a vetting transcript',
    await page.locator('.session .ql').count() >= 5,
    (await page.locator('.session .ql').count()) + ' questions');
  check('the answer lines are left blank',
    (await page.locator('.session .al span').allTextContents()).every(t => t.trim() === ''));
  check('the questions come from the tool\'s own prompt list',
    /bankruptcies/i.test(await page.locator('.session').textContent()) &&
    /arrested/i.test(await page.locator('.session').textContent()));
  check('it explains what the transcript was',
    /keep going after you have answered/.test(await page.locator('.session').textContent()));
  check('it says the point is being pressed in private first',
    /while it is still a private room/.test(await page.locator('.session').textContent()));

  // Animation delays rather than JS timers, so the text is in the DOM at first
  // paint whatever happens to the animation.
  check('the transcript is real text, not built by a timer',
    await page.evaluate(() => document.querySelectorAll('.session .ql').length > 0));

  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  const reducedReqs = [];
  reduced.on('request', r => { if (!r.url().startsWith('file://')) reducedReqs.push(r.url()); });
  await reduced.goto(FILE);
  await reduced.waitForTimeout(300);
  const anim = await reduced.evaluate(() => {
    const q = document.querySelector('.session .ql');
    return { name: getComputedStyle(q).animationName, opacity: getComputedStyle(q).opacity };
  });
  check('reduced motion gets the transcript instantly',
    anim.name === 'none' && anim.opacity === '1', JSON.stringify(anim));
  check('reduced motion drops the vignette too',
    await reduced.evaluate(() =>
      getComputedStyle(document.getElementById('intro'), '::before').display === 'none'));
  check('the cold open costs no network requests', reducedReqs.length === 0);
  await reduced.close();

  // The vetter's register, applied to the copy rather than only the visuals.
  check('it warns you will want to stop, and that this is the point',
    /Wanting to stop is not a sign that you should/.test(intro));
  check('it explains why the questions are blunt',
    /a euphemism is somewhere for an answer to hide/.test(intro));
  check('it admits the tool cannot press you the way a person would',
    /It cannot press you/.test(intro));

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
  check('the AI prompts warn that an AI without search will invent results',
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
    await page.locator('.why-block .case').count() === 4,
    (await page.locator('.why-block .case').count()) + ' cases');

  // --- flagged but not rated ----------------------------------------------
  //
  // Ticking a box and then leaving it unrated used to produce a register that
  // was quietly missing things. Now the section will not let you past.

  await start(page);
  await page.click('#btn-next');
  await page.waitForTimeout(300);
  await page.check('#chk-finances-lien');
  await page.waitForTimeout(250);
  await page.click('#btn-next');
  await page.waitForTimeout(350);
  check('an unfinished item blocks the section',
    await page.locator('.question[data-q="finances"]').count() === 1);
  check('the error says what is wrong',
    /flagged but not finished/.test(await page.locator('#step-error').textContent()),
    await page.locator('#step-error').textContent());
  check('the offending row is marked',
    await page.locator('.flag[data-incomplete]').count() === 1);

  await page.fill('#desc-finances-lien', 'Unpaid state taxes');
  await page.check('#likelihood-finances-lien-high');
  await page.check('#severity-finances-lien-serious');
  await page.waitForTimeout(250);
  check('finishing it clears the error',
    await page.locator('#step-error').isHidden() &&
    await page.locator('.flag[data-incomplete]').count() === 0);
  await page.click('#btn-next');
  await page.waitForTimeout(350);
  check('and then the section lets you past',
    await page.locator('.question[data-q="legal"]').count() === 1);

  // Unticking is always a way out, so nobody is trapped by a box they hit by
  // accident.
  await page.click('#btn-back');
  await page.waitForTimeout(350);
  await page.uncheck('#chk-finances-lien');
  await page.waitForTimeout(200);
  await page.check('#chk-finances-judgment');
  await page.waitForTimeout(200);
  await page.click('#btn-next');
  await page.waitForTimeout(300);
  await page.uncheck('#chk-finances-judgment');
  await page.waitForTimeout(200);
  check('unticking an unfinished item releases the gate',
    await page.locator('#step-error').isHidden());

  // --- the voice ----------------------------------------------------------

  await start(page);
  await page.click('#btn-next');
  await page.waitForTimeout(300);
  check('each section opens in the voice of the room',
    /Start with money/.test(await page.locator('.opener').textContent()),
    await page.locator('.opener').textContent());
  check('the opener sits above the explanation, not instead of it',
    (await page.locator('.help').first().textContent()).length > 80);

  // The re-ask: the one thing the tool can do that a plain form cannot.
  await flag(page, 'finances', 'bankruptcy', 'Chapter 7 in 2011', 'low', 'survivable');
  await page.waitForTimeout(250);
  check('waving something away twice gets asked about once',
    await page.locator('.press:not([hidden])').count() === 1);
  check('the re-ask does not scold, it offers the way out',
    /Leave it if you still mean it/.test(await page.locator('.press').first().textContent()));
  await page.check('#severity-finances-bankruptcy-severe');
  await page.waitForTimeout(200);
  check('changing the rating retires the re-ask',
    await page.locator('.press:not([hidden])').count() === 0);

  for (let i = 0; i < 3; i++) { await page.click('#btn-next'); await page.waitForTimeout(320); }
  check('the break line lands where the intro said it would',
    /want to stop about here/.test(await page.locator('#step-hint').textContent()),
    await page.locator('#step-hint').textContent());

  // --- adding your own ----------------------------------------------------

  await start(page);
  await page.click('#btn-next');
  await page.waitForTimeout(300);
  await page.click('.add-own');
  await page.waitForTimeout(200);
  check('you can add something the list did not think of',
    await page.locator('.flag-own').count() === 1);
  await page.fill('.flag-own .own-label', 'A dispute with the HOA');
  await page.fill('#desc-finances-own-1', 'HOA took me to a hearing in 2019');
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

  // --- the evidence base --------------------------------------------------
  //
  // The listing tells buyers to look all of this up, so a fabricated or
  // overclaimed source is the single worst defect this product could ship.

  const ev = await page.evaluate(() => ({
    cites: Object.values(window.SelfVetEvidence.CITES).map(c => c.source),
    claims: Object.values(window.SelfVetEvidence.CITES).map(c => c.claim),
    limits: window.SelfVetEvidence.LIMITS.length,
    cases: [].concat(
      window.SelfVetEvidence.WHY,
      window.SelfVetEvidence.casesFor('ahead'),
      window.SelfVetEvidence.casesFor('draft'),
      window.SelfVetEvidence.casesFor('prepare')
    )
  }));

  check('the citation list is substantial', ev.cites.length >= 14, String(ev.cites.length));
  check('the case library is substantial', ev.cases.length >= 14, String(ev.cases.length));
  check('every citation carries a year or a named publisher',
    ev.cites.every(c => /\(\d{4}\)/.test(c) || /Governing|CampaignNow/.test(c)),
    ev.cites.filter(c => !/\(\d{4}\)/.test(c) && !/Governing|CampaignNow/.test(c)).join(' | '));
  check('every citation names a journal or a publisher',
    ev.cites.every(c => /Review|Journal|Quarterly|Science|Bulletin|Research|Proceedings|Management|Communications|Politics|Behavior|Governing|CampaignNow/.test(c)));
  check('no citation hedges with "studies show"',
    !ev.claims.some(c => /studies show|research suggests|experts say/i.test(c)));
  check('every case names a subject and a year',
    ev.cases.every(c => c.who && c.year && String(c.year).length === 4));
  check('every case carries the full arc',
    ev.cases.every(c => c.background && c.reaction && c.handling && c.outcome));

  // Nonpartisan is a shipping guarantee, not a preference. A buyer should be
  // able to read the case list and not be able to tell who built it.
  const who = ev.cases.map(c => c.who).join(' | ');
  check('cases include Democrats',
    /Clinton|Buttigieg|Blumenthal|Eagleton|Barry/.test(who), who);
  check('cases include Republicans',
    /Santos|Vitter|Howard|Puzder|Nixon|Romney/.test(who), who);
  check('cases include business and institutions',
    /Johnson & Johnson|Wells Fargo/.test(who));
  check('cases include local and state level races',
    /South Bend|Florida House|St. Petersburg|Washington/.test(who), who);

  // The honest part. This is what separates a cited tool from a trusted one.
  check('the report says where the evidence is thin', ev.limits >= 4, String(ev.limits));
  const limitsText = await page.locator('.limits-block').textContent();
  check('it admits the pre-emption evidence is mostly corporate',
    /largely from crisis communications and marketing/.test(limitsText));
  check('it surfaces the political science that cuts against it',
    /did not gain support and sometimes lost it/.test(limitsText));
  check('it admits nobody has studied races this size',
    /no peer-reviewed research on how scandal behaves in a school board/.test(limitsText));
  check('it admits self-vetting itself is practice rather than evidence',
    /practice, not evidence|weaker claim than a study/.test(limitsText));
  check('the contrary finding is cited, not just described',
    /British Journal of Political Science/.test(limitsText));

  // The room section is the thing that sets the stakes, so its facts are held
  // to the same standard as the citations: verified, or not printed.
  check('the room section names what investigators actually do',
    /interview your employers, your colleagues, your neighbours/.test(intro));
  check('it uses the household employment nominations',
    /two candidates for Attorney General/.test(intro) &&
    /lasted eight days/.test(intro));
  check('it makes the point that the second lost over an appearance',
    /lost the job over an appearance/.test(intro));
  check('it uses the unasked question as the cost',
    /The ticket lasted eighteen days/.test(intro) &&
    /what your not knowing says about you/.test(intro));
  check('the questionnaire length is stated',
    /about 127 pages/.test(intro));

  // --- two columns --------------------------------------------------------
  //
  // Asked for to cut the scroll. The prompt list is two independent columns
  // rather than one grid, so opening an item on the left does not pad out the
  // right to match.

  await page.setViewportSize({ width: 1440, height: 1000 });
  await start(page);
  await page.click('#btn-next');
  await page.waitForTimeout(400);
  const cols = await page.evaluate(() => {
    const c = document.querySelectorAll('.flags .flag-col');
    if (c.length !== 2) return null;
    return { n: c.length, sameTop: Math.abs(c[0].getBoundingClientRect().top - c[1].getBoundingClientRect().top) < 2 };
  });
  check('the prompt list runs in two columns on a wide screen',
    cols && cols.n === 2 && cols.sameTop, JSON.stringify(cols));

  // offsetTop, not getBoundingClientRect: ticking a box scrolls the page, and
  // a viewport-relative measurement would report that as a layout shift.
  const before = await page.evaluate(() =>
    document.querySelectorAll('.flag-col')[1].offsetTop);
  await page.check('#chk-finances-bankruptcy');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() =>
    document.querySelectorAll('.flag-col')[1].offsetTop);
  check('opening an item on one side does not move the other',
    before === after, before + ' -> ' + after);

  await page.setViewportSize({ width: 375, height: 720 });
  await page.waitForTimeout(200);
  const stacked = await page.evaluate(() => {
    const c = document.querySelectorAll('.flags .flag-col');
    return c[1].getBoundingClientRect().top > c[0].getBoundingClientRect().top;
  });
  check('and it stacks back to one column on a narrow screen', stacked);
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const w of [1280, 1440, 1920]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(150);
    check('the wizard does not overflow at ' + w + 'px', !(await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  }

  // The start button now sits below the explanation, deliberately, so nobody
  // begins without reading what the exercise is.
  await page.goto(FILE);
  await page.waitForTimeout(400);
  const order = await page.evaluate(() => {
    const btn = document.getElementById('btn-start');
    const blocks = document.querySelectorAll('#intro .intro-block');
    const last = blocks[blocks.length - 1];
    return !!(last.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  check('start sits after the instructions, not before them', order);
  check('the session header is stripped back',
    (await page.locator('.session-head').textContent()).trim() === 'Session',
    await page.locator('.session-head').textContent());
  await page.setViewportSize({ width: 1100, height: 900 });

  // --- the companion tool -------------------------------------------------
  //
  // The two tools are halves of one job: one for before anything happens, one
  // for the hour after. Each report points at the other.

  const sib = await page.locator('.sibling').textContent();
  check('the report points at the companion tool',
    /Crisis Triage and Rapid Response/.test(sib), sib.slice(0, 80));
  check('the cross-sell links to the shop',
    (await page.locator('.sibling .cta-link').getAttribute('href')) === 'https://www.etsy.com/shop/WINNXTetsy');
  check('the cross-sell sits below the ask for a professional, not above it',
    await page.evaluate(() => {
      const cta = document.querySelector('.cta');
      const sib = document.querySelector('.sibling');
      return !!(cta.compareDocumentPosition(sib) & Node.DOCUMENT_POSITION_FOLLOWING);
    }));
  check('the cross-sell never prints', await page.locator('.sibling').evaluate(
    e => e.classList.contains('no-print')));

  check('still zero network requests at end', requests.length === 0, requests.join(', '));
  check('still no errors at end', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
