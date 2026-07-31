// The murder board.
//
// Flagging something and scoring it tells you what to do about it. It does not
// prepare you for the ninety seconds where somebody is actually asking, and
// that is the moment people lose. A candidate who has thought about the item
// but never heard the question out loud still hesitates, and the hesitation is
// what gets clipped.
//
// So every question here comes with the trap attached: what the question is
// really testing, which is almost never the thing it appears to ask about.
// That is the part a first-timer cannot work out alone and the part a
// professional would charge for.
//
// Two rules:
//   1. These are questions, not scripts. The tool does not write the answer,
//      because an answer it wrote would be somebody else's words about facts it
//      cannot see. It writes the question and names the trap.
//   2. No question assumes guilt. Each one is phrased the way a competent
//      reporter would actually ask it, which is neutrally and then again.
(function () {

  // The three that arrive whatever you flagged, in roughly this order.
  var UNIVERSAL = [
    {
      q: 'Why are we only hearing about this now?',
      trap: 'It is not about the timeline. It is testing whether you have a reason you are willing to say out loud, or whether you hoped nobody would ask. "Nobody asked" is a true answer that sounds terrible.'
    },
    {
      q: 'Is there anything else like this we should know about?',
      trap: 'The closer. It is asked so that a second story later becomes a story about your answer to this question. Never say no unless you have done the work and mean it, and never say "not that I recall".'
    },
    {
      q: 'Have you told your supporters, your family, and your party?',
      trap: 'It is checking whether the people who would have to defend you are about to be surprised on your behalf. An endorser who learns from a reporter stops being an endorser.'
    }
  ];

  var BY_SECTION = {
    finances: [
      { q: 'Who was left out of pocket, and have they been paid?',
        trap: 'It moves the story from a number to a person. If somebody real lost money, they are a phone call away from being quoted, so know their name and their status before you are asked.' },
      { q: 'How should voters trust you with a public budget after that?',
        trap: 'The bridge from the private fact to the job. This is the version that runs in a mailer, so it needs answering on the merits rather than dismissed as unfair.' },
      { q: 'Was it resolved, and can you show that it was resolved?',
        trap: 'Testing for a document. "It is behind me" without a filing, a release, or a receipt is an answer that invites a records request.' }
    ],
    legal: [
      { q: 'What was the charge, and how did it actually resolve?',
        trap: 'Precision is the whole answer here. Dismissed, diverted, expunged, pleaded and acquitted are different words with different meanings, and getting your own case wrong is worse than the case.' },
      { q: 'Is the record still available anywhere?',
        trap: 'Checking whether you know what is discoverable. Believing something is sealed when it is indexed by an aggregator is a common and expensive mistake.' },
      { q: 'What would the other party in that matter say about it today?',
        trap: 'There is a second person with a version. This asks whether you have considered that their account exists and might be sought.' }
    ],
    statements: [
      { q: 'Do you still believe that? If not, what changed and when?',
        trap: 'A change of mind is fine and usually survivable. A change of mind with no account of how it happened reads as convenience, and the date matters because "when I started running" is the wrong answer.' },
      { q: 'Would you say the same thing to the people it was about, in this room?',
        trap: 'It converts a post into a conversation. If the honest answer is no, that is the thing to address rather than the wording.' },
      { q: 'Are you apologising for it, or explaining it?',
        trap: 'Trying to do both in one sentence is what makes an answer sound slippery. Decide which one this is before you open your mouth.' }
    ],
    work: [
      { q: 'Why did you leave, and would they describe it the same way?',
        trap: 'Somebody there remembers it differently and can be called. This tests whether your account survives contact with theirs.' },
      { q: 'Can we speak to your former employer about it?',
        trap: 'Not really a request. It is checking your reaction, and hesitation answers it more loudly than the words do.' },
      { q: 'Does that affect your judgement on the things this office decides?',
        trap: 'The relevance bridge. It is how a professional matter becomes a campaign matter, and it should be met rather than dodged.' }
    ],
    personal: [
      { q: 'Where do you actually live, and how long have you lived there?',
        trap: 'Residency is the most-run local attack because it is checkable in an afternoon and needs no interpretation. The answer needs to match your registration, your deed, and your school district.' },
      { q: 'How do you square that with what you have said publicly about families?',
        trap: 'Only bites if you have campaigned on the subject. If you have, the private fact is now a consistency question, which is harder to answer than the fact.' },
      { q: 'Is anyone else affected by this being discussed publicly?',
        trap: 'It is asking whether you are willing to put a family member into the story. Think about that before the microphone, not during.' }
    ],
    affiliations: [
      { q: 'Do you still support them, and will you return the money?',
        trap: 'A binary with a cost either way, and refusing to answer it is itself the answer. Decide in advance which side you are on.' },
      { q: 'What did you know about them when you joined or gave?',
        trap: 'Separating what you endorsed from what they later did. That distinction is real and it only works if you can date it.' },
      { q: 'Would you do it again?',
        trap: 'Sounds soft, is not. It is the quote that runs, and both yes and no are usable, so answer the version you can defend for a month.' }
    ],
    record: [
      { q: 'Can you produce the document that proves that line on your bio?',
        trap: 'The only question that matters here. Anything on your record you cannot evidence in an afternoon should come off the bio today rather than be defended tomorrow.' },
      { q: 'Who wrote your biography, and did you check it?',
        trap: 'A volunteer wrote it is not a defence, it is an admission you did not read your own claims. Own the page.' },
      { q: 'What else on there have you not verified?',
        trap: 'The escalation. One unverified claim invites a line-by-line audit of everything else, which is why the fix is auditing it yourself first.' }
    ]
  };

  var BY_TIER = {
    ahead: [
      { q: 'You raised this yourself. Why now, and what were you waiting for?',
        trap: 'The cost of disclosing: you buy the framing, and you pay for it with a question about the timing. Have the reason ready, and make it about the campaign rather than about the story.' }
    ],
    contain: [
      { q: 'Can you confirm or deny that this material exists?',
        trap: 'A trap in both directions. Confirming publishes it, denying can be disproved later, and "I am not discussing my private life" is a complete answer that you are allowed to give more than once. Talk to a lawyer before you talk to anyone else.' }
    ],
    draft: [
      { q: 'Do you have a comment, or would you like to send a statement?',
        trap: 'The offer of a deadline. Taking the statement option buys you an hour to write carefully, and it is almost always the better choice over answering live.' }
    ],
    prepare: [
      { q: 'That is on the record, isn\'t it?',
        trap: 'The whole test is whether you flinch. Confirm it plainly, do not add anything, and change the subject without appearing to.' }
    ]
  };

  // Two specific questions per item, so a long register does not turn into
  // sixty questions nobody reads. The universal three are shown once.
  function forItem(item) {
    var out = (BY_SECTION[item.section] || []).slice(0, 2);
    var tier = (BY_TIER[item.tier] || [])[0];
    return tier ? out.concat([tier]) : out;
  }

  function sectionQuestions(sectionId) {
    return BY_SECTION[sectionId] || [];
  }

  window.SelfVetQuestions = {
    UNIVERSAL: UNIVERSAL,
    BY_SECTION: BY_SECTION,
    BY_TIER: BY_TIER,
    forItem: forItem,
    sectionQuestions: sectionQuestions
  };
})();
