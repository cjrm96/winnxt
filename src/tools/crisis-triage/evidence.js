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
      claim: 'Match the response to how much blame the public assigns you — not to how bad you feel.',
      source: 'Coombs, W. T. (2007). Protecting Organization Reputations During a Crisis: The Development and Application of Situational Crisis Communication Theory. Corporate Reputation Review, 10(3), 163–176.'
    },
    scctTest: {
      claim: 'Responses that overshoot or undershoot the level of responsibility the audience perceives do measurably worse than matched ones.',
      source: 'Coombs, W. T., & Holladay, S. J. (2002). Helping Crisis Managers Protect Reputational Assets. Management Communication Quarterly, 16(2), 165–186.'
    },
    thunder: {
      claim: 'Disclosing your own bad news first — "stealing thunder" — leaves you more credible than letting someone else break it.',
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
      claim: 'Lead with the fact, warn before you mention the falsehood, mention it once, and give people a replacement explanation — not just a denial.',
      source: 'Lewandowsky, S., Ecker, U. K. H., Seifert, C. M., Schwarz, N., & Cook, J. (2012). Misinformation and Its Correction. Psychological Science in the Public Interest, 13(3), 106–131.'
    },
    correctionsWork: {
      claim: 'Corrections generally do move people. The fear that facts always backfire is largely unsupported — which is why a damaging false claim is worth answering.',
      source: 'Wood, T., & Porter, E. (2019). The Elusive Backfire Effect: Mass Attitudes’ Steadfast Factual Adherence. Political Behavior, 41, 135–163.'
    },
    streisand: {
      claim: 'Trying to suppress something small is itself the event that makes it big.',
      source: 'Jansen, S. C., & Martin, B. (2015). The Streisand Effect and Censorship Backfire. International Journal of Communication, 9, 656–671.'
    },
    imageRepair: {
      claim: 'The available moves — deny, evade responsibility, reduce offensiveness, correct, apologize — are a known set, and mixing them incoherently is what reads as evasive.',
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

  var CASES = {
    sayNothing: [
      {
        who: 'Barbra Streisand',
        year: 2003,
        what: 'She sued to have an aerial photograph of her home removed from a public coastal-erosion archive. The image had been downloaded a handful of times before the suit. Coverage of the lawsuit drove it to hundreds of thousands of views.',
        lesson: 'The response is what created the audience. The photo was not the event; the objection was.'
      }
    ],
    hold: [
      {
        who: 'Barbra Streisand',
        year: 2003,
        what: 'A lawsuit over an obscure aerial photo of her house turned a file almost nobody had seen into an internationally recognized example, and gave the effect its name.',
        lesson: 'If almost nobody has seen it, your statement is the distribution mechanism. Prepare it; do not publish it.'
      }
    ],
    preempt: [
      {
        who: 'Bill Clinton',
        year: 1992,
        what: 'Facing allegations that threatened to end his primary campaign, he chose the venue and the timing — a 60 Minutes interview immediately after the Super Bowl — rather than letting the story be told for him week by week. He finished second in New Hampshire, called himself the Comeback Kid, and won the nomination.',
        lesson: 'When the story is coming out anyway, the one thing still under your control is who frames it first.'
      },
      {
        who: 'Johnson & Johnson',
        year: 1982,
        what: 'After cyanide-laced Tylenol capsules killed seven people in Chicago, the company pulled roughly 31 million bottles nationwide and went public immediately, before regulators compelled it and while the tampering was still unexplained.',
        lesson: 'Acting faster than you are required to is what buys the benefit of the doubt later.'
      }
    ],
    trueDoes: [
      {
        who: 'Johnson & Johnson',
        year: 1982,
        what: 'Full disclosure, a national recall, and a redesigned tamper-evident package. The brand recovered its market position within about a year.',
        lesson: 'Say all of it at once, and pair the admission with a fix people can see.'
      },
      {
        who: 'Richard Nixon',
        year: 1974,
        what: 'The Watergate break-in was survivable. The concealment that followed was not, and it ended in resignation.',
        lesson: 'The cover-up outlived the offense. It usually does.'
      },
      {
        who: 'Anthony Weiner',
        year: 2011,
        what: 'He denied the story flatly for several days, including in press interviews, before admitting it was true. He resigned within weeks.',
        lesson: 'A denial that later collapses costs far more than the fact it was meant to hide.'
      }
    ],
    falseDoes: [
      {
        who: 'John Kerry',
        year: 2004,
        what: 'Attack ads challenging his military record ran for weeks before his campaign answered them forcefully. The delay let the charge settle before the rebuttal arrived.',
        lesson: 'Against a damaging claim you can disprove, silence is read as confirmation. Speed is the whole game.'
      }
    ],
    trueDoesnt: [
      {
        who: 'Mark Sanford',
        year: 2013,
        what: 'Four years after a scandal that ended his time as governor, he ran for a U.S. House seat and won, treating the episode as known, settled, and old news rather than something to avoid discussing.',
        lesson: 'Once everyone already knows, it stops being a story. Flinching is what makes it one again.'
      }
    ],
    channel: [
      {
        who: "Domino's Pizza",
        year: 2009,
        what: 'A prank video by two employees spread on YouTube. The company answered on YouTube, with its president on camera, within about 48 hours.',
        lesson: 'They answered where it happened. A press release would not have reached the same people.'
      }
    ],
    safety: [
      {
        who: 'Local school board members, United States',
        year: 2021,
        what: 'Reuters documented more than 200 instances of school board members being harassed or threatened; NBC News reporting found most tracked incidents came from people who were not physically present at meetings.',
        lesson: 'This is common, it is documented, and it is a matter for law enforcement rather than a communications problem to absorb quietly.'
      }
    ],
    localPattern: [
      {
        who: 'A St. Petersburg, Florida city council candidate',
        year: 2021,
        what: 'Old posts resurfaced and were amplified locally. The candidate withdrew from the race within days.',
        lesson: 'Local first, wider second. The window to act is measured in hours.'
      },
      {
        who: 'A Norman, Oklahoma council member',
        year: 2021,
        what: 'An exchange in a local Facebook group spread through neighborhood groups, then drew national attention. The member resigned within about three months.',
        lesson: 'The neighborhood group is where these start. Watch it accordingly.'
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
