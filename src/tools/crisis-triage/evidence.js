// Why the tool says what it says, and where it has played out before.
//
// Two rules for anything added to this file:
//   1. Every citation must be a real, findable publication. No paraphrased
//      "studies show." If it cannot be looked up, it does not go in.
//   2. Every case must be a matter of public record, described in a way its
//      own subject would recognize as accurate. These are illustrations of a
//      pattern, not attacks on the people in them.
//
// Cases are drawn from both parties and from business deliberately. The tool
// ships nonpartisan and the reader should be able to tell.
(function () {

  var CITES = {
    scct: {
      claim: 'Match the response to how much blame the public assigns you, not to how bad you feel.',
      source: 'Coombs, W. T. (2007). Protecting Organization Reputations During a Crisis: The Development and Application of Situational Crisis Communication Theory. Corporate Reputation Review, 10(3), 163–176.'
    },
    scctTest: {
      claim: 'Responses that overshoot or undershoot the level of responsibility the audience perceives do measurably worse than matched ones.',
      source: 'Coombs, W. T., & Holladay, S. J. (2002). Helping Crisis Managers Protect Reputational Assets. Management Communication Quarterly, 16(2), 165–186.'
    },
    thunder: {
      claim: 'Disclosing your own bad news first, what researchers call stealing thunder, leaves you more credible than letting someone else break it.',
      source: 'Arpan, L. M., & Roskos-Ewoldsen, D. R. (2005). Stealing Thunder: Analysis of the Effects of Proactive Disclosure of Crisis Information. Public Relations Review, 31(3), 425–433.'
    },
    timing: {
      claim: 'Timing does as much work as wording. Getting ahead of a story outperforms reacting to it, across response types.',
      source: 'Claeys, A.-S., & Cauberghe, V. (2012). Crisis Response and Crisis Timing Strategies, Two Sides of the Same Coin. Public Relations Review, 38(1), 83–88.'
    },
    illusory: {
      claim: 'A claim repeated is a claim believed. Familiarity alone raises how true something feels.',
      source: 'Hasher, L., Goldstein, D., & Toppino, T. (1977). Frequency and the Conference of Referential Validity. Journal of Verbal Learning and Verbal Behavior, 16(1), 107–112.'
    },
    denialRisk: {
      claim: 'Repeating a false claim in order to deny it can leave people remembering the claim and forgetting the denial.',
      source: 'Skurnik, I., Yoon, C., Park, D. C., & Schwarz, N. (2005). How Warnings About False Claims Become Recommendations. Journal of Consumer Research, 31(4), 713–724.'
    },
    sandwich: {
      claim: 'Lead with the fact, warn before you mention the falsehood, mention it once, and give people a replacement explanation rather than just a denial.',
      source: 'Lewandowsky, S., Ecker, U. K. H., Seifert, C. M., Schwarz, N., & Cook, J. (2012). Misinformation and Its Correction. Psychological Science in the Public Interest, 13(3), 106–131.'
    },
    correctionsWork: {
      claim: 'Corrections generally do move people. The fear that facts always backfire is largely unsupported, which is why a damaging false claim is worth answering.',
      source: 'Wood, T., & Porter, E. (2019). The Elusive Backfire Effect: Mass Attitudes’ Steadfast Factual Adherence. Political Behavior, 41, 135–163.'
    },
    streisand: {
      claim: 'Trying to suppress something small is itself the event that makes it big.',
      source: 'Jansen, S. C., & Martin, B. (2015). The Streisand Effect and Censorship Backfire. International Journal of Communication, 9, 656–671.'
    },
    imageRepair: {
      claim: 'The available moves are a known set: deny, evade responsibility, reduce offensiveness, correct, apologize. Mixing them incoherently is what reads as evasive.',
      source: 'Benoit, W. L. (1997). Image Repair Discourse and Crisis Communication. Public Relations Review, 23(2), 177–186.'
    },
    cerc: {
      claim: 'Crises move through phases, and what works in the first hour is not what works in week three.',
      source: 'U.S. Centers for Disease Control and Prevention. Crisis and Emergency Risk Communication (CERC) manual.'
    },
    harassment: {
      claim: 'Harassment of local officials is common, and most of it arrives from people who are not physically present.',
      source: 'Reuters and NBC News reporting on threats and harassment directed at U.S. school board members and local officials.'
    }
  };

  // Each case carries the full arc, because the arc is the teaching. What
  // happened, what the public did with it, what the subject actually chose,
  // and where it ended up. Facts here are matters of public record; where the
  // detail is thin the entry stays short rather than getting embellished.
  var CASES = {
    sayNothing: [
      {
        who: 'Barbra Streisand',
        year: 2003,
        what: 'She sued to have an aerial photograph of her home removed from a public coastal-erosion archive. The image had been downloaded a handful of times before the suit. Coverage of the lawsuit drove it to hundreds of thousands of views.',
        lesson: 'The response is what created the audience. The photo was not the event; the objection was.',
        background: 'Photographer Kenneth Adelman was shooting the entire California coastline for the California Coastal Records Project, an environmental effort to document erosion. Image 3850 of roughly 12,000 happened to include Streisand\'s Malibu house. It was one anonymous frame in a scientific archive, labelled by number, and nobody had connected it to her.',
        reaction: 'Before the lawsuit, the photograph had been downloaded six times, two of those by her own attorneys. Once news of the suit spread, roughly 420,000 people visited the site in the following month. The image was reproduced everywhere, now firmly attached to her name.',
        handling: 'She sued the photographer and the hosting service for $50 million, alleging invasion of privacy. The suit itself, not the photo, was what made the story newsworthy: a celebrity trying to remove an image most people had never seen.',
        outcome: 'The case was dismissed and she was ordered to pay the photographer\'s legal costs, reported at about $155,000. In 2005 the pattern was named the Streisand effect, and it is now the standard reference for suppression that backfires.'
      }
    ],
    hold: [
      {
        who: 'Barbra Streisand',
        year: 2003,
        what: 'A lawsuit over an obscure aerial photo of her house turned a file almost nobody had seen into an internationally recognised example, and gave the effect its name.',
        lesson: 'If almost nobody has seen it, your statement is the distribution mechanism. Prepare it; do not publish it.',
        background: 'The photo sat in a 12,000-image environmental archive, identified only by a number. Nothing linked it to her publicly.',
        reaction: 'Six downloads before the suit. Roughly 420,000 visitors in the month after it became news.',
        handling: 'A $50 million privacy suit. An action loud enough to be covered, about an image quiet enough that coverage was the only way most people would ever learn of it.',
        outcome: 'Dismissed, with about $155,000 in the other side\'s legal costs against her, and her name permanently attached to the phenomenon.'
      }
    ],
    preempt: [
      {
        who: 'Bill Clinton',
        year: 1992,
        what: 'Facing allegations that threatened to end his primary campaign, he chose the venue and the timing rather than letting the story be told for him week by week.',
        lesson: 'When the story is coming out anyway, the one thing still under your control is who frames it first.',
        background: 'In January 1992, weeks before the New Hampshire primary, a supermarket tabloid published Gennifer Flowers\'s claim of a long affair. Clinton was a little-known governor in a crowded field, and the story had the shape of something that would consume every day of coverage until the primary.',
        reaction: 'The press treated it as potentially disqualifying. Staff and observers at the time widely expected the campaign to collapse; the question being asked was when he would withdraw, not whether he would recover.',
        handling: 'Rather than issue statements and let the story be relitigated daily, the campaign picked the largest available stage and went to it deliberately: a 60 Minutes interview aired immediately after the Super Bowl, with Hillary Clinton beside him. He acknowledged difficulty in the marriage in his own words, on his own schedule, in front of an enormous audience, and declined to relitigate specifics afterwards.',
        outcome: 'He finished second in New Hampshire, called himself the Comeback Kid, and turned a survival into a narrative. He won the nomination and the presidency. The episode is the standard example of choosing your own venue instead of being summoned to someone else\'s.'
      },
      {
        who: 'Johnson & Johnson',
        year: 1982,
        what: 'After cyanide-laced Tylenol capsules killed seven people in the Chicago area, the company pulled roughly 31 million bottles nationwide and went public immediately, before regulators compelled it and while the tampering was still unexplained.',
        lesson: 'Acting faster than you are required to is what buys the benefit of the doubt later.',
        background: 'In autumn 1982 seven people died after taking Extra-Strength Tylenol capsules that had been laced with potassium cyanide. The tampering happened after the product left the company\'s control, on store shelves. By the standards of legal exposure, the company was a victim rather than a cause.',
        reaction: 'Public alarm was immediate and national. Tylenol\'s share of the pain-reliever market fell from roughly 37% to about 7%. Commentators at the time widely assumed the brand could not survive under that name.',
        handling: 'The company warned the public before it was required to, halted advertising, recalled roughly 31 million bottles at a cost of around $100 million, cooperated openly with investigators, and offered exchanges to anyone holding capsules. It then reintroduced the product in triple-sealed tamper-evident packaging: a visible, checkable change rather than a promise.',
        outcome: 'Market share recovered to around 30% within about a year. The response drove federal anti-tampering law and FDA packaging rules, and it remains the case taught first in nearly every crisis communications course.'
      }
    ],
    trueDoes: [
      {
        who: 'Johnson & Johnson',
        year: 1982,
        what: 'Full disclosure, a national recall, and a redesigned tamper-evident package. The brand recovered its market position within about a year.',
        lesson: 'Say all of it at once, and pair the admission with a fix people can see.',
        background: 'Seven deaths in the Chicago area from cyanide placed in Tylenol capsules after they had left the factory. The company had not caused the tampering.',
        reaction: 'Market share collapsed from roughly 37% to about 7%. The brand was widely written off.',
        handling: 'Warned the public early, pulled roughly 31 million bottles at around $100 million, cooperated with investigators, and returned with tamper-evident packaging that customers could verify themselves.',
        outcome: 'Recovered to roughly 30% share within a year, and changed federal packaging law in the process.'
      },
      {
        who: 'Richard Nixon',
        year: 1974,
        what: 'The Watergate break-in was survivable. The concealment that followed was not, and it ended in resignation.',
        lesson: 'The cover-up outlived the offense. It usually does.',
        background: 'Five men were arrested breaking into Democratic National Committee headquarters in June 1972. The connection to the president was not established at the time, and he was re-elected that November in one of the largest landslides in American history. The original crime was, on its own, a survivable political problem.',
        reaction: 'Sustained investigative reporting, then televised Senate hearings in 1973, then the revelation that the president had taped his own conversations. Each concealment produced a fresh round of coverage larger than the last. The dismissal of the special prosecutor in late 1973 turned a legal story into a constitutional one.',
        handling: 'Denial, withheld tapes, claims of executive privilege, and edited transcripts released in place of recordings. Every partial disclosure invited a demand for the rest, and every demand was itself a news cycle.',
        outcome: 'The Supreme Court ordered the tapes released. One recording showed he had moved to obstruct the investigation days after the break-in. Approval fell from roughly 67% to the mid-20s, and he resigned in August 1974, over the concealment and not the burglary.'
      },
      {
        who: 'Anthony Weiner',
        year: 2011,
        what: 'He denied the story flatly for several days, including in press interviews, before admitting it was true. He resigned within weeks.',
        lesson: 'A denial that later collapses costs far more than the fact it was meant to hide.',
        background: 'In late May 2011 a lewd photograph was sent from the public Twitter account of a sitting congressman with a rising national profile.',
        reaction: 'What could have been a short embarrassment ran for about ten days because the denial kept generating new questions. In televised interviews he claimed his account had been hacked and said he could not state "with certitude" whether a photograph was of him. That phrase became the story in its own right and made him the subject of ridicule.',
        handling: 'Roughly ten days of denials, then a press conference admitting he had sent the images, had exchanged messages with several women, and had lied about all of it publicly.',
        outcome: 'He resigned in June 2011. A 2013 mayoral run briefly led the polls before further revelations; he finished fifth with about 5%. The lie, not the photograph, is what people remembered.'
      }
    ],
    falseDoes: [
      {
        who: 'John Kerry',
        year: 2004,
        what: 'Attack ads challenging his military record ran for weeks before his campaign answered them forcefully. The delay let the charge settle before the rebuttal arrived.',
        lesson: 'Against a damaging claim you can disprove, silence is read as confirmation. Speed is the whole game.',
        background: 'Kerry had built his presidential campaign on his Vietnam service, making his military record the centre of his case. In August 2004 a group of veterans opposed to him began running ads disputing that record and the circumstances of his decorations.',
        reaction: 'The initial ad buy was small: a few hundred thousand dollars in a handful of markets. Cable news, talk radio, and the resulting argument carried it vastly further than the money ever could have. The specific claims were contradicted by Navy records, by contemporaneous accounts, and in some cases by the earlier statements of the people now making them. But the correction had to travel through a story that was already weeks old.',
        handling: 'The campaign initially chose not to respond directly, reasoning that a formal reply would elevate a small ad buy into a national story. The unanswered charge became the national story anyway. He responded forcefully about two weeks after the first ad aired.',
        outcome: 'His standing on the issue he had made central to his candidacy fell measurably during the silence. "Swiftboating" entered the language as a word for the tactic. He later said publicly that not answering faster had been a mistake.'
      }
    ],
    trueDoesnt: [
      {
        who: 'Mark Sanford',
        year: 2013,
        what: 'Four years after a scandal that ended his time as governor, he ran for a U.S. House seat and won, treating the episode as known, settled, and old news rather than something to avoid discussing.',
        lesson: 'Once everyone already knows, it stops being a story. Flinching is what makes it one again.',
        background: 'In 2009 the sitting governor of South Carolina disappeared for several days. His staff said he was hiking the Appalachian Trail; he had in fact travelled to Argentina. He returned to an airport press conference and admitted an affair. He was censured by the legislature, paid ethics fines, and was widely regarded as politically finished.',
        reaction: 'The details, particularly the Appalachian Trail cover story, made it a national punchline for years, the kind of thing that follows a name permanently.',
        handling: 'When he ran for Congress in a 2013 special election, he did not avoid the subject or hope it would not come up. He raised it himself, ran explicitly on the theme of second chances and failure, and treated the facts as common knowledge rather than as an accusation to be parried.',
        outcome: 'He won with about 54% and served three more terms. The scandal never stopped being true; it simply stopped being news, because he refused to behave as though it were.'
      }
    ],
    channel: [
      {
        who: "Domino's Pizza",
        year: 2009,
        what: 'A prank video by two employees spread on YouTube. The company answered on YouTube, with its president on camera, within about 48 hours.',
        lesson: 'They answered where it happened. A press release would not have reached the same people.',
        background: 'Two employees at a North Carolina store filmed themselves doing revolting things to food and posted it to YouTube. The company said the food was never delivered to customers, but the video did not need to be representative to be devastating.',
        reaction: 'The video passed roughly a million views within days. Brand perception tracking showed the company move from positive to negative sentiment in about 48 hours, a reversal that would ordinarily take years.',
        handling: 'The company identified the store, fired the employees, worked with the health department and pressed charges. Then the president recorded a direct response and posted it to YouTube, the same platform, addressing the same audience, and the company opened a Twitter account to answer people individually.',
        outcome: 'It became an early standard example of answering a crisis on the platform that produced it. The main criticism was of the delay, roughly a day or two, which is a long time on a platform that moves in hours.'
      }
    ],
    safety: [
      {
        who: 'Local school board members, United States',
        year: 2021,
        what: 'Reuters documented more than 200 instances of school board members being harassed or threatened; NBC News reporting found most tracked incidents came from people who were not physically present at meetings.',
        lesson: 'This is common, it is documented, and it is a matter for law enforcement rather than a communications problem to absorb quietly.',
        background: 'Beginning around 2021, school board meetings across the country became a focus of organised anger over curriculum and public health policy. Members who had run for unpaid local seats found themselves the target of sustained campaigns.',
        reaction: 'Documented incidents included threats to homes and families, publication of members\' addresses, and confrontations that required police presence at meetings. A meaningful share of members resigned or declined to run again.',
        handling: 'Reporting found the most effective responses were procedural rather than rhetorical: documenting every incident with dates, involving law enforcement early, coordinating with district security on meeting logistics, and declining to engage individually with anonymous accounts.',
        outcome: 'The pattern is well enough established that it should be planned for rather than absorbed. Most tracked incidents originated with people who were not physically present, which is exactly why documentation and reporting matter more than a public response.'
      }
    ],
    localPattern: [
      {
        who: 'A St. Petersburg, Florida city council candidate',
        year: 2021,
        what: 'Old posts resurfaced and were amplified locally. The candidate withdrew from the race within days.',
        lesson: 'Local first, wider second. The window to act is measured in hours.',
        background: 'A candidate for city council in a mid-sized Florida city had old social media posts surface during the campaign.',
        reaction: 'The material spread locally and was picked up by local news within days.',
        handling: 'The candidate withdrew from the race rather than attempt a response.',
        outcome: 'A local race ended over material that had been publicly available for years and that nobody had gone looking for until the campaign made it worth finding. A self-vet before filing is the cheapest insurance available against this.'
      },
      {
        who: 'A Norman, Oklahoma council member',
        year: 2021,
        what: 'An exchange in a local Facebook group spread through neighborhood groups, then drew national attention. The member resigned within about three months.',
        lesson: 'The neighborhood group is where these start. Watch it accordingly.',
        background: 'A sitting council member in a university town had an exchange in a local Facebook group.',
        reaction: 'It moved from that group through other neighborhood groups, then to a wider audience, the standard local-then-national sequence.',
        handling: 'The pressure was sustained locally over a period of months rather than resolving in a single news cycle.',
        outcome: 'The member resigned within roughly three months. Local pressure does not need national coverage to end a local career, though it often gets it.'
      }
    ]
  };

  // Which evidence belongs on this particular report.
  function forAssessment(r, answers) {
    var cites = [];
    var cases = [];

    var publish = r.call.publish;
    var q = r.quadrantKey;

    if (publish === 'no') {
      cites.push(CITES.streisand, CITES.illusory);
      cases = cases.concat(CASES.sayNothing);
    } else if (publish === 'hold') {
      cites.push(CITES.streisand, CITES.timing);
      cases = cases.concat(CASES.hold);
    } else if (publish === 'preempt') {
      cites.push(CITES.thunder, CITES.timing);
      cases = cases.concat(CASES.preempt);
    }

    if (q === 'true-does') {
      cites.push(CITES.imageRepair, CITES.thunder);
      cases = cases.concat(CASES.trueDoes);
    } else if (q === 'false-does') {
      cites.push(CITES.sandwich, CITES.denialRisk, CITES.correctionsWork);
      cases = cases.concat(CASES.falseDoes);
    } else if (q === 'true-doesnt') {
      cases = cases.concat(CASES.trueDoesnt);
    } else if (q === 'false-doesnt') {
      cites.push(CITES.illusory);
    }

    cites.push(CITES.scct, CITES.scctTest);
    cites.push(CITES.cerc);

    if (answers.where === 'facebook-group' || answers.where === 'neighborhood-app') {
      cases = cases.concat(CASES.localPattern);
    }
    if (publish !== 'no' && r.channel) {
      cases = cases.concat(CASES.channel);
    }
    if (answers.safety === 'yes') {
      cites.push(CITES.harassment);
      cases = CASES.safety.concat(cases);
    }

    return { citations: dedupe(cites), cases: dedupe(cases) };
  }

  function dedupe(list) {
    var seen = [];
    return list.filter(function (x) {
      var key = x.source || (x.who + x.year);
      if (seen.indexOf(key) !== -1) return false;
      seen.push(key);
      return true;
    });
  }

  // Citation attached to a specific line of the read.
  function forQuadrant(key) {
    if (key === 'false-does') return CITES.sandwich;
    if (key === 'true-does') return CITES.thunder;
    if (key === 'false-doesnt') return CITES.streisand;
    return null;
  }

  function forCall(publish) {
    if (publish === 'no' || publish === 'hold') return CITES.streisand;
    if (publish === 'preempt') return CITES.thunder;
    if (publish === 'yes') return CITES.timing;
    return null;
  }

  window.CrisisEvidence = {
    forAssessment: forAssessment,
    forQuadrant: forQuadrant,
    forCall: forCall,
    scct: CITES.scct,
    CITES: CITES,
    CASES: CASES
  };
})();
