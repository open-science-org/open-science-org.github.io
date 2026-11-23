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

// Labs at work: every checker verdict, newest first, from every experiment streaming now and the shared run.
// Fills any element with [data-oso-feed]; the Live page draws its own copy of the same feed.
(() => {
  const hosts = document.querySelectorAll('[data-oso-feed]');
  if (!hosts.length) return;
  const RAW = 'https://raw.githubusercontent.com/open-science-org/experiment/';
  const get = (u) => fetch(u + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const name = (s) => { const p = s.label || s.key, a = (p.match(/α=([\d.]+)/) || [])[1]; return /at target/.test(p) ? 'Traditional' : /lab chooses/.test(p) ? `Labs choose, α ${a}` : a ? `α ${a}` : s.key; };
  const ago = (t) => { const s = Math.max(1, Math.round((Date.now() - t) / 1000)); return s < 60 ? `${s} s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`; };
  let items = [];
  const draw = () => hosts.forEach((h) => { h.innerHTML = items.length ? items.slice(0, 30).map((m) => `<a class="msg${m.ok ? '' : ' no'}" href="${m.href}" style="display:block;color:inherit;text-decoration:none"><div class="hd"><span>${esc(m.from)} → ${esc(m.to)}</span><span class="ago">${ago(m.t)}</span></div><p>${esc(m.text)}</p><div class="src">${esc(m.src)}</div></a>`).join('') : '<div class="msg no"><p>Nothing is streaming right now. The next run shows up here as it goes.</p></div>'; });
  const load = async () => {
    const [idx, shared] = await Promise.all([get(RAW + 'live/index.json'), get(RAW + 'master/shared-run/state/summary.json')]);
    const runs = await Promise.all((idx?.experiments || []).filter((e) => e.running).map((e) => get(RAW + 'live/' + e.file)));
    items = runs.filter(Boolean).flatMap((d) => (d.feed || []).map((e) => {
      const s = d.setups.find((x) => x.key === e.setup), what = e.kind === 'target' ? `target ${e.item}` : `lemma ${e.item}`, cites = e.cites || [];
      return { t: e.t, href: `live.html?id=${encodeURIComponent(d.id)}`, from: `lab ${e.lab}`, to: cites.length ? cites.map((l) => `lab ${l}`).join(', ') : e.ok ? 'library' : 'Lean', ok: e.ok && !e.duplicate,
        text: !e.ok ? `Tried ${what}. Lean did not accept it.` : e.duplicate ? `Proved ${what} again, but another lab got there first.` : `Proved ${what}${cites.length ? `, building on ${cites.map((l) => `lab ${l}`).join(' and ')}'s result` : ''}.`,
        src: `${d.id} · ${s ? name(s) : e.setup} · run ${e.run}` };
    }));
    if (shared) items.push(...shared.feed.map((f) => ({ t: Date.parse(f.at), href: 'live.html#shared', from: f.lab, to: f.ok ? 'library' : 'Lean', ok: f.ok,
      text: f.ok ? `Proved ${f.kind === 'target' ? 'target ' + f.target : 'a lemma'}${f.id ? ` (now ${f.id} in the library)` : ''}.` : `Submitted ${f.kind === 'target' ? 'target ' + f.target : 'a lemma'}. Lean did not accept it.`, src: `Shared run · pull request #${f.pr}` })));
    items.sort((a, b) => (b.t || 0) - (a.t || 0));
    draw();
  };
  load(); setInterval(load, 60000); setInterval(draw, 10000);
})();
