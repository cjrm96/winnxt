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
  function baseline(name, city, former) {
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
        { s: former ? '"' + former.trim() + '" ' + c : 'Every other version of your name',
          why: former
            ? 'The name you had at the time is the name the record is filed under. Run every search on this page again with this one, because a researcher will and most candidates never do.'
            : 'Maiden name, married name, a middle initial, a nickname, and the misspelling people actually use. Run the baseline search again for each one.' }
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

  // The AI pass.
  //
  // These used to be three polite requests to "find anything about me", which
  // is the prompt everybody already writes and which produces a paragraph of
  // hedging. What a competent researcher actually does is run a specific list
  // and account for every line of it, so that is what these ask for. The first
  // one hands over the exact queries this page just generated, which closes the
  // loop: the same searches, run by something that can read a hundred results
  // faster than you can read ten.
  function aiPrompts(race, groups) {
    var n = String(race.name || '').trim() || 'YOUR NAME';
    var c = place(race.city);
    var o = String(race.office || '').trim() || 'local office';
    var former = String(race.former || '').trim();

    var lines = [];
    groups.forEach(function (g) {
      g.queries.forEach(function (item) {
        if (item.s.indexOf('"') === 0 || item.s.indexOf('from:') === 0 ||
            item.s.indexOf('web.archive') === 0) lines.push(item.s);
      });
    });
    var queryBlock = lines.length ? lines.join('\n') : '"YOUR FULL NAME" YOUR CITY';

    return [
      {
        title: 'Run the list and account for every line',
        body: 'You are doing opposition research on me. I am ' + n +
          ', in ' + c + ', running for ' + o + '.' +
          (former ? ' I have also gone by ' + former + '.' : '') +
          '\n\nRun each of these searches. Do not summarise them together.\n\n' +
          queryBlock +
          '\n\nFor every single line, report back in this format:\n' +
          '1. The query.\n' +
          '2. What you found, with the source link, or the words NOTHING FOUND.\n' +
          '3. How damaging it is, and to whom.\n\n' +
          'Then tell me the three most useful things across the whole set, and the three queries you would run next that are not on this list. Do not soften anything. If you cannot actually search the web, say so in your first sentence and stop, rather than guessing at what might be there.'
      },
      {
        title: 'Find the records offices for my state',
        body: 'I am running for ' + o + ' in ' + c +
          '. I want to check my own public records myself.\n\n' +
          'For my state and county specifically, give me the working web address for each of these, and say whether each one is free, pay-per-page, or in person only:\n\n' +
          '1. County clerk of court, criminal and civil case search.\n' +
          '2. Statewide trial court case search, if one exists.\n' +
          '3. County recorder, for liens, deeds and judgments.\n' +
          '4. County assessor, searchable by owner name.\n' +
          '5. Secretary of State, business entity search.\n' +
          '6. State campaign finance contributor search.\n' +
          '7. State voter registration lookup.\n' +
          '8. Professional licence lookup for my state.\n' +
          '9. Marriage and divorce index for my county.\n\n' +
          'If you are not certain a link is current, say so rather than giving me one that looks right.'
      },
      {
        title: 'Read my old posts back to me the way an opponent would',
        body: 'Below are things I wrote years ago. For each one, tell me: how it reads with no context, what the worst honest headline would be, and whether it would survive being screenshotted next to my candidate photo.\n\n' +
          'Rank the five worst and explain what specifically makes each one usable against me. Do not reassure me and do not tell me they are fine because the context is obvious, because the context does not travel.\n\n' +
          '[paste your old posts here]'
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
    var groups = [baseline(name, city, race.former)];
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

    return { groups: groups, ai: aiPrompts(race, groups) };
  }

  window.SelfVetSearches = { build: build, slug: slug };
})();
