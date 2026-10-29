#!/usr/bin/env python3
"""CI guard: blocks agent commits that touch protected areas, and any commit that leaks secrets.
Usage: python3 tools/qa/guard.py <before_sha> <after_sha>"""
import subprocess, sys, re
before, after = (sys.argv[1:3] + ['', ''])[:2]
if not before or set(before) == {'0'}: before = after + '~1'
def git(*a): return subprocess.run(['git', *a], capture_output=True, text=True).stdout
AGENT = re.compile(r'^(watchdog|panel|design|backend|growth|chief)\s*:', re.I)
PROTECTED = ('.github/', 'tools/agents/CONSTITUTION.md', 'tools/agents/TEAM.md', 'tools/qa/', 'supabase/', 'vercel.json')
SECRET = re.compile(r'(vcp_[A-Za-z0-9_]{20,}|sb_secret_[A-Za-z0-9_-]{10,}|eyJhbGciOi[A-Za-z0-9._-]{60,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}|sk_live_[A-Za-z0-9]{10,})')
bad = []
for sha in git('rev-list', f'{before}..{after}').split():
    msg = git('log', '-1', '--format=%s', sha).strip()
    files = git('diff-tree', '--no-commit-id', '--name-only', '-r', sha).split()
    if AGENT.match(msg):
        hit = [f for f in files if f.startswith(PROTECTED)]
        if hit: bad.append(f'{sha[:7]} "{msg}" — agent commit touches protected paths: {hit}')
        if len(files) > 12: bad.append(f'{sha[:7]} "{msg}" — agent commit changes {len(files)} files (max 12)')
    added = '\n'.join(l for l in git('show', '--format=', '-U0', sha, '--', '.', ':(exclude)tools/qa/guard.py').splitlines() if l.startswith('+') and not l.startswith('+++'))
    m = SECRET.search(added)
    if m: bad.append(f'{sha[:7]} "{msg}" — looks like a secret was committed ({m.group(0)[:8]}…)')
if bad:
    print('GUARD BLOCKED:'); [print(' -', b) for b in bad]; sys.exit(1)
print('guard ok')
