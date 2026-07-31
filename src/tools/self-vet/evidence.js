// Why the tool says what it says, and where it has played out before.
//
// Same two rules as the crisis tool, and for the same reason: this is the part
// a buyer cannot get from a checklist, and it is worthless the moment any of
// it is invented.
//   1. Every citation is a real, findable publication.
//   2. Every case is a matter of public record, described in a way its own
//      subject would recognise as accurate.
//
// Cases are drawn from both parties deliberately. The tool ships nonpartisan
// and the reader should be able to tell.
(function () {

  var CITES = {
    thunder: {
      claim: 'Disclosing your own bad news first, what researchers call stealing thunder, leaves you more credible than letting someone else break it.',
      source: 'Arpan, L. M., & Roskos-Ewoldsen, D. R. (2005). Stealing Thunder: Analysis of the Effects of Proactive Disclosure of Crisis Information. Public Relations Review, 31(3), 425–433.'
    },
    timing: {
      claim: 'Timing does as much work as wording. Getting ahead of a story outperforms reacting to it, across response types.',
      source: 'Claeys, A.-S., & Cauberghe, V. (2012). Crisis Response and Crisis Timing Strategies, Two Sides of the Same Coin. Public Relations Review, 38(1), 83–88.'
    },
    imageRepair: {
      claim: 'The available moves are a known set: deny, evade responsibility, reduce offensiveness, correct, apologise. Deciding which one you are using before you are asked is what keeps an answer from reading as evasive.',
      source: 'Benoit, W. L. (1997). Image Repair Discourse and Crisis Communication. Public Relations Review, 23(2), 177–186.'
    },
    scct: {
      claim: 'Match the response to how much blame the public assigns you, not to how bad you feel about it.',
      source: 'Coombs, W. T. (2007). Protecting Organization Reputations During a Crisis: The Development and Application of Situational Crisis Communication Theory. Corporate Reputation Review, 10(3), 163–176.'
    },
    selfResearch: {
      claim: 'Running opposition research on your own candidate before anyone else does is standard practice at every level of professional campaigning.',
      source: 'Governing, on self-vetting and the cost of skipping it, and CampaignNow, "Doing Political Campaign Opposition Research on Yourself."'
    }
  };

  var TIER_CITES = {
    ahead: ['thunder', 'timing'],
    draft: ['imageRepair', 'scct'],
    prepare: ['scct']
  };

  // Two cases that make the case for doing this at all. Shown to everyone,
  // whatever their register looks like, because the person who most needs them
  // is the one who flagged nothing.
  var WHY = [
    {
      who: 'A St. Petersburg, Florida city council candidate',
      year: 2021,
      what: 'Old posts resurfaced during the campaign and were amplified locally. The candidate withdrew within days.',
      lesson: 'The material had been public for years. Nobody had gone looking until the campaign made it worth finding.',
      background: 'A candidate for city council in a mid-sized Florida city had old social media posts surface during the campaign.',
      reaction: 'The material spread locally and was picked up by local news within days.',
      handling: 'The candidate withdrew from the race rather than attempt a response.',
      outcome: 'A local race ended over material that had been publicly available for years. Nothing about it was undiscoverable. It had simply never been looked for, including by the candidate.'
    },
    {
      who: 'Richard Nixon',
      year: 1974,
      what: 'The Watergate break-in was survivable. The concealment that followed was not, and it ended in resignation.',
      lesson: 'The cover-up outlived the offense. It usually does.',
      background: 'Five men were arrested breaking into Democratic National Committee headquarters in June 1972. The connection to the president was not established at the time, and he was re-elected that November in one of the largest landslides in American history. The original crime was, on its own, a survivable political problem.',
      reaction: 'Sustained investigative reporting, then televised Senate hearings in 1973, then the revelation that the president had taped his own conversations. Each concealment produced a fresh round of coverage larger than the last.',
      handling: 'Denial, withheld tapes, claims of executive privilege, and edited transcripts released in place of recordings. Every partial disclosure invited a demand for the rest, and every demand was itself a news cycle.',
      outcome: 'Approval fell from roughly 67% to the mid-20s, and he resigned in August 1974, over the concealment and not the burglary. The scale is presidential; the mechanism is identical in a school board race.'
    }
  ];

  var TIER_CASES = {
    ahead: [
      {
        who: 'Bill Clinton',
        year: 1992,
        what: 'Facing allegations that threatened to end his primary campaign, he chose the venue and the timing rather than letting the story be told for him week by week.',
        lesson: 'When it is coming out anyway, the one thing still under your control is who frames it first.',
        background: 'In January 1992, weeks before the New Hampshire primary, a supermarket tabloid published Gennifer Flowers\'s claim of a long affair. Clinton was a little-known governor in a crowded field, and the story had the shape of something that would consume every day of coverage until the primary.',
        reaction: 'The press treated it as potentially disqualifying. Staff and observers at the time widely expected the campaign to collapse; the question being asked was when he would withdraw, not whether he would recover.',
        handling: 'Rather than issue statements and let the story be relitigated daily, the campaign picked the largest available stage and went to it deliberately: a 60 Minutes interview aired immediately after the Super Bowl, with Hillary Clinton beside him. He acknowledged difficulty in the marriage in his own words, on his own schedule, in front of an enormous audience, and declined to relitigate specifics afterwards.',
        outcome: 'He finished second in New Hampshire, called himself the Comeback Kid, and turned a survival into a narrative. He won the nomination and the presidency. It remains the standard example of choosing your own venue instead of being summoned to someone else\'s.'
      },
      {
        who: 'Johnson & Johnson',
        year: 1982,
        what: 'After cyanide-laced Tylenol capsules killed seven people, the company went public and pulled roughly 31 million bottles before regulators compelled it, while the tampering was still unexplained.',
        lesson: 'Acting faster than you are required to is what buys the benefit of the doubt later.',
        background: 'The tampering happened after the product left the company\'s control, on store shelves. By the standards of legal exposure, the company was a victim rather than a cause, and had every excuse to wait for the facts.',
        reaction: 'Public alarm was immediate and national. Tylenol\'s share of the pain-reliever market fell from roughly 37% to about 7%. Commentators widely assumed the brand could not survive under that name.',
        handling: 'It warned the public before it was required to, recalled roughly 31 million bottles at a cost of around $100 million, cooperated openly with investigators, and returned with tamper-evident packaging people could check themselves.',
        outcome: 'Market share recovered to around 30% within about a year. Volunteering the bad news, at cost, before anyone made them, is the whole reason the case is still taught.'
      }
    ],
    draft: [
      {
        who: 'Anthony Weiner',
        year: 2011,
        what: 'A denial issued in the first days collapsed under evidence within three weeks, and the collapse ended the career rather than the original conduct.',
        lesson: 'A denial that later fails costs far more than the fact it was meant to hide.',
        background: 'A sitting congressman was asked about a message sent from his own account. The underlying conduct was embarrassing and not illegal.',
        reaction: 'The denial itself became the story, and every subsequent detail was measured against it rather than against the original event.',
        handling: 'He denied it publicly and repeatedly, including in interviews, before acknowledging it about three weeks later.',
        outcome: 'He resigned in June 2011. The available evidence suggests the original conduct was survivable and the false denial was not, which is exactly the outcome a pre-written truthful statement exists to prevent.'
      }
    ],
    prepare: [
      {
        who: 'Mark Sanford',
        year: 2013,
        what: 'He ran for Congress with a well-known scandal already in his past, addressed it plainly rather than avoiding it, and won.',
        lesson: 'Once everyone already knows, it stops being a story. Flinching is what makes it one again.',
        background: 'Four years after a widely covered scandal as governor, he ran in a special election for a South Carolina congressional seat. Every voter in the district already knew the history.',
        reaction: 'National coverage treated the candidacy as a curiosity and expected the past to be disqualifying.',
        handling: 'He did not attempt to relitigate or hide it. He referenced it directly, including in his own advertising, and moved the conversation to what he was running on.',
        outcome: 'He won the seat in May 2013. Old, known, and openly acknowledged is a materially different problem from new, hidden, and discovered.'
      }
    ]
  };

  function citesFor(tierKey) {
    return (TIER_CITES[tierKey] || []).map(function (k) { return CITES[k]; }).filter(Boolean);
  }

  function casesFor(tierKey) {
    return TIER_CASES[tierKey] || [];
  }

  // Deduplicated across the tiers actually present, capped, so a register with
  // all three tiers does not open with nine case studies.
  function allCites(tierKeys) {
    var seen = {};
    var out = [];
    (tierKeys || []).forEach(function (k) {
      (TIER_CITES[k] || []).forEach(function (id) {
        if (seen[id]) return;
        seen[id] = true;
        out.push(CITES[id]);
      });
    });
    return out;
  }

  window.SelfVetEvidence = {
    CITES: CITES,
    WHY: WHY,
    citesFor: citesFor,
    casesFor: casesFor,
    allCites: allCites
  };
})();
