(function () {
  var STATUSES = [
    { id: 'unknown', label: "Don't know yet" },
    { id: 'verbal', label: 'Someone told me' },
    { id: 'written', label: 'Confirmed in writing' }
  ];

  var store = new window.WinnxtStorage('winnxt:pre-filing-check');

  var state = {
    race: { office: '', jurisdiction: '', electionDate: '', filingDeadline: '' },
    answers: {}
  };

  var allItems = [];
  PREFILING_SECTIONS.forEach(function (s) {
    s.items.forEach(function (i) {
      allItems.push(i);
    });
  });

  function answer(id) {
    if (!state.answers[id]) state.answers[id] = { status: 'unknown', note: '' };
    return state.answers[id];
  }

  function hasData() {
    if (state.race.office || state.race.jurisdiction) return true;
    return allItems.some(function (i) {
      var a = state.answers[i.id];
      return a && (a.status !== 'unknown' || a.note);
    });
  }

  function persist() {
    store.save(state);
  }

  // ---- dates -------------------------------------------------------------

  function parseDate(s) {
    if (!s) return null;
    var p = s.split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function shift(date, days) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function fmt(d) {
    return d.toLocaleDateString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  function daysBetween(a, b) {
    return Math.round((b - a) / 86400000);
  }

  function today() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  // ---- rendering ---------------------------------------------------------

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) {
      node.appendChild(c);
    });
    return node;
  }

  function renderChecklist() {
    var root = document.getElementById('checklist');
    root.textContent = '';

    PREFILING_SECTIONS.forEach(function (section) {
      var wrap = el('section', { class: 'section' });
      wrap.appendChild(el('h2', { text: section.title }));
      wrap.appendChild(el('p', { class: 'note', text: section.intro }));

      section.items.forEach(function (item) {
        wrap.appendChild(renderItem(item));
      });

      root.appendChild(wrap);
    });
  }

  function renderItem(item) {
    var a = answer(item.id);
    var card = el('div', { class: 'card item', 'data-item': item.id });

    var head = el('div', { class: 'item-head' });
    head.appendChild(el('h3', { text: item.label }));
    if (item.blocker) {
      head.appendChild(el('span', {
        class: 'tag tag-blocker',
        text: 'Blocks spending',
        title: 'Confirm this in writing before you spend money'
      }));
    }
    card.appendChild(head);

    card.appendChild(el('p', { class: 'why', text: item.why }));

    var askBox = el('div', { class: 'ask' });
    askBox.appendChild(el('span', { class: 'ask-label', text: 'Ask them:' }));
    askBox.appendChild(el('span', { text: ' ' + item.ask }));
    card.appendChild(askBox);

    var fs = el('fieldset', { class: 'status' });
    fs.appendChild(el('legend', { text: 'Where this stands' }));
    STATUSES.forEach(function (s) {
      var inputId = item.id + '-' + s.id;
      var label = el('label', { class: 'radio', for: inputId });
      var input = el('input', { type: 'radio', name: item.id, id: inputId, value: s.id });
      if (a.status === s.id) input.checked = true;
      input.addEventListener('change', function () {
        answer(item.id).status = s.id;
        card.setAttribute('data-status', s.id);
        persist();
        renderReadiness();
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + s.label));
      fs.appendChild(label);
    });
    card.appendChild(fs);

    var noteId = item.id + '-note';
    card.appendChild(el('label', { for: noteId, class: 'note-label', text: 'What you found out' }));
    var ta = el('textarea', { id: noteId, rows: '2', placeholder: 'Write the actual answer here — dates, numbers, exact wording, who told you.' });
    ta.value = a.note;
    ta.addEventListener('input', function () {
      answer(item.id).note = ta.value;
      persist();
    });
    card.appendChild(ta);

    card.setAttribute('data-status', a.status);
    return card;
  }

  // ---- readiness ---------------------------------------------------------

  function blockers() {
    return allItems.filter(function (i) {
      return i.blocker;
    });
  }

  function unresolvedBlockers() {
    return blockers().filter(function (i) {
      return answer(i.id).status !== 'written';
    });
  }

  function renderReadiness() {
    var box = document.getElementById('readiness');
    box.textContent = '';

    var total = blockers().length;
    var open = unresolvedBlockers().length;
    var done = total - open;

    box.appendChild(el('h2', { text: 'Are you clear to spend money?' }));

    var verdict = el('p', { class: 'verdict ' + (open ? 'verdict-no' : 'verdict-yes') });
    verdict.textContent = open
      ? 'Not yet. ' + open + ' of ' + total + ' spending blockers are still unconfirmed.'
      : 'Yes. All ' + total + ' spending blockers are confirmed in writing.';
    box.appendChild(verdict);

    var bar = el('div', { class: 'bar', role: 'img',
      'aria-label': done + ' of ' + total + ' blockers confirmed in writing' });
    var fill = el('div', { class: 'bar-fill' });
    fill.style.width = (total ? (done / total) * 100 : 0) + '%';
    bar.appendChild(fill);
    box.appendChild(bar);

    if (open) {
      box.appendChild(el('p', { class: 'note', text: 'Every item below is something a first-time candidate has paid for getting wrong. Confirm them in writing, then spend.' }));
      var ul = el('ul');
      unresolvedBlockers().forEach(function (i) {
        var a = answer(i.id);
        var li = el('li');
        li.appendChild(el('strong', { text: i.label }));
        if (a.status === 'verbal') {
          li.appendChild(document.createTextNode(' — you have a verbal answer. Get it in writing.'));
        }
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }

    renderCountdown(box);
  }

  function renderCountdown(box) {
    var filing = parseDate(state.race.filingDeadline);
    if (!filing) return;
    var n = daysBetween(today(), filing);
    var p = el('p', { class: 'countdown' });
    if (n > 1) p.textContent = n + ' days until your filing deadline.';
    else if (n === 1) p.textContent = 'Your filing deadline is tomorrow.';
    else if (n === 0) p.textContent = 'Your filing deadline is today. Filing closes at a specific time, not end of day.';
    else p.textContent = 'Your filing deadline was ' + Math.abs(n) + ' days ago.';
    box.appendChild(p);
  }

  // ---- timeline ----------------------------------------------------------

  var MILESTONES = [
    { from: 'filing', days: -56, text: 'Start working through this checklist. Call the filing office this week.' },
    { from: 'filing', days: -42, text: 'If signatures are required, start collecting. Aim for well more than the minimum — some will be invalid.' },
    { from: 'filing', days: -35, text: 'Confirm the exact disclaimer wording in writing. Do not place a print order before this date.' },
    { from: 'filing', days: -28, text: 'Appoint a treasurer and register the committee, if required, before any money moves.' },
    { from: 'filing', days: -14, text: 'All filing forms filled out. Notary lined up if one is needed.' },
    { from: 'filing', days: -7, text: 'File. Do not wait for the last day — a missing form on deadline day ends the campaign.' },
    { from: 'filing', days: 0, text: 'Filing deadline. Closes at a specific time, not end of day.' },
    { from: 'election', days: -28, text: 'Mail and absentee voting is often underway by now. Your materials should already be out.' },
    { from: 'election', days: 0, text: 'Election day.' }
  ];

  function renderTimeline() {
    var box = document.getElementById('timeline');
    box.textContent = '';
    box.appendChild(el('h2', { text: 'Your working backward plan' }));

    var filing = parseDate(state.race.filingDeadline);
    var election = parseDate(state.race.electionDate);

    if (!filing && !election) {
      box.appendChild(el('p', { class: 'note', text: 'Enter your filing deadline and election date above and this builds a dated plan working backward from them.' }));
      return;
    }

    box.appendChild(el('p', { class: 'note', text: 'These are planning dates, not legal deadlines. The only dates that bind you are the ones your filing authority gives you in writing.' }));

    var rows = [];
    MILESTONES.forEach(function (m) {
      var base = m.from === 'filing' ? filing : election;
      if (!base) return;
      rows.push({ date: shift(base, m.days), text: m.text });
    });
    rows.sort(function (a, b) {
      return a.date - b.date;
    });

    var now = today();
    var list = el('ol', { class: 'timeline-list' });
    rows.forEach(function (r) {
      var li = el('li', { class: r.date < now ? 'past' : '' });
      li.appendChild(el('span', { class: 'when', text: fmt(r.date) }));
      li.appendChild(el('span', { class: 'what', text: r.text }));
      list.appendChild(li);
    });
    box.appendChild(list);
  }

  // ---- call script -------------------------------------------------------

  function openQuestions() {
    return allItems.filter(function (i) {
      return answer(i.id).status !== 'written';
    });
  }

  function renderCallScript() {
    var box = document.getElementById('call-script');
    box.textContent = '';
    box.appendChild(el('h2', { text: 'What to ask when you call' }));

    var open = openQuestions();
    if (!open.length) {
      box.appendChild(el('p', { text: 'Nothing left to ask. Everything is confirmed in writing.' }));
      return;
    }

    box.appendChild(el('p', { class: 'note', text: 'Print this and take it to the phone. Be brief, be polite, ask for the answers by email, and get a name.' }));

    var ol = el('ol', { class: 'questions' });
    open.forEach(function (i) {
      ol.appendChild(el('li', { text: i.ask }));
    });
    box.appendChild(ol);

    box.appendChild(el('p', { class: 'note', text: 'Close with: "Could you email me that so I have it in writing? And is there a candidate packet you can send?"' }));
  }

  // ---- handoff -----------------------------------------------------------

  function buildHandoff() {
    var confirmed = [];
    var unknown = [];

    allItems.forEach(function (i) {
      var a = answer(i.id);
      if (a.status === 'written') {
        confirmed.push(i.label + ': ' + (a.note || '(confirmed in writing, no detail recorded)'));
      } else if (a.status === 'verbal' && a.note) {
        confirmed.push(i.label + ': ' + a.note + ' [verbal only, not yet in writing]');
      } else if (a.status === 'verbal') {
        unknown.push(i.label + ' [someone told me, but I did not write down what they said]');
      } else {
        unknown.push(i.label);
      }
    });

    return window.WinnxtHandoff.buildPrompt({
      role: 'You are helping a first-time candidate for local office get ready to file. Be direct and practical. Do not guess at any jurisdiction\'s legal requirements — if something depends on local rules, tell me to confirm it with my filing authority.',
      task: 'Here is where my pre-filing research stands. Help me finish it and turn it into a week-by-week plan.',
      context: [
        { label: 'Office', value: state.race.office },
        { label: 'Jurisdiction', value: state.race.jurisdiction },
        { label: 'Election date', value: state.race.electionDate },
        { label: 'Filing deadline', value: state.race.filingDeadline }
      ],
      sections: [
        { title: 'What I have confirmed', items: confirmed },
        { title: 'What I still do not know', items: unknown }
      ],
      asks: [
        'Write me a short, polite email to my filing authority that asks for everything in the "still do not know" list at once.',
        'Build a week-by-week plan from today to my filing deadline, based on what is still open.',
        'Tell me which of the open items are most likely to sink a first-time campaign if I leave them to the last week, and why.',
        'Flag anything a candidate for this kind of office commonly gets wrong that is not on my list.'
      ]
    });
  }

  function renderHandoff() {
    document.getElementById('handoff-text').textContent = buildHandoff();
  }

  // ---- wiring ------------------------------------------------------------

  function bindRaceFields() {
    ['office', 'jurisdiction', 'electionDate', 'filingDeadline'].forEach(function (k) {
      var input = document.getElementById('race-' + k);
      input.value = state.race[k] || '';
      input.addEventListener('input', function () {
        state.race[k] = input.value;
        persist();
        renderTimeline();
        renderReadiness();
      });
    });
  }

  function bindStorageToggle() {
    var box = document.getElementById('storage-toggle');
    var note = document.getElementById('storage-note');

    if (!store.available()) {
      box.disabled = true;
      note.textContent = 'Your browser is blocking local storage, so nothing can be saved. Use Download or Print before you close this tab.';
      return;
    }

    box.checked = store.enabled();
    box.addEventListener('change', function () {
      store.setEnabled(box.checked);
      if (box.checked) persist();
      updateStorageNote();
    });
    updateStorageNote();

    function updateStorageNote() {
      note.textContent = store.enabled()
        ? 'Saving to this browser on this device. Anyone who uses this computer can reopen it. Use Erase everything when you are done.'
        : 'Nothing is being saved. Close this tab and your answers are gone.';
    }
  }

  function bindButtons() {
    document.getElementById('btn-print').addEventListener('click', function () {
      window.WinnxtExport.print();
    });

    document.getElementById('btn-download').addEventListener('click', function () {
      window.WinnxtExport.downloadJSON('pre-filing-check.json', state);
    });

    document.getElementById('btn-copy').addEventListener('click', function () {
      var btn = this;
      window.WinnxtExport.copyText(buildHandoff(), function (ok) {
        btn.textContent = ok ? 'Copied' : 'Press Ctrl+C to copy';
        if (!ok) selectHandoff();
        setTimeout(function () {
          btn.textContent = 'Copy this prompt';
        }, 2500);
      });
    });

    document.getElementById('btn-erase').addEventListener('click', function () {
      if (!confirm('Erase everything you have entered? This cannot be undone.')) return;
      store.eraseAll();
      state = {
        race: { office: '', jurisdiction: '', electionDate: '', filingDeadline: '' },
        answers: {}
      };
      var box = document.getElementById('storage-toggle');
      if (!box.disabled) box.checked = false;
      renderAll();
      bindRaceFields();
      document.getElementById('storage-note').textContent = 'Nothing is being saved. Close this tab and your answers are gone.';
    });
  }

  function selectHandoff() {
    var pre = document.getElementById('handoff-text');
    var range = document.createRange();
    range.selectNodeContents(pre);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function renderAll() {
    renderChecklist();
    renderReadiness();
    renderTimeline();
    renderCallScript();
    renderHandoff();
  }

  // Re-render the derived panels on any change, cheaply.
  function bindRefresh() {
    document.addEventListener('change', function () {
      renderCallScript();
      renderHandoff();
    });
    document.addEventListener('input', function () {
      renderHandoff();
    });
  }

  function init() {
    var saved = store.load();
    if (saved && saved.race && saved.answers) state = saved;

    bindRaceFields();
    bindStorageToggle();
    bindButtons();
    bindRefresh();
    renderAll();

    store.warnOnUnloadWhenOff(hasData);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
