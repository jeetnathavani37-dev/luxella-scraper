// Catalogue sync summary: reads the scraper logs, lists saved pieces per store, and warns on every store that saved 0,
// every "<store> fail" line, and every expected store that printed no result at all (script crashed before DONE).
// Usage: node scripts/sync_summary.js sync.log [--expect=shopify,tb,...]   (writes to $GITHUB_STEP_SUMMARY when set; always exits 0)
const fs = require('fs');
const args = process.argv.slice(2);
const expect = (args.find((a) => a.startsWith('--expect=')) || '--expect=').slice(9).split(',').filter(Boolean);
const files = args.filter((a) => !a.startsWith('--'));
const stores = {}; const seen = new Set(); const fails = [];
for (const f of files) {
  let text = '';
  try { text = fs.readFileSync(f, 'utf8'); } catch (e) { console.log('no log', f); continue; }
  for (const line of text.split('\n')) {
    const fm = line.match(/^(?:\S+ )?(\w+) fail\b(.*)$/); if (fm) fails.push(fm[1] + fm[2].slice(0, 120));
    const m = line.match(/^(?:\S+ )?(shopify|DONE) (\{.*?\})(?: started|$)/);
    if (!m) continue;
    let o; try { o = JSON.parse(m[2]); } catch (e) { continue; }
    if (m[1] === 'shopify') seen.add('shopify');
    for (const [k, v] of Object.entries(o)) {
      if (m[1] === 'DONE') seen.add(k);
      if (m[1] === 'DONE' && k === 'shopify') continue; // per-shop counts come from the "shopify {...}" line
      if (typeof v === 'number') stores[k] = (stores[k] || 0) + v;
    }
  }
}
const names = Object.keys(stores).sort();
const dead = names.filter((k) => stores[k] === 0);
const missing = expect.filter((k) => !seen.has(k));
let md = '## Catalogue sync\n\n';
md += names.length ? `${names.length} stores: ${names.length - dead.length} saved pieces, ${dead.length} saved 0.\n\n` : 'No store results found in the logs.\n\n';
if (missing.length) md += `⚠️ No result at all (crashed before DONE?): ${missing.join(', ')}\n\n`;
if (fails.length) md += `⚠️ Failures:\n${fails.map((x) => '- ' + x).join('\n')}\n\n`;
if (names.length) { md += '| Store | Saved |\n|---|---|\n'; for (const k of names) md += `| ${stores[k] === 0 ? '⚠️ ' : ''}${k} | ${stores[k]} |\n`; }
for (const k of dead) console.log(`::warning title=Store saved 0::${k} saved 0 pieces this run`);
for (const k of missing) console.log(`::warning title=No result::${k} printed no result (script crashed before DONE?)`);
for (const x of fails) console.log(`::warning title=Scraper failure::${x}`);
if (!names.length) console.log('::warning title=No results::no store results found in the scraper logs');
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log(md);
