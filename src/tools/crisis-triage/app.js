(function () {
  var store = new window.WinnxtStorage('winnxt:crisis-triage');

  var QUESTIONS = [
    {
      id: 'what', type: 'textarea', required: false,
      label: 'What happened?',
      help: 'Write it the way you would say it out loud. This never leaves your browser.',
      placeholder: 'A post from 2016 is going around in a local parents group.'
    },
    {
      id: 'where', type: 'select', required: true,
      label: 'Where did it surface?',
      help: 'The pattern for local candidates is almost always a neighborhood Facebook group first, everything else second.',
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
      label: 'Is it true?',
      help: 'Answer this one honestly even though nobody is watching. Every wrong response strategy starts with getting this wrong.',
      options: [
        ['true', 'Yes, it is accurate'],
        ['partly', 'Partly — the core is true, some details are wrong'],
        ['false', 'No, it is false']
      ]
    },
    {
      id: 'truePart', type: 'textarea', required: false, showIf: { truth: ['partly'] },
      label: 'Which part is true?',
      help: 'The true part is the part that gets reported. Name it now so your response does not lean on the wrong half.',
      placeholder: 'I did miss those meetings. The reason they gave is wrong.'
    },
    {
      id: 'harm', type: 'radio', required: true,
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
      label: 'Is anyone unsafe?',
      help: 'Threats, harassment, anything aimed at your home or your family. This changes the order of what you do next.',
      options: [
        ['no', 'No'],
        ['yes', 'Yes, or it is heading that way']
      ]
    },
    {
      id: 'daysOut', type: 'number', required: false,
      label: 'Days until the election',
      help: 'Leave blank if you are not sure. Close to election day, the same crisis is a bigger problem because there is less time to recover.',
      placeholder: 'e.g. 21'
    }
  ];

  var state = { answers: {} };

  function val(id) {
    return state.answers[id] === undefined ? '' : state.answers[id];
  }

  function visible(q) {
    if (!q.showIf) return true;
    return Object.keys(q.showIf).every(function (k) {
      return q.showIf[k].indexOf(val(k)) !== -1;
    });
  }

  function missing() {
    return QUESTIONS.filter(function (q) {
      return q.required && visible(q) && !val(q.id);
    });
  }

  function hasData() {
    return Object.keys(state.answers).some(function (k) {
      return state.answers[k];
    });
  }

  function persist() {
    store.save(state);
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

  function onChange(id, value) {
    state.answers[id] = value;
    persist();
    render();
  }

  // ---- questions ---------------------------------------------------------

  function renderQuestions() {
    var root = document.getElementById('questions');
    root.textContent = '';

    QUESTIONS.forEach(function (q) {
      if (!visible(q)) return;
      var card = el('div', { class: 'card question', 'data-q': q.id });

      if (q.type === 'radio') {
        var fs = el('fieldset');
        fs.appendChild(el('legend', { text: q.label }));
        if (q.help) fs.appendChild(el('p', { class: 'help', text: q.help }));
        q.options.forEach(function (o) {
          var inputId = q.id + '-' + o[0];
          var lab = el('label', { class: 'radio', for: inputId });
          var input = el('input', { type: 'radio', name: q.id, id: inputId, value: o[0] });
          if (val(q.id) === o[0]) input.checked = true;
          input.addEventListener('change', function () { onChange(q.id, o[0]); });
          lab.appendChild(input);
          lab.appendChild(document.createTextNode(' ' + o[1]));
          fs.appendChild(lab);
        });
        card.appendChild(fs);
      } else {
        card.appendChild(el('label', { for: q.id, text: q.label }));
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
          field.addEventListener('change', function () { onChange(q.id, field.value); });
        } else if (q.type === 'textarea') {
          field = el('textarea', { id: q.id, rows: '3', placeholder: q.placeholder || '' });
          field.value = val(q.id);
          field.addEventListener('input', function () {
            state.answers[q.id] = field.value;
            persist();
            renderHandoff();
          });
        } else {
          field = el('input', { type: 'number', id: q.id, min: '0', placeholder: q.placeholder || '' });
          field.value = val(q.id);
          field.addEventListener('input', function () { onChange(q.id, field.value); });
        }
        card.appendChild(field);
      }

      root.appendChild(card);
    });
  }

  // ---- read --------------------------------------------------------------

  function renderRead() {
    var box = document.getElementById('read');
    box.textContent = '';

    var need = missing();
    if (need.length) {
      box.className = 'card read incomplete';
      box.appendChild(el('h2', { text: 'Your read' }));
      box.appendChild(el('p', { text: 'Answer these and this fills in:' }));
      var ul = el('ul');
      need.forEach(function (q) { ul.appendChild(el('li', { text: q.label })); });
      box.appendChild(ul);
      return;
    }

    var a = state.answers;
    var r = window.CrisisLogic.assess(a);
    box.className = 'card read risk-' + r.riskKey;

    if (a.safety === 'yes') {
      var safety = el('div', { class: 'safety' });
      safety.appendChild(el('h2', { text: 'Safety comes before messaging' }));
      safety.appendChild(el('p', { text: 'Document it with dated screenshots. Report it to law enforcement. Tell your family and whoever runs your events. Threats against local officials are common and they are not something to absorb quietly — most of them come from people who are not physically present, which does not make them harmless.' }));
      safety.appendChild(el('p', { class: 'note', text: 'This tool is not legal advice and cannot assess your risk. Talk to law enforcement and a lawyer.' }));
      box.appendChild(safety);
    }

    box.appendChild(el('h2', { text: 'Your read' }));

    var verdict = el('div', { class: 'verdict-block' });
    verdict.appendChild(el('p', { class: 'verdict', text: r.call.verdict }));
    verdict.appendChild(el('p', { text: r.call.line }));
    box.appendChild(verdict);

    box.appendChild(row('Where this sits', r.quadrant.name, r.quadrant.posture, r.quadrant.detail));
    box.appendChild(row('How much blame lands on you', r.scct.type, r.scct.strategy, r.scct.detail));

    var riskRow = el('div', { class: 'read-row' });
    riskRow.appendChild(el('h3', { text: 'Risk level' }));
    riskRow.appendChild(el('p', { class: 'headline', text: r.risk.name }));
    var dl = el('dl', { class: 'grid-row' });
    [['Prepare', r.risk.prep], ['Watch', r.risk.detect], ['Respond', r.risk.respond], ['Recover', r.risk.recover]]
      .forEach(function (p) {
        dl.appendChild(el('dt', { text: p[0] }));
        dl.appendChild(el('dd', { text: p[1] }));
      });
    riskRow.appendChild(dl);
    box.appendChild(riskRow);

    if (r.channel && r.call.publish !== 'no') {
      var ch = el('div', { class: 'read-row' });
      ch.appendChild(el('h3', { text: 'Where to answer it' }));
      ch.appendChild(el('p', { class: 'note', text: 'Answer where it landed. A press release does not reach the people who saw a Facebook post.' }));
      ch.appendChild(el('p', { text: r.channel }));
      box.appendChild(ch);
    }

    var sk = el('div', { class: 'read-row' });
    sk.appendChild(el('h3', { text: 'How to build the statement — ' + r.skeleton.title }));
    var ol = el('ol');
    r.skeleton.steps.forEach(function (s) { ol.appendChild(el('li', { text: s })); });
    sk.appendChild(ol);
    sk.appendChild(el('p', { class: 'note', text: 'This tool gives you the shape. Use the handoff below to get actual words.' }));
    box.appendChild(sk);
  }

  function row(heading, headline, posture, detail) {
    var d = el('div', { class: 'read-row' });
    d.appendChild(el('h3', { text: heading }));
    d.appendChild(el('p', { class: 'headline', text: headline }));
    d.appendChild(el('p', { class: 'posture', text: posture }));
    d.appendChild(el('p', { text: detail }));
    return d;
  }

  function renderPlan() {
    var box = document.getElementById('plan');
    box.textContent = '';
    if (missing().length) return;

    var r = window.CrisisLogic.assess(state.answers);

    box.appendChild(el('h2', { text: 'What to do, in order' }));
    var ol = el('ol', { class: 'sequence' });
    r.sequence.forEach(function (s) {
      var li = el('li');
      li.appendChild(el('span', { class: 'when', text: s.when }));
      li.appendChild(el('span', { class: 'what', text: s.what }));
      ol.appendChild(li);
    });
    box.appendChild(ol);

    box.appendChild(el('h2', { text: 'What not to do' }));
    var ul = el('ul', { class: 'donts' });
    r.donts.forEach(function (d) { ul.appendChild(el('li', { text: d })); });
    box.appendChild(ul);
  }

  // ---- handoff -----------------------------------------------------------

  function buildHandoff() {
    var a = state.answers;
    var need = missing();

    if (need.length) {
      return 'Answer the questions above and a ready-to-paste prompt appears here.';
    }

    var r = window.CrisisLogic.assess(a);
    var labelOf = function (id) {
      var q = QUESTIONS.filter(function (x) { return x.id === id; })[0];
      if (!q || !q.options) return val(id);
      var found = q.options.filter(function (o) { return o[0] === val(id); })[0];
      return found ? found[1] : val(id);
    };

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
    document.getElementById('btn-print').addEventListener('click', function () {
      window.WinnxtExport.print();
    });

    document.getElementById('btn-download').addEventListener('click', function () {
      window.WinnxtExport.downloadJSON('crisis-triage.json', state);
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
      state = { answers: {} };
      var box = document.getElementById('storage-toggle');
      if (!box.disabled) box.checked = false;
      document.getElementById('storage-note').textContent = 'Nothing is being saved. Close this tab and it is gone.';
      render();
    });
  }

  function render() {
    renderQuestions();
    renderRead();
    renderPlan();
    renderHandoff();
  }

  function init() {
    var saved = store.load();
    if (saved && saved.answers) state = saved;
    bindStorageToggle();
    bindButtons();
    render();
    store.warnOnUnloadWhenOff(hasData);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
