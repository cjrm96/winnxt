// Crisis triage decision logic. Pure functions — no DOM, so it can be tested
// directly. Implements the WINNXT defense framework: the truth x harm
// quadrant, the SCCT crisis-type mapping, and the risk-level grid.
//
// DEFENSE ONLY. Nothing here advises acting against an opponent, and nothing
// here should ever be added that does.
(function () {

  // --- the quadrant -------------------------------------------------------

  var QUADRANTS = {
    'true-doesnt': {
      name: "True, and it doesn't really hurt",
      posture: 'Acknowledge it, or get out in front of it.',
      detail: 'This is factual and it is not damaging. Treat it as a chance to look straightforward rather than a threat. If it is going to come up anyway, saying it yourself first costs you nothing and buys you credibility.'
    },
    'true-does': {
      name: 'True, and it hurts',
      posture: 'Admit it quickly, with context. Apologize if an apology is owed. Say what you are doing about it.',
      detail: 'The facts are not on your side, so a denial will not hold and will make the second story worse than the first. Speed and completeness are what limit the damage. Say it once, say all of it, and do not let it come out in pieces.'
    },
    'false-doesnt': {
      name: "False, and it doesn't really hurt",
      posture: 'Say nothing. Monitor it.',
      detail: 'Responding is what would give this an audience. Most voters will never see it. Keep a record in case it grows, and check back in a day.'
    },
    'false-does': {
      name: 'False, and it hurts',
      posture: 'Deny it firmly, with facts, using a truth sandwich.',
      detail: 'State what is true. Name the false claim once, briefly. State what is true again. Never lead with the accusation and never repeat it more than once — repetition is what makes a false claim stick.'
    }
  };

  function quadrantKey(truth, harm) {
    // "Partly true" sits on the true side. The true part is the part that gets
    // reported, and a denial that leans on the false part collapses the moment
    // someone checks.
    var side = truth === 'false' ? 'false' : 'true';
    var hurts = harm !== 'none' ? 'does' : 'doesnt';
    return side + '-' + hurts;
  }

  // --- SCCT ---------------------------------------------------------------

  var SCCT = {
    victim: {
      type: 'Victim — low blame',
      strategy: 'Diminish',
      detail: 'This came at you from outside. Downplay your role rather than performing contrition you do not owe. Over-apologizing here reads as guilt and invites a second round.'
    },
    accidental: {
      type: 'Accidental — minimal blame',
      strategy: 'Excuse',
      detail: 'Admit what happened and explain the context honestly, then move the focus to the fix. The public reads this as a slip-up, and competence in the response matters more than remorse.'
    },
    preventable: {
      type: 'Preventable — high blame',
      strategy: 'Rebuild',
      detail: 'You made a choice, and scrutiny will be heavy. A partial apology will not close this. Apologize fully, offer a concrete change people can check, and let supporters and endorsers vouch for you rather than doing all the talking yourself.'
    }
  };

  function scctKey(fault, truth) {
    if (truth === 'false') return 'victim';
    return fault;
  }

  // --- risk level ---------------------------------------------------------

  var HARM_SCORE = { none: 0, some: 2, serious: 4 };
  var SPREAD_SCORE = { few: 0, 'one-group': 1, 'many-groups': 2, 'local-press': 3, beyond: 4 };

  function riskLevel(a) {
    var s = 0;
    s += HARM_SCORE[a.harm] || 0;
    s += SPREAD_SCORE[a.spread] || 0;
    if (a.truth !== 'false') s += 1;
    if (a.proof === 'no') s += 1;
    if (a.daysOut !== '' && a.daysOut !== null) {
      var d = Number(a.daysOut);
      if (!isNaN(d)) {
        if (d <= 14) s += 2;
        else if (d <= 30) s += 1;
      }
    }
    if (a.safety === 'yes') s += 3;

    if (s >= 9) return 'extreme';
    if (s >= 6) return 'high';
    if (s >= 3) return 'medium';
    return 'low';
  }

  var GRID = {
    low: {
      name: 'Low — routine',
      prep: 'Know your own talking points on this issue.',
      detect: 'Check the local groups once a day.',
      respond: 'Fix it quickly and quietly if it needs fixing at all.',
      recover: 'Note what happened. Move on.'
    },
    medium: {
      name: 'Medium — emerging',
      prep: 'Call someone who has run before. Do not sit alone with this.',
      detect: 'Track where it is being repeated and by whom.',
      respond: 'Let supporters and surrogates carry the pushback where they can.',
      recover: 'Ask a few trusted people how it actually landed.'
    },
    high: {
      name: 'High — serious',
      prep: 'Line up whoever gives you legal and communications advice now, not later.',
      detect: 'Have someone checking hourly and sending you what they find.',
      respond: 'Respond directly, then pivot hard back to your issues and stay there.',
      recover: 'Rebuild on visible work and visible wins, not on more statements.'
    },
    extreme: {
      name: 'Extreme — campaign-threatening',
      prep: 'Get real advice before you say anything publicly.',
      detect: 'Real-time monitoring. Someone other than you should be doing it.',
      respond: 'If it is false, debunk it completely and at once. If it is true, stop defending and start rebuilding.',
      recover: 'Assume this changes your strategy, not just your messaging.'
    }
  };

  // --- respond or stay quiet ---------------------------------------------

  // The single most useful and least wanted piece of advice in this tool is
  // "do not respond." It gets its own function so it is impossible to bury.
  function responseCall(a) {
    var q = quadrantKey(a.truth, a.harm);

    if (a.safety === 'yes') {
      return {
        verdict: 'Handle the safety part first',
        line: 'Before anything else: document it, report it, and tell someone. The communications question can wait an hour.',
        publish: 'later'
      };
    }

    if (q === 'false-doesnt') {
      return {
        verdict: 'Say nothing',
        line: 'Do not respond. Responding is the only thing that would give this an audience. Save a screenshot with the date and check again tomorrow.',
        publish: 'no'
      };
    }

    if (a.spread === 'few' && a.harm !== 'serious') {
      return {
        verdict: 'Do not publish yet — get ready instead',
        line: 'Almost nobody has seen this. A public statement now would introduce it to people who were never going to hear about it. Write your response, keep it in your pocket, and watch for it to spread.',
        publish: 'hold'
      };
    }

    if (a.truth !== 'false' && a.harm === 'serious' && (a.spread === 'few' || a.spread === 'one-group')) {
      return {
        verdict: 'Get ahead of it',
        line: 'This is true, it is damaging, and it has not spread yet. That is the one window where you control how the story is first told. Tell it yourself, in full, before someone else tells it for you. Your supporters can forgive almost anything except being surprised.',
        publish: 'preempt'
      };
    }

    if (q === 'true-doesnt') {
      return {
        verdict: 'Answer it plainly if asked',
        line: 'No statement needed. If someone raises it, confirm it without flinching and move on. Do not act like it is a problem, because it is not one.',
        publish: 'if-asked'
      };
    }

    return {
      verdict: 'Respond, today',
      line: 'This is damaging and enough people have seen it that silence will be read as confirmation. Get out a short, accurate response now and a fuller one once you have your facts lined up.',
      publish: 'yes'
    };
  }

  // --- channel ------------------------------------------------------------

  // Match the medium: answer where the hit landed, and where the people who
  // saw it actually are.
  var CHANNEL = {
    'facebook-group': 'The same local group, if you are a member and the admins allow it. If you are not, ask a supporter who is a member and well liked there. A candidate parachuting into a neighborhood group to argue rarely goes well.',
    'neighborhood-app': 'The same platform, once, calmly. Then stop. These threads reward whoever stays calm the longest.',
    'local-paper': 'The reporter directly, on the record, plus a letter or op-ed if the piece is already out. Do not fight it on social media only.',
    'tv': 'Broadcast if you can get it, plus a written statement to the same outlet the same day.',
    'mailer': 'Mail, if there is time and budget. Calls and texts to your own supporters are the bridge while mail is in production.',
    'digital-ad': 'Digital, targeted to the same audience. A press release will not reach the people who saw the ad.',
    'forum': 'In person, at the next forum or meeting, and to anyone who was in the room.',
    'social': 'The same platform, once, in your own words. Do not quote-tweet the attack.',
    'word-of-mouth': 'In person and by phone, to the people who would hear it. Nothing public.',
    'private': 'Nowhere public. This has not surfaced. Prepare, do not publish.'
  };

  // --- the 72 hours -------------------------------------------------------

  function sequence(a) {
    var call = responseCall(a);
    var q = quadrantKey(a.truth, a.harm);
    var out = [];

    if (a.safety === 'yes') {
      out.push({ when: 'Right now', what: 'Document everything — screenshots with dates, messages, names. Report it to law enforcement. Tell your family and whoever runs your events. Do not handle this alone and do not treat it as a messaging problem.' });
    }

    out.push({ when: 'First hour', what: 'Write down exactly what happened and what you know for certain. Separate what you know from what you assume. Do not post anything yet.' });
    out.push({ when: 'First hour', what: 'Call one person who has done this before. You will make a worse decision alone than you will in a ten minute phone call.' });

    if (call.publish === 'no') {
      out.push({ when: 'Today', what: 'Save a dated record and set a reminder to check again tomorrow. That is the whole plan. Doing nothing is the action.' });
      out.push({ when: 'If it spreads', what: 'Come back to this tool and run it again. The right answer changes the moment more people see it.' });
      return out;
    }

    if (call.publish === 'hold') {
      out.push({ when: 'Today', what: 'Draft your response and have it ready to go. Do not publish it.' });
      out.push({ when: 'Today', what: 'Tell your closest supporters what happened and what you would say, so nobody is caught flat if it moves.' });
      out.push({ when: 'Daily', what: 'Check whether it has spread. Publish only if it reaches people who were going to hear it anyway.' });
      return out;
    }

    if (q === 'true-does' || call.publish === 'preempt') {
      out.push({ when: 'Today', what: 'Get all of it out at once. A story that comes out in pieces gets covered three times instead of once.' });
      out.push({ when: 'Today', what: 'Say what you are doing about it. Concrete and checkable beats sincere and vague.' });
    } else if (q === 'false-does') {
      out.push({ when: 'Today', what: 'Assemble your proof first — the document, the record, the person who will say so by name. A denial without evidence reads as a denial.' });
      out.push({ when: 'Today', what: 'Publish the truth sandwich: what is true, the false claim once, what is true again. Keep it short enough to be read in full.' });
    } else {
      out.push({ when: 'Today', what: 'Answer it once, plainly, and get back to your own message.' });
    }

    out.push({ when: 'Today', what: 'Tell your supporters and endorsers directly, before they hear it somewhere else. Give them the two sentences you want them repeating.' });
    out.push({ when: 'Next 48 hours', what: 'Answer what comes back, keep it short, and stop feeding it. Your goal is to be the least interesting part of the story by Thursday.' });
    out.push({ when: 'Next 48 hours', what: 'Return to your issues in public. Every day you spend on their subject is a day you are not on yours.' });
    out.push({ when: 'After it settles', what: 'Thank the people who stood up for you, by name and in private. Write down what you would do differently. That note is worth more than it sounds.' });

    return out;
  }

  // --- what not to do -----------------------------------------------------

  function donts(a) {
    var q = quadrantKey(a.truth, a.harm);
    var list = [
      'Do not respond while you are angry. Write it, wait twenty minutes, read it again.',
      'Do not argue in the comments. You will not win, and every reply pushes the thread back to the top.',
      'Do not delete anything that is already public. Someone has a screenshot, and the deletion becomes the story.'
    ];

    if (q === 'true-does') {
      list.push('Do not deny a part of it hoping the rest holds. Partial denials are what turn one bad day into three.');
      list.push('Do not release it in pieces. Everything you hold back gets reported separately and looks worse.');
    }
    if (q === 'false-does') {
      list.push('Do not repeat the false claim more than once, and never lead with it. Repetition is what makes it stick.');
      list.push('Do not speculate about who is behind it in public unless you can prove it.');
    }
    if (q === 'false-doesnt') {
      list.push('Do not respond at all. The response is the only way most people would ever learn about this.');
    }
    if (a.truth === 'partly') {
      list.push('Do not lean on the inaccurate detail to dodge the accurate one. It works for a day and then collapses.');
    }
    list.push('Do not go after the person who raised it. It changes the subject to your temperament, and that is a worse subject.');

    return list;
  }

  // --- statement skeleton -------------------------------------------------

  function skeleton(a) {
    var q = quadrantKey(a.truth, a.harm);
    if (q === 'false-does') {
      return {
        title: 'Truth sandwich',
        steps: [
          'Open with what is true, stated plainly and first.',
          'Name the false claim once, briefly, without heat.',
          'Give your proof — the record, the document, the person who will confirm it.',
          'Close by restating what is true, and turn to what you are running on.'
        ]
      };
    }
    if (q === 'true-does') {
      return {
        title: 'Admit, contextualize, fix',
        steps: [
          'State what happened, in your own words, before anyone else characterizes it.',
          'Give the context honestly — without using it to dodge responsibility.',
          'Apologize to the specific people affected, if an apology is owed. Name them.',
          'Say what you are doing about it, concretely enough that someone could check.',
          'Close on why you are still running. One sentence.'
        ]
      };
    }
    if (q === 'true-doesnt') {
      return {
        title: 'Confirm and move on',
        steps: [
          'Confirm it in one sentence, without defensiveness.',
          'Add the context that makes it ordinary.',
          'Move straight to your issues. Do not linger.'
        ]
      };
    }
    return {
      title: 'Holding line, if you are asked',
      steps: [
        'One sentence acknowledging you have seen it.',
        'One sentence of what you know for certain right now.',
        'What happens next, and when. Then stop talking.'
      ]
    };
  }

  function assess(a) {
    var qk = quadrantKey(a.truth, a.harm);
    var sk = scctKey(a.fault, a.truth);
    var rl = riskLevel(a);
    return {
      quadrantKey: qk,
      quadrant: QUADRANTS[qk],
      scctKey: sk,
      scct: SCCT[sk],
      riskKey: rl,
      risk: GRID[rl],
      call: responseCall(a),
      channel: CHANNEL[a.where] || '',
      sequence: sequence(a),
      donts: donts(a),
      skeleton: skeleton(a)
    };
  }

  window.CrisisLogic = {
    assess: assess,
    quadrantKey: quadrantKey,
    riskLevel: riskLevel,
    responseCall: responseCall,
    QUADRANTS: QUADRANTS,
    SCCT: SCCT,
    GRID: GRID
  };
})();
