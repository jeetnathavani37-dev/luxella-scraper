// Catalogue sync summary: reads the scraper logs, lists saved pieces per store, and warns on every store that saved 0.
// Usage: node scripts/sync_summary.js sync.log   (writes to $GITHUB_STEP_SUMMARY when set; always exits 0)
const fs = require('fs');
const files = process.argv.slice(2);
const stores = {};
for (const f of files) {
  let text = '';
  try { text = fs.readFileSync(f, 'utf8'); } catch (e) { console.log('no log', f); continue; }
  for (const line of text.split('\n')) {
    const m = line.match(/^(?:\S+ )?(shopify|DONE) (\{.*?\})(?: started|$)/);
    if (!m) continue;
    let o; try { o = JSON.parse(m[2]); } catch (e) { continue; }
    for (const [k, v] of Object.entries(o)) {
      if (m[1] === 'DONE' && k === 'shopify') continue; // per-shop counts come from the "shopify {...}" line
      if (typeof v === 'number') stores[k] = (stores[k] || 0) + v;
    }
  }
}
const names = Object.keys(stores).sort();
const dead = names.filter((k) => stores[k] === 0);
let md = '## Catalogue sync\n\n';
md += names.length ? `${names.length} stores, ${names.length - dead.length} saved pieces, ${dead.length} saved 0.\n\n| Store | Saved |\n|---|---|\n` : 'No store results found in the logs.\n';
for (const k of names) md += `| ${stores[k] === 0 ? '⚠️ ' : ''}${k} | ${stores[k]} |\n`;
for (const k of dead) console.log(`::warning title=Store saved 0::${k} saved 0 pieces this run`);
if (!names.length) console.log('::warning title=No results::no store results found in the scraper logs');
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log(md);
