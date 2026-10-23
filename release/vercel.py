#!/usr/bin/env python3
"""Vercel helper for the B2B portal. Token comes from env VT, team from TEAM.
  vercel.py deploy <dir>          -> uploads <dir>, creates a production deployment
                                     WITHOUT moving the live domain; prints its id
  vercel.py alias <deployment_id> -> points luxella-b2b.vercel.app at that deployment
  vercel.py current               -> prints the deployment id the live domain serves
"""
import os, sys, json, hashlib, urllib.request, urllib.error, time
VT = os.environ['VT']; TEAM = os.environ['TEAM']; API = 'https://api.vercel.com'
DOMAIN = 'luxella-b2b.vercel.app'; PROJECT = 'luxella-b2b'

def call(method, path, body=None, raw=None, ctype='application/json', extra=None, tries=6):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    for i in range(tries):
        req = urllib.request.Request(API + path, data=data, method=method)
        req.add_header('Authorization', 'Bearer ' + VT)
        if data is not None: req.add_header('Content-Type', ctype)
        for k, v in (extra or {}).items(): req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=90) as r: return r.status, json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')
        except Exception: time.sleep(2 + 2 * i)
    sys.exit('gave up ' + path)

def deploy(root):
    files = []
    for dp, _, fs in os.walk(root):
        for f in fs:
            full = os.path.join(dp, f); rel = os.path.relpath(full, root)
            b = open(full, 'rb').read(); sha = hashlib.sha1(b).hexdigest()
            s, r = call('POST', f'/v2/files?teamId={TEAM}', raw=b, ctype='application/octet-stream', extra={'x-vercel-digest': sha})
            assert s in (200, 201, 409), (rel, s, r)
            files.append({'file': rel, 'sha': sha, 'size': len(b)})
    # autoAssignCustomDomains=false keeps the live domain where it is until we alias after tests
    s, d = call('POST', f'/v13/deployments?teamId={TEAM}&forceNew=1', {
        'name': PROJECT, 'project': PROJECT, 'target': 'production', 'files': files,
        'autoAssignCustomDomains': False,
        'projectSettings': {'framework': None, 'buildCommand': None, 'outputDirectory': None, 'installCommand': None}})
    if s >= 300: sys.exit(f'deploy failed {s} {d}')
    for _ in range(60):
        s, x = call('GET', f"/v13/deployments/{d['id']}?teamId={TEAM}")
        if x.get('readyState') == 'READY': print(d['id']); return
        if x.get('readyState') in ('ERROR', 'CANCELED'): sys.exit('deploy ' + x.get('readyState'))
        time.sleep(4)
    sys.exit('deploy timeout')

def alias(dep):
    s, r = call('POST', f'/v2/deployments/{dep}/aliases?teamId={TEAM}', {'alias': DOMAIN})
    if s >= 300: sys.exit(f'alias failed {s} {r}')
    print('aliased', DOMAIN, '->', dep)

def current():
    s, r = call('GET', f'/v4/aliases/{DOMAIN}?teamId={TEAM}')
    print(r.get('deploymentId') or r.get('deployment', {}).get('id') or json.dumps(r)[:200])

if __name__ == '__main__':
    cmd = sys.argv[1]
    {'deploy': lambda: deploy(sys.argv[2]), 'alias': lambda: alias(sys.argv[2]), 'current': current}[cmd]()
