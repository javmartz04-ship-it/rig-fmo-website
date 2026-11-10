(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];

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

  // Community video: big play button, then native controls
  // Plays silently on a loop while it's on screen. Tapping play restarts it from the top with sound.
  const vsl = $('#vsl');
  if (vsl) {
    const v = $('#vslV');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const preview = () => { if (still) return; v.muted = true; v.setAttribute('muted', ''); v.loop = true; v.play().catch(() => {}); };
    if (!still) {
      v.preload = 'auto';
      new IntersectionObserver(([e]) => { if (vsl.classList.contains('on')) return; if (e.isIntersecting) preview(); else v.pause(); }, { threshold: .35 }).observe(vsl);
    }
    $('#vslGo').addEventListener('click', () => {
      vsl.classList.add('on'); v.loop = false; v.muted = false; v.removeAttribute('muted'); v.controls = true;
      try { v.currentTime = 0; } catch (_) {}
      v.play().catch(() => {}); v.focus();
    });
    v.addEventListener('ended', () => { v.controls = false; vsl.classList.remove('on'); try { v.currentTime = 0; } catch (_) {} preview(); });
  }

  // Video
  const modal = $('#modal'), player = $('#player'); let last;
  const close = () => { const yt = $('iframe', modal); if (yt) { yt.remove(); player.hidden = false; document.dispatchEvent(new Event('talkclose')); } player.pause(); player.removeAttribute('src'); player.innerHTML = ''; player.load(); modal.hidden = true; document.body.style.overflow = ''; last && last.focus(); };
  $$('[data-video]').forEach(b => b.addEventListener('click', () => {
    last = b; const n = b.dataset.video;
    player.innerHTML = `<track default kind="captions" srclang="en" label="English" src="assets/video/${n}.vtt">`;
    player.src = `assets/video/${n}.mp4`; player.poster = `assets/video/${n}.jpg`;
    modal.hidden = false; document.body.style.overflow = 'hidden'; player.play().catch(() => {}); $('#x').focus();
  }));
  $$('[data-talk]').forEach(b => b.addEventListener('click', () => {
    last = b; player.hidden = true;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube.com/embed/${b.dataset.talk}?autoplay=1&rel=0&playsinline=1`;
    f.title = 'Johnny Brock at MedicareCon'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
    modal.appendChild(f); modal.hidden = false; document.body.style.overflow = 'hidden'; $('#x').focus();
    document.dispatchEvent(new Event('talkopen'));
  }));
  $('#x').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (!modal.hidden) close(); setMenu(false); } });

})();
