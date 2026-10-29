#!/usr/bin/env python3
"""Deploy the client portal (repo root) to Vercel project 'luxella' (production).
Needs env VT (Vercel token) and TEAM. Keeps private proof images (assets/p, not in git) via keep.json shas."""
import os,re,json,time,hashlib,base64,urllib.request,urllib.error,sys
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'));os.chdir(ROOT)
VT=os.environ.get('VT');TEAM=os.environ.get('TEAM','team_JRDOohhEdB4BTllyNpGmKeIS');API='https://api.vercel.com'
if not VT: sys.exit('VT (Vercel token) missing')
for must in ('index.html','app.js','shim.js','style.css','deals.js'):
    if not os.path.exists(must): sys.exit('refusing: '+must+' missing')
V=str(int(time.time()))
s=open('shim.js').read();s=re.sub(r"src='([a-z0-9]+\.js)(\?v=[0-9a-z]+)?'",lambda m:"src='"+m.group(1)+"?v="+V+"'",s);open('shim.js','w').write(s)
h=open('index.html').read();h=re.sub(r'src="shim\.js(\?v=[0-9]+)?"','src="shim.js?v='+V+'"',h);h=re.sub(r'href="style\.css(\?v=[0-9]+)?"','href="style.css?v='+V+'"',h);h=re.sub(r'lux-motion\.js\?v=[0-9]+','lux-motion.js?v='+V,h);open('index.html','w').write(h)
def call(method,path,body=None):
    data=json.dumps(body).encode() if body is not None else None
    for i in range(6):
        req=urllib.request.Request(API+path,data=data,method=method);req.add_header('Authorization','Bearer '+VT)
        if data is not None: req.add_header('Content-Type','application/json')
        try:
            with urllib.request.urlopen(req,timeout=90) as r: return r.status,json.loads(r.read() or b'{}')
        except urllib.error.HTTPError as e: return e.code,json.loads(e.read() or b'{}')
        except Exception: time.sleep(2+2*i)
    sys.exit('gave up '+path)
files=[]
for dp,_,fs in os.walk('.'):
    if any(x in dp.split(os.sep) for x in ('.git','.github','b2b-site','supabase','hq','tools')): continue
    for f in fs:
        if f in('README.md','.gitignore') or (f.endswith('.png') and dp=='.'): continue
        p=os.path.relpath(os.path.join(dp,f),'.');b=open(p,'rb').read();files.append({'file':p,'sha':hashlib.sha1(b).hexdigest(),'size':len(b)})
have={x['file'] for x in files}
for k in json.load(open(os.path.join(ROOT,'tools/qa/keep.json'))):
    if k['file'] not in have: files.append(k)
BODY={'name':'luxella','project':'luxella','target':'production','files':files,'projectSettings':{'framework':None,'buildCommand':None,'outputDirectory':None,'installCommand':None}}
for _ in range(3):
    st,d=call('POST',f'/v13/deployments?teamId={TEAM}&forceNew=1',BODY)
    miss=set((d.get('error') or {}).get('missing') or [])
    if not miss: break
    bad=[x['file'] for x in files if x['sha'] in miss and not os.path.exists(x['file'])]
    if bad: sys.exit('refusing: Vercel no longer has kept files '+str(bad))
    BODY['files']=[({'file':x['file'],'data':base64.b64encode(open(x['file'],'rb').read()).decode(),'encoding':'base64'} if x['sha'] in miss else x) for x in files]
if not d.get('id'): sys.exit('deploy failed '+json.dumps(d)[:300])
for i in range(60):
    st,x=call('GET',f"/v13/deployments/{d['id']}?teamId={TEAM}")
    if x.get('readyState') in('READY','ERROR','CANCELED'): print(x.get('readyState'),d.get('url'));break
    time.sleep(5)
