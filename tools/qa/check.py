#!/usr/bin/env python3
"""Luxella portal watchdog.
Runs the portal from this repo on an iPhone-sized WebKit + Chromium page, with Supabase mocked by fixtures,
walks every main screen, and writes tools/qa/out/report.json + screenshots.
Also smoke-tests production (site, key assets, voice function).

Fixtures: tools/qa/fixtures/orders.json (synthetic, committed) and, optionally,
tools/qa/.fixtures/cat.json + deals.json (real catalogue rows exported at run time, never committed).
Usage: python3 tools/qa/check.py [--prod-only] [--engine webkit|chromium|both]
Exit code 0 = healthy, 1 = problems found (see report)."""
import json, os, sys, time, threading, functools, http.server, base64, urllib.request, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
SUPA = 'qzripzgbstvxkfobzhyv.supabase.co'
PROD = ['https://luxellaclients.duckdns.org/', 'https://luxella-client.vercel.app/']
args = sys.argv[1:]
ENG = (args[args.index('--engine') + 1] if '--engine' in args else 'both')
problems, notes = [], []

def load(p, d):
    try: return json.load(open(p))
    except Exception: return d

ORD = load(os.path.join(HERE, 'fixtures/orders.json'), [])
CAT = load(os.path.join(HERE, '.fixtures/cat.json'), [])
DEALS = load(os.path.join(HERE, '.fixtures/deals.json'), [])

# ---------- production smoke ----------
def get(u, data=None, timeout=25):
    req = urllib.request.Request(u, data=data, headers={'User-Agent': 'LuxellaWatchdog/1', 'Content-Type': 'application/json'})
    t = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read(), round(time.time() - t, 2)

for base in PROD:
    try:
        st, body, dt = get(base)
        html = body.decode('utf8', 'ignore')
        if st != 200 or 'shim.js' not in html: problems.append(f'PROD {base} status {st} or shim missing')
        else: notes.append(f'prod {base} ok {dt}s')
        import re
        for a in sorted(set(re.findall(r'(?:src|href)="([^"]+\.(?:js|css)[^"]*)"', html)))[:20]:
            if a.startswith('http'): continue
            try:
                s2, _, _ = get(urllib.parse.urljoin(base, a))
                if s2 != 200: problems.append(f'PROD asset {a} -> {s2}')
            except Exception as e: problems.append(f'PROD asset {a} -> {e}')
    except Exception as e: problems.append(f'PROD {base} unreachable: {e}')
try:
    st, body, dt = get(f'https://{SUPA}/functions/v1/lx-voice?cap=1&t=0000000000000000000000000000')
    notes.append(f'lx-voice up {dt}s')
except Exception as e: problems.append(f'lx-voice down: {e}')

if '--prod-only' in args:
    json.dump({'at': time.strftime('%Y-%m-%d %H:%M:%S'), 'problems': problems, 'notes': notes}, open(os.path.join(OUT, 'report.json'), 'w'), indent=1)
    print(json.dumps({'problems': problems, 'notes': notes}, indent=1)); sys.exit(1 if problems else 0)

# ---------- local portal walk ----------
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8139), functools.partial(Q, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
CID = '00000000-0000-4000-8000-0000000000a1'
def b64(o): return base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip('=')
exp = int(time.time()) + 86400
jwt = b64({'alg': 'HS256', 'typ': 'JWT'}) + '.' + b64({'sub': 'qa', 'email': 'qa@example.com', 'exp': exp, 'role': 'authenticated', 'aud': 'authenticated'}) + '.x'
sess = {'access_token': jwt, 'token_type': 'bearer', 'expires_in': 86400, 'expires_at': exp, 'refresh_token': 'r', 'user': {'id': 'qa', 'email': 'qa@example.com', 'aud': 'authenticated', 'role': 'authenticated'}}
def J(route, obj, headers=None):
    return route.fulfill(status=200, content_type='application/json', headers=headers or {}, body=json.dumps(obj))
def handle(route, req):
    u = req.url
    if '/functions/v1/' in u: return J(route, {'text': 'QA reply', 'ai': True, 'tts': False, 'cards': []})
    if '/auth/v1/' in u: return J(route, sess['user'])
    if '/rest/v1/lx_clients' in u: return J(route, [{'id': CID, 'slug': 'qa', 'name': 'QA Client', 'data': {}}])
    if '/rest/v1/lx_client_users' in u: return J(route, [{'client_id': CID, 'email': 'qa@example.com', 'role': 'client'}])
    if '/rest/v1/lx_orders' in u: return J(route, ORD)
    if '/rest/v1/lx_deals' in u: return J(route, DEALS)
    if '/rest/v1/rpc/lx_catalog_facets' in u:
        B, C = {}, {}
        for x in CAT: B[x.get('brand')] = B.get(x.get('brand'), 0) + 1; C[x.get('category')] = C.get(x.get('category'), 0) + 1
        return J(route, {'brands': [[k, v] for k, v in B.items() if k], 'cats': [[k, v, ''] for k, v in C.items() if k], 'total': len(CAT)})
    if '/rest/v1/lx_catalog' in u:
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(u).query); lim = int((qs.get('limit') or ['24'])[0]); off = int((qs.get('offset') or ['0'])[0])
        rows = CAT[off:off + lim]
        return J(route, rows, {'content-range': f'{off}-{off + len(rows) - 1}/{len(CAT)}', 'access-control-expose-headers': 'content-range'})
    if '/rest/v1/' in u: return J(route, [] if req.method == 'GET' else {})
    if '/storage/v1/' in u and req.method != 'GET': return J(route, {'Key': 'qa'})
    return route.continue_()

STEPS = [
    ('home', "()=>window.scrollTo(0,0)"),
    ('home-scrolled', "()=>window.scrollTo(0,1600)"),
    ('edit-arrivals', "()=>{const t=document.getElementById('tab-deals');t&&t.click()}"),
    ('boutique', "()=>{const b=[...document.querySelectorAll('.dl-vs-b')].find(x=>/boutique/i.test(x.textContent));b&&b.click()}"),
    ('boutique-mid', "()=>{const p=document.getElementById('pane-deals');p&&p.scrollTo(0,4000)}"),
    ('boutique-deep', "()=>{const p=document.getElementById('pane-deals');p&&p.scrollTo(0,9000)}"),
    ('product', "()=>{const c=[...document.querySelectorAll('.cl-card')].find(x=>x.querySelector('img'));c&&c.click()}"),
    ('product-swipe', "()=>{const g=document.querySelector('.cl-dt .cl-gal');if(g){window.__gl=g.scrollLeft;g.scrollTo({left:g.clientWidth,behavior:'instant'})}}"),
]
PROBE = """()=>{
 const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight};
 const imgs=[...document.images].filter(vis);
 const broken=imgs.filter(i=>i.complete&&i.naturalWidth===0&&i.src&&!i.src.startsWith('data:')).map(i=>i.src.slice(0,120));
 const inf=document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.getTiming().iterations===Infinity).length;
 const g=document.querySelector('.cl-dt .cl-gal');
 const overflowX=document.documentElement.scrollWidth>innerWidth+2;
 const txt=document.body.innerText||'';
 return {nodes:document.getElementsByTagName('*').length,visImgs:imgs.length,broken:broken.slice(0,8),infiniteAnims:inf,overflowX,
   galleryScrolls:g?(g.scrollLeft>0||g.scrollWidth<=g.clientWidth+2):null,undefinedText:/\\bundefined\\b|\\bNaN\\b|\\[object Object\\]/.test(txt)};
}"""
summary = []
with sync_playwright() as p:
    engines = ['webkit', 'chromium'] if ENG == 'both' else [ENG]
    for eng in engines:
        b = getattr(p, eng).launch()
        ctx = b.new_context(**p.devices['iPhone 14']) if eng == 'webkit' else b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        ctx.add_init_script("localStorage.setItem('sb-qzripzgbstvxkfobzhyv-auth-token',%s)" % json.dumps(json.dumps(sess)))
        ctx.route(f'**/{SUPA}/**', handle)
        pg = ctx.new_page(); errs = []; bad = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:240]))
        pg.on('crash', lambda *_: errs.append('PAGE CRASH'))
        pg.on('response', lambda r: bad.append(f'{r.status} {r.url[:140]}') if r.status >= 400 and '127.0.0.1' in r.url else None)
        t0 = time.time()
        try:
            pg.goto('http://127.0.0.1:8139/?c=qa', timeout=60000); pg.wait_for_timeout(4500)
            pg.evaluate("()=>{document.querySelectorAll('button').forEach(b=>{if(/got it/i.test(b.textContent))b.click()});document.querySelectorAll('.nt-ov,.lx-sheet-back').forEach(x=>x.remove())}")
        except Exception as e: errs.append('LOAD ' + str(e)[:200])
        notes.append(f'{eng} first paint+settle {round(time.time() - t0, 1)}s')
        for name, js in STEPS:
            try:
                pg.evaluate(js); pg.wait_for_timeout(3500 if name in ('boutique', 'product') else 1600)
                r = pg.evaluate(PROBE); r['step'] = name; r['engine'] = eng; summary.append(r)
                pg.screenshot(path=os.path.join(OUT, f'{eng}-{name}.png'))
                if r['broken']: problems.append(f'{eng}/{name}: broken images {r["broken"][:3]}')
                if r['overflowX']: problems.append(f'{eng}/{name}: page scrolls sideways (layout overflow)')
                if r['undefinedText']: problems.append(f'{eng}/{name}: "undefined/NaN/[object Object]" visible in text')
                if r['infiniteAnims'] > 40: problems.append(f'{eng}/{name}: {r["infiniteAnims"]} endless animations running (jank risk)')
                if name == 'product-swipe' and r['galleryScrolls'] is False: problems.append(f'{eng}: product photo gallery does not swipe')
                if r['nodes'] > 25000: problems.append(f'{eng}/{name}: {r["nodes"]} DOM nodes (crash risk on iPhone)')
            except Exception as e: problems.append(f'{eng}/{name}: step failed {str(e)[:160]}')
        for e in errs: problems.append(f'{eng} JS error: {e}')
        for x in bad[:10]: problems.append(f'{eng} local 4xx/5xx: {x}')
        b.close()
srv.shutdown()
rep = {'at': time.strftime('%Y-%m-%d %H:%M:%S'), 'problems': problems, 'notes': notes, 'steps': summary}
json.dump(rep, open(os.path.join(OUT, 'report.json'), 'w'), indent=1)
print(json.dumps({'problems': problems, 'notes': notes}, indent=1))
sys.exit(1 if problems else 0)
