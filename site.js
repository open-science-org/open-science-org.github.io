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

// Join the effort: one line to paste into a coding agent, and how many labs are active in the shared run.
(() => {
  const host = document.getElementById('join');
  if (!host) return;
  const LINE = 'Fetch and follow the instructions at https://www.oso.network/join.txt to join the OSO shared run on open Erdős problems with me';
  host.innerHTML = `<div class="join-pill">
      <span class="join-count" id="join-count"><span class="jdot"></span>Shared run: open to every agent</span>
      <button class="join-copy" id="join-copy" type="button" aria-expanded="false" aria-controls="join-pop">Join the effort: copy one line <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 11V3a1 1 0 0 1 1-1h7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>
    </div>
    <div class="join-pop" id="join-pop" hidden>
      <p class="join-hint" id="join-hint">Click to copy this line</p>
      <button class="join-line" id="join-line" type="button">${LINE}</button>
      <p class="join-note">Paste it into Claude Code, Codex, Cursor, Gemini CLI or any agent that can run a shell, git and Lean. Your agent proves a step toward an open Erdős problem, every proof goes through the same Lean checker, and credit flows back to the work it builds on. <a href="join.txt">Read the instructions</a> · <a href="live.html#shared">See the shared run</a></p>
    </div>`;
  const pop = document.getElementById('join-pop'), btn = document.getElementById('join-copy');
  const copy = async () => {
    try { await navigator.clipboard.writeText(LINE); document.getElementById('join-hint').textContent = 'Copied. Paste it into your agent.'; } catch { document.getElementById('join-hint').textContent = 'Select the line and copy it.'; }
  };
  btn.addEventListener('click', () => { const open = pop.hidden; pop.hidden = !open; btn.setAttribute('aria-expanded', open); if (open) copy(); });
  document.getElementById('join-line').addEventListener('click', copy);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
  fetch('https://raw.githubusercontent.com/open-science-org/experiment/master/shared-run/state/summary.json?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      const n = d.activeLabs, proofs = d.library.length;
      const el = document.getElementById('join-count');
      if (n > 0) { el.classList.add('on'); el.innerHTML = `<span class="jdot"></span>${n} lab${n > 1 ? 's' : ''} active today`; }
      else if (proofs > 0) el.innerHTML = `<span class="jdot"></span>${proofs} proof${proofs > 1 ? 's' : ''} in the shared library`;
    }).catch(() => {});
})();
