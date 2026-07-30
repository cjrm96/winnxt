(function () {
  // This tool deliberately stores nothing. Not localStorage, not sessionStorage,
  // not a cookie. A candidate typing their worst moment into a shared family
  // computer should not leave it behind, and "nothing is saved, ever" is a
  // promise that needs no asterisk. The cost is that closing the tab loses the
  // run, which is what the beforeunload warning is for.
  var QUESTIONS = [
    {
      id: 'what', type: 'textarea', required: false,
      short: 'What happened',
      label: 'What happened?',
      help: "Write it the way you'd say it out loud. Or don't type at all — tap the microphone on your keyboard and just talk it through. Ramble. Nobody is reading this but you.",
      note: "Dictation belongs to your phone or computer, not to this file, and some of them send the audio off to be transcribed. If that bothers you, type it instead.",
      placeholder: 'A post from 2016 is going around in a local parents group.'
    },
    {
      id: 'where', type: 'select', required: true,
      short: 'Where it surfaced',
      label: 'Where did it surface?',
      help: 'For local candidates the pattern is almost always a neighborhood Facebook group first, everything else second.',
      options: [
        ['facebook-group', 'A local Facebook group'],
        ['neighborhood-app', 'Nextdoor or a neighborhood app'],
        ['social', 'Social media generally'],
        ['local-paper', 'The local newspaper or news site'],
        ['tv', 'TV or radio'],
        ['mailer', "An opponent's mailer"],
        ['digital-ad', "An opponent's digital ad"],
        ['forum', 'A forum, debate, or public meeting'],
        ['word-of-mouth', 'Word of mouth — people are talking'],
        ['private', 'Nowhere yet — someone warned me it is coming']
      ]
    },
    {
      id: 'spread', type: 'radio', required: true,
      short: 'How far it spread',
      label: 'How far has it actually gone?',
      help: 'Be honest rather than fearful. This drives whether responding helps you or hands it an audience.',
      options: [
        ['few', 'A handful of people know'],
        ['one-group', 'One group or thread'],
        ['many-groups', 'Several groups, or it keeps getting reposted'],
        ['local-press', 'Local press has picked it up'],
        ['beyond', 'It is past local now']
      ]
    },
    {
      id: 'truth', type: 'radio', required: true,
      short: 'Is it true',
      label: 'Is it true?',
      help: 'Answer honestly even though nobody is watching. Every wrong response strategy starts with getting this wrong.',
      options: [
        ['true', 'Yes, it is accurate'],
        ['partly', 'Partly — the core is true, some details are wrong'],
        ['false', 'No, it is false']
      ]
    },
    {
      id: 'truePart', type: 'textarea', required: false, showIf: { truth: ['partly'] },
      short: 'The true part',
      label: 'Which part is true?',
      help: 'The true part is the part that gets reported. Name it now so your response does not lean on the wrong half.',
      placeholder: 'I did miss those meetings. The reason they gave is wrong.'
    },
    {
      id: 'harm', type: 'radio', required: true,
      short: 'Damage to you',
      label: 'Does it actually damage you with people who might vote for you?',
      help: 'Not whether it is unfair, and not how it makes you feel. Whether it moves votes. Most attacks do not.',
      options: [
        ['none', 'Not really — it looks worse to me than to voters'],
        ['some', 'Somewhat — it gives undecided people a reason to pause'],
        ['serious', 'Seriously — it goes to trust, character, or the job itself']
      ]
    },
    {
      id: 'fault', type: 'radio', required: true,
      short: 'How it came about',
      label: 'How did this come about?',
      help: 'This decides how much apology is owed. Over-apologizing for something outside your control reads as guilt; under-apologizing for something you chose reads as contempt.',
      options: [
        ['victim', 'It came at me from outside — I did not cause it'],
        ['accidental', 'I did it, but it was a mistake — I was not trying to'],
        ['preventable', 'I made a choice, and this is the result']
      ]
    },
    {
      id: 'proof', type: 'radio', required: true,
      short: 'Proof you have',
      label: 'Can you prove your side right now?',
      help: 'A document, a record, a dated receipt, or a person who will say so by name.',
      options: [
        ['yes', 'Yes — I have something I can show'],
        ['partly', 'Partly — I could get there with some digging'],
        ['no', 'No — it would be my word against theirs']
      ]
    },
    {
      id: 'safety', type: 'radio', required: true,
      short: 'Anyone unsafe',
      label: 'Is anyone unsafe?',
      help: 'Threats, harassment, anything aimed at your home or your family. This changes the order of what you do next.',
      options: [
        ['no', 'No'],
        ['yes', 'Yes, or it is heading that way']
      ]
    },
    {
      id: 'daysOut', type: 'number', required: false,
      short: 'Days to election',
      label: 'How many days until the election?',
      help: 'Leave this blank if you are not sure. Close to election day the same crisis is a bigger problem, because there is less time to recover from it.',
      placeholder: 'e.g. 21'
    }
  ];

  var state = { answers: {} };
  var step = 0;
  var view = 'intro';

  function val(id) {
    return state.answers[id] === undefined ? '' : state.answers[id];
  }

  function visible(q) {
    if (!q.showIf) return true;
    return Object.keys(q.showIf).every(function (k) {
      return q.showIf[k].indexOf(val(k)) !== -1;
    });
  }

  function steps() {
    return QUESTIONS.filter(visible);
  }

  function missing() {
    return steps().filter(function (q) { return q.required && !val(q.id); });
  }

  function hasData() {
    return Object.keys(state.answers).some(function (k) { return state.answers[k]; });
  }

  // ---- dom helpers -------------------------------------------------------

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  function show(id, on) {
    var node = document.getElementById(id);
    if (on) node.removeAttribute('hidden');
    else node.setAttribute('hidden', '');
  }

  // ---- the wizard --------------------------------------------------------

  function renderStep(dir) {
    var list = steps();
    if (step >= list.length) step = list.length - 1;
    if (step < 0) step = 0;

    var q = list[step];
    var host = document.getElementById('step');
    host.textContent = '';

    document.getElementById('progress-label').textContent = 'Question ' + (step + 1);
    document.getElementById('progress-count').textContent = 'of ' + list.length;
    var pct = Math.round((step / list.length) * 100);
    var fill = document.getElementById('progress-fill');
    fill.style.width = pct + '%';
    fill.parentNode.setAttribute('aria-valuenow', String(pct));

    host.setAttribute('data-dir', dir === 'back' ? 'back' : 'fwd');
    var card = el('div', { class: 'question', 'data-q': q.id });

    if (q.type === 'radio') {
      var fs = el('fieldset');
      fs.appendChild(el('legend', { class: 'q-label', text: q.label }));
      if (q.help) fs.appendChild(el('p', { class: 'help', text: q.help }));
      var opts = el('div', { class: 'options' });
      q.options.forEach(function (o) {
        var inputId = q.id + '-' + o[0];
        var lab = el('label', { class: 'option', for: inputId });
        var input = el('input', { type: 'radio', name: q.id, id: inputId, value: o[0] });
        if (val(q.id) === o[0]) input.checked = true;
        input.addEventListener('change', function () {
          state.answers[q.id] = o[0];
          markSelected(opts);
          clearError();
          updateNav(q);
        });
        // Advance on a real pointer click only. Arrow-key selection in a radio
        // group also fires a click event, so the event has to be interrogated:
        // detail is 0 for keyboard and programmatic activation, non-zero for an
        // actual press. Without this, arrow-keying through the options skips
        // you past them one at a time.
        input.addEventListener('click', function (e) {
          if (!e.detail) return;
          queueAdvance();
        });
        lab.appendChild(input);
        lab.appendChild(el('span', { class: 'option-text', text: o[1] }));
        opts.appendChild(lab);
      });
      fs.appendChild(opts);
      card.appendChild(fs);
      markSelected(opts);
    } else {
      card.appendChild(el('label', { class: 'q-label', for: q.id, text: q.label }));
      if (q.help) card.appendChild(el('p', { class: 'help', text: q.help }));

      var field;
      if (q.type === 'select') {
        field = el('select', { id: q.id });
        field.appendChild(el('option', { value: '', text: 'Choose one' }));
        q.options.forEach(function (o) {
          var opt = el('option', { value: o[0], text: o[1] });
          if (val(q.id) === o[0]) opt.selected = true;
          field.appendChild(opt);
        });
        field.addEventListener('change', function () {
          state.answers[q.id] = field.value;
          clearError();
        });
      } else if (q.type === 'textarea') {
        field = el('textarea', { id: q.id, rows: '4', placeholder: q.placeholder || '' });
        field.value = val(q.id);
        field.addEventListener('input', function () {
          state.answers[q.id] = field.value;
        });
      } else {
        field = el('input', { type: 'number', id: q.id, min: '0', inputmode: 'numeric', placeholder: q.placeholder || '' });
        field.value = val(q.id);
        field.addEventListener('input', function () {
          state.answers[q.id] = field.value;
        });
      }
      card.appendChild(field);
      if (q.note) card.appendChild(el('p', { class: 'q-note', text: q.note }));
      if (!q.required) card.appendChild(el('p', { class: 'optional', text: 'Optional — you can skip this.' }));
    }

    host.appendChild(card);

    document.getElementById('btn-back').textContent = step === 0 ? 'Back to start' : 'Back';
    document.getElementById('btn-next').textContent =
      step === list.length - 1 ? 'See my read' : 'Continue';
    updateNav(q);
  }

  // Choosing an option with the mouse advances on its own, so Continue would
  // just be a button that does nothing. It stays hidden on those questions
  // until there is an answer to move on from — which is the case for keyboard
  // users, who move through a radio group with arrow keys and would otherwise
  // be stranded, and for anyone who came back to change something.
  function updateNav(q) {
    var btn = document.getElementById('btn-next');
    var last = step === steps().length - 1;
    var hide = q.type === 'radio' && !val(q.id) && !last;
    if (hide) btn.setAttribute('hidden', '');
    else btn.removeAttribute('hidden');

    var hint = document.getElementById('step-hint');
    if (hide) hint.removeAttribute('hidden');
    else hint.setAttribute('hidden', '');
  }

  function markSelected(opts) {
    Array.prototype.forEach.call(opts.querySelectorAll('.option'), function (lab) {
      var input = lab.querySelector('input');
      if (input.checked) lab.setAttribute('data-selected', '');
      else lab.removeAttribute('data-selected');
    });
  }

  // Every navigation goes through here. One place to cancel from, so a pending
  // auto-advance can never fire after the user has chosen to go somewhere else.
  var timers = [];

  function cancelPending() {
    timers.forEach(clearTimeout);
    timers = [];
    document.getElementById('step').classList.remove('is-leaving-fwd', 'is-leaving-back');
  }

  function queueAdvance() {
    cancelPending();
    timers.push(setTimeout(function () { next(); }, 260));
  }

  function clearError() { show('step-error', false); }

  // Slide the current question out, swap it, let the new one slide in from the
  // side it came from. Direction carries meaning: forward and back look different.
  function transitionTo(target, dir) {
    cancelPending();
    var host = document.getElementById('step');
    host.classList.add(dir === 'back' ? 'is-leaving-back' : 'is-leaving-fwd');
    timers.push(setTimeout(function () {
      host.classList.remove('is-leaving-fwd', 'is-leaving-back');
      step = target;
      renderStep(dir);
      focusStep();
    }, 170));
  }

  function next() {
    var list = steps();
    var q = list[step];
    if (q.required && !val(q.id)) {
      cancelPending();
      show('step-error', true);
      return;
    }
    clearError();
    if (step >= list.length - 1) {
      cancelPending();
      finish();
      return;
    }
    transitionTo(step + 1, 'fwd');
  }

  function back() {
    clearError();
    // Back always goes somewhere. From the first question that means the intro.
    if (step === 0) {
      cancelPending();
      goto('intro');
      return;
    }
    transitionTo(step - 1, 'back');
  }

  function focusStep() {
    var h = document.querySelector('#step .q-label');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }

  function finish() {
    var need = missing();
    if (need.length) {
      var list = steps();
      step = list.indexOf(need[0]);
      renderStep();
      show('step-error', true);
      return;
    }
    goto('report');
  }

  function goto(v) {
    view = v;
    show('intro', v === 'intro');
    show('wizard', v === 'wizard');
    show('report', v === 'report');
    if (v === 'wizard') { cancelPending(); renderStep('fwd'); }
    if (v === 'report') renderReport();
    window.scrollTo(0, 0);
  }

  // ---- the report --------------------------------------------------------

  function labelOf(id) {
    var q = QUESTIONS.filter(function (x) { return x.id === id; })[0];
    if (!q || !q.options) return val(id);
    var found = q.options.filter(function (o) { return o[0] === val(id); })[0];
    return found ? found[1] : val(id);
  }

  var RISK_ORDER = ['low', 'medium', 'high', 'extreme'];
  var RISK_SHORT = { low: 'Low', medium: 'Medium', high: 'High', extreme: 'Extreme' };

  function renderReport() {
    var box = document.getElementById('read');
    box.textContent = '';
    if (missing().length) return;

    var a = state.answers;
    var r = window.CrisisLogic.assess(a);

    if (a.safety === 'yes') {
      var safety = el('section', { class: 'report-block safety' });
      safety.appendChild(el('p', { class: 'eyebrow', text: 'First' }));
      safety.appendChild(el('h2', { text: 'Safety comes before messaging' }));
      safety.appendChild(el('p', { text: 'Document it with dated screenshots. Report it to law enforcement. Tell your family and whoever runs your events. Threats against local officials are common, and most of them come from people who are not physically present — which does not make them harmless.' }));
      safety.appendChild(el('p', { class: 'note', text: 'This tool is not legal advice and cannot assess your risk. Talk to law enforcement and a lawyer.' }));
      box.appendChild(safety);
    }

    // Hero: the call, and nothing competing with it.
    var hero = el('section', { class: 'report-block hero risk-' + r.riskKey });
    hero.appendChild(el('p', { class: 'eyebrow', text: 'Your read' }));
    hero.appendChild(el('p', { class: 'verdict', text: r.call.verdict }));
    hero.appendChild(el('p', { class: 'verdict-line', text: r.call.line }));
    var callCite = window.CrisisEvidence.forCall(r.call.publish);
    if (callCite) hero.appendChild(cite(callCite, 'hero-cite'));
    box.appendChild(hero);

    // At a glance.
    var tiles = el('section', { class: 'tiles' });
    tiles.appendChild(tile('Where this sits', r.quadrant.name));
    tiles.appendChild(tile('Blame', r.scct.type.split('—')[0].trim()));
    tiles.appendChild(tile('Strategy', r.scct.strategy));
    box.appendChild(tiles);

    // Risk meter.
    var risk = el('section', { class: 'report-block' });
    risk.appendChild(el('p', { class: 'eyebrow', text: 'Risk level' }));
    risk.appendChild(el('h2', { text: r.risk.name }));
    var meter = el('div', { class: 'meter', role: 'img', 'aria-label': 'Risk level: ' + r.risk.name });
    RISK_ORDER.forEach(function (k) {
      var seg = el('div', { class: 'meter-seg' + (k === r.riskKey ? ' is-on' : '') });
      seg.appendChild(el('span', { text: RISK_SHORT[k] }));
      meter.appendChild(seg);
    });
    risk.appendChild(meter);
    var dl = el('dl', { class: 'grid-row' });
    [['Prepare', r.risk.prep], ['Watch', r.risk.detect], ['Respond', r.risk.respond], ['Recover', r.risk.recover]]
      .forEach(function (p) {
        dl.appendChild(el('dt', { text: p[0] }));
        dl.appendChild(el('dd', { text: p[1] }));
      });
    risk.appendChild(dl);
    box.appendChild(risk);

    box.appendChild(detail('Where this sits', r.quadrant.name, r.quadrant.posture,
      r.quadrant.detail, window.CrisisEvidence.forQuadrant(r.quadrantKey)));
    box.appendChild(detail('How much blame lands on you', r.scct.type, r.scct.strategy,
      r.scct.detail, window.CrisisEvidence.scct));

    if (r.channel && r.call.publish !== 'no') {
      var ch = el('section', { class: 'report-block' });
      ch.appendChild(el('p', { class: 'eyebrow', text: 'Where to answer it' }));
      ch.appendChild(el('h2', { text: 'Answer where it landed' }));
      ch.appendChild(el('p', { class: 'note', text: 'A press release does not reach the people who saw a Facebook post.' }));
      ch.appendChild(el('p', { text: r.channel }));
      box.appendChild(ch);
    }

    var sk = el('section', { class: 'report-block' });
    sk.appendChild(el('p', { class: 'eyebrow', text: 'How to build the statement' }));
    sk.appendChild(el('h2', { text: r.skeleton.title }));
    var ol = el('ol', { class: 'skeleton' });
    r.skeleton.steps.forEach(function (s) { ol.appendChild(el('li', { text: s })); });
    sk.appendChild(ol);
    sk.appendChild(el('p', { class: 'note', text: 'This tool gives you the shape. Use the handoff below to get actual words.' }));
    box.appendChild(sk);

    renderPlan(r);
    renderCases(r);        // right after the advice — this is the persuasive part
    renderSummary();
    renderSources(r);
    renderHandoff();
  }

  function tile(label, value) {
    var t = el('div', { class: 'tile' });
    t.appendChild(el('p', { class: 'tile-label', text: label }));
    t.appendChild(el('p', { class: 'tile-value', text: value }));
    return t;
  }

  function detail(eyebrow, headline, posture, body, citation) {
    var d = el('section', { class: 'report-block' });
    d.appendChild(el('p', { class: 'eyebrow', text: eyebrow }));
    d.appendChild(el('h2', { text: headline }));
    d.appendChild(el('p', { class: 'posture', text: posture }));
    d.appendChild(el('p', { text: body }));
    if (citation) d.appendChild(cite(citation));
    return d;
  }

  // A short "this is not just our opinion" line under a piece of advice.
  function cite(c, cls) {
    var box = el('div', { class: 'cite' + (cls ? ' ' + cls : '') });
    box.appendChild(el('p', { class: 'cite-claim', text: c.claim }));
    box.appendChild(el('p', { class: 'cite-source', text: c.source }));
    return box;
  }

  function renderPlan(r) {
    var box = document.getElementById('plan');
    box.textContent = '';

    var seq = el('section', { class: 'report-block' });
    seq.appendChild(el('p', { class: 'eyebrow', text: 'Do this' }));
    seq.appendChild(el('h2', { text: 'What to do, in order' }));
    var ol = el('ol', { class: 'sequence' });
    r.sequence.forEach(function (s) {
      var li = el('li');
      li.appendChild(el('span', { class: 'when', text: s.when }));
      li.appendChild(el('span', { class: 'what', text: s.what }));
      ol.appendChild(li);
    });
    seq.appendChild(ol);
    box.appendChild(seq);

    var no = el('section', { class: 'report-block donts-block' });
    no.appendChild(el('p', { class: 'eyebrow', text: 'Avoid' }));
    no.appendChild(el('h2', { text: 'What not to do' }));
    var ul = el('ul', { class: 'donts' });
    r.donts.forEach(function (d) { ul.appendChild(el('li', { text: d })); });
    no.appendChild(ul);
    box.appendChild(no);
  }

  function renderCases(r) {
    var ev = window.CrisisEvidence.forAssessment(r, state.answers);
    if (!ev.cases.length) return;
    var box = document.getElementById('plan');

    var wrap = el('section', { class: 'report-block cases-block' });
    wrap.appendChild(el('p', { class: 'eyebrow', text: 'Precedent' }));
    wrap.appendChild(el('h2', { text: 'How this has gone before' }));
    wrap.appendChild(el('p', { class: 'note', text: 'People who faced the decision you are facing now, and what it cost or saved them. Different scale, same mechanics. Open any one for the full story.' }));

    var list = el('div', { class: 'cases' });
    ev.cases.forEach(function (c) {
      list.appendChild(caseCard(c));
    });
    wrap.appendChild(list);
    box.appendChild(wrap);
  }

  function caseCard(c) {
    var card = el('article', { class: 'case' });

    var head = el('p', { class: 'case-head' });
    head.appendChild(el('span', { class: 'case-who', text: c.who }));
    head.appendChild(el('span', { class: 'case-year', text: String(c.year) }));
    card.appendChild(head);

    card.appendChild(el('p', { class: 'case-what', text: c.what }));
    card.appendChild(el('p', { class: 'case-lesson', text: c.lesson }));

    // <details> rather than a scripted accordion: it works with no JS, it is
    // keyboard accessible for free, and it can be forced open for printing.
    var rows = [
      ['What was actually going on', c.background],
      ['How the public reacted', c.reaction],
      ['What they chose to do', c.handling],
      ['Where it ended up', c.outcome]
    ].filter(function (r) { return r[1]; });

    if (rows.length) {
      var det = el('details', { class: 'case-more' });
      det.appendChild(el('summary', { text: 'The full story' }));
      var body = el('div', { class: 'case-body' });
      rows.forEach(function (r) {
        body.appendChild(el('h3', { class: 'case-sub', text: r[0] }));
        body.appendChild(el('p', { text: r[1] }));
      });
      det.appendChild(body);
      card.appendChild(det);
    }

    return card;
  }

  function renderSources(r) {
    var ev = window.CrisisEvidence.forAssessment(r, state.answers);
    if (!ev.citations.length) return;
    var box = document.getElementById('plan');

    var src = el('section', { class: 'report-block sources-block' });
    src.appendChild(el('p', { class: 'eyebrow', text: 'Evidence' }));
    src.appendChild(el('h2', { text: 'Why this is the advice' }));
    src.appendChild(el('p', { class: 'note', text: 'The research this read is built on. Look any of it up — none of it is ours.' }));
    var ol = el('ol', { class: 'sources' });
    ev.citations.forEach(function (c) {
      var li = el('li');
      li.appendChild(el('span', { class: 'source-claim', text: c.claim }));
      li.appendChild(el('span', { class: 'source-ref', text: c.source }));
      ol.appendChild(li);
    });
    src.appendChild(ol);
    box.appendChild(src);
  }

  function renderSummary() {
    var box = document.getElementById('plan');
    var wrap = el('section', { class: 'report-block summary' });
    wrap.appendChild(el('p', { class: 'eyebrow', text: 'Based on' }));
    wrap.appendChild(el('h2', { text: 'What you told it' }));

    var list = el('dl', { class: 'summary-list' });
    steps().forEach(function (q, i) {
      if (!val(q.id)) return;
      var dt = el('dt', { text: q.short });
      var dd = el('dd');
      dd.appendChild(el('span', { class: 'summary-value', text: labelOf(q.id) }));
      var edit = el('button', { type: 'button', class: 'link no-print', text: 'Change' });
      edit.addEventListener('click', function () {
        step = i;
        goto('wizard');
      });
      dd.appendChild(edit);
      list.appendChild(dt);
      list.appendChild(dd);
    });
    wrap.appendChild(list);
    box.appendChild(wrap);
  }

  // ---- handoff -----------------------------------------------------------

  function buildHandoff() {
    if (missing().length) return 'Answer the questions and a ready-to-paste prompt appears here.';

    var a = state.answers;
    var r = window.CrisisLogic.assess(a);

    var asks = [];
    if (r.call.publish === 'no') {
      asks.push('Push back on me. My read says do not respond — tell me honestly whether that is right, and what would have to change for it to be wrong.');
      asks.push('Write the two sentences I would say if a reporter or a voter asks me about this directly, so I am not caught flat.');
    } else if (r.call.publish === 'hold') {
      asks.push('Draft the statement I would put out if this spreads, so it is ready and I am not writing it under pressure.');
      asks.push('Tell me what specifically would signal that it is time to publish.');
    } else {
      asks.push('Draft a short statement using the structure above — under 120 words, in plain speech, no jargon or campaign-ese.');
      asks.push('Draft a longer version for my website or a letter, under 350 words.');
      asks.push('Write the two sentences I want my supporters repeating on my behalf.');
      asks.push('Give me the five hardest follow-up questions I will get, and a straight answer to each.');
    }
    asks.push('Tell me where I am fooling myself in how I described this.');

    return window.WinnxtHandoff.buildPrompt({
      role: 'You are an experienced, blunt campaign communications advisor helping a first-time candidate for local office through a live problem. Be direct. Tell me if I am wrong. Do not write corporate-sounding statements and do not give me legal advice — tell me when to call a lawyer instead.',
      task: 'I ran this through a triage tool. Here is what happened and what the tool concluded.',
      context: [
        { label: 'What happened', value: a.what },
        { label: 'Where it surfaced', value: labelOf('where') },
        { label: 'How far it has spread', value: labelOf('spread') },
        { label: 'Is it true', value: labelOf('truth') },
        { label: 'The part that is true', value: a.truePart },
        { label: 'Damage to me with voters', value: labelOf('harm') },
        { label: 'How it came about', value: labelOf('fault') },
        { label: 'Proof I can show', value: labelOf('proof') },
        { label: 'Days until the election', value: a.daysOut }
      ],
      sections: [
        {
          title: "The tool's read",
          items: [
            'Quadrant: ' + r.quadrant.name,
            'Posture: ' + r.quadrant.posture,
            'Crisis type: ' + r.scct.type + ' — strategy is to ' + r.scct.strategy.toLowerCase(),
            'Risk level: ' + r.risk.name,
            'Call: ' + r.call.verdict
          ]
        },
        { title: 'Statement structure to follow — ' + r.skeleton.title, items: r.skeleton.steps }
      ],
      asks: asks
    });
  }

  function renderHandoff() {
    document.getElementById('handoff-text').textContent = buildHandoff();
  }

  // ---- chrome ------------------------------------------------------------

  // Every button acknowledges the press it just received.
  function bindTapFeedback() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      b.classList.remove('tapped');
      void b.offsetWidth;                       // restart the animation
      b.classList.add('tapped');
    });
  }

  function bindButtons() {
    document.getElementById('btn-start').addEventListener('click', function () {
      goto('wizard');
    });
    document.getElementById('btn-next').addEventListener('click', next);
    document.getElementById('btn-back').addEventListener('click', back);
    document.getElementById('btn-review').addEventListener('click', function () {
      step = 0;
      goto('wizard');
    });

    document.getElementById('btn-restart').addEventListener('click', function () {
      if (!confirm('Clear your answers and start over? This cannot be undone.')) return;
      state = { answers: {} };
      step = 0;
      goto('intro');
    });

    document.getElementById('btn-print').addEventListener('click', function () {
      window.WinnxtExport.print();
    });

    document.getElementById('btn-download').addEventListener('click', function () {
      window.WinnxtExport.downloadJSON('crisis-triage.json', { answers: state.answers });
    });

    document.getElementById('btn-copy').addEventListener('click', function () {
      var btn = this;
      window.WinnxtExport.copyText(buildHandoff(), function (ok) {
        btn.textContent = ok ? 'Copied' : 'Press Ctrl+C to copy';
        setTimeout(function () { btn.textContent = 'Copy this prompt'; }, 2500);
      });
    });

  }

  function init() {
    bindButtons();
    bindTapFeedback();
    goto('intro');

    // Nothing is saved, so leaving really does lose it. Say so.
    window.addEventListener('beforeunload', function (e) {
      if (!hasData()) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
