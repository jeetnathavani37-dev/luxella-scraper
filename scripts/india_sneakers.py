#!/usr/bin/env python3
"""India sneaker market prices -> Supabase (lx_snk_market) via the lx_snk_ingest RPC.

Stores (all Shopify, public products.json):
  cdc         crepdogcrew.com      (resale)
  mainstreet  mainstreet.co.in     (resale)
  superkicks  superkicks.in        (India retail / MRP)

Every in-stock sneaker size becomes one row: store, handle, title, style codes, size (UK), price ₹.
The view lx_v_snk_gap joins these rows with the GOAT 'Drip' catalogue on style code + size
to show where buying in the US and selling in India leaves a margin.

Usage:  LX_CAT_KEY=... python3 scripts/india_sneakers.py [cdc,mainstreet,superkicks] [--dry out.json]
"""
import json, os, re, sys, time, urllib.request

SB = 'https://qzripzgbstvxkfobzhyv.supabase.co'
ANON = os.environ.get('SB_ANON', 'sb_publishable_-EA-q_dacUuWovbrCW5XVw_pPZ2vK_O')  # public publishable key
KEY = os.environ.get('LX_CAT_KEY') or (open(os.environ['LX_CAT_KEY_FILE']).read().strip() if os.environ.get('LX_CAT_KEY_FILE') else '')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36'
STORES = {
    'cdc': 'https://crepdogcrew.com',
    'mainstreet': 'https://www.mainstreet.co.in',
    'superkicks': 'https://www.superkicks.in',
}
SNEAKER = re.compile(r'sneaker|shoe|footwear|jordan|dunk|air force|air max|yeezy|samba|gazelle|campus|new balance|asics|gel-|onitsuka|salomon|vomero|spezial|\b(nb|9060|990|2002r|1906r|550|530)\b', re.I)
NOT_SNEAKER = re.compile(r'\b(tee|t-shirt|hoodie|sweatshirt|jacket|pants|shorts|cap|hat|socks|bag|backpack|keychain|cleaner|lace|crease|toy|figure|watch|perfume|jersey|sweatpant|trouser|denim|shirt|vest|beanie)\b', re.I)
# style codes
NIKE = re.compile(r'\b([A-Z]{2}\d{4}|\d{6})[- ](\d{3})\b')
ADI = re.compile(r'\b([A-Z]{2}\d{4})\b')
NB = re.compile(r'\b([UMWBG][A-Z]?\d{3,4}[A-Z0-9]{2,5})\b')
ASICS = re.compile(r'\b(1[0-2]\d{2}[A-Z]\d{3})[- .]?(\d{3})\b')
PUMA = re.compile(r'\b(\d{6})[- ](\d{2})\b')
CONV = re.compile(r'\b(A?\d{5,6}C)\b')
SAL = re.compile(r'\b(L\d{8})\b')


def get(url, tries=3):
    for t in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except Exception as e:  # noqa
            if t == tries - 1:
                print('  fail', url, e, flush=True)
                return None
            time.sleep(4 * (t + 1))


def styles_of(text, sku=''):
    """All candidate style codes in the text, normalised to A-Z0-9 only (CZ0790-102 -> CZ0790102)."""
    t = (text or '').upper()
    out = []
    for m in NIKE.finditer(t):
        out.append(m.group(1) + m.group(2))
    for m in ASICS.finditer(t):
        out.append(m.group(1) + m.group(2))
    for m in PUMA.finditer(t):
        out.append(m.group(1) + m.group(2))
    for rx in (SAL, CONV, NB, ADI):
        out += [m.group(1) for m in rx.finditer(t)]
    s = (sku or '').upper()
    if s:
        s = re.sub(r'-(\d+(\.\d)?|UK.*|US.*)$', '', s)  # superkicks: STYLE-SIZE
        s = re.sub(r'[^A-Z0-9]', '', s)
        if 5 <= len(s) <= 14 and re.search(r'\d', s) and re.search(r'[A-Z]', s):
            out.append(s)
    seen, res = set(), []
    for x in out:
        if x not in seen and not re.fullmatch(r'UK\d+', x):
            seen.add(x); res.append(x)
    return res[:8]


def size_of(store, opts):
    """Return UK size string like '8.5' from variant option values."""
    for o in opts:
        o = str(o or '')
        m = re.search(r'UK\s*([0-9]{1,2}(?:\.5)?)', o, re.I)
        if m:
            return m.group(1)
    if store == 'superkicks':  # superkicks shows UK sizes as bare numbers
        for o in opts:
            if re.fullmatch(r'\s*[0-9]{1,2}(\.5)?\s*', str(o or '')):
                return str(o).strip()
    return ''


def scrape(store, base, cap_pages=80):
    rows, n_prod = [], 0
    for page in range(1, cap_pages + 1):
        d = get(f'{base}/products.json?limit=250&page={page}')
        if not d or not d.get('products'):
            break
        for p in d['products']:
            n_prod += 1
            title = re.sub(r'\s+', ' ', p.get('title') or '').strip()
            ptype = p.get('product_type') or ''
            tags = ' '.join(p.get('tags') or [])
            blob = f'{title} {ptype} {tags}'
            if not SNEAKER.search(blob) or NOT_SNEAKER.search(title):
                continue
            body = re.sub(r'<[^>]+>', ' ', p.get('body_html') or '')
            sku0 = (p.get('variants') or [{}])[0].get('sku') if store == 'superkicks' else ''  # only Superkicks SKUs carry the style code
            styles = styles_of(f'{title} {body} {tags}', sku0)
            women = bool(re.search(r"\(w\)|wmns|women", title, re.I))
            img = ((p.get('images') or [{}])[0] or {}).get('src', '')
            for v in p.get('variants') or []:
                uk = size_of(store, [v.get('option1'), v.get('option2'), v.get('option3'), v.get('title')])
                if not uk:
                    continue
                try:
                    price = round(float(v.get('price') or 0))
                except ValueError:
                    continue
                if price <= 0 or not v.get('available'):
                    continue  # only sizes a buyer can actually get today
                rows.append({'store': store, 'handle': p.get('handle'), 'title': title, 'brand': p.get('vendor') or '',
                             'styles': styles, 'women': women, 'size_uk': uk, 'price': price,
                             'available': bool(v.get('available')), 'url': f"{base}/products/{p.get('handle')}", 'img': img})
        print(f'  {store} page {page} · products {n_prod} · sneaker rows {len(rows)}', flush=True)
        time.sleep(1.2)
    return rows


def ingest(rows):
    saved = 0
    for i in range(0, len(rows), 1500):
        body = json.dumps({'k': KEY, 'rows': rows[i:i + 1500]}).encode()
        req = urllib.request.Request(f'{SB}/rest/v1/rpc/lx_snk_ingest', data=body, method='POST',
                                     headers={'apikey': ANON, 'Authorization': f'Bearer {ANON}', 'Content-Type': 'application/json'})
        for t in range(3):
            try:
                with urllib.request.urlopen(req, timeout=120) as r:
                    saved += int(json.load(r) or 0)
                break
            except Exception as e:  # noqa
                print('  ingest error', getattr(e, 'code', ''), str(e)[:200], flush=True)
                time.sleep(5)
    return saved


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    pick = (args[0].split(',') if args else list(STORES))
    dry = sys.argv[sys.argv.index('--dry') + 1] if '--dry' in sys.argv else None
    allrows = []
    for s in pick:
        print('==', s, flush=True)
        r = scrape(s, STORES[s])
        print(f'  {s}: {len(r)} rows, {sum(1 for x in r if x["styles"])} with style code', flush=True)
        if not dry:
            print(f'  {s}: saved', ingest(r), flush=True)
        allrows += r
    if dry:
        json.dump(allrows, open(dry, 'w'))
    print('INDIA SNEAKERS DONE ·', len(allrows), 'rows', flush=True)
