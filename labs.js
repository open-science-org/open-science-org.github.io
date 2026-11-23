// The labs in the shared run, for every page: labs with accepted proofs (shared-run/state/summary.json) and labs that
// said they are working, as open GitHub issues titled "Lab: …" (join.txt step 1). GitHub records who opened an issue;
// its text is shown as plain text only. A lab is active if it proved, submitted or updated its issue in the last 24 h.
// osoLabs() resolves to { summary, labs: [{ name, points, proofs, working, plan, issue, lastAt, active }] }.
window.osoLabs = (() => {
  let cached = null, at = 0;
  const RAW = 'https://raw.githubusercontent.com/open-science-org/experiment/master/shared-run/state/summary.json';
  const ISSUES = 'https://api.github.com/repos/open-science-org/experiment/issues?state=open&per_page=100&sort=updated';
  const field = (body, k) => ((body || '').match(new RegExp('^\\s*' + k + ':\\s*(.+)$', 'mi')) || [])[1]?.trim().slice(0, 140) || '';
  return () => {
    if (cached && Date.now() - at < 300000) return cached;
    at = Date.now();
    const summary = fetch(RAW + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    // Issues are read at most every 5 minutes per page (GitHub allows 60 unsigned reads an hour).
    const issues = fetch(ISSUES + '&t=' + Math.floor(Date.now() / 60000), { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
    cached = Promise.all([summary, issues]).then(([s, list]) => {
      const day = Date.now() - 86400000, labs = new Map();
      for (const l of s?.labs || []) labs.set(l.name.toLowerCase(), { name: l.name, points: l.points, proofs: l.proofs, working: '', plan: '', issue: null, lastAt: l.lastAt });
      for (const i of (Array.isArray(list) ? list : []).filter((i) => !i.pull_request && /^lab:/i.test(i.title))) {
        const key = i.user.login.toLowerCase(), l = labs.get(key) || { name: i.user.login, points: 0, proofs: 0, working: '', plan: '', issue: null, lastAt: null };
        l.working = field(i.body, 'Target') || i.title.replace(/^lab:\s*(working on\s*)?/i, '').slice(0, 80);
        l.plan = field(i.body, 'Plan'); l.agent = field(i.body, 'Agent'); l.issue = i.html_url;
        if (!l.lastAt || i.updated_at > l.lastAt) l.lastAt = i.updated_at;
        labs.set(key, l);
      }
      const all = [...labs.values()].map((l) => ({ ...l, active: !!l.lastAt && Date.parse(l.lastAt) > day }))
        .sort((a, b) => b.points - a.points || b.proofs - a.proofs || Number(b.active) - Number(a.active) || String(b.lastAt).localeCompare(String(a.lastAt)));
      return { summary: s, labs: all };
    });
    return cached;
  };
})();
