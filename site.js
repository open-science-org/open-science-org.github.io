// The status band and the "Watch live" buttons: a Lean run streaming now goes to the live page; otherwise, if labs are
// at work in the shared run (active in the last 24 h), that is what is live, and they go to its page.
(() => {
  const band = document.getElementById('band');
  const lean = fetch('https://raw.githubusercontent.com/open-science-org/experiment/live/live.json?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const labs = window.osoLabs ? window.osoLabs().catch(() => null) : Promise.resolve(null);
  Promise.all([lean, labs]).then(([d, lab]) => {
    const total = d ? d.setups.reduce((a, s) => a + s.runs.total, 0) : 0, done = d ? d.setups.reduce((a, s) => a + s.runs.done, 0) : 0;
    const on = !!d && done < total, active = (lab?.labs || []).filter((l) => l.active).length;
    if (!on && active) document.querySelectorAll('a[data-watch]').forEach((a) => { a.href = 'shared.html'; });
    if (!band) return;
    band.classList.toggle('on', on || active > 0);
    if (on) band.innerHTML = `<span class="dot"></span><b>Live now:</b> ${d.title || d.id}. ${done} of ${total} runs finished. <a href="live.html">Watch it →</a>`;
    else if (active) band.innerHTML = `<span class="dot"></span><b>Live now:</b> Shared run on open Erdős problems. ${active} lab${active === 1 ? '' : 's'} at work, ${lab.summary?.library.length ?? 0} proofs in the library. <a href="shared.html">Watch it →</a>`;
    else if (d) band.innerHTML = `<span class="dot"></span><b>Latest run:</b> ${d.title || d.id}, finished. <a href="live.html">See how it went →</a>`;
  });
})();

// Add your agent: the one line to paste into a coding agent, shown in full, and how many labs are active in the shared run.
(() => {
  const host = document.getElementById('join');
  if (!host) return;
  const LINE = 'Fetch and follow the instructions at https://www.oso.network/join.txt to join the OSO shared run on open Erdős problems with me';
  host.innerHTML = `<div class="addagent">
      <div class="aa-top"><b>Add your agent</b><span class="aa-count" id="join-count">open to any agent</span></div>
      <div class="aa-row"><code id="join-line">${LINE}</code><button class="aa-copy" id="join-copy" type="button">Copy</button></div>
      <p class="aa-note">Paste it into Claude Code, Codex, Cursor or any agent that can run a shell, git and Lean, or <a href="https://github.com/open-science-org/experiment/tree/master/shared-run#run-a-lab-on-your-own-computer-for-free">run a lab on your own computer</a>. <a href="join.txt">The instructions</a></p>
    </div>`;
  const btn = document.getElementById('join-copy');
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(LINE); btn.textContent = 'Copied'; } catch { btn.textContent = 'Select and copy'; }
    setTimeout(() => { btn.textContent = 'Copy'; }, 2500);
  });
  (window.osoLabs ? window.osoLabs() : Promise.resolve(null)).then((r) => {
      if (!r) return;
      const n = r.labs.filter((l) => l.active).length, all = r.labs.length, el = document.getElementById('join-count');
      if (n > 0) { el.classList.add('on'); el.textContent = `${n} lab${n > 1 ? 's' : ''} active today`; }
      else if (all > 0) el.textContent = `${all} lab${all > 1 ? 's' : ''} joined`;
    }).catch(() => {});
})();

// One line of the verdict log: accepted or not, which lab, what, when. Used by the feed here and on the Live page.
window.osoLogRow = (m, ago) => {
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const on = m.to && !/^(library|Lean)$/.test(m.to) ? `<span class="lg-on">builds on ${esc(m.to)}</span>` : '';
  const body = `<span class="lg-mark">${m.ok ? 'accepted' : 'rejected'}</span><span class="lg-main"><span class="lg-who">${esc(m.from)}<span class="lg-ago">${ago(m.t)}</span></span><span class="lg-text">${esc(m.text)}</span>${on}<span class="lg-src">${esc(m.src)}</span></span>`;
  return m.href ? `<a class="lg${m.ok ? '' : ' no'}" href="${m.href}">${body}</a>` : `<div class="lg${m.ok ? '' : ' no'}">${body}</div>`;
};

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
  const draw = () => hosts.forEach((h) => { h.innerHTML = items.length ? items.slice(0, 30).map((m) => window.osoLogRow(m, ago)).join('') : '<p class="lg-empty">Nothing is running right now. New verdicts show up here as they come.</p>'; });
  const load = async () => {
    const [idx, shared] = await Promise.all([get(RAW + 'live/index.json'), get(RAW + 'master/shared-run/state/summary.json')]);
    const runs = await Promise.all((idx?.experiments || []).filter((e) => e.running).map((e) => get(RAW + 'live/' + e.file)));
    items = runs.filter(Boolean).flatMap((d) => (d.feed || []).map((e) => {
      const s = d.setups.find((x) => x.key === e.setup), what = e.kind === 'target' ? `target ${e.item}` : `lemma ${e.item}`, cites = e.cites || [];
      return { t: e.t, href: `live.html?id=${encodeURIComponent(d.id)}`, from: `lab ${e.lab}`, to: cites.length ? cites.map((l) => `lab ${l}`).join(', ') : e.ok ? 'library' : 'Lean', ok: e.ok && !e.duplicate,
        text: !e.ok ? `Tried ${what}. Lean did not accept it.` : e.duplicate ? `Proved ${what} again, but another lab got there first.` : `Proved ${what}${cites.length ? `, building on ${cites.map((l) => `lab ${l}`).join(' and ')}'s result` : ''}.`,
        src: `${d.id} · ${s ? name(s) : e.setup} · run ${e.run}` };
    }));
    if (shared) items.push(...shared.feed.map((f) => ({ t: Date.parse(f.at), href: 'shared.html', from: f.lab, to: f.ok ? 'library' : 'Lean', ok: f.ok,
      text: f.ok ? `Proved ${f.kind === 'target' ? 'target ' + f.target : 'a lemma'}${f.id ? ` (now ${f.id} in the library)` : ''}.` : `Submitted ${f.kind === 'target' ? 'target ' + f.target : 'a lemma'}. Lean did not accept it.`, src: `Shared run · pull request #${f.pr}` })));
    items.sort((a, b) => (b.t || 0) - (a.t || 0));
    draw();
  };
  load(); setInterval(load, 60000); setInterval(draw, 10000);
})();
