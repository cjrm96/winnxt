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
    specificity: {
      claim: 'Getting ahead of it only protects you if you give the specific details. A vague admission buys almost nothing.',
      source: 'Nguyen, A., Guyer, J. J., & Fabrigar, L. R. (2021). Stealing Thunder: The Influence of Confession Specificity and Transgression Severity. Journal of Experimental Social Psychology, 97, 104218.'
    },
    hiding: {
      claim: 'People judge you more harshly for visibly refusing to answer than for admitting to the unflattering thing itself.',
      source: 'John, L. K., Barasz, K., & Norton, M. I. (2016). Hiding Personal Information Reveals the Worst. Proceedings of the National Academy of Sciences, 113(4), 954–959.'
    },
    reputation: {
      claim: 'Disclosing first does the most for somebody who was well regarded beforehand, and less for somebody already under a cloud. It is not a substitute for a record.',
      source: 'Beldad, A. D., van Laar, E., & Hegner, S. M. (2018). Should the Shady Steal Thunder? Journal of Contingencies and Crisis Management, 26(1), 150–163.'
    },
    followUp: {
      claim: 'Early disclosure pays off only when it comes with a clear account of what you are doing about it, and then you do it.',
      source: 'Kim, S., & Lee, J. (2022). How to Maximize the Effectiveness of Stealing Thunder in Crisis Communication. Corporate Communications: An International Journal, 27(3), 425–440.'
    },
    denialCollapse: {
      claim: 'A denial that is later disproved leaves you trusted less than if you had admitted it at the start.',
      source: 'Kim, P. H., Ferrin, D. L., Cooper, C. D., & Dirks, K. T. (2004). Removing the Shadow of Suspicion. Journal of Applied Psychology, 89(1), 104–118.'
    },
    apologyParts: {
      claim: 'If you do apologise, the more of it you actually say the better it works, and taking responsibility is the part that carries the most weight.',
      source: 'Lewicki, R. J., Polin, B., & Lount, R. B., Jr. (2016). An Exploration of the Structure of Effective Apologies. Negotiation and Conflict Management Research, 9(2), 177–196.'
    },
    abusePower: {
      claim: 'Voters treat financial wrongdoing more harshly than personal wrongdoing, but anything that looks like using your office for yourself is punished hardest of all.',
      source: 'Doherty, D., Dowling, C. M., & Miller, M. G. (2011). Are Financial or Moral Scandals Worse? It Depends. PS: Political Science & Politics, 44(4), 749–757.'
    },
    decay: {
      claim: 'Most scandals only move votes if they break in the election year itself. Moral and sexual ones are the exception and keep costing you.',
      source: 'Pereira, M. M., & Waterbury, N. W. (2019). Do Voters Discount Political Scandals over Time? Political Research Quarterly, 72(3), 584–595.'
    },
    recovery: {
      claim: 'Scandal damage to an incumbent shrinks a lot by the next election, though it takes years to disappear entirely. Most survive it.',
      source: 'Praino, R., Stockemer, D., & Moscardelli, V. G. (2013). The Lingering Effect of Scandals in Congressional Elections. Social Science Quarterly, 94(4), 1045–1061.'
    },
    lowInfo: {
      claim: 'Scandal costs you most when voters know little else about you. Having a substantive record on the ballot softens it.',
      source: 'Funck, A. S., & McCabe, K. T. (2022). Partisanship, Information, and the Conditional Effects of Scandal on Voting Decisions. Political Behavior, 44(3), 1389–1409.'
    },
    selfResearch: {
      claim: 'Running opposition research on your own candidate before anyone else does is standard practice at every level of professional campaigning.',
      source: 'Governing, on self-vetting and the cost of skipping it, and CampaignNow, "Doing Political Campaign Opposition Research on Yourself."'
    }
  };

  var TIER_CITES = {
    ahead: ['thunder', 'timing', 'specificity', 'hiding', 'followUp', 'reputation'],
    draft: ['denialCollapse', 'apologyParts', 'imageRepair', 'scct'],
    prepare: ['decay', 'recovery', 'abusePower', 'scct']
  };

  // Everybody gets these, whatever their register looks like.
  var ALWAYS = ['lowInfo', 'selfResearch'];

  // What the research does not settle.
  //
  // This ships in the product on purpose. The listing tells a buyer to look it
  // all up, and anybody who does will find the contradiction below within an
  // afternoon. Being the one to point it out is the difference between a tool
  // that is trusted and one that is caught overclaiming.
  var LIMITS = [
    {
      title: 'The case for disclosing first comes mostly from corporate research',
      body: 'The studies showing that getting ahead of bad news protects your credibility are largely from crisis communications and marketing, run on companies and products rather than candidates. The reasoning transfers well. The measurements have not been repeated on real elections.'
    },
    {
      title: 'Political science on apologising points the other way',
      body: 'One large recent set of experiments on US voters found that politicians who apologised after an accusation did not gain support and sometimes lost it, while denials did better, even when evidence later proved the accusation true. That study is about responding after you have been accused, which is a different decision from disclosing before anyone has asked, but it is a real finding and it is not comfortable for the advice on this page.',
      source: 'Hamrak, B., Simonovits, G., Rusnak, A., & Szucs, F. (2024). Why Politicians Won\'t Apologize. British Journal of Political Science, 54(4), 1486–1495.'
    },
    {
      title: 'Almost none of it measures actual votes',
      body: 'Nearly every study behind every rule here is a survey or a laboratory experiment using hypothetical people. They measure what somebody says about a candidate in a questionnaire, not what they do in a booth.'
    },
    {
      title: 'Nobody has studied races the size of yours',
      body: 'There is no peer-reviewed research on how scandal behaves in a school board or city council race. The effects measured in congressional and senate contests come with money, media coverage and partisanship that a local race does not have. Treat any number from those studies as an argument, not a measurement of your situation.',
      source: 'Warshaw, C. (2019). Local Elections and Representation in the United States. Annual Review of Political Science, 22, 461–479.'
    },
    {
      title: 'Self-vetting itself is practice, not evidence',
      body: 'Running opposition research on your own candidate is standard at every level of professional campaigning, and there is no scholarship measuring whether it works. It is included here because practitioners are unanimous about it, which is a weaker claim than a study and is worth saying out loud.'
    }
  ];

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
    },
    {
      who: 'Senator Thomas Eagleton',
      year: 1972,
      what: 'Eighteen days after being nominated for vice president, he disclosed hospitalisations for depression and electroshock therapy from a decade earlier. He was off the ticket within a week.',
      lesson: 'The person nobody thought to ask gets discovered by somebody who does, and the campaign pays for the question it never put.',
      background: 'George McGovern selected him hurriedly at the convention after other choices fell through. The hospitalisations were a matter of medical record and known to some in Missouri political circles, but the campaign did not run a search that surfaced them before the nomination. Reporters received tips and started asking.',
      reaction: 'It dominated coverage for over two weeks, at a time when psychiatric treatment carried heavy stigma. McGovern said publicly that he was behind him a thousand per cent, which became a lasting liability once he then dropped him. The framing moved quickly from Eagleton\'s health to McGovern\'s competence.',
      handling: 'Eagleton made the disclosure himself at a press conference rather than waiting for publication, and answered questions directly. He resisted leaving the ticket and went only after McGovern\'s position shifted.',
      outcome: 'He withdrew on 31 July 1972 and was replaced. McGovern lost in a landslide. Eagleton stayed in the Senate and Missouri re-elected him twice more. The failure was not his disclosure; it was that nobody had asked him beforehand.'
    },
    {
      who: 'George Santos',
      year: 2022,
      what: 'After he won his seat, reporting found that core biographical claims, including a degree and Wall Street employment, could not be substantiated. He was expelled from the House a year later.',
      lesson: 'Winning does not close the file. A biography nobody checked before the election gets checked after it.',
      background: 'He campaigned on a resume including a college degree and employment at two major banks. The college had no record of his graduation, and he later said he had not worked directly for either bank. Further discrepancies about his family history and schooling emerged over following weeks.',
      reaction: 'The story ran continuously for months. Local officials of his own party publicly called for his resignation within weeks. The interest was driven less by any single claim than by the accumulation, and by the fact that none of it had surfaced before the ballot.',
      handling: 'He acknowledged in an interview that he had embellished his resume, declined to resign, and continued to contest other characterisations while remaining in office for nearly a year.',
      outcome: 'A House Ethics Committee report found he had used campaign funds for personal spending, and the House expelled him on 1 December 2023 by 311 to 114, the sixth member ever expelled. He later pleaded guilty to federal charges.'
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
        reaction: 'Public alarm was immediate and national. Tylenol\'s share of the pain-reliever market collapsed within weeks. Commentators widely assumed the brand could not survive under that name.',
        handling: 'It warned the public before it was required to, recalled roughly 31 million bottles at a cost of around $100 million, cooperated openly with investigators, and returned with tamper-evident packaging people could check themselves.',
        outcome: 'Most of the lost market share was back within about a year. Volunteering the bad news, at cost, before anyone made them, is the whole reason the case is still taught.'
      },
      {
        who: 'Pete Buttigieg, then mayor of South Bend, Indiana',
        year: 2015,
        what: 'He published a first-person essay in his local paper stating that he is gay, months before standing for re-election, and was returned with about 80% of the vote.',
        lesson: 'If a fact about you is going to come out anyway, publishing it yourself converts it from a weapon into a biography.',
        background: 'A 33-year-old mayor in a conservative-leaning part of Indiana, in a first term and preparing a re-election campaign, in a state that had just been through a national fight over its Religious Freedom Restoration Act. He had not discussed his sexuality publicly before.',
        reaction: 'National outlets picked it up within hours, largely descriptively, and much of the coverage quoted his own framing that it had no bearing on how he did the job. No sustained opposition campaign formed around it locally.',
        handling: 'He chose the venue, the timing and the wording himself, and put it in the local paper his own constituents read rather than a national outlet. He wrote it plainly and at length rather than as a confession.',
        outcome: 'He won the November 2015 general election 8,515 votes to 2,074, roughly 80% to 20%. It never became a line of attack in that race, and by the time he ran nationally in 2020 it was old news.'
      },
      {
        who: 'Wells Fargo',
        year: 2016,
        what: 'Regulators announced that employees had opened large numbers of accounts without customer authorisation. The core facts had been reported by the Los Angeles Times almost three years earlier.',
        lesson: 'A problem you already know about does not get smaller while you wait. It turns into a story about how long you knew.',
        background: 'A Los Angeles Times investigation in December 2013, prompted by a fired employee, described sales quotas pushing staff to open accounts customers had not asked for. The bank had already dismissed around 5,300 employees over the conduct before the 2016 settlement was announced.',
        reaction: 'The 2016 settlement drew far heavier coverage than the original reporting had. Congressional hearings followed, and much of the questioning was about why so many staff had been dismissed without the conduct being treated as something to disclose. The three year gap became a feature of the coverage in its own right.',
        handling: 'The early public posture attributed the conduct to individual employees rather than to the sales targets, and the dismissals were presented as evidence the problem was in hand. That framing did not survive the scale becoming public.',
        outcome: 'The bank paid $185 million plus $5 million in customer remediation in September 2016. The chief executive forfeited $41 million in unvested equity and retired the following month. In 2020 the bank paid $3 billion to resolve related federal investigations.'
      },
      {
        who: 'Andrew Puzder, nominated United States Secretary of Labor',
        year: 2017,
        what: 'He acknowledged during confirmation that he had employed a housekeeper not authorised to work in the United States, and had paid the associated taxes only after his nomination. He withdrew before his hearing.',
        lesson: 'Fixing something quietly at the moment you are about to be checked is itself the story. Fix it earlier or disclose it plainly.',
        background: 'The employment had ended years before, when he learned of her status. The back taxes to the IRS and to California were paid only after the nomination was announced, roughly five years later.',
        reaction: 'The timing of the tax payment, rather than the employment itself, was what senior senators of his own party reportedly found hardest to defend, because it appeared to have been prompted by the nomination.',
        handling: 'He disclosed it to the committee himself rather than waiting for it to emerge, and confirmed the back taxes had been paid in full. He withdrew a day before the scheduled hearing after being told he had no path to confirmation.',
        outcome: 'He withdrew on 15 February 2017, the first cabinet-level nominee of that administration to fail. Household employment and tax filings remain the most reliable thing to lose a confirmation over, and are entirely knowable in advance.'
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
      },
      {
        who: 'Richard Blumenthal',
        year: 2010,
        what: 'Reporting found he had on occasion said he served in Vietnam when he had served in the Marine Corps Reserve in the United States during that era. He said he had misspoken, and won the Senate seat that November.',
        lesson: 'One ambiguous sentence about your own service record will be checked against the documentary record. Audit your own stump speech first.',
        background: 'He completed recruit training at Parris Island and served six years in the Reserve stateside. He had described his service accurately on many occasions, but at least one 2008 event was recorded in which he said he had served in Vietnam. It surfaced during a competitive Senate race.',
        reaction: 'It led national coverage for several days. Critics focused less on the underlying record, which was honourable, than on the gap between what he said and what the documents showed. His polling lead narrowed sharply.',
        handling: 'He first called the reporting distorted and held an event flanked by veterans, then said he had misspoken and apologised, describing the misstatements as unintentional and rare against hundreds of appearances. He did not dispute the facts of his own service.',
        outcome: 'He beat Linda McMahon in November 2010, roughly 55% to 43%. Opponents revived it in his 2016 re-election campaign, which he also won. The story attached to him permanently without ending his career.'
      },
      {
        who: 'David Vitter',
        year: 2007,
        what: 'His phone number appeared in the billing records of a prosecuted Washington escort operation. He issued a short written statement acknowledging a serious sin in his past, and was re-elected in 2010.',
        lesson: 'A short, unqualified admission on your own initiative can close a cycle that a denial would have kept open for months.',
        background: 'Records from the prosecution showed his number appearing several times between 1999 and 2001, while he was in the US House. He had built a public profile partly on family values themes.',
        reaction: 'It ran nationally and stayed a staple of Louisiana coverage for years, including in a 2015 attack advertisement. He faced repeated questioning at debates. State party officials did not push him out.',
        handling: 'He put out a written statement within a day taking responsibility, and then declined to answer further questions on it for the rest of his career. He and his wife appeared briefly before the press and took none.',
        outcome: 'He won re-election in 2010, roughly 57% to 38%. He lost the 2015 governor\'s race by about 12 points and did not seek re-election to the Senate. How much the 2007 matter contributed to that loss is commentary rather than measurement.'
      },
      {
        who: 'Melissa Howard, candidate for the Florida House',
        year: 2018,
        what: 'Reporting found she had not graduated from the university her campaign materials named. She tried to disprove it by posting a photograph of a diploma, and the university said the document matched no record it held. She withdrew within days.',
        lesson: 'The response to a question about your record can do more damage than the record, if the response is itself checkable and false.',
        background: 'She was running in a competitive primary in the Bradenton and Sarasota area. The university confirmed she had attended from 1990 to 1994 but had not graduated. She travelled to Ohio and posted a photograph of a diploma to social media to rebut the reporting.',
        reaction: 'The university\'s general counsel stated publicly that the pictured diploma showed a degree and a date for which the university had no record. The story moved from local Florida outlets to national television in about 48 hours, and the coverage was about the document rather than the missing degree.',
        handling: 'She defended the claim and produced the photograph, then reversed, apologised, and said she had made a terrible error in judgment.',
        outcome: 'She withdrew from the race in August 2018 and was later charged with misrepresentation of an educational institution, a misdemeanour, resolved through a deferred prosecution agreement.'
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
      },
      {
        who: 'Marion Barry',
        year: 1994,
        what: 'Four years after a cocaine possession conviction and six months in federal prison, he ran for mayor of Washington again and won with about 56% of the general election vote.',
        lesson: 'A voter who already knows the worst thing about you can still choose you, as long as you do not pretend it did not happen.',
        background: 'He was arrested in an FBI sting in 1990 during his third term as mayor, convicted on one misdemeanour count, and imprisoned. After release he won a council seat in 1992 with about 70% of the vote, then entered the 1994 mayoral race.',
        reaction: 'National coverage treated the comeback as extraordinary. Local coverage documented a sharp racial split in his support. Critics argued the result damaged the city\'s standing with Congress.',
        handling: 'He did not deny or minimise the conviction. He built the campaign around recovery, spoke about his addiction openly, and made his own record the explicit premise of the argument rather than something to steer around.',
        outcome: 'He won the primary with about 47% in a crowded field and the general election with roughly 56% to 42%, and served a fourth term as mayor.'
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
    ALWAYS.forEach(function (id) {
      seen[id] = true;
      out.push(CITES[id]);
    });
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
    LIMITS: LIMITS,
    WHY: WHY,
    citesFor: citesFor,
    casesFor: casesFor,
    allCites: allCites
  };
})();
