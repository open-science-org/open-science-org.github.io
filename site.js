// The status band: is a run streaming now? The same file the live page reads.
(() => {
  const band = document.getElementById('band');
  if (!band) return;
  fetch('https://raw.githubusercontent.com/open-science-org/experiment/live/live.json?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      const total = d.setups.reduce((a, s) => a + s.runs.total, 0), done = d.setups.reduce((a, s) => a + s.runs.done, 0);
      const on = done < total;
      band.classList.toggle('on', on);
      band.innerHTML = on
        ? `<span class="dot"></span><b>Live now:</b> ${d.title || d.id}. ${done} of ${total} runs finished. <a href="live.html">Watch it →</a>`
        : `<span class="dot"></span><b>Latest run:</b> ${d.title || d.id}, finished. <a href="live.html">See how it went →</a>`;
    }).catch(() => {});
})();
