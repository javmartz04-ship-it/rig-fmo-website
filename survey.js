(() => {
  const WEBHOOK = ''; // GHL inbound webhook for applications. Empty = preview, nothing is sent.
  const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 8h11M9 4l4 4-4 4"/></svg>';
  const CTA = 'Apply To Work With Us';

  const fmtPhone = v => { const d = v.replace(/\D/g, '').slice(0, 10); if (d.length < 4) return d; if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`; return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`; };

  // The survey. One object per screen.
  const STEPS = [
    { id: 'role', q: 'Which Best Describes You?', hint: 'It just changes where we start.',
      options: ['Independent Agent', 'Agency Owner'] },
    { id: 'team_size', q: 'How Many People Work With You?', hint: 'Agents, assistants and office staff. Don’t count yourself.',
      options: ['Just Me', '1 To 4', '5 To 14', '15 Or More'] },
    { id: 'annual_revenue', q: 'What Does Your Business Bring In Each Year?', hint: 'A ballpark is fine.',
      options: ['Under $100K', '$100K To $250K', '$250K To $500K', '$500K To $1M', 'Over $1M'] },
    { id: 'biggest_challenge', q: 'What’s Holding You Back The Most?', hint: 'Pick the one that costs you the most.',
      options: a => ['Not Enough Leads', 'Leads That Don’t Close', 'No Time To Run Marketing', ...(a.team_size === 'Just Me' ? [] : ['My Team Isn’t Producing']), 'Something Else'] },
    { q: 'Last Part. Who Are We Talking To?', hint: 'Next, you’ll pick a time for your call.',
      fields: [
        { id: 'full_name', label: 'Full Name', type: 'text', auto: 'name', ph: 'Jordan Rivera',
          check: v => v.trim().length >= 2 ? '' : 'Please enter your full name.' },
        { id: 'email', label: 'Email Address', type: 'email', auto: 'email', ph: 'you@agency.com',
          check: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.' },
        { id: 'phone', label: 'Phone Number', type: 'tel', auto: 'tel', ph: '(555) 123-4567',
          check: v => { const n = v.replace(/\D/g, '').length; return n === 10 ? '' : 'Please enter a 10-digit phone number.'; } },
      ] },
  ];

  const $ = id => document.getElementById(id);
  const root = $('sv'), card = $('svCard'), stage = $('svStage'), fill = $('svFill');
  const answers = {};
  const pad = n => String(n).padStart(2, '0');
  let i = 0, locked = false, finished = false, opener = null;

  const go = (n, dir = '') => { i = n; locked = false; render(dir); };

  function render(dir = '') {
    const s = STEPS[i];
    fill.style.width = `${((i + 1) / STEPS.length) * 100}%`;
    const head = `<div class="sv-c"><span class="sv-n"><b>${pad(i + 1)}</b> / ${pad(STEPS.length)}</span>${i ? '<button type="button" class="sv-b" id="svBack">← Back</button>' : ''}</div><h2 class="q" tabindex="-1">${s.q}</h2><p class="help">${s.hint}</p>`;
    if (s.options) {
      const opts = typeof s.options === 'function' ? s.options(answers) : s.options;
      stage.innerHTML = `<div class="step ${dir}">${head}<div class="opts" role="radiogroup" aria-label="${s.q}">${opts.map((o, n) => `<button type="button" class="opt" role="radio" aria-checked="${answers[s.id] === o}" data-v="${o}"><span class="key">${String.fromCharCode(65 + n)}</span><span class="tx">${o}</span></button>`).join('')}</div></div>`;
      stage.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
        if (locked) return; locked = true;
        answers[s.id] = b.dataset.v;
        stage.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', x === b));
        setTimeout(() => go(i + 1), 260);
      }));
      stage.querySelector('.q').focus({ preventScroll: true });
    } else {
      stage.innerHTML = `<form class="step ${dir}" novalidate>${head}<div class="flds">${s.fields.map(f => `<div class="fld"><label for="sv_${f.id}">${f.label}</label><input class="in" id="sv_${f.id}" name="${f.id}" type="${f.type}" autocomplete="${f.auto}" placeholder="${f.ph}" ${f.type === 'tel' ? 'inputmode="tel"' : ''} required><p class="err" role="alert" hidden></p></div>`).join('')}</div><button type="submit" class="btn">${CTA}<i>${ARROW}</i></button><p class="micro">Submitting an application does not guarantee acceptance.</p></form>`;
      const f = stage.querySelector('form');
      s.fields.forEach(d => {
        const inp = $(`sv_${d.id}`), er = inp.nextElementSibling;
        inp.value = answers[d.id] || '';
        inp.addEventListener('input', () => { if (d.type === 'tel') inp.value = fmtPhone(inp.value); answers[d.id] = inp.value; inp.classList.remove('bad'); inp.removeAttribute('aria-invalid'); er.hidden = true; });
      });
      f.addEventListener('submit', e => {
        e.preventDefault();
        let first = null;
        s.fields.forEach(d => {
          const inp = $(`sv_${d.id}`), er = inp.nextElementSibling, msg = d.check(inp.value);
          er.textContent = msg; er.hidden = !msg; inp.classList.toggle('bad', !!msg);
          if (msg) { inp.setAttribute('aria-invalid', 'true'); first = first || inp; } else { answers[d.id] = inp.value.trim(); }
        });
        if (first) { first.focus(); return; }
        submit(f);
      });
      $(`sv_${s.fields[0].id}`).focus({ preventScroll: true });
    }
    const b = $('svBack');
    if (b) b.addEventListener('click', () => go(i - 1, 'back'));
    root.scrollTop = 0;
  }

  async function submit(f) {
    if (locked) return; locked = true;
    f.querySelector('.btn').disabled = true;
    if (WEBHOOK) { try { await fetch(WEBHOOK, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...answers, source: 'website_application' }) }); } catch (_) {} }
    finished = true;
    fill.style.width = '100%';
    // book.html only opens for someone holding this pass.
    try { localStorage.setItem('rig_applied', String(Date.now())); } catch (_) { window.name = 'rig_applied'; }
    location.href = 'book.html';
  }

  // Coming back from the booking page with the browser's Back button.
  addEventListener('pageshow', e => { if (e.persisted && finished) close(); });

  function open(e) {
    e.preventDefault();
    opener = e.currentTarget;
    if (finished) { finished = false; Object.keys(answers).forEach(k => delete answers[k]); i = 0; }
    locked = false;
    root.inert = false;
    root.classList.add('open');
    document.body.style.overflow = 'hidden';
    render();
  }

  function close() {
    root.classList.remove('open');
    root.inert = true;
    document.body.style.overflow = '';
    if (opener) opener.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-apply]').forEach(a => a.addEventListener('click', open));
  $('svX').addEventListener('click', close);
  root.querySelector('.scrim').addEventListener('click', close);

  addEventListener('keydown', e => {
    if (!root.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const f = [...card.querySelectorAll('button,input,a[href]')].filter(x => x.offsetParent && !x.disabled);
      const first = f[0], last = f[f.length - 1], cur = document.activeElement;
      if (e.shiftKey && (cur === first || !card.contains(cur))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (finished || e.metaKey || e.ctrlKey || e.altKey || !STEPS[i].options || e.key.length !== 1) return;
    const b = stage.querySelectorAll('.opt')[e.key.toUpperCase().charCodeAt(0) - 65];
    if (b) b.click();
  });
})();
