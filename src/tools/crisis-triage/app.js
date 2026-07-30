(function () {
  var store = new window.WinnxtStorage('winnxt:crisis-triage');

  var QUESTIONS = [
    {
      id: 'what', type: 'textarea', required: false,
      short: 'What happened',
      label: 'What happened?',
      help: 'Write it the way you would say it out loud. This never leaves your browser.',
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

  var state = { answers: {}, seen: false };
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

  function persist() { store.save({ answers: state.answers, seen: state.seen }); }

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

  function renderStep() {
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
          persist();
          markSelected(opts);
          clearError();
        });
        // Advance on an actual click. Keyboard users move through the group
        // with arrow keys, so auto-advancing on change would trap them.
        input.addEventListener('click', function () { queueAdvance(); });
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
          persist();
          clearError();
        });
      } else if (q.type === 'textarea') {
        field = el('textarea', { id: q.id, rows: '4', placeholder: q.placeholder || '' });
        field.value = val(q.id);
        field.addEventListener('input', function () {
          state.answers[q.id] = field.value;
          persist();
        });
      } else {
        field = el('input', { type: 'number', id: q.id, min: '0', inputmode: 'numeric', placeholder: q.placeholder || '' });
        field.value = val(q.id);
        field.addEventListener('input', function () {
          state.answers[q.id] = field.value;
          persist();
        });
      }
      card.appendChild(field);
      if (!q.required) card.appendChild(el('p', { class: 'optional', text: 'Optional — you can skip this.' }));
    }

    host.appendChild(card);

    document.getElementById('btn-back').disabled = step === 0;
    document.getElementById('btn-next').textContent =
      step === list.length - 1 ? 'See my read' : 'Continue';
  }

  function markSelected(opts) {
    Array.prototype.forEach.call(opts.querySelectorAll('.option'), function (lab) {
      var input = lab.querySelector('input');
      if (input.checked) lab.setAttribute('data-selected', '');
      else lab.removeAttribute('data-selected');
    });
  }

  var advanceTimer = null;
  function queueAdvance() {
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(function () { next(); }, 280);
  }

  function clearError() { show('step-error', false); }

  function next() {
    clearTimeout(advanceTimer);
    var list = steps();
    var q = list[step];
    if (q.required && !val(q.id)) {
      show('step-error', true);
      return;
    }
    clearError();
    if (step >= steps().length - 1) {
      finish();
      return;
    }
    step += 1;
    renderStep();
    focusStep();
  }

  function back() {
    clearTimeout(advanceTimer);
    clearError();
    if (step === 0) {
      goto('intro');
      return;
    }
    step -= 1;
    renderStep();
    focusStep();
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
    state.seen = true;
    persist();
    goto('report');
  }

  function goto(v) {
    view = v;
    show('intro', v === 'intro');
    show('wizard', v === 'wizard');
    show('report', v === 'report');
    if (v === 'wizard') renderStep();
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

    box.appendChild(detail('Where this sits', r.quadrant.name, r.quadrant.posture, r.quadrant.detail));
    box.appendChild(detail('How much blame lands on you', r.scct.type, r.scct.strategy, r.scct.detail));

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
    renderSummary();
    renderHandoff();
  }

  function tile(label, value) {
    var t = el('div', { class: 'tile' });
    t.appendChild(el('p', { class: 'tile-label', text: label }));
    t.appendChild(el('p', { class: 'tile-value', text: value }));
    return t;
  }

  function detail(eyebrow, headline, posture, body) {
    var d = el('section', { class: 'report-block' });
    d.appendChild(el('p', { class: 'eyebrow', text: eyebrow }));
    d.appendChild(el('h2', { text: headline }));
    d.appendChild(el('p', { class: 'posture', text: posture }));
    d.appendChild(el('p', { text: body }));
    return d;
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

  function bindStorageToggle() {
    var box = document.getElementById('storage-toggle');
    var note = document.getElementById('storage-note');

    if (!store.available()) {
      box.disabled = true;
      note.textContent = 'Your browser is blocking local storage, so nothing can be saved. Print or download before you close this tab.';
      return;
    }

    box.checked = store.enabled();
    box.addEventListener('change', function () {
      store.setEnabled(box.checked);
      if (box.checked) persist();
      updateNote();
    });
    updateNote();

    function updateNote() {
      note.textContent = store.enabled()
        ? 'Saved in this browser on this device. Anyone using this computer could open it. Erase when you are done.'
        : 'Nothing is being saved. Close this tab and it is gone.';
    }
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

    document.getElementById('btn-reset').addEventListener('click', function () {
      if (!confirm('Erase everything you have entered? This cannot be undone.')) return;
      store.eraseAll();
      state = { answers: {}, seen: false };
      step = 0;
      var box = document.getElementById('storage-toggle');
      if (!box.disabled) box.checked = false;
      document.getElementById('storage-note').textContent = 'Nothing is being saved. Close this tab and it is gone.';
      document.getElementById('resume-note').setAttribute('hidden', '');
      goto('intro');
    });
  }

  function init() {
    var saved = store.load();
    if (saved && saved.answers) {
      state.answers = saved.answers;
      state.seen = !!saved.seen;
    }

    bindStorageToggle();
    bindButtons();

    if (hasData()) {
      var note = document.getElementById('resume-note');
      note.textContent = 'Picking up where you left off — your saved answers are still here.';
      note.removeAttribute('hidden');
      document.getElementById('btn-start').textContent =
        state.seen && !missing().length ? 'See my read' : 'Continue';
      if (state.seen && !missing().length) {
        goto('report');
        return;
      }
    }

    goto('intro');
    store.warnOnUnloadWhenOff(hasData);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
