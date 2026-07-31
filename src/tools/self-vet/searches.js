// Search recipes: what to actually type, and where, to find out what is public.
//
// The register is only ever as good as the recall behind it, and recall is the
// weak link. This turns "go and look" from advice into a list of specific
// strings somebody can paste, tailored to the sections they flagged.
//
// Everything here is built as text in the page. Nothing is run, nothing is
// fetched, and no query leaves the browser unless the user copies it and goes
// somewhere else. That is the same promise the rest of the tool makes and it
// would be trivially easy to break here, so it is worth stating twice.
//
// Rules for anything added:
//   1. It must work for a private citizen with no subscriptions. No paid
//      background-check services, no data brokers.
//   2. It must be a real operator or a real public register. No invented
//      Google syntax, and no site that does not exist.
(function () {

  function q(name) {
    var n = String(name || '').trim();
    return n ? '"' + n + '"' : '"YOUR FULL NAME"';
  }

  function place(city) {
    var c = String(city || '').trim();
    return c || 'YOUR CITY';
  }

  // Universal. Everybody runs these, whatever they flagged.
  function baseline(name, city) {
    var n = q(name);
    var c = place(city);
    return {
      id: 'baseline',
      title: 'Start here, whatever you flagged',
      why: 'Run these in a private window while signed out. Signed in, Google personalises results and quietly hides the things you never click, which are exactly the things a stranger would see first.',
      queries: [
        { s: n + ' ' + c, why: 'The search an opponent, a reporter, or a curious voter types first.' },
        { s: n + ' -site:YOURCAMPAIGNSITE.com -site:linkedin.com', why: 'Everything about you that you did not publish yourself. Put your own site in once you have one, and keep adding exclusions until only other people\'s pages are left.' },
        { s: n + ' (arrested OR charged OR lawsuit OR sued OR settlement OR complaint)', why: 'The words a researcher pairs with a name on the first pass.' },
        { s: n + ' filetype:pdf', why: 'Meeting minutes, agendas, donor lists, rosters, and programmes. This is where a name turns up in a document nobody indexed properly.' },
        { s: n + ' site:' + slug(city) + '.gov', why: 'Your own local government: minutes, agendas, permits, public comment. Check the real domain first, because this is a guess and plenty of towns use something else.' },
        { s: 'Every other version of your name', why: 'Maiden name, married name, a middle initial, a nickname, and the misspelling people actually use. Run the baseline search again for each one.' }
      ]
    };
  }

  var BY_SECTION = {
    finances: {
      title: 'Money',
      why: 'Almost all of this is a public register somewhere, and most of it is free.',
      queries: function (n, c) {
        return [
          { s: n + ' (lien OR judgment OR bankruptcy OR foreclosure)', why: 'The plain search. Do it before the paid services do.' },
          { s: 'PACER, at pacer.uscourts.gov', why: 'Federal court records, including every bankruptcy. Searching costs cents per page and the fee is waived below a quarterly threshold.' },
          { s: 'Your county recorder or clerk, property and lien search', why: 'Liens, deeds, and mortgages are filed at county level and are usually searchable online for nothing.' },
          { s: 'Your county assessor, property search', why: 'What you own, what it is assessed at, and which exemptions are claimed on it.' }
        ];
      }
    },
    legal: {
      title: 'Legal',
      why: 'Court records are public by default. The question is only which court.',
      queries: function (n, c) {
        return [
          { s: 'Your county clerk of court, case search', why: 'Most civil and criminal matters live here, not in a national database. Search every county you have lived in.' },
          { s: 'Your state trial court portal, party name search', why: 'Many states run one statewide search that covers every county at once.' },
          { s: n + ' (docket OR "case no" OR plaintiff OR defendant)', why: 'Catches filings that have been indexed by aggregators even when the court site has not been.' },
          { s: 'Your state licensing board, disciplinary lookup', why: 'Licence status and any public discipline, for every licence you have ever held.' }
        ];
      }
    },
    statements: {
      title: 'What you said',
      why: 'This is the section where searching properly finds material you had genuinely forgotten.',
      queries: function (n, c) {
        return [
          { s: 'from:YOURHANDLE until:2017-01-01', why: 'On X, this returns your own oldest posts first. Change the date and repeat. Do it for every handle you have ever had.' },
          { s: 'web.archive.org/web/*/YOUROLDSITE.com', why: 'The Wayback Machine keeps pages after you delete them. Try old blogs, an old business site, and an old employer bio page.' },
          { s: n + ' site:reddit.com', why: 'Then repeat with the other places you posted: forums, review sites, comment sections, local groups.' },
          { s: n + ' site:facebook.com', why: 'Public posts and, more usefully, posts other people made about you and tagged.' },
          { s: 'Google Images, then reverse image search', why: 'Search your name in Images, then take any photograph of yourself and reverse search it to find everywhere else it appears.' }
        ];
      }
    },
    work: {
      title: 'Work',
      why: 'Businesses and licences leave filings. Employment leaves people.',
      queries: function (n, c) {
        return [
          { s: 'Your Secretary of State, business entity search', why: 'Every company you have registered, its officers, its status, and whether it was dissolved or forfeited.' },
          { s: n + ' (fired OR resigned OR terminated OR "stepped down")', why: 'Blunt, and it is what somebody else will type.' },
          { s: 'Your state licensing board, licence lookup', why: 'Status, expiry, and any public action, for each licence.' },
          { s: 'Your own resume, line by line', why: 'Not a search. Read it as a hostile stranger and check every date, title, and claim against a document you can produce.' }
        ];
      }
    },
    personal: {
      title: 'Personal',
      why: 'Residency and family records are the two that decide local races.',
      queries: function (n, c) {
        return [
          { s: 'Your state voter registration lookup', why: 'Confirm the address on file is the address you actually live at, and check when it last changed.' },
          { s: 'Your county recorder, marriage and divorce index', why: 'Usually indexed publicly by name, and divorce filings can contain allegations you have forgotten are on the record.' },
          { s: 'Your county assessor, by name rather than address', why: 'Finds property you may have stopped thinking about, including anything held jointly.' },
          { s: n + ' obituary', why: 'Family obituaries name relatives, employers, and towns, and they are how a researcher maps your family in ten minutes.' }
        ];
      }
    },
    affiliations: {
      title: 'Affiliations',
      why: 'Money and membership are both filed somewhere.',
      queries: function (n, c) {
        return [
          { s: 'FEC individual contributor search, at fec.gov', why: 'Every federal political donation you have made, by name and employer, going back decades.' },
          { s: 'Your state campaign finance portal, contributor search', why: 'State and local donations, which is where the awkward ones usually are.' },
          { s: 'ProPublica Nonprofit Explorer', why: 'Form 990s for any nonprofit you served, founded, or gave to. Officers are listed by name.' },
          { s: n + ' (donated OR contribution OR endorsed OR "signed the petition")', why: 'Catches the local coverage that never made it into a register.' }
        ];
      }
    },
    record: {
      title: 'Your record',
      why: 'Every claim on your bio is a claim somebody can check.',
      queries: function (n, c) {
        return [
          { s: n + ' (alumni OR graduated OR degree OR "class of")', why: 'What the internet already believes about your education.' },
          { s: n + ' site:' + slug(c) + '.gov minutes', why: 'Attendance, votes, and what you actually said, at every meeting that was minuted. Correct the domain if this is not the right one.' },
          { s: 'Your prior campaign finance filings', why: 'Late filings, amendments, and anything flagged, from any race you have run before.' },
          { s: 'Your own bio, claim by claim', why: 'Not a search. For each line, name the document that proves it. Anything you cannot prove comes off the bio today.' }
        ];
      }
    }
  };

  // The AI pass. Useful and worth two explicit warnings, both of which go on
  // screen next to it rather than being buried here.
  function aiPrompts(name, city, office) {
    var n = String(name || '').trim() || 'YOUR NAME';
    var c = place(city);
    var o = String(office || '').trim() || 'local office';
    return [
      {
        title: 'Ask an AI that can search the web',
        body: 'Act as an opposition researcher hired to beat me. My name is ' + n +
          ', I live in ' + c + ', and I am running for ' + o +
          '. Search the web and tell me everything publicly available about me that could be used against me. List each item with the source link, and rank them by how much damage they would do. Do not be polite about it, and tell me plainly if you cannot find much.'
      },
      {
        title: 'Ask it to read your own old posts back to you',
        body: 'Below are posts I wrote years ago. For each one, tell me how it would read if it were screenshotted with no context and posted by somebody who wants me to lose. Pick the five worst and explain what makes them usable.\n\n[paste your old posts here]'
      },
      {
        title: 'Ask what records exist where you live',
        body: 'I am running for ' + o + ' in ' + c + '. List the public records that exist about a candidate in this state and where each one is held: court records, property, liens, campaign finance, business filings, voter registration, and professional licences. Give me the actual website for each one.'
      }
    ];
  }

  // "St. Petersburg, Florida" -> "stpetersburg". Good enough for a site: hint
  // that the user is expected to correct, and honest about being a guess.
  function slug(city) {
    var c = String(city || '').trim().split(',')[0];
    if (!c) return 'yourcity';
    return c.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yourcity';
  }

  function build(race, flaggedSections) {
    var name = race.name;
    var city = race.city;
    var groups = [baseline(name, city)];
    var n = q(name);
    var c = place(city);

    Object.keys(BY_SECTION).forEach(function (key) {
      if (flaggedSections.indexOf(key) === -1) return;
      var s = BY_SECTION[key];
      groups.push({
        id: key,
        title: s.title,
        why: s.why,
        queries: s.queries(n, c)
      });
    });

    return { groups: groups, ai: aiPrompts(name, city, race.office) };
  }

  window.SelfVetSearches = { build: build, slug: slug };
})();
