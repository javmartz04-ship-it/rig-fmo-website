(() => {
  // Muted corner clip of Johnny's MedicareCon talk. Click opens the full talk with sound (site.js).
  const ID = 'llbVmghtQ0M', START = 120, CLIP = 90;
  const talk = document.getElementById('talk'), KEY = 'rig-talk-closed';
  let closed = false; try { closed = sessionStorage.getItem(KEY) === '1'; } catch (_) {}
  if (closed || !talk) return;

  const phone = matchMedia('(max-width:760px)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let player = null, inFull = false, inEnd = false, heroGone = false, liveTimer;

  const sync = () => {
    const away = inFull || inEnd || (phone && !heroGone);
    talk.classList.toggle('away', away);
    talk.inert = away;
    if (player && player.playVideo) { if (away) player.pauseVideo(); else player.playVideo(); }
  };

  talk.hidden = false;
  requestAnimationFrame(() => setTimeout(() => { talk.classList.add('in'); sync(); }, phone ? 0 : 1200));

  new IntersectionObserver(es => { es.forEach(e => { heroGone = !e.isIntersecting; }); sync(); }).observe(document.getElementById('top'));
  const ends = new Set();
  const endIo = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) ends.add(e.target); else ends.delete(e.target); }); inEnd = ends.size > 0; sync(); });
  document.querySelectorAll('#apply,.foot').forEach(el => endIo.observe(el));

  document.addEventListener('talkopen', () => { inFull = true; sync(); });
  document.addEventListener('talkclose', () => { inFull = false; sync(); });
  document.addEventListener('visibilitychange', () => { if (player && player.pauseVideo) { if (document.hidden) player.pauseVideo(); else sync(); } });

  document.getElementById('talkX').addEventListener('click', () => {
    try { sessionStorage.setItem(KEY, '1'); } catch (_) {}
    if (player && player.destroy) player.destroy();
    player = null; talk.remove();
  });

  if (phone) return; // Phones get the still and the button, no background video.

  const start = () => {
    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player('talkYt', {
        videoId: ID,
        playerVars: { autoplay: 1, mute: 1, controls: 0, rel: 0, playsinline: 1, disablekb: 1, fs: 0, iv_load_policy: 3, start: START, end: START + CLIP },
        events: {
          onReady: e => { e.target.mute(); sync(); },
          onStateChange: e => {
            if (e.data === YT.PlayerState.ENDED) { e.target.seekTo(START, true); e.target.playVideo(); }
            if (e.data === YT.PlayerState.PLAYING && !talk.classList.contains('live')) { clearTimeout(liveTimer); liveTimer = setTimeout(() => talk.classList.add('live'), 2500); }
          }
        }
      });
    };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
  };
  if (document.readyState === 'complete') setTimeout(start, 1500); else addEventListener('load', () => setTimeout(start, 1500), { once: true });
})();
