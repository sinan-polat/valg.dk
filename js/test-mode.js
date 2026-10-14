/* Testpanel til brugertest. Aktiveres ved at åbne siden med ?test=1 (fx index.html?test=1).
   Panelet er til facilitatoren: viser opgave, måler tid/klik/sider/blindgyder, samler SEQ og noter
   og kan downloade alle resultater som CSV. Alt gemmes kun lokalt i browseren (localStorage) –
   ingen data sendes nogen steder, og der indsamles ingen personoplysninger (brug et anonymt deltager-id). */
(function () {
  'use strict';
  const TASKS = [
    { id: 'T1', group: 'Borger', text: 'Find ud af, hvor mange mandater Hørsholm Kommune fik ved Kommunalvalg 2025, og hvilket parti der fik flest.', answer: '19 mandater. Parti C (Det Konservative Folkeparti) fik flest (6).' },
    { id: 'T2', group: 'Journalist / analytiker', text: 'Sammenlign mandatfordelingen i Hørsholm og Ishøj ved Kommunalvalg 2025, og hent tallene, så du kan åbne dem i et regneark.', answer: 'Når sammenligningssiden for Hørsholm vs. Ishøj og henter CSV-filen.' },
    { id: 'T3', group: 'Kommunal medarbejder', text: 'Du arbejder i en kommune. Find vejledning til, hvordan resultatet indberettes efter optælling.', answer: 'Åbner artiklen "Optælling og indberetning".' },
    { id: 'T4', group: 'Borger / analytiker', text: 'Find ud af, hvilket parti der fik flest mandater i Ishøj, og om partiet fik flere eller færre mandater end ved valget i 2021.', answer: 'A (Socialdemokratiet) fik 9 mandater – ét færre end i 2021.' },
  ];
  const KEY = 'valgTestResults', PKEY = 'valgTestPid';
  const params = new URLSearchParams(location.search);
  if (params.get('test') === '1') { try { sessionStorage.setItem('valgTest', '1'); } catch (e) {} }
  let enabled = false;
  try { enabled = sessionStorage.getItem('valgTest') === '1'; } catch (e) { enabled = params.get('test') === '1'; }

  const S = { phase: 'idle', task: null, t0: 0, clicks: 0, routes: [], dead: 0, sorts: 0, exports: 0, searches: 0, secs: 0, outcome: '', seq: 0, note: '' };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
  const getPid = () => { try { return localStorage.getItem(PKEY) || 'P01'; } catch (e) { return 'P01'; } };
  const setPid = (v) => { try { localStorage.setItem(PKEY, v); } catch (e) {} };

  window.VLOG = function (type, detail) {
    if (!enabled || S.phase !== 'running') return;
    if (type === 'route') { if (S.routes[S.routes.length - 1] !== detail) S.routes.push(detail); }
    else if (type === 'dead') S.dead++;
    else if (type === 'sort') S.sorts++;
    else if (type === 'export') S.exports++;
    else if (type === 'search') S.searches++;
    updateMetrics();
  };
  window.VTEST_ENABLED = enabled;
  if (!enabled) return;

  let panel, timer;
  const $ = (s, r) => (r || panel).querySelector(s);
  const el = (t, a, ...k) => { const e = document.createElement(t); Object.entries(a || {}).forEach(([n, v]) => { if (n === 'class') e.className = v; else if (n.startsWith('on')) e.addEventListener(n.slice(2), v); else if (v != null) e.setAttribute(n, v); }); k.flat().forEach(x => e.append(x && x.nodeType ? x : document.createTextNode(x == null ? '' : x))); return e; };
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  const elapsed = () => S.phase === 'running' ? Math.round((Date.now() - S.t0) / 1000) : S.secs;

  function updateMetrics() {
    if (!panel) return;
    const m = $('#tm'); if (!m) return;
    m.querySelector('[data-k=t]').textContent = fmt(elapsed());
    m.querySelector('[data-k=c]').textContent = S.clicks;
    m.querySelector('[data-k=p]').textContent = Math.max(S.routes.length, 0);
    m.querySelector('[data-k=d]').textContent = S.dead;
  }

  function build() {
    panel = el('aside', { id: 'testpanel', 'aria-label': 'Testpanel (facilitator)' });
    document.body.append(panel);
    render();
  }

  function render() {
    const results = load();
    panel.innerHTML = '';
    const min = panel.dataset.min === 'true';
    const head = el('header', {}, 'Testpanel – facilitator', el('button', { 'aria-label': 'Fold panel ind/ud', onclick: () => { panel.dataset.min = panel.dataset.min === 'true' ? 'false' : 'true'; } }, '▾'));
    const body = el('div', { class: 'body' });
    panel.append(head, body);
    panel.dataset.min = min ? 'true' : 'false';

    body.append(el('div', { class: 'row' }, el('label', { for: 'pid', style: 'font-weight:600' }, 'Deltager'), el('input', { id: 'pid', value: getPid(), style: 'width:90px', oninput: (e) => setPid(e.target.value.trim() || 'P01') }),
      el('button', { class: 'tb', onclick: () => { const m = /(\d+)$/.exec(getPid()); const n = m ? String(+m[1] + 1).padStart(m[1].length, '0') : '02'; setPid('P' + n); render(); } }, 'Næste')));

    if (S.phase === 'idle') {
      body.append(el('div', { class: 'fine' }, 'Vælg opgave. Læs den højt for deltageren, og tryk Start. Tiden, klik, sider og blindgyder måles automatisk.'));
      TASKS.forEach(t => body.append(el('button', { class: 'tb' + (S.task === t.id ? ' sel' : ''), style: 'text-align:left', onclick: () => { S.task = t.id; render(); } }, `${t.id} – ${t.group}`)));
      const t = TASKS.find(x => x.id === S.task);
      if (t) {
        body.append(el('div', { class: 'task' }, el('b', {}, t.id + ' · opgave til deltager'), t.text));
        body.append(el('details', {}, el('summary', {}, 'Forventet svar (facilitator)'), el('div', { class: 'fine' }, t.answer)));
        body.append(el('button', { class: 'tb pri', onclick: startTask }, '▶ Start opgave (gå til forsiden)'));
      }
    } else if (S.phase === 'running') {
      const t = TASKS.find(x => x.id === S.task);
      body.append(el('div', { class: 'task' }, el('b', {}, t.id + ' · kører'), t.text));
      body.append(metricsEl());
      body.append(el('button', { class: 'tb pri', onclick: stopTask }, '■ Stop opgave'));
    } else if (S.phase === 'rating') {
      const t = TASKS.find(x => x.id === S.task);
      body.append(el('div', { class: 'task' }, el('b', {}, `${t.id} stoppet – ${fmt(S.secs)}`), 'Udfald og oplevet sværhed:'));
      body.append(metricsEl());
      const out = el('div', { class: 'row' });
      ['Lykkedes', 'Delvist', 'Mislykkedes'].forEach(o => out.append(el('button', { class: 'tb' + (S.outcome === o ? ' sel' : ''), onclick: () => { S.outcome = o; render(); } }, o)));
      body.append(out);
      body.append(el('div', { class: 'fine' }, 'SEQ: Hvor let eller svær var opgaven? (1 = meget svær, 7 = meget let)'));
      const seq = el('div', { class: 'seq' });
      for (let i = 1; i <= 7; i++) seq.append(el('button', { class: 'tb' + (S.seq === i ? ' sel' : ''), onclick: () => { S.seq = i; render(); } }, String(i)));
      body.append(seq);
      body.append(el('textarea', { id: 'note', rows: '3', placeholder: 'Noter: hvad sagde/gjorde deltageren? (think aloud)' }, S.note));
      body.append(el('button', { class: 'tb pri', onclick: saveTask }, 'Gem opgave'));
    }

    body.append(el('hr', { style: 'border:0;border-top:1px solid #D5DDE6;width:100%' }));
    body.append(el('div', { class: 'fine' }, `${results.length} opgave(r) gemt lokalt i denne browser.`));
    body.append(el('div', { class: 'row' },
      el('button', { class: 'tb', onclick: () => download(results) }, '⬇ Download CSV'),
      el('button', { class: 'tb', onclick: () => { if (confirm('Slet alle gemte testresultater i denne browser?')) { save([]); render(); } } }, 'Nulstil')));
    updateMetrics();
  }

  function metricsEl() {
    return el('div', { class: 'metrics', id: 'tm' },
      el('div', {}, el('b', { 'data-k': 't' }, '00:00'), 'tid'), el('div', {}, el('b', { 'data-k': 'c' }, '0'), 'klik'),
      el('div', {}, el('b', { 'data-k': 'p' }, '0'), 'sider'), el('div', {}, el('b', { 'data-k': 'd' }, '0'), 'blindgyder'));
  }

  function startTask() {
    Object.assign(S, { phase: 'running', t0: Date.now(), clicks: 0, routes: [], dead: 0, sorts: 0, exports: 0, searches: 0, secs: 0, outcome: '', seq: 0, note: '' });
    clearInterval(timer); timer = setInterval(updateMetrics, 500);
    render();
    if (location.hash === '#/' || location.hash === '' || location.hash === '#') { window.dispatchEvent(new HashChangeEvent('hashchange')); } else { location.hash = '#/'; }
    S.routes = ['#/'];
    updateMetrics();
  }
  function stopTask() { S.secs = elapsed(); S.phase = 'rating'; clearInterval(timer); render(); }
  function saveTask() {
    const t = TASKS.find(x => x.id === S.task);
    const note = $('#note') ? $('#note').value : S.note;
    const r = load();
    r.push({ deltager: getPid(), opgave: t.id, gruppe: t.group, udfald: S.outcome || '', seq: S.seq || '', sekunder: S.secs, klik: S.clicks, sider: S.routes.length, blindgyder: S.dead, sorteringer: S.sorts, eksporter: S.exports, soegninger: S.searches, note, rutesti: S.routes.join(' > '), tidspunkt: new Date().toISOString() });
    save(r);
    S.phase = 'idle'; S.task = null; render();
  }
  function download(rows) {
    if (!rows.length) { alert('Ingen resultater gemt endnu.'); return; }
    const cols = Object.keys(rows[0]);
    const esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
    const csv = '﻿' + [cols.join(';')].concat(rows.map(r => cols.map(c => esc(r[c])).join(';'))).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'testresultater-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.append(a); a.click(); a.remove();
  }

  document.addEventListener('click', (e) => {
    if (S.phase !== 'running' || (panel && panel.contains(e.target))) return;
    if (e.target.closest('a,button,summary,label.pill,li[role=option],input,select')) { S.clicks++; updateMetrics(); }
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
