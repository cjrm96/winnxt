(function () {
  // Same promise as the crisis tool, and it matters more here. A candidate
  // typing their bankruptcy, their arrest and their worst posts into a box is
  // doing the single most sensitive thing this product line asks of anyone.
  // So: no localStorage, no sessionStorage, no cookies, no network. The only
  // way anything leaves is the print dialog or the handoff block, and both are
  // things the user has to actively choose.
  var Items = window.SelfVetItems;
  var Logic = window.SelfVetLogic;
  var Evidence = window.SelfVetEvidence;

  // flagged: { itemId: { label, section, sectionName, desc, likelihood, severity, custom } }
  var state = { flagged: {}, race: {} };
  var step = 0;
  var view = 'intro';
  var booted = false;
  var customSeq = 0;

  // Step 0 is the race, then one step per section.
  function steps() {
    return [{ id: '__race', race: true }].concat(Items.SECTIONS);
  }

  function flaggedList() {
    return Object.keys(state.flagged).map(function (id) {
      var f = state.flagged[id];
      return {
        id: id,
        label: f.label,
        section: f.section,
        sectionName: f.sectionName,
        desc: f.desc,
        likelihood: f.likelihood,
        severity: f.severity,
        custom: f.custom
      };
    });
  }

  function hasData() {
    return Object.keys(state.flagged).length > 0 ||
      !!(state.race.office || state.race.days);
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

    var s = list[step];
    var host = document.getElementById('step');
    host.textContent = '';

    document.getElementById('progress-label').textContent =
      s.race ? 'Your race' : 'Section ' + step + ' of ' + Items.SECTIONS.length;
    // The heading already names the section, so this counts instead. Watching
    // the number climb is the only feedback there is until the register.
    var n = Object.keys(state.flagged).length;
    document.getElementById('progress-count').textContent =
      n ? n + (n === 1 ? ' flagged' : ' flagged') : '';
    var pct = Math.round((step / list.length) * 100);
    var fill = document.getElementById('progress-fill');
    fill.style.width = pct + '%';
    fill.parentNode.setAttribute('aria-valuenow', String(pct));

    host.setAttribute('data-dir', dir === 'back' ? 'back' : 'fwd');
    host.appendChild(s.race ? raceCard() : sectionCard(s));

    document.getElementById('btn-back').textContent = step === 0 ? 'Back to start' : 'Back';
    document.getElementById('btn-next').textContent =
      step === list.length - 1 ? 'See my register' : 'Continue';

    var hint = document.getElementById('step-hint');
    hint.textContent = s.race
      ? 'Both optional. They only sharpen the timing advice.'
      : 'Flag what applies. Most people flag two or three per section.';
  }

  function raceCard() {
    var card = el('div', { class: 'question', 'data-q': 'race' });
    card.appendChild(el('h2', { class: 'q-label', text: 'First, your race' }));
    card.appendChild(el('p', { class: 'help', text: 'Both of these are optional and neither changes what gets flagged. The deadline sharpens the timing advice at the end, because disclosing something early and disclosing it late are different acts.' }));

    var wrap = el('div', { class: 'race-fields' });

    wrap.appendChild(el('label', { for: 'race-office', text: 'What are you running for?' }));
    var office = el('input', { type: 'text', id: 'race-office', placeholder: 'e.g. Board of Education, District 3' });
    office.value = state.race.office || '';
    office.addEventListener('input', function () { state.race.office = office.value; });
    wrap.appendChild(office);

    wrap.appendChild(el('label', { for: 'race-days', text: 'Days until your filing deadline or election' }));
    var days = el('input', { type: 'number', id: 'race-days', min: '0', inputmode: 'numeric', placeholder: 'e.g. 60' });
    days.value = state.race.days || '';
    days.addEventListener('input', function () { state.race.days = days.value; });
    wrap.appendChild(days);
    wrap.appendChild(el('p', { class: 'optional', text: 'Leave it blank if you are not sure.' }));

    card.appendChild(wrap);
    return card;
  }

  function sectionCard(s) {
    var card = el('div', { class: 'question', 'data-q': s.id });
    card.appendChild(el('h2', { class: 'q-label', text: s.full }));
    card.appendChild(el('p', { class: 'help', text: s.lede }));

    var list = el('div', { class: 'flags' });
    s.items.forEach(function (pair) {
      list.appendChild(flagRow(s, s.id + '.' + pair[0], pair[1], false));
    });

    // Anything already added by hand in this section, so it survives going back.
    Object.keys(state.flagged).forEach(function (id) {
      var f = state.flagged[id];
      if (f.section === s.id && f.custom) list.appendChild(flagRow(s, id, f.label, true));
    });

    card.appendChild(list);

    var add = el('button', { type: 'button', class: 'secondary add-own no-print' });
    add.textContent = Items.OTHER_LABEL;
    add.addEventListener('click', function () {
      customSeq += 1;
      var id = s.id + '.own-' + customSeq;
      state.flagged[id] = {
        label: '', section: s.id, sectionName: s.full,
        desc: '', likelihood: '', severity: '', custom: true
      };
      var row = flagRow(s, id, '', true);
      list.appendChild(row);
      var input = row.querySelector('.own-label');
      if (input) input.focus();
    });
    card.appendChild(add);

    return card;
  }

  function flagRow(section, id, label, custom) {
    var row = el('div', { class: 'flag' + (custom ? ' flag-own' : '') });
    var boxId = 'chk-' + id.replace(/\./g, '-');

    var head = el('label', { class: 'flag-head', for: boxId });
    var box = el('input', { type: 'checkbox', id: boxId });
    box.checked = !!state.flagged[id];
    head.appendChild(box);

    if (custom) {
      var own = el('input', { type: 'text', class: 'own-label', placeholder: 'Describe it in a few words' });
      own.value = label || '';
      own.addEventListener('input', function () {
        if (state.flagged[id]) state.flagged[id].label = own.value;
      });
      // Clicking into the text field must not toggle the checkbox around it.
      own.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); });
      head.appendChild(own);
    } else {
      head.appendChild(el('span', { class: 'flag-text', text: label }));
    }

    row.appendChild(head);

    var detail = el('div', { class: 'flag-detail' });
    detail.appendChild(detailFields(id));
    row.appendChild(detail);

    function sync() {
      if (box.checked) row.setAttribute('data-on', '');
      else row.removeAttribute('data-on');
    }

    box.addEventListener('change', function () {
      if (box.checked) {
        if (!state.flagged[id]) {
          state.flagged[id] = {
            label: custom ? (row.querySelector('.own-label') || {}).value || '' : label,
            section: section.id,
            sectionName: section.full,
            desc: '', likelihood: '', severity: '', custom: !!custom
          };
        }
      } else if (custom) {
        // An unchecked hand-written row has nothing left to mean, so it goes.
        delete state.flagged[id];
        row.parentNode.removeChild(row);
        return;
      } else {
        delete state.flagged[id];
      }
      sync();
      detail.textContent = '';
      detail.appendChild(detailFields(id));
    });

    sync();
    if (custom) box.checked = true;
    if (custom) row.setAttribute('data-on', '');
    return row;
  }

  function detailFields(id) {
    var wrap = el('div', { class: 'flag-fields' });
    var f = state.flagged[id];
    if (!f) return wrap;

    var descId = 'desc-' + id.replace(/\./g, '-');
    wrap.appendChild(el('label', { class: 'flag-label', for: descId, text: 'In one line, what is it?' }));
    var desc = el('input', { type: 'text', id: descId, placeholder: 'Only you will ever read this' });
    desc.value = f.desc || '';
    desc.addEventListener('input', function () { f.desc = desc.value; });
    wrap.appendChild(desc);

    wrap.appendChild(seg(id, 'likelihood', 'How likely is it to surface?', Items.LIKELIHOOD));
    wrap.appendChild(seg(id, 'severity', 'How bad is it if it does?', Items.SEVERITY));

    return wrap;
  }

  function seg(id, field, question, options) {
    var f = state.flagged[id];
    var wrap = el('fieldset', { class: 'seg' });
    wrap.appendChild(el('legend', { class: 'flag-label', text: question }));
    var row = el('div', { class: 'seg-row' });

    options.forEach(function (o) {
      var inputId = field + '-' + id.replace(/\./g, '-') + '-' + o[0];
      var lab = el('label', { class: 'seg-opt', for: inputId, title: o[2] });
      var input = el('input', {
        type: 'radio', name: field + '-' + id, id: inputId, value: o[0]
      });
      if (f[field] === o[0]) {
        input.checked = true;
        lab.setAttribute('data-selected', '');
      }
      input.addEventListener('change', function () {
        f[field] = o[0];
        Array.prototype.forEach.call(row.querySelectorAll('.seg-opt'), function (l) {
          l.removeAttribute('data-selected');
        });
        lab.setAttribute('data-selected', '');
      });
      lab.appendChild(input);
      lab.appendChild(el('span', { class: 'seg-name', text: o[1] }));
      row.appendChild(lab);
    });

    wrap.appendChild(row);

    // One definition per line. Run together as a paragraph these three read as
    // a wall and get skipped, and the whole exercise depends on somebody
    // actually distinguishing serious from severe.
    var help = el('div', { class: 'seg-help' });
    options.forEach(function (o) {
      var line = el('p', { class: 'seg-def' });
      line.appendChild(el('b', { text: o[1] }));
      line.appendChild(el('span', { text: o[2] }));
      help.appendChild(line);
    });
    wrap.appendChild(help);
    return wrap;
  }

  // ---- navigation --------------------------------------------------------

  var timers = [];

  function cancelPending() {
    timers.forEach(clearTimeout);
    timers = [];
    document.getElementById('step').classList.remove('is-leaving-fwd', 'is-leaving-back');
  }

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
    if (step >= list.length - 1) {
      cancelPending();
      goto('report');
      return;
    }
    transitionTo(step + 1, 'fwd');
  }

  function back() {
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

  function goto(v) {
    view = v;
    document.querySelector('main').setAttribute('data-view', v);
    show('intro', v === 'intro');
    show('wizard', v === 'wizard');
    show('report', v === 'report');
    if (v !== 'report') hideVerdictBar();
    if (v === 'wizard') { cancelPending(); renderStep('fwd'); }
    if (v === 'report') renderReport();
    window.scrollTo(0, 0);

    if (!booted) return;
    if (v === 'report') focusEl(document.getElementById('report-heading'));
    if (v === 'intro') focusEl(document.querySelector('#intro h1'));
  }

  function focusEl(node) {
    if (!node) return;
    if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
    node.focus({ preventScroll: true });
  }

  // ---- the register ------------------------------------------------------

  function renderReport() {
    var box = document.getElementById('read');
    box.textContent = '';
    var r = Logic.assess(flaggedList());

    var hero = el('section', { class: 'report-block hero' + (r.counts.ahead ? ' hero-hot' : '') });
    hero.appendChild(el('p', { class: 'verdict', text: r.headline }));
    hero.appendChild(el('p', { class: 'verdict-line', text: r.posture }));
    box.appendChild(hero);

    if (r.counts.total) {
      var tiles = el('section', { class: 'tiles' });
      Logic.TIER_ORDER.forEach(function (k) {
        tiles.appendChild(tile(Logic.TIERS[k].name, String(r.counts[k])));
      });
      box.appendChild(tiles);
    }

    if (r.unscored.length) {
      var warn = el('section', { class: 'report-block' });
      var note = el('div', { class: 'callout callout-warn' });
      note.appendChild(el('p', {
        text: r.unscored.length + (r.unscored.length === 1 ? ' item is' : ' items are') +
          ' flagged but not rated, so they are not in the register below. Go back and set how likely and how bad each one is. An unrated item is the same as an unexamined one.'
      }));
      warn.appendChild(note);
      box.appendChild(warn);
    }

    var timing = Logic.timing(state.race.days, r.counts);
    if (timing) {
      var t = el('section', { class: 'report-block' });
      t.appendChild(el('p', { class: 'eyebrow', text: 'Timing' }));
      t.appendChild(el('h2', { text: 'When to do it' }));
      t.appendChild(el('p', { text: timing }));
      box.appendChild(t);
    }

    renderRegister(r);
    renderWhy();
    renderSources(r);
    renderHandoff();
    setupVerdictBar(r);
  }

  function tile(label, value) {
    var t = el('div', { class: 'tile' });
    t.appendChild(el('p', { class: 'tile-label', text: label }));
    t.appendChild(el('p', { class: 'tile-value', text: value }));
    return t;
  }

  function renderRegister(r) {
    var box = document.getElementById('plan');
    box.textContent = '';

    if (!r.counts.scored) return;

    r.groups.forEach(function (g) {
      var panel = el('section', { class: 'report-block panel tier-block tier-' + g.tier.key });
      panel.appendChild(el('p', { class: 'eyebrow', text: g.tier.short + ' / ' + g.items.length }));
      panel.appendChild(el('h2', { text: g.tier.name }));
      panel.appendChild(el('p', { class: 'posture', text: g.tier.line }));
      panel.appendChild(el('p', { text: g.tier.detail }));

      var list = el('ol', { class: 'register' });
      g.items.forEach(function (item) { list.appendChild(registerRow(item)); });
      panel.appendChild(list);

      Evidence.casesFor(g.tier.key).forEach(function (c) {
        panel.appendChild(caseCard(c));
      });

      box.appendChild(panel);
    });
  }

  function registerRow(item) {
    var li = el('li', { class: 'reg-item' });
    li.appendChild(el('p', { class: 'reg-what', text: item.desc || item.label || 'Unnamed item' }));

    var meta = el('p', { class: 'reg-meta' });
    meta.appendChild(el('span', { class: 'reg-section', text: item.sectionName }));
    if (item.desc && item.label) {
      meta.appendChild(el('span', { class: 'reg-prompt', text: item.label }));
    }
    li.appendChild(meta);

    var chips = el('p', { class: 'chips' });
    chips.appendChild(el('span', { class: 'chip chip-' + item.likelihood, text: nameOf(Items.LIKELIHOOD, item.likelihood) }));
    chips.appendChild(el('span', { class: 'chip chip-' + item.severity, text: nameOf(Items.SEVERITY, item.severity) }));
    li.appendChild(chips);

    return li;
  }

  function nameOf(options, key) {
    var found = options.filter(function (o) { return o[0] === key; })[0];
    return found ? found[1] : key;
  }

  function caseCard(c) {
    var card = el('article', { class: 'case' });
    var head = el('p', { class: 'case-head' });
    head.appendChild(el('span', { class: 'case-who', text: c.who }));
    head.appendChild(el('span', { class: 'case-year', text: String(c.year) }));
    card.appendChild(head);
    card.appendChild(el('p', { class: 'case-what', text: c.what }));
    card.appendChild(el('p', { class: 'case-lesson', text: c.lesson }));

    var rows = [
      ['What was actually going on', c.background],
      ['How the public reacted', c.reaction],
      ['What they chose to do', c.handling],
      ['Where it ended up', c.outcome]
    ].filter(function (row) { return row[1]; });

    if (rows.length) {
      var det = el('details', { class: 'case-more' });
      det.appendChild(el('summary', { text: 'The full story' }));
      var body = el('div', { class: 'case-body' });
      rows.forEach(function (row) {
        body.appendChild(el('h3', { class: 'case-sub', text: row[0] }));
        body.appendChild(el('p', { text: row[1] }));
      });
      det.appendChild(body);
      card.appendChild(det);
    }
    return card;
  }

  function renderWhy() {
    var box = document.getElementById('plan');
    var panel = el('section', { class: 'report-block why-block' });
    panel.appendChild(el('p', { class: 'eyebrow', text: 'Precedent' }));
    panel.appendChild(el('h2', { text: 'How this goes wrong' }));
    panel.appendChild(el('p', { class: 'note', text: 'Two cases at opposite ends of the scale, with the same mechanism underneath: the thing itself was survivable, and not saying it first was not.' }));
    Evidence.WHY.forEach(function (c) { panel.appendChild(caseCard(c)); });
    box.appendChild(panel);
  }

  function renderSources(r) {
    var box = document.getElementById('summary-slot');
    box.textContent = '';
    var keys = r.groups.map(function (g) { return g.tier.key; });
    if (!keys.length) keys = ['ahead'];
    var cites = Evidence.allCites(keys);
    if (!cites.length) return;

    var src = el('section', { class: 'report-block sources-block' });
    src.appendChild(el('p', { class: 'eyebrow', text: 'Evidence' }));
    src.appendChild(el('h2', { text: 'Why this is the advice' }));
    src.appendChild(el('p', { class: 'note', text: 'Every rule above traces back to these. Look any of it up. None of it is ours.' }));
    cites.forEach(function (c) {
      var box2 = el('div', { class: 'cite' });
      box2.appendChild(el('p', { class: 'cite-claim', text: c.claim }));
      box2.appendChild(el('p', { class: 'cite-source', text: c.source }));
      src.appendChild(box2);
    });
    box.appendChild(src);
  }

  var verdictObserver = null;

  function setupVerdictBar(r) {
    var bar = document.getElementById('verdict-bar');
    document.getElementById('verdict-bar-text').textContent = r.headline;
    var count = document.getElementById('verdict-bar-risk');
    count.textContent = r.counts.total ? r.counts.total + ' flagged' : 'Nothing flagged';
    bar.setAttribute('aria-label', r.headline + '. Back to top.');

    if (verdictObserver) verdictObserver.disconnect();
    bar.setAttribute('hidden', '');

    var hero = document.querySelector('#read .hero');
    if (!hero || !('IntersectionObserver' in window)) return;

    verdictObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (view !== 'report') return;
        if (e.isIntersecting) bar.setAttribute('hidden', '');
        else bar.removeAttribute('hidden');
      });
    }, { rootMargin: '-8px 0px 0px 0px', threshold: 0 });

    verdictObserver.observe(hero);
  }

  function hideVerdictBar() {
    if (verdictObserver) { verdictObserver.disconnect(); verdictObserver = null; }
    document.getElementById('verdict-bar').setAttribute('hidden', '');
  }

  // ---- handoff -----------------------------------------------------------

  function buildHandoff() {
    var r = Logic.assess(flaggedList());
    if (!r.counts.scored) {
      return 'Flag and rate at least one item and a ready-to-paste prompt appears here.';
    }

    var sections = r.groups.map(function (g) {
      return {
        title: g.tier.name + ' (' + g.items.length + ')',
        items: g.items.map(function (i) {
          return (i.desc || i.label) + ' [' + i.sectionName + ', ' +
            nameOf(Items.LIKELIHOOD, i.likelihood).toLowerCase() + ' to surface, ' +
            nameOf(Items.SEVERITY, i.severity).toLowerCase() + ']';
        })
      };
    });

    var asks = [];
    if (r.counts.ahead) {
      asks.push('For each item under "Get ahead of it", draft two or three sentences I could say publicly, in my own plain voice, that put it on the record before anyone asks. No press-release language.');
      asks.push('Tell me the best venue and moment for each of those disclosures, given the timing above.');
    }
    if (r.counts.draft) {
      asks.push('For each item under "Draft a statement", write the short answer I would give if a reporter or an opponent raised it. Two or three sentences, then a way back to what I am running on.');
    }
    if (r.counts.prepare) {
      asks.push('For the "Prepare an answer" items, give me one sentence each. I am not raising these, I just want to not hesitate.');
    }
    asks.push('Give me the five hardest follow-up questions this list invites, and a straight answer to each.');
    asks.push('Tell me what is missing. Based on what I have flagged, what would a professional opposition researcher go looking for next?');

    return window.WinnxtHandoff.buildPrompt({
      role: 'You are an experienced, blunt campaign communications advisor helping someone running for local office. Be direct. Tell me if I am wrong. Do not write corporate-sounding statements, and do not give me legal advice. Tell me when to call a lawyer instead.',
      task: 'I ran my own record through a self-vetting tool. Here is what I found and what the tool says to do about each item.',
      context: [
        { label: 'Office', value: state.race.office },
        { label: 'Days until filing or election', value: state.race.days },
        { label: 'Items flagged', value: String(r.counts.total) }
      ],
      sections: sections,
      asks: asks
    });
  }

  function renderHandoff() {
    document.getElementById('handoff-text').textContent = buildHandoff();
  }

  // ---- chrome ------------------------------------------------------------

  function bindTapFeedback() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      b.classList.remove('tapped');
      void b.offsetWidth;
      b.classList.add('tapped');
    });
  }

  function bindButtons() {
    document.getElementById('btn-start').addEventListener('click', function () {
      goto('wizard');
    });
    document.getElementById('btn-next').addEventListener('click', next);
    document.getElementById('btn-back').addEventListener('click', back);

    document.getElementById('verdict-bar').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      focusEl(document.getElementById('report-heading'));
    });

    document.getElementById('btn-review').addEventListener('click', function () {
      step = 0;
      goto('wizard');
    });

    document.getElementById('btn-restart').addEventListener('click', function () {
      if (!confirm('Clear everything and start over? This cannot be undone.')) return;
      state = { flagged: {}, race: {} };
      step = 0;
      goto('intro');
    });

    document.getElementById('btn-print').addEventListener('click', function () {
      window.WinnxtExport.print();
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
    booted = true;

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
