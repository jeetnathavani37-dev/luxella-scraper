// Smoke test for the B2B portal. Usage: node smoke.js <url> [--log '<json>']
// Login comes from env LX_SMOKE_EM / LX_SMOKE_PW (never committed).
// Checks: login works, every workspace renders without a JS error, and a
// write+read round-trip on meta/smoke (never touches orders).
// With --log it also prepends a release record to meta/releases (last 30 kept).
const { chromium } = require('playwright');
const url = process.argv[2];
const logIdx = process.argv.indexOf('--log');
const logRec = logIdx > 0 ? JSON.parse(process.argv[logIdx + 1]) : null;
const EM = process.env.LX_SMOKE_EM, PW = process.env.LX_SMOKE_PW;
if (!url || !EM || !PW) { console.error('usage: LX_SMOKE_EM=.. LX_SMOKE_PW=.. node smoke.js <url>'); process.exit(2); }
const exe = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const fails = [];
  const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--headless=new'] });
  try {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now(), { waitUntil: 'networkidle' });
    await p.fill('#em', EM); await p.fill('#pw', PW); await p.click('#go');
    await p.waitForSelector('.bp-top', { timeout: 30000 }).catch(() => fails.push('login: portal did not load'));
    await p.waitForTimeout(3000);
    const ws = await p.$$eval('.ws-b', els => els.map(e => ((e.querySelector('.ws-tx')||e).innerText || '').split('\n')[0].trim()).filter(Boolean));
    if (ws.length < 5) fails.push('workspaces: only ' + ws.length + ' found');
    for (let i = 0; i < ws.length; i++) {
      const before = errs.length;
      await p.locator('.ws-b').nth(i).click();
      await p.waitForTimeout(1200);
      const txt = await p.evaluate(() => (document.querySelector('#admin-root') || document.body).innerText.length);
      if (txt < 200) fails.push('ws "' + ws[i] + '": empty render');
      if (errs.length > before) fails.push('ws "' + ws[i] + '": ' + errs.slice(before).join(' | '));
    }
    // write + read round-trip on a meta row
    const rt = await p.evaluate(async () => {
      const sb = window.__lxAdmin && window.__lxAdmin.sb; if (!sb) return 'no client';
      const tok = 'smoke-' + Date.now();
      const w = await sb.from('lx_b2b').upsert({ kind: 'meta', id: 'smoke', data: { tok, at: new Date().toISOString() }, updated_at: new Date().toISOString() }, { onConflict: 'kind,id' });
      if (w.error) return 'write: ' + w.error.message;
      const r = await sb.from('lx_b2b').select('data').eq('kind', 'meta').eq('id', 'smoke').single();
      if (r.error) return 'read: ' + r.error.message;
      return r.data.data.tok === tok ? 'ok' : 'mismatch';
    });
    if (rt !== 'ok') fails.push('round-trip: ' + rt);
    if (logRec) {
      logRec.smoke = fails.length ? 'fail' : 'pass'; logRec.fails = fails;
      const lr = await p.evaluate(async rec => {
        const sb = window.__lxAdmin.sb;
        const r = await sb.from('lx_b2b').select('data').eq('kind', 'meta').eq('id', 'releases').maybeSingle();
        const list = [rec].concat(((r.data || {}).data || {}).list || []).slice(0, 30);
        const w = await sb.from('lx_b2b').upsert({ kind: 'meta', id: 'releases', data: { list }, updated_at: new Date().toISOString() }, { onConflict: 'kind,id' });
        return w.error ? w.error.message : 'ok';
      }, logRec);
      if (lr !== 'ok') console.error('release log write failed: ' + lr);
    }
    console.log(JSON.stringify({ url, workspaces: ws, fails }));
  } catch (e) { fails.push('crash: ' + e.message); console.log(JSON.stringify({ url, fails })); }
  await b.close();
  process.exit(fails.length ? 1 : 0);
})();
