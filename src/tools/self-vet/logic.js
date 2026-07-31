// Scoring. Pure functions, no DOM, so the rules can be tested directly and so
// the same answers always produce the same register.
//
// The whole tool reduces to one judgement per flagged item: what do you do
// about it. There are only three answers, and which one applies is decided by
// severity first and likelihood second. That ordering is the argument:
//
//   A severe item is worth pre-empting even if it is unlikely to surface,
//   because the cost of being wrong about "nobody will find it" is the
//   campaign. A survivable item is not worth pre-empting even if it is
//   certain to surface, because volunteering it spends attention you need
//   elsewhere.
(function () {

  var TIERS = {
    ahead: {
      key: 'ahead',
      rank: 0,
      name: 'Get ahead of it',
      short: 'Pre-empt',
      line: 'Say it yourself, first, in your own words, at a time you choose.',
      detail: 'The goal is for this to be old news before anyone else raises it. That means saying it early enough that it is not a response to something. If it comes out any other way, the story is not the fact, it is that you did not mention it.'
    },
    draft: {
      key: 'draft',
      rank: 1,
      name: 'Draft a statement',
      short: 'Draft',
      line: 'Do not volunteer it. Have the words written before you need them.',
      detail: 'This is likely to come up and it will cost you something when it does. Writing it now, calmly, is worth more than writing it well under pressure. Two or three sentences, and then a subject change.'
    },
    prepare: {
      key: 'prepare',
      rank: 2,
      name: 'Prepare an answer',
      short: 'Prepare',
      line: 'Know what you would say. Do not raise it.',
      detail: 'Not everything needs a plan. This needs you to have thought about it once, so that if it is ever raised you answer without hesitating, because the hesitation is what makes it look like something.'
    }
  };

  var TIER_ORDER = ['ahead', 'draft', 'prepare'];

  // severity first, then likelihood. See the note at the top of the file.
  function tierFor(item) {
    if (!item || !item.severity || !item.likelihood) return null;
    if (item.severity === 'severe') return 'ahead';
    if (item.severity === 'serious' && item.likelihood === 'high') return 'draft';
    return 'prepare';
  }

  function complete(item) {
    return !!(item && item.likelihood && item.severity);
  }

  // The register: every flagged item, scored, grouped by what to do about it.
  function assess(flagged) {
    var items = (flagged || []).map(function (it) {
      var copy = {};
      for (var k in it) if (Object.prototype.hasOwnProperty.call(it, k)) copy[k] = it[k];
      copy.tier = tierFor(it);
      return copy;
    });

    var scored = items.filter(function (i) { return i.tier; });
    var unscored = items.filter(function (i) { return !i.tier; });

    var groups = TIER_ORDER.map(function (key) {
      return {
        tier: TIERS[key],
        items: scored.filter(function (i) { return i.tier === key; })
      };
    }).filter(function (g) { return g.items.length; });

    var counts = {
      total: items.length,
      scored: scored.length,
      unscored: unscored.length,
      ahead: scored.filter(function (i) { return i.tier === 'ahead'; }).length,
      draft: scored.filter(function (i) { return i.tier === 'draft'; }).length,
      prepare: scored.filter(function (i) { return i.tier === 'prepare'; }).length
    };

    return {
      items: items,
      groups: groups,
      unscored: unscored,
      counts: counts,
      headline: headline(counts),
      posture: posture(counts)
    };
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  function headline(c) {
    if (!c.total) return 'Nothing flagged';
    if (c.ahead) return plural(c.ahead, 'thing', 'things') + ' to get ahead of';
    if (c.draft) return plural(c.draft, 'statement', 'statements') + ' to draft';
    return 'Nothing here ends you';
  }

  function posture(c) {
    if (!c.total) {
      return 'You went through every section and flagged nothing. That is possible, and it is also the single most common way this exercise fails. Nobody reaches adulthood with a blank record. Before you accept this result, go and actually look: open the old accounts, pull your own court records, read your own bio as a hostile stranger would. Then come back.';
    }
    if (c.ahead) {
      return 'The items below marked to get ahead of are the ones that decide this. They are severe enough that being surprised by them is worse than disclosing them, and disclosure only works while it is still your choice. Everything else can wait; these cannot.';
    }
    if (c.draft) {
      return 'Nothing you flagged is likely to end a campaign on its own. Several things are likely to come up and cost you a bad news cycle, which is a manageable problem exactly as long as the words are written before the question is asked.';
    }
    return 'You flagged real things and none of them rise above awkward. That is a good position and a boring one, which in this exercise is the same thing. Read each answer once, out loud, and then stop thinking about it.';
  }

  // Pre-emption is a timing decision, not just a content one. Disclosure works
  // when it is early and voluntary; the same sentence in October is a scandal.
  function timing(days, counts) {
    if (!counts.ahead) return null;
    var n = days === '' || days === null || days === undefined ? null : Number(days);
    if (n === null || isNaN(n)) {
      return 'Pre-empt the severe items now rather than later. There is no version of this where waiting improves the outcome, and the window closes the moment somebody else starts asking.';
    }
    if (n <= 14) {
      return 'You have ' + plural(n, 'day', 'days') + '. That is not enough room to disclose comfortably, which means doing it immediately and plainly rather than waiting for a better moment. There is no better moment left.';
    }
    if (n <= 45) {
      return 'You have ' + plural(n, 'day', 'days') + '. Get the severe items out within the next week or two, while it is still your news rather than a response to somebody else\'s.';
    }
    return 'You have ' + plural(n, 'day', 'days') + ', which is enough time to do this properly. Disclose the severe items early, in a quiet week, well before anybody is paying close attention. Early and boring is the entire objective.';
  }

  window.SelfVetLogic = {
    TIERS: TIERS,
    TIER_ORDER: TIER_ORDER,
    tierFor: tierFor,
    complete: complete,
    assess: assess,
    timing: timing
  };
})();
