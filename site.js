(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const WEBHOOK = ''; // GHL inbound webhook for agent applications. Empty = preview, nothing is sent.
  const THANKS = '';  // Optional thank-you URL.

  // Reveal
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.r').forEach((el) => io.observe(el));

  // Count-up, starts when seen
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count; if (reduce) return;
    const t0 = performance.now() + 150, dur = 1500;
    const tick = t => { const k = Math.min(Math.max((t - t0) / dur, 0), 1), v = Math.round(end * (1 - Math.pow(1 - k, 4))); el.textContent = v.toLocaleString('en-US'); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }));
  $$('[data-count]').forEach(el => cio.observe(el));

  // Nav clears over the hero, solid after
  const nav = $('#nav');
  new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting)).observe($('#sent'));

  // Menu
  const root = document.documentElement, burger = $('#burger');
  const setMenu = o => { root.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); document.body.style.overflow = o ? 'hidden' : ''; };
  burger.addEventListener('click', () => setMenu(!root.classList.contains('open')));
  $$('#sheet a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  // Rail
  const rail = $('#rail'), step = () => $('.t', rail).offsetWidth + 18;
  $('#next').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  $('#prev').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));

  // Video
  const modal = $('#modal'), player = $('#player'); let last;
  const close = () => { player.pause(); player.removeAttribute('src'); player.innerHTML = ''; player.load(); modal.hidden = true; document.body.style.overflow = ''; last && last.focus(); };
  $$('[data-video]').forEach(b => b.addEventListener('click', () => {
    last = b; const n = b.dataset.video;
    player.innerHTML = `<track default kind="captions" srclang="en" label="English" src="assets/video/${n}.vtt">`;
    player.src = `assets/video/${n}.mp4`; player.poster = `assets/video/${n}.jpg`;
    modal.hidden = false; document.body.style.overflow = 'hidden'; player.play().catch(() => {}); $('#x').focus();
  }));
  $('#x').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (!modal.hidden) close(); setMenu(false); } });

  // Application
  const form = $('#form'), err = $('#err');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    let good = true;
    $$('input,select', form).forEach(f => { const ok = f.checkValidity() && f.value.trim() !== ''; f.classList.toggle('bad', !ok); f.setAttribute('aria-invalid', !ok); if (!ok) good = false; });
    err.hidden = good; if (!good) { $('.bad', form).focus(); return; }
    if (WEBHOOK) { try { await fetch(WEBHOOK, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) }); } catch (_) {} }
    if (THANKS) { location.href = THANKS; return; }
    form.hidden = true; const ok = $('#ok'); ok.hidden = false; ok.focus();
  });
})();
