// Statement assembly.
//
// Not templates. The connective tissue is ours and follows the structure the
// read already prescribed; the substance is the user's own words. That is what
// keeps five hundred campaigns from publishing the same paragraph, and what
// keeps the tool from inventing facts about a situation it cannot see.
//
// Voice is deliberately neutral. These are not written in WINNXT's voice and
// they should not go out in it either: they are scaffolding for someone else's
// words, and the interface says so plainly.
//
// Two rules that must hold:
//   1. When the read says stay quiet, this produces nothing publishable. Only
//      the line to use if someone asks directly.
//   2. Empty slots stay visibly empty. No plausible filler, ever, because
//      filler is how somebody publishes something untrue about themselves.
(function () {

  var SLOTS = {
    happened: {
      label: 'What happened, in one sentence',
      help: 'Plain and factual. No adjectives, no defending it yet.',
      placeholder: 'In 2016 I posted something about the school budget that I would not write today.'
    },
    context: {
      label: 'The context that matters',
      help: 'Optional. Only include it if it is true and it would matter to someone who is not you.',
      placeholder: 'It was written during a heated public argument about a bond measure.'
    },
    affected: {
      label: 'Who it affected',
      help: 'Name them specifically. A general apology to nobody in particular reads as no apology.',
      placeholder: 'teachers in this district, and the families who read it'
    },
    fix: {
      label: 'What you are doing about it',
      help: 'Concrete enough that somebody could check whether you did it.',
      placeholder: 'I have asked to meet the union directly this week, and I will report back publicly.'
    },
    claim: {
      label: 'The claim being made',
      help: 'State it once, briefly, in neutral words. You will mention it only once in the statement.',
      placeholder: 'that I voted to cut the after-school programme'
    },
    truth: {
      label: 'What is actually true',
      help: 'The fact that replaces the claim. Lead with this, not with the denial.',
      placeholder: 'I voted for the budget that funded the after-school programme in full.'
    },
    proof: {
      label: 'The proof you can show',
      help: 'Optional. The record, the document, the person who will confirm it by name.',
      placeholder: 'The vote is in the minutes of the 12 March meeting.'
    },
    forward: {
      label: 'What you want to get back to',
      help: 'Optional. One clause. This is how you end without trailing off.',
      placeholder: 'the work of getting class sizes down'
    }
  };

  // Which slots a given read actually needs.
  var SHAPE = {
    'true-does':   ['happened', 'context', 'affected', 'fix', 'forward'],
    'true-doesnt': ['happened', 'context', 'forward'],
    'false-does':  ['truth', 'claim', 'proof', 'forward'],
    'false-doesnt':['truth', 'claim']
  };

  var REQUIRED = {
    'true-does':   ['happened', 'fix'],
    'true-doesnt': ['happened'],
    'false-does':  ['truth', 'claim'],
    'false-doesnt':['truth', 'claim']
  };

  // The responsibility clause is the one place the blame type changes the
  // words rather than the order. Getting this wrong in either direction is the
  // classic failure the read already warned about.
  var RESPONSIBILITY = {
    preventable: {
      own: 'That was my decision and my responsibility.',
      sorry: 'I am sorry'
    },
    accidental: {
      own: 'That was a mistake on my part. It was not what I intended, which does not undo it.',
      sorry: 'I am sorry'
    },
    victim: {
      own: 'I did not cause this, and I am not going to pretend otherwise.',
      sorry: null
    }
  };

  function has(v) { return typeof v === 'string' && v.trim().length > 0; }
  function clean(v) { return String(v || '').trim().replace(/\s+$/, ''); }
  function sentence(v) {
    var t = clean(v);
    if (!t) return '';
    return /[.!?]$/.test(t) ? t : t + '.';
  }

  function slotsFor(quadrantKey) {
    var ids = SHAPE[quadrantKey] || [];
    var req = REQUIRED[quadrantKey] || [];
    return ids.map(function (id) {
      return {
        id: id,
        label: SLOTS[id].label,
        help: SLOTS[id].help,
        placeholder: SLOTS[id].placeholder,
        required: req.indexOf(id) !== -1
      };
    });
  }

  function missing(quadrantKey, v) {
    return (REQUIRED[quadrantKey] || []).filter(function (id) { return !has(v[id]); });
  }

  // --- the three lengths ---------------------------------------------------

  function holding(q, scctKey, v) {
    if (q === 'false-does' || q === 'false-doesnt') {
      return 'I have seen the claim going around. It is not accurate. I am putting the facts together now and I will set them out today.';
    }
    if (q === 'true-doesnt') {
      return has(v.happened)
        ? 'Yes, that is accurate. ' + sentence(v.happened) + ' I am happy to talk about it.'
        : 'Yes, that is accurate, and I am happy to talk about it.';
    }
    var lead = has(v.happened) ? sentence(v.happened) : 'I am aware of the reports.';
    return lead + ' I am looking into it properly rather than reacting, and I will have more to say today.';
  }

  function short(q, scctKey, v) {
    var out = [];

    if (q === 'false-does' || q === 'false-doesnt') {
      // Fact, then the claim once, then the fact again.
      out.push(sentence(v.truth));
      if (has(v.claim)) out.push('A claim is circulating ' + clean(v.claim).replace(/^that\s+/i, 'that ') + '. That is not true.');
      if (has(v.proof)) out.push(sentence(v.proof));
      out.push('The record is what it is, and it is not in dispute.');
      if (has(v.forward)) out.push('I am going to keep my attention on ' + clean(v.forward) + '.');
      return out.filter(Boolean).join(' ');
    }

    if (q === 'true-doesnt') {
      out.push('I want to be straightforward about this.');
      out.push(sentence(v.happened));
      if (has(v.context)) out.push(sentence(v.context));
      out.push('It is not something I have hidden and it is not something I am worried about.');
      if (has(v.forward)) out.push('What I care about is ' + clean(v.forward) + '.');
      return out.filter(Boolean).join(' ');
    }

    // true and damaging: admit, place it, own it, fix it, close.
    var r = RESPONSIBILITY[scctKey] || RESPONSIBILITY.accidental;
    out.push('I want to address this directly rather than let it be described for me.');
    out.push(sentence(v.happened));
    if (has(v.context)) out.push(sentence(v.context) + ' I am not offering that as an excuse.');
    out.push(r.own);
    if (r.sorry) {
      out.push(has(v.affected) ? r.sorry + ' to ' + clean(v.affected) + '.' : r.sorry + '.');
    }
    if (has(v.fix)) out.push('Here is what I am doing about it. ' + sentence(v.fix));
    if (has(v.forward)) out.push('Then I am getting back to ' + clean(v.forward) + '.');
    return out.filter(Boolean).join(' ');
  }

  function long(q, scctKey, v) {
    var body = short(q, scctKey, v);
    var tail = [];

    if (q === 'false-does' || q === 'false-doesnt') {
      tail.push('I understand why anyone hearing this for the first time would want to check it, and I would rather people checked than took my word for it.');
      tail.push('Anyone who wants to see the record can ask me for it directly and I will send it.');
    } else if (q === 'true-doesnt') {
      tail.push('If it would be useful to talk about it at more length, I am willing to do that.');
    } else {
      tail.push('I know that an explanation is not the same as a change, and that people will judge this on what happens next rather than on this statement.');
      tail.push('I am not going to litigate this in comments. Anyone who wants to talk about it properly can contact me directly.');
    }

    return body + '\n\n' + tail.join(' ');
  }

  // --- what the read allows ------------------------------------------------

  // The read comes first. If it says stay quiet, this produces a line for when
  // somebody asks, and nothing that could be pasted into a post.
  function modeFor(publish) {
    if (publish === 'no') return 'reactive';
    if (publish === 'hold') return 'prepare';
    return 'publish';
  }

  function build(r, values, kind) {
    var q = r.quadrantKey;
    var scctKey = r.scctKey;
    var v = values || {};
    if (kind === 'holding') return holding(q, scctKey, v);
    if (kind === 'long') return long(q, scctKey, v);
    return short(q, scctKey, v);
  }

  function words(text) {
    var t = clean(text);
    return t ? t.split(/\s+/).length : 0;
  }

  window.CrisisStatements = {
    slotsFor: slotsFor,
    missing: missing,
    build: build,
    modeFor: modeFor,
    words: words
  };
})();
