/* Valg.dk – prototype til bachelorprojekt. Ren HTML/CSS/JS, ingen afhængigheder.
   Alle tal er EKSEMPELDATA (se tools/generate_data.py). Routing sker via #-adresser. */
(function () {
  'use strict';
  const D = window.DATA;
  const KOM = D.kommuner;
  const byId = Object.fromEntries(KOM.map(k => [k.id, k]));
  const ELS = D.elections;
  const main = document.getElementById('main');
  const log = (t, d) => { if (window.VLOG) window.VLOG(t, d); };
  const COL = ['#0B4FBF', '#E6732F', '#12998F'];
  const DEFAULT_VALG = 'kv2025';

  /* ---------- hjælpere ---------- */
  const fmtN = n => Math.round(n).toLocaleString('da-DK');
  const fmtP = (n, d = 1) => n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' %';
  const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toLocaleString('da-DK', { maximumFractionDigits: 1 });
  const norm = s => s.toLowerCase().replace(/aa/g, 'å').replace(/\s+kommune$/, '').trim();

  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return e;
  }
  const svgNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, ...kids) {
    const e = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    kids.flat().forEach(k => k != null && e.append(k.nodeType ? k : document.createTextNode(k)));
    return e;
  }
  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  function href(path, q) {
    const qs = q ? new URLSearchParams(Object.entries(q).filter(([, v]) => v != null && v !== '')).toString() : '';
    return '#' + path + (qs ? '?' + qs : '');
  }
  const icons = {
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    compare: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
    download: '<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5zM18 19v2H6"/>',
  };
  const icon = n => h('span', { class: 'ic', 'aria-hidden': 'true', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[n]}</svg>` });
  const crumb = (...items) => h('nav', { class: 'crumb', 'aria-label': 'Brødkrumme' }, items.map((it, i) => [i ? '  ›  ' : '', it.href ? h('a', { href: it.href }, it.t) : it.t]));

  function mapSvg() {
    return h('div', { class: 'map', 'aria-hidden': 'true', html: '<svg viewBox="0 0 300 330" fill="#C6D8EA"><path d="M70 10c30-8 55 10 58 40 3 25-12 40-8 62 4 22 22 34 14 62-8 28-34 46-52 40-24-8-34-40-30-70 3-24-18-34-20-62C30 52 44 18 70 10z"/><ellipse cx="170" cy="195" rx="30" ry="26"/><path d="M215 120c28-14 66 4 70 36 4 30-26 52-54 46-26-6-40-30-16-82z"/><circle cx="285" cy="215" r="9"/></svg>' });
  }

  /* ---------- søgeforslag (combobox) ---------- */
  let acSeq = 0;
  function autocomplete(input, getItems, onPick) {
    const id = 'ac' + (++acSeq);
    const ul = h('ul', { class: 'suggest', role: 'listbox', id, hidden: true });
    input.after(ul);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', id);
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');
    let items = [], idx = -1;
    function close() { ul.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); idx = -1; }
    function paint() {
      ul.innerHTML = '';
      items.forEach((it, i) => {
        const li = h('li', { role: 'option', id: id + '-' + i, 'aria-selected': String(i === idx) }, h('span', {}, h('strong', {}, it.label)), h('span', { class: 'meta' }, it.meta || ''));
        li.addEventListener('mousedown', e => { e.preventDefault(); pick(i); });
        ul.append(li);
      });
      if (!items.length && input.value.trim()) ul.append(h('li', { class: 'empty', role: 'option', 'aria-selected': 'false' }, 'Ingen forslag – tryk Enter for at søge alligevel'));
      ul.hidden = !ul.children.length;
      input.setAttribute('aria-expanded', String(!ul.hidden));
      if (idx >= 0) input.setAttribute('aria-activedescendant', id + '-' + idx);
    }
    function pick(i) { const it = items[i]; if (!it) return; close(); onPick(it); }
    input.addEventListener('input', () => { items = input.value.trim() ? getItems(input.value) : []; idx = -1; paint(); });
    input.addEventListener('focus', () => { if (input.value.trim()) { items = getItems(input.value); paint(); } });
    input.addEventListener('blur', () => setTimeout(close, 120));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!items.length) { items = getItems(input.value); } idx = Math.min(idx + 1, items.length - 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); paint(); }
      else if (e.key === 'Escape') close();
      else if (e.key === 'Enter') { if (idx >= 0) { e.preventDefault(); pick(idx); } else if (input.dataset.enter === 'first' && getItems(input.value)[0]) { e.preventDefault(); items = getItems(input.value); pick(0); } }
    });
  }
  function searchKommuner(q) {
    const n = norm(q); if (!n) return [];
    const starts = KOM.filter(k => norm(k.name).startsWith(n));
    const incl = KOM.filter(k => !norm(k.name).startsWith(n) && norm(k.name).includes(n));
    return starts.concat(incl).slice(0, 7).map(k => ({ type: 'kommune', id: k.id, label: k.name + ' Kommune', meta: k.region.replace('Region ', '') }));
  }
  function searchAll(q) {
    const n = q.toLowerCase().trim();
    const els = Object.entries(ELS).filter(([, e]) => e.name.toLowerCase().includes(n) || (n.length > 3 && 'kommunalvalg'.startsWith(n))).map(([id, e]) => ({ type: 'valg', id, label: e.name, meta: 'Valg' }));
    return searchKommuner(q).concat(els).slice(0, 8);
  }

  /* ---------- data-hjælpere ---------- */
  function partyRows(k, valg) {
    const R = k.results[valg];
    const prev = ELS[valg].prev ? k.results[ELS[valg].prev] : null;
    return Object.keys(R.votes).filter(p => R.votes[p] > 0).map(p => ({
      p, name: D.parties[p].name, color: D.parties[p].color, votes: R.votes[p], share: R.votes[p] / R.valid * 100,
      m: R.mandates[p] || 0, d: prev ? (R.mandates[p] || 0) - (prev.mandates[p] || 0) : null,
    }));
  }
  const sortRows = (rows, mode) => rows.slice().sort(mode === 'alpha'
    ? (a, b) => a.p.localeCompare(b.p, 'da')
    : (a, b) => b.m - a.m || b.votes - a.votes || a.p.localeCompare(b.p, 'da'));
  function csv(head, rows, { sep = ';', dec = ',' } = {}) {
    const q = v => { if (typeof v === 'number') return String(v).replace('.', dec); return '"' + String(v).replace(/"/g, '""') + '"'; };
    return '﻿' + [head.map(q).join(sep)].concat(rows.map(r => r.map(q).join(sep))).join('\r\n');
  }
  function download(name, text) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })), download: name });
    document.body.append(a); a.click(); a.remove();
    log('export', name);
  }
  const slugName = k => k.id;

  /* ---------- forside ---------- */
  function home() {
    document.title = 'valg.dk – prototype';
    const el = h('div', { class: 'page wrap' });
    const inp = h('input', { type: 'text', id: 'q', placeholder: 'Søg kommune, kandidat, parti eller valg …', 'aria-label': 'Søg på valg.dk', 'data-enter': 'first' });
    const go = () => {
      const v = inp.value.trim(); if (!v) return;
      const f = searchAll(v)[0];
      log('search', v);
      if (f) pickSearch(f); else location.hash = href('/ikke-med', { side: 'Søgning efter «' + v + '»' });
    };
    function pickSearch(it) { log('search', it.label); location.hash = it.type === 'kommune' ? href('/resultat/' + it.id, { valg: DEFAULT_VALG }) : href('/find', { valg: it.id }); }
    const form = h('form', { class: 'search', role: 'search', onsubmit: e => { e.preventDefault(); go(); } },
      h('div', { class: 'box' }, inp, h('button', { class: 'btn', type: 'submit' }, 'Søg')),
      h('p', { class: 'hint' }, 'Fx København, Hørsholm eller Kommunalvalg 2025'));
    el.append(h('div', { class: 'hero' }, h('div', {}, h('p', { class: 'eyebrow' }, 'Officielle valgresultater i Danmark'), h('h1', {}, 'Velkommen til valg.dk'),
      h('p', { class: 'lead' }, 'Find resultater, sammenlign tal og få vejledning – uanset hvilket valg det handler om.'), h('div', { style: 'margin-top:28px' }, form)), mapSvg()));
    autocomplete(inp, searchAll, pickSearch);

    el.append(h('section', { class: 'section', 'aria-labelledby': 'h-task' }, h('h2', { id: 'h-task' }, 'Hvad vil du gerne?'),
      h('div', { class: 'cards' },
        h('a', { class: 'card', href: '#/find' }, icon('pin'), h('h3', {}, 'Find resultatet for din kommune'), h('p', {}, 'Se hvordan der blev stemt hos dig'), h('span', { class: 'chev', 'aria-hidden': 'true' }, '›')),
        h('a', { class: 'card', href: '#/sammenlign' }, icon('compare'), h('h3', {}, 'Sammenlign valg og områder'), h('p', {}, 'Sæt to eller flere kommuner side om side'), h('span', { class: 'chev', 'aria-hidden': 'true' }, '›')),
        h('a', { class: 'card', href: href('/sammenlign', { fokus: 'eksport' }) }, icon('download'), h('h3', {}, 'Hent tal og data'), h('p', {}, 'Download tal til dit eget arbejde'), h('span', { class: 'chev', 'aria-hidden': 'true' }, '›')),
        h('a', { class: 'card', href: '#/vejledning' }, icon('book'), h('h3', {}, 'Få vejledning til valgarbejdet'), h('p', {}, 'Procedurer og praktisk information'), h('span', { class: 'chev', 'aria-hidden': 'true' }, '›')))));

    const tot = (v) => KOM.reduce((a, k) => ({ cast: a.cast + k.results[v].cast, el: a.el + k.results[v].electorate }), { cast: 0, el: 0 });
    const t25 = tot('kv2025'), t21 = tot('kv2021');
    const turn = t25.cast / t25.el * 100, dturn = turn - t21.cast / t21.el * 100;
    const mand = KOM.reduce((a, k) => a + k.seats, 0);
    const sel = h('select', { class: 'select', id: 'pickK', 'aria-label': 'Vælg kommune' }, h('option', { value: '' }, 'Vælg kommune …'), KOM.map(k => h('option', { value: k.id }, k.name)));
    sel.addEventListener('change', () => { if (sel.value) location.hash = href('/resultat/' + sel.value, { valg: DEFAULT_VALG }); });
    el.append(h('section', { class: 'section', 'aria-labelledby': 'h-latest' }, h('div', { class: 'panel tint latest' },
      h('div', {}, h('p', { class: 'eyebrow' }, 'Seneste valg'), h('h2', { id: 'h-latest' }, ELS.kv2025.name), h('p', { style: 'margin:8px 0 18px' }, ELS.kv2025.date + ' · Endeligt resultat'),
        h('a', { class: 'btn', href: '#/find' }, 'Se valgresultater  →')),
      h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Stemmeprocent'), h('div', { class: 'val' }, fmtP(turn)), h('div', { class: 'sub' + (dturn < 0 ? ' neg' : '') }, sgn(dturn) + ' %-point ift. 2021')),
      h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Optælling'), h('div', { class: 'val' }, '100 %'), h('div', { class: 'sub' }, `Færdig · ${fmtN(mand)} byrådsmandater`)),
      h('div', { class: 'pick' }, h('label', { for: 'pickK' }, 'Se resultater i din kommune'), sel))));

    const accData = [
      ['Kommunalvalg', 'Find resultater fra kommunalvalg i hele Danmark', [h('a', { href: href('/find', { valg: 'kv2025' }) }, 'Kommunalvalg 2025'), h('a', { href: href('/find', { valg: 'kv2021' }) }, 'Kommunalvalg 2021')]],
      ['Regionsrådsvalg', 'Find resultater fra regionsrådsvalg i hele Danmark', null],
      ['Europa-Parlamentsvalg', 'Find resultater fra Europa-Parlamentsvalg i Danmark', null],
      ['Folkeafstemning', 'Find resultater fra folkeafstemninger i Danmark', null],
    ];
    const acc = h('div', { class: 'acc' });
    accData.forEach(([t, d, links], i) => {
      const bid = 'acc-b' + i, pid = 'acc-p' + i;
      const item = h('div', { class: 'acc-item', 'data-open': 'false' });
      const btn = h('button', { type: 'button', id: bid, 'aria-expanded': 'false', 'aria-controls': pid }, h('span', { class: 't' }, t), h('span', { class: 'd' }, d), h('span', { class: 'pm', 'aria-hidden': 'true' }, '+'));
      const body = h('div', { class: 'acc-body', id: pid, role: 'region', 'aria-labelledby': bid }, h('div', {}, h('div', { class: 'in' },
        links || [h('p', {}, 'Resultater fra dette valg er ikke med i prototypen.'), h('a', { href: href('/ikke-med', { side: t }) }, 'Læs mere')])));
      btn.addEventListener('click', () => { const o = item.dataset.open !== 'true'; item.dataset.open = String(o); btn.setAttribute('aria-expanded', String(o)); });
      item.append(btn, body); acc.append(item);
    });
    el.append(h('section', { class: 'section', 'aria-labelledby': 'h-oth' },
      h('div', { style: 'display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:18px' }, h('h2', { id: 'h-oth' }, 'Andre valgtyper'), h('a', { href: '#/find', style: 'font-weight:600' }, 'Se alle valgresultater  →')), acc));
    return el;
  }

  /* ---------- find resultat (borger) ---------- */
  function find(parts, q) {
    document.title = 'Find resultat – valg.dk (prototype)';
    let valg = ELS[q.valg] ? q.valg : DEFAULT_VALG;
    const inp = h('input', { type: 'text', id: 'area', placeholder: 'Skriv kommunens navn …', 'aria-label': 'Søg efter område', 'data-enter': 'first' });
    const err = h('p', { class: 'error', role: 'alert', hidden: true });
    function pick(it) { log('search', it.label); location.hash = href('/resultat/' + it.id, { valg }); }
    autocomplete(inp, searchKommuner, pick);
    const form = h('form', { class: 'search', role: 'search', onsubmit: e => { e.preventDefault(); const f = searchKommuner(inp.value)[0]; if (f) pick(f); else { err.hidden = false; err.textContent = 'Vi kan ikke finde «' + inp.value + '». Prøv fx Hørsholm eller Aarhus.'; log('search', inp.value + ' (ingen)'); } } },
      h('div', { class: 'box' }, inp, h('button', { class: 'btn', type: 'submit' }, 'Søg')));
    const chips = h('div', { class: 'pills', role: 'radiogroup', 'aria-label': 'Vælg valg' }, Object.entries(ELS).map(([id, e]) =>
      h('label', { class: 'pill' }, h('input', { type: 'radio', name: 'valg', value: id, checked: id === valg, onchange: () => { valg = id; history.replaceState(null, '', href('/find', { valg })); } }), h('span', {}, e.name))));
    const often = ['kobenhavn', 'aarhus', 'odense', 'aalborg', 'horsholm'].map(id => byId[id]);
    const regions = [...new Set(KOM.map(k => k.region))];
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Find resultat' }),
      h('h1', {}, 'Find dit valgresultat'), h('p', { class: 'lead' }, 'Vælg først valg, og søg derefter på din kommune.'),
      h('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:40px;margin-top:30px;align-items:start' , class: 'findgrid' },
        h('div', { class: 'steps', style: 'margin-top:0' },
          h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '1'), 'Vælg valg'), chips),
          h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '2'), 'Søg efter område'), form, err),
          h('div', { class: 'step' }, h('div', { class: 'lab' }, 'Eller find din kommune via region'),
            regions.map(r => h('details', { class: 'panel', style: 'padding:14px 20px;margin-bottom:10px' }, h('summary', { style: 'cursor:pointer;font-weight:700' }, r),
              h('p', { style: 'margin-top:12px;display:flex;flex-wrap:wrap;gap:6px 22px' }, KOM.filter(k => k.region === r).map(k => h('a', { href: href('/resultat/' + k.id, { valg }), onclick: () => { } }, k.name))))))),
        h('aside', { class: 'panel' }, h('h3', { style: 'margin-bottom:14px' }, 'Ofte søgte områder'),
          h('div', { class: 'list' }, often.map(k => h('a', { href: href('/resultat/' + k.id, { valg }), style: 'padding:12px 16px' }, k.name + '  ›'))))));
  }

  /* ---------- kommuneresultat (borger) ---------- */
  function resultat(parts, q) {
    const k = byId[parts[1]];
    if (!k) return ikkeMed([], { side: 'Ukendt område' });
    const valg = ELS[q.valg] ? q.valg : DEFAULT_VALG;
    let sort = q.sort === 'alpha' ? 'alpha' : 'size';
    const R = k.results[valg], prevId = ELS[valg].prev, P = prevId ? k.results[prevId] : null;
    document.title = `${k.name} Kommune – ${ELS[valg].name} – valg.dk (prototype)`;
    const rows0 = partyRows(k, valg);
    const maxM = Math.max(...rows0.map(r => r.m), 1);
    const el = h('div', { class: 'page wrap' });
    el.append(crumb({ t: 'Forside', href: '#/' }, { t: 'Find resultat', href: href('/find', { valg }) }, { t: k.name + ' Kommune' }));
    el.append(h('div', { class: 'titlerow' }, h('h1', {}, k.name + ' Kommune'), h('span', { class: 'badge' }, 'Endeligt resultat')));
    el.append(h('p', { class: 'lead' }, `${ELS[valg].name} · ${ELS[valg].date} · ${k.region}`));
    el.append(h('div', { class: 'pills', style: 'margin-top:20px', role: 'group', 'aria-label': 'Skift valg' }, Object.entries(ELS).map(([id, e]) =>
      h('a', { class: 'pill' + (id === valg ? ' active' : ''), href: href('/resultat/' + k.id, { valg: id, sort }), 'aria-current': id === valg ? 'true' : null }, e.name))));
    const dT = P ? R.turnout - P.turnout : null;
    el.append(h('section', { class: 'panel', style: 'margin-top:26px', 'aria-label': 'Nøgletal' },
      h('div', { class: 'kpis', style: 'margin-top:0' },
        h('div', { class: 'stat main' }, h('div', { class: 'lbl' }, 'Mandater i alt'), h('div', { class: 'val' }, String(k.seats))),
        h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Stemmeprocent'), h('div', { class: 'val' }, fmtP(R.turnout))),
        h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Ændring ift. forrige valg'), h('div', { class: 'val' }, dT == null ? '–' : sgn(dT) + ' %-point')),
        h('div', { class: 'stat' }, h('div', { class: 'lbl' }, 'Afgivne stemmer'), h('div', { class: 'val' }, fmtN(R.cast)))),
      (() => {
        const seg = sortRows(rows0, 'size').filter(r => r.m > 0);
        const bar = h('div', { class: 'mbar', role: 'img', 'aria-label': 'Mandatfordeling: ' + seg.map(r => `${r.p} ${r.m}`).join(', ') },
          seg.map(r => h('span', { style: `flex:${r.m} 1 0;background:${r.color}`, title: `${r.p} – ${r.name}: ${r.m} mandater` }, r.m >= 2 ? r.p : '')));
        const leg = h('div', { class: 'legend' }, seg.map(r => h('span', {}, h('i', { style: `background:${r.color}` }), `${r.p} ${r.name} (${r.m})`)));
        return h('div', {}, bar, leg);
      })()));

    const tbody = h('tbody');
    function rowEl(r) {
      return h('tr', { class: 'row', 'data-key': r.p },
        h('td', {}, h('span', { class: 'pletter', style: `background:${r.color}`, 'aria-hidden': 'true' }, r.p), r.name),
        h('td', { class: 'num' }, fmtN(r.votes)), h('td', { class: 'num' }, fmtP(r.share)),
        h('td', {}, h('div', { class: 'bar' }, h('i', { style: `width:${Math.max(r.m / maxM * 180, r.m ? 6 : 0)}px;background:${r.color}` }), h('strong', {}, String(r.m)))),
        P ? h('td', { class: 'num' }, h('span', { class: 'delta ' + (r.d > 0 ? 'up' : r.d < 0 ? 'down' : 'zero'), 'aria-label': r.d === 0 ? 'uændret' : (r.d > 0 ? r.d + ' flere' : -r.d + ' færre') }, r.d === 0 ? '0' : (r.d > 0 ? '▲ +' + r.d : '▼ −' + (-r.d)))) : null);
    }
    sortRows(rows0, sort).forEach(r => tbody.append(rowEl(r)));
    const bSize = h('button', { class: 'pill', type: 'button', 'aria-pressed': String(sort === 'size') }, 'Størst først');
    const bAlpha = h('button', { class: 'pill', type: 'button', 'aria-pressed': String(sort === 'alpha') }, 'A–Å');
    const live = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    function setSort(m) {
      if (m === sort) return; sort = m; log('sort', m);
      bSize.setAttribute('aria-pressed', String(m === 'size')); bAlpha.setAttribute('aria-pressed', String(m === 'alpha'));
      history.replaceState(null, '', href('/resultat/' + k.id, { valg, sort }));
      const rows = [...tbody.children], first = new Map(rows.map(r => [r.dataset.key, r.getBoundingClientRect().top]));
      sortRows(rows0, m).forEach(r => tbody.append(rows.find(x => x.dataset.key === r.p)));
      rows.forEach(r => { const dy = first.get(r.dataset.key) - r.getBoundingClientRect().top; if (dy) { r.style.transition = 'none'; r.style.transform = `translateY(${dy}px)`; requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transition = ''; r.style.transform = ''; })); } });
      live.textContent = m === 'size' ? 'Sorteret efter størst først' : 'Sorteret alfabetisk efter partibogstav';
    }
    bSize.addEventListener('click', () => setSort('size')); bAlpha.addEventListener('click', () => setSort('alpha'));
    const exportRows = () => sortRows(rows0, sort).map(r => [r.p, r.name, r.votes, +r.share.toFixed(2), r.m].concat(P ? [r.d] : []));
    const exHead = ['Parti', 'Partinavn', 'Stemmer', 'Andel (%)', 'Mandater'].concat(P ? ['Ændring i mandater ift. ' + ELS[prevId].name] : []);
    const fname = ext => `valgresultat-${k.id}-${valg}${ext}`;
    el.append(h('div', { class: 'toolbar' }, h('span', { class: 'lab', id: 'sortlab' }, 'Sortér partier'), h('div', { class: 'pills', role: 'group', 'aria-labelledby': 'sortlab' }, bSize, bAlpha), h('span', { class: 'spacer' }),
      h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(fname('.csv'), csv(exHead, exportRows(), { sep: ';', dec: ',' })) }, '⬇ Hent til Excel'),
      h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(fname('-data.csv'), csv(exHead, exportRows(), { sep: ',', dec: '.' })) }, '⬇ CSV (UTF-8)')));
    el.append(live);
    el.append(h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, `Resultat for ${k.name} Kommune, ${ELS[valg].name}`),
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Parti'), h('th', { scope: 'col', class: 'num' }, 'Stemmer'), h('th', { scope: 'col', class: 'num' }, 'Andel'), h('th', { scope: 'col' }, 'Mandater'), P ? h('th', { scope: 'col', class: 'num' }, 'Ændring') : null)), tbody)));
    el.append(h('div', { class: 'panel tint section cta' }, h('div', {}, h('h2', { style: 'font-size:22px' }, 'Vil du sammenligne med en anden kommune?'), h('p', { style: 'color:var(--muted);margin-top:6px' }, 'Sæt områder side om side og hent tallene som regneark.')),
      h('a', { class: 'btn', href: href('/sammenlign', { a: k.id, valg }) }, 'Sammenlign områder  →')));
    el.append(h('p', { class: 'source' }, 'Kilde: eksempeldata i prototypen – ikke officielle valgresultater.'));
    return el;
  }

  /* ---------- sammenlign: opsætning ---------- */
  const MAAL = { mandater: 'Mandater', stemmeandel: 'Stemmeprocent pr. parti', valgdeltagelse: 'Valgdeltagelse', aendring: 'Ændring ift. forrige valg' };
  function sammenlign(parts, q) {
    if (parts[1] === 'resultat') return sammenlignRes(q);
    document.title = 'Sammenlign valgdata – valg.dk (prototype)';
    let valg = ELS[q.valg] ? q.valg : DEFAULT_VALG, maal = MAAL[q.maal] ? q.maal : 'mandater';
    const startNames = [q.a, q.b, q.c].filter(x => x !== undefined).map(id => byId[id] ? byId[id].name : '');
    const names = startNames.length >= 2 ? startNames : startNames.concat(['', '']).slice(0, 2);
    const areaBox = h('div', { class: 'areas' });
    const err = h('p', { class: 'error', role: 'alert', hidden: true });
    function drawAreas() {
      const vals = [...areaBox.querySelectorAll('input')].map(i => i.value); vals.forEach((v, i) => names[i] = v);
      areaBox.innerHTML = '';
      names.forEach((n, i) => {
        const inp = h('input', { type: 'text', id: 'area' + i, value: n, placeholder: 'Skriv kommune …', 'data-enter': 'first', 'aria-label': 'Område ' + (i + 1) });
        const f = h('div', { class: 'field' }, h('label', { for: 'area' + i }, 'Område ' + (i + 1)), inp);
        if (names.length > 2 && i === 2) f.append(h('button', { type: 'button', class: 'rm', 'aria-label': 'Fjern område 3', onclick: () => { names.pop(); drawAreas(); } }, '×'));
        areaBox.append(f);
        autocomplete(inp, searchKommuner, it => { inp.value = it.label.replace(/ Kommune$/, ''); names[i] = inp.value; });
      });
    }
    drawAreas();
    const add = h('button', { type: 'button', class: 'linkbtn', onclick: () => { if (names.length < 3) { names.push(''); drawAreas(); } add.hidden = names.length >= 3; } }, '+ Tilføj område');
    const valgBox = h('div', { class: 'pills', role: 'radiogroup', 'aria-label': 'Vælg valg' });
    const maalBox = h('div', { class: 'pills', role: 'radiogroup', 'aria-label': 'Hvad vil du sammenligne?' });
    function drawMaal() {
      maalBox.innerHTML = '';
      Object.entries(MAAL).forEach(([id, t]) => {
        const dis = id === 'aendring' && !ELS[valg].prev;
        maalBox.append(h('label', { class: 'pill', title: dis ? 'Kræver et tidligere valg – vælg ' + ELS.kv2025.name : null }, h('input', { type: 'radio', name: 'maal', value: id, checked: id === maal && !dis, disabled: dis, onchange: () => { maal = id; } }), h('span', {}, t)));
      });
    }
    Object.entries(ELS).forEach(([id, e]) => valgBox.append(h('label', { class: 'pill' }, h('input', { type: 'radio', name: 'valg', value: id, checked: id === valg, onchange: () => { valg = id; if (!ELS[valg].prev && maal === 'aendring') maal = 'mandater'; drawMaal(); } }), h('span', {}, e.name))));
    drawMaal();
    function submit(e) {
      e.preventDefault();
      const vals = [...areaBox.querySelectorAll('input')].map(i => i.value.trim());
      const ids = vals.map(v => { const n = norm(v); const k = KOM.find(k => norm(k.name) === n); return k ? k.id : null; });
      const bad = vals.findIndex((v, i) => !ids[i]);
      err.hidden = false;
      if (bad >= 0) { err.textContent = vals[bad] ? `Vi kan ikke finde «${vals[bad]}». Vælg en kommune fra forslagene.` : `Vælg et område i felt ${bad + 1}.`; return; }
      if (new Set(ids).size !== ids.length) { err.textContent = 'Vælg to forskellige områder.'; return; }
      err.hidden = true;
      location.hash = href('/sammenlign/resultat', { a: ids[0], b: ids[1], c: ids[2], valg, maal });
    }
    const form = h('form', { class: 'steps', onsubmit: submit, novalidate: true },
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '1'), 'Vælg områder'), areaBox, h('div', { style: 'margin-top:12px' }, add)),
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '2'), 'Vælg valg'), valgBox),
      h('div', { class: 'step' }, h('div', { class: 'lab' }, h('b', {}, '3'), 'Hvad vil du sammenligne?'), maalBox),
      h('div', {}, h('button', { class: 'btn', type: 'submit' }, 'Vis sammenligning  →'), err));
    const recents = [['kobenhavn', 'aarhus', 'København vs. Aarhus', 'Kommunalvalg 2025 · i går'], ['odense', 'aalborg', 'Odense vs. Aalborg', 'Kommunalvalg 2025 · for 3 dage siden']];
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Tal og data' }, { t: 'Sammenlign' }),
      h('h1', {}, 'Sammenlign valgdata'), h('p', { class: 'lead' }, 'Sæt områder og valg side om side – og hent tallene bagefter.'),
      q.fokus === 'eksport' ? h('p', { class: 'panel', style: 'margin-top:20px;max-width:760px;background:var(--soft);box-shadow:none' }, 'Vælg områder og valg nedenfor. Når sammenligningen vises, kan du hente tallene som Excel eller CSV.') : null,
      form,
      h('section', { class: 'panel', style: 'margin-top:44px;max-width:1000px', 'aria-labelledby': 'h-rec' }, h('h2', { id: 'h-rec', style: 'font-size:22px' }, 'Seneste sammenligninger'),
        h('div', { class: 'recent' }, recents.map(r => h('a', { href: href('/sammenlign/resultat', { a: r[0], b: r[1], valg: 'kv2025', maal: 'mandater' }) }, h('span', {}, r[2]), h('small', {}, r[3]))))));
  }

  /* ---------- sammenlign: resultat ---------- */
  function niceStep(r) { const p = Math.pow(10, Math.floor(Math.log10(r))); const n = r / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function barChart({ cats, series, decimals = 0, unit = '' }) {
    const W = 1100, H = 440, ml = 56, mr = 16, mt = 24, mb = 66;
    const all = series.flatMap(x => x.values);
    let vmin = Math.min(0, ...all), vmax = Math.max(0, ...all); if (vmax === vmin) vmax = vmin + 1;
    const step = niceStep((vmax - vmin) / 5);
    vmax = Math.ceil(vmax / step) * step; vmin = Math.floor(vmin / step) * step;
    const y = v => mt + (H - mt - mb) * (1 - (v - vmin) / (vmax - vmin));
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Søjlediagram: ' + cats.join(', ') });
    for (let t = vmin; t <= vmax + 1e-9; t += step) {
      svg.append(s('line', { x1: ml, x2: W - mr, y1: y(t), y2: y(t), stroke: t === 0 ? '#9AA7B5' : '#E3E9EF', 'stroke-width': t === 0 ? 1.5 : 1 }));
      svg.append(s('text', { x: ml - 10, y: y(t) + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#5B6877' }, t.toLocaleString('da-DK', { maximumFractionDigits: 1 })));
    }
    const gw = (W - ml - mr) / cats.length, bw = Math.min(46, gw * 0.8 / series.length);
    cats.forEach((c, i) => {
      const gx = ml + gw * i + (gw - bw * series.length - 4 * (series.length - 1)) / 2;
      series.forEach((se, j) => {
        const v = se.values[i], x = gx + j * (bw + 4), y0 = y(0), y1 = y(v);
        const rect = s('rect', { class: 'bar-rect', x, y: Math.min(y0, y1), width: bw, height: Math.max(Math.abs(y1 - y0), v === 0 ? 2 : 0), rx: 4, fill: se.color, style: `animation-delay:${(i * series.length + j) * 25}ms` });
        rect.append(s('title', {}, `${se.name} – ${c}: ${v.toLocaleString('da-DK', { maximumFractionDigits: decimals })}${unit}`));
        svg.append(rect);
        svg.append(s('text', { x: x + bw / 2, y: (v >= 0 ? Math.min(y0, y1) - 6 : Math.max(y0, y1) + 15), 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: '#0F1C2E' }, v.toLocaleString('da-DK', { maximumFractionDigits: decimals })));
      });
      svg.append(s('text', { x: ml + gw * i + gw / 2, y: H - 20, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#0F1C2E' }, c.length > 14 ? c.slice(0, 13) + '…' : c));
    });
    return svg;
  }
  function sammenlignRes(q) {
    const ids = [q.a, q.b, q.c].filter(id => id && byId[id]);
    if (ids.length < 2) { setTimeout(() => { location.replace(href('/sammenlign', {})); }, 0); return h('div', { class: 'page wrap' }, 'Vælg mindst to områder …'); }
    const valg = ELS[q.valg] ? q.valg : DEFAULT_VALG;
    let maal = MAAL[q.maal] ? q.maal : 'mandater'; if (maal === 'aendring' && !ELS[valg].prev) maal = 'mandater';
    const areas = ids.map((id, i) => ({ k: byId[id], R: byId[id].results[valg], P: ELS[valg].prev ? byId[id].results[ELS[valg].prev] : null, color: COL[i] }));
    const title = areas.map(a => a.k.name).join(' vs. ');
    document.title = `${title} – valg.dk (prototype)`;
    const pOrder = Object.keys(D.parties).filter(p => areas.some(a => a.R.votes[p] > 0 || (a.R.mandates[p] || 0) > 0));
    const mand = (a, p) => a.R.mandates[p] || 0, vot = (a, p) => (a.R.votes[p] || 0) / a.R.valid * 100;
    let cats, series, decimals = 0, unit = '', head, rows, fmt;
    if (maal === 'valgdeltagelse') {
      cats = ['Valgdeltagelse']; decimals = 1; unit = ' %';
      series = areas.map(a => ({ name: a.k.name, color: a.color, values: [a.R.turnout] }));
      head = ['Område', 'Valgberettigede', 'Afgivne stemmer', 'Valgdeltagelse (%)'].concat(areas[0].P ? ['Forrige valg (%)', 'Ændring (%-point)'] : []);
      rows = areas.map(a => [a.k.name, a.R.electorate, a.R.cast, a.R.turnout].concat(a.P ? [a.P.turnout, +(a.R.turnout - a.P.turnout).toFixed(1)] : []));
      fmt = (v, c) => c === 0 ? v : c === 1 || c === 2 ? fmtN(v) : c === 5 ? sgn(v) : fmtP(v);
    } else {
      const val = maal === 'mandater' ? (a, p) => mand(a, p) : maal === 'stemmeandel' ? (a, p) => +vot(a, p).toFixed(1) : (a, p) => mand(a, p) - (a.P ? (a.P.mandates[p] || 0) : 0);
      const order = pOrder.slice().sort((x, y) => areas.reduce((t, a) => t + Math.abs(val(a, y)), 0) - areas.reduce((t, a) => t + Math.abs(val(a, x)), 0) || x.localeCompare(y, 'da'));
      if (maal !== 'stemmeandel') { const keep = order.filter(p => areas.some(a => val(a, p) !== 0)); order.length = 0; order.push(...keep); }
      cats = order; decimals = maal === 'stemmeandel' ? 1 : 0; unit = maal === 'stemmeandel' ? ' %' : '';
      series = areas.map(a => ({ name: a.k.name, color: a.color, values: order.map(p => val(a, p)) }));
      head = ['Parti', 'Partinavn'].concat(areas.map(a => a.k.name + (maal === 'stemmeandel' ? ' (%)' : maal === 'aendring' ? ' (ændring)' : ' (mandater)'))).concat(areas.length === 2 ? ['Forskel'] : []);
      rows = order.map((p, i) => [p, D.parties[p].name].concat(areas.map((a, j) => series[j].values[i])).concat(areas.length === 2 ? [+(series[0].values[i] - series[1].values[i]).toFixed(1)] : []));
      fmt = (v, c) => (typeof v === 'string') ? v : (c === rows[0].length - 1 && areas.length === 2) ? sgn(v) : maal === 'stemmeandel' ? fmtP(v) : maal === 'aendring' ? sgn(v) : String(v);
    }
    const key = { mandater: 'mandater', stemmeandel: 'stemmeandel', valgdeltagelse: 'valgdeltagelse', aendring: 'aendring' }[maal];
    const el = h('div', { class: 'page wrap' });
    el.append(crumb({ t: 'Forside', href: '#/' }, { t: 'Tal og data', href: '#/sammenlign' }, { t: 'Sammenlign', href: href('/sammenlign', { a: ids[0], b: ids[1], c: ids[2], valg, maal }) }, { t: 'Resultat' }));
    el.append(h('h1', {}, title));
    el.append(h('p', { class: 'lead' }, `${ELS[valg].name} · ${MAAL[maal]} · Eksempeldata`));
    const links = (mk, cur, entries, paramName) => h('div', { class: 'pills', style: 'margin-top:18px' }, entries.map(([id, t, dis]) => dis ? h('span', { class: 'pill', 'aria-disabled': 'true', title: 'Kræver et tidligere valg' }, t) : h('a', { class: 'pill' + (id === cur ? ' active' : ''), 'aria-current': id === cur ? 'true' : null, href: href('/sammenlign/resultat', Object.assign({ a: ids[0], b: ids[1], c: ids[2], valg, maal }, { [paramName]: id })) }, t)));
    el.append(links(null, valg, Object.entries(ELS).map(([id, e]) => [id, e.name]), 'valg'));
    el.append(links(null, maal, Object.entries(MAAL).map(([id, t]) => [id, t, id === 'aendring' && !ELS[valg].prev]), 'maal'));
    el.append(h('div', { class: 'areacards' }, areas.map(a => h('div', { class: 'areacard' }, h('i', { style: `background:${a.color}`, 'aria-hidden': 'true' }), h('div', {}, h('div', { class: 'n' }, a.k.name + ' Kommune'), h('div', { class: 'v' }, a.k.seats + ' mandater'), h('div', { class: 'n' }, 'Valgdeltagelse ' + fmtP(a.R.turnout)))))));
    const chartPanel = h('div', { class: 'chart' }, h('div', { class: 'chart-legend' }, areas.map(a => h('span', {}, h('i', { style: `background:${a.color}` }), a.k.name))), barChart({ cats, series, decimals, unit }));
    const tablePanel = h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' }, h('caption', { class: 'sr-only' }, `${MAAL[maal]} – ${title}`),
      h('thead', {}, h('tr', {}, head.map((t, i) => h('th', { scope: 'col', class: (maal === 'valgdeltagelse' ? i > 0 : i > 1) ? 'num' : '' }, t)))),
      h('tbody', {}, rows.map(r => h('tr', {}, r.map((v, c) => h('td', { class: (maal === 'valgdeltagelse' ? c > 0 : c > 1) ? 'num' : '' }, (maal !== 'valgdeltagelse' && c === 0) ? [h('span', { class: 'pletter', style: `background:${D.parties[v].color}`, 'aria-hidden': 'true' }, v)] : fmt(v, c))))))));
    const bBars = h('button', { class: 'pill', type: 'button', 'aria-pressed': 'true' }, 'Søjler');
    const bTab = h('button', { class: 'pill', type: 'button', 'aria-pressed': 'false' }, 'Tabel');
    tablePanel.hidden = true;
    const show = v => { bBars.setAttribute('aria-pressed', String(v === 'bars')); bTab.setAttribute('aria-pressed', String(v === 'table')); chartPanel.hidden = v !== 'bars'; tablePanel.hidden = v !== 'table'; log('view', v); };
    bBars.addEventListener('click', () => show('bars')); bTab.addEventListener('click', () => show('table'));
    const fname = ext => `sammenligning-${ids.join('-')}-${valg}-${key}${ext}`;
    el.append(h('div', { class: 'toolbar' }, h('div', { class: 'pills', role: 'group', 'aria-label': 'Visning' }, bBars, bTab), h('span', { class: 'spacer' }),
      h('button', { class: 'btn small', type: 'button', onclick: () => download(fname('.csv'), csv(head, rows, { sep: ';', dec: ',' })) }, '⬇ Hent som Excel'),
      h('button', { class: 'btn secondary small', type: 'button', onclick: () => download(fname('-data.csv'), csv(head, rows, { sep: ',', dec: '.' })) }, '⬇ CSV (UTF-8)')));
    el.append(chartPanel, tablePanel);
    el.append(h('p', { class: 'source' }, 'Kilde: eksempeldata i prototypen – ikke officielle valgresultater. ', h('a', { href: href('/sammenlign', { a: ids[0], b: ids[1], c: ids[2], valg, maal }) }, 'Skift områder eller valg')));
    return el;
  }

  /* ---------- vejledning (kommunal medarbejder) ---------- */
  const ART = {
    foer: { t: 'Før valget', d: 'Kandidatlister, frister og forberedelse', lead: 'Overblik over opgaver og frister, inden valget udskrives.', steps: [['Planlæg valgforløbet', 'Fastlæg tidsplan, ansvarlige og vigtige frister i kommunen.'], ['Kontrollér valgsteder', 'Bekræft adresser, åbningstider og tilgængelighed for alle valgsteder.'], ['Gør VALG-løsningen klar', 'Tjek brugeradgang og roller for medarbejdere, der skal registrere eller godkende.'], ['Informér borgerne', 'Offentliggør information om valgsteder, brevstemme og frister.']] },
    valgdagen: { t: 'Valgdagen', d: 'Valgsteder, afstemning og opgaver', lead: 'Praktiske opgaver på selve valgdagen.', steps: [['Åbn valgstedet', 'Kontrollér materiale, stemmebokse og valgliste.'], ['Gennemfør afstemningen', 'Følg retningslinjerne for identifikation og stemmeafgivelse.'], ['Luk valgstedet', 'Afslut afstemningen på det fastsatte tidspunkt, og sikr materialet.']] },
    optaelling: { t: 'Optælling og indberetning', d: 'Sådan tæller og melder du resultater', lead: 'Trin-for-trin gennem optælling og indberetning, så resultatet vises korrekt for borgerne.', steps: [['Gør klar til optælling', 'Kontrollér, at alle valgsteder har afleveret afstemningsmateriale.'], ['Tæl stemmerne op', 'Optælling foregår i henhold til retningslinjerne for valgstedet.'], ['Indberet foreløbigt resultat', 'Indtast tallene i VALG-løsningen, og kontrollér mod valgstedets protokol.'], ['Godkend og offentliggør', 'Når resultatet er godkendt, vises det automatisk på valg.dk.'], ['Afslut og arkivér', 'Gem dokumentation, og luk valgstedet i systemet.']] },
    efter: { t: 'Efter valget', d: 'Offentliggørelse og afslutning', lead: 'Opgaver, når resultatet er endeligt.', steps: [['Kontrollér det endelige resultat', 'Sammenhold indberetninger med protokollerne.'], ['Offentliggør resultatet', 'Resultatet publiceres på valg.dk, når det er godkendt.'], ['Afslut valget', 'Arkivér materiale og luk valget i systemet.']] },
  };
  function vejledning(parts, q) {
    if (parts[1] && ART[parts[1]]) return artikel(parts[1]);
    document.title = 'Vejledning – valg.dk (prototype)';
    const inp = h('input', { type: 'text', id: 'gq', placeholder: 'Søg i vejledninger …', 'aria-label': 'Søg i vejledninger' });
    const cards = h('div', { class: 'guide-grid' });
    const upd = [['Ny vejledning: offentliggørelse af foreløbige resultater', '12. okt. 2026', 'efter'], ['Opdateret: tidsplan for valgaftenen', '8. okt. 2026', 'valgdagen'], ['Ny FAQ: hvad gør jeg ved fejl i indberetningen?', '1. okt. 2026', 'optaelling']];
    const none = h('p', { class: 'panel', hidden: true, role: 'status' }, 'Ingen vejledninger matcher din søgning.');
    function draw() {
      const n = inp.value.toLowerCase().trim();
      const hit = Object.entries(ART).filter(([, a]) => !n || (a.t + ' ' + a.d + ' ' + a.steps.flat().join(' ')).toLowerCase().includes(n));
      cards.innerHTML = '';
      hit.forEach(([id, a]) => cards.append(h('a', { class: 'card', href: href('/vejledning/' + id) }, icon('book'), h('h3', {}, a.t), h('p', {}, a.d), h('span', { class: 'chev', 'aria-hidden': 'true' }, '›'))));
      none.hidden = hit.length > 0;
    }
    inp.addEventListener('input', () => { draw(); log('search', inp.value); });
    draw();
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Hjælp' }, { t: 'Vejledning' }),
      h('h1', {}, 'Vejledning til valgarbejdet'), h('p', { class: 'lead' }, 'Praktisk information og procedurer til dig, der arbejder med valg i en kommune.'),
      h('form', { class: 'search', style: 'margin-top:26px', role: 'search', onsubmit: e => e.preventDefault() }, h('div', { class: 'box' }, inp, h('button', { class: 'btn', type: 'submit' }, 'Søg'))),
      cards, none,
      h('section', { class: 'section', 'aria-labelledby': 'h-upd' }, h('h2', { id: 'h-upd' }, 'Seneste opdateringer'), h('div', { class: 'list' }, upd.map(u => h('a', { href: href('/vejledning/' + u[2]) }, h('strong', {}, u[0]), h('small', {}, u[1]))))),
      h('section', { class: 'panel tint section cta', 'aria-labelledby': 'h-help' }, h('div', {}, h('h2', { id: 'h-help', style: 'font-size:22px' }, 'Brug for hjælp?'), h('p', { style: 'color:var(--muted);margin-top:6px' }, 'Kontakt valg-supporten, hvis du ikke kan finde svaret.')),
        h('a', { class: 'btn secondary', href: href('/ikke-med', { side: 'Kontakt support' }) }, 'Kontakt support')));
  }
  function artikel(id) {
    const a = ART[id]; document.title = `${a.t} – vejledning – valg.dk (prototype)`;
    const done = new Set(); const prog = h('i'); const pt = h('small', { style: 'color:var(--muted)' });
    const upd = () => { prog.style.width = (done.size / a.steps.length * 100) + '%'; pt.textContent = `${done.size} af ${a.steps.length} trin gennemført`; };
    const cards = a.steps.map((st, i) => {
      const cb = h('input', { type: 'checkbox', id: 'cb' + i });
      const card = h('div', { class: 'step-card', id: 'step' + i }, h('div', { class: 'no', 'aria-hidden': 'true' }, String(i + 1)), h('div', {}, h('h3', {}, st[0]), h('p', {}, st[1]), h('label', { for: 'cb' + i }, cb, 'Markér som gennemført')));
      cb.addEventListener('change', () => { card.classList.toggle('done', cb.checked); cb.checked ? done.add(i) : done.delete(i); upd(); });
      return card;
    });
    upd();
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Hjælp' }, { t: 'Vejledning', href: '#/vejledning' }, { t: a.t }),
      h('h1', { style: 'max-width:820px' }, a.t), h('p', { class: 'lead' }, a.lead),
      h('div', { class: 'article' }, h('div', {}, cards, h('p', { class: 'source' }, 'Eksempeltekst til prototypen – ikke officiel vejledning.')),
        h('aside', { class: 'aside' },
          h('nav', { class: 'panel', 'aria-label': 'På denne side' }, h('h3', { style: 'margin-bottom:10px' }, 'På denne side'), a.steps.map((st, i) => h('a', { href: '#', onclick: e => { e.preventDefault(); document.getElementById('step' + i).scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, `${i + 1}. ${st[0]}`))),
          h('div', { class: 'panel' }, h('h3', {}, 'Din fremdrift'), h('div', { class: 'progress' }, prog), pt),
          h('div', { class: 'panel tint' }, h('h3', { style: 'margin-bottom:12px' }, 'Se hvordan resultatet vises for borgerne'), h('a', { class: 'btn secondary small', href: href('/resultat/horsholm', { valg: DEFAULT_VALG }) }, 'Åbn kommuneresultat')),
          h('div', { class: 'panel' }, h('h3', {}, 'Brug for hjælp?'), h('p', { style: 'color:var(--muted);margin:6px 0 12px' }, 'Kontakt valg-supporten.'), h('a', { class: 'btn secondary small', href: href('/ikke-med', { side: 'Kontakt support' }) }, 'Kontakt')))));
  }

  /* ---------- blindgyde ---------- */
  function ikkeMed(parts, q) {
    const side = q.side || 'Denne side';
    document.title = 'Ikke med i prototypen – valg.dk';
    log('dead', side);
    return h('div', { class: 'page wrap' }, crumb({ t: 'Forside', href: '#/' }, { t: 'Ikke med i prototypen' }),
      h('h1', {}, 'Denne side er ikke med i prototypen'),
      h('p', { class: 'lead' }, `Du klikkede på «${side}». Den del af valg.dk er ikke bygget i denne prototype. Prøv at gå tilbage, eller start forfra fra forsiden.`),
      h('div', { class: 'pills', style: 'margin-top:28px' }, h('button', { class: 'btn secondary', type: 'button', onclick: () => history.back() }, '← Gå tilbage'), h('a', { class: 'btn', href: '#/' }, 'Til forsiden')));
  }

  /* ---------- router ---------- */
  const routes = { '': home, find, resultat, sammenlign, vejledning, 'om-valg': (p, q) => ikkeMed(p, { side: 'Om valg' }), 'ikke-med': ikkeMed };
  function render() {
    const { parts, q } = parse();
    const view = routes[parts[0] || ''] || ((p, qq) => ikkeMed(p, { side: location.hash }));
    main.innerHTML = '';
    let node;
    try { node = view(parts, q); } catch (e) { console.error(e); node = h('div', { class: 'page wrap' }, h('h1', {}, 'Noget gik galt'), h('p', {}, String(e))); }
    main.append(node);
    document.querySelectorAll('[data-nav]').forEach(a => { const on = a.dataset.nav === (parts[0] || ''); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
    log('route', location.hash || '#/');
    document.getElementById('nav').classList.remove('open'); document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
  }
  window.addEventListener('hashchange', render);
  document.getElementById('menuBtn').addEventListener('click', e => { const n = document.getElementById('nav'); const o = n.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#/ikke-med"]'); if (a && location.hash.startsWith('#/ikke-med')) log('dead', a.getAttribute('href'));
  });
  render();
})();
