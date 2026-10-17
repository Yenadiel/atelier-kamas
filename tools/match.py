import json,re,unicodedata,glob,collections
def norm(s):
    s=s.lower().replace('œ','oe').replace('æ','ae').replace('’',"'");s=unicodedata.normalize('NFD',s);s=''.join(c for c in s if unicodedata.category(c)!='Mn')
    return re.sub(r'\s+',' ',s).strip()
fr=json.load(open('fr.json'))['entries']
items={x['data']['id']:x['data'] for x in json.load(open('items.json'))['references']['RefIds'] if x['type']['class'] in ('ItemData','WeaponData')}
byn=collections.defaultdict(list)
for i in items.values():
    n=fr.get(str(i['nameId']))
    if n: byn[norm(n)].append(i)
rows=[];cat=None
for f in sorted(glob.glob('hdv/p*.txt')):
    for l in open(f,encoding='utf-8'):
        l=l.strip()
        if not l: continue
        if l.startswith('#'): cat=l[1:];continue
        n,lv,p=l.split('|');rows.append((cat,n,int(lv),int(p)))
print('lignes',len(rows),'catégories',len(set(r[0] for r in rows)))
res={};miss=[];dup=collections.Counter()
for cat,n,lv,p in rows:
    cands=[]
    if n.endswith('*'):
        pre=norm(n[:-1]);cands=[i for k,v in byn.items() if k.startswith(pre) for i in v]
    else: cands=byn.get(norm(n),[])
    if len(cands)>1:
        c2=[i for i in cands if i['level']==lv]; cands=c2 or cands
        c3=[i for i in cands if i['typeId'] not in (203,)]; cands=c3 or cands
    if not cands: miss.append((cat,n,lv));continue
    it=cands[0]; dup[it['id']]+=1
    res[it['id']]={'p':p,'c':cat,'n':fr[str(it['nameId'])]}
print('rapprochés',len(res),'non trouvés',len(miss))
for m in miss: print('  ?',m)
print('doublons',[ (res[k]['n'],c) for k,c in dup.items() if c>1])
json.dump({str(k):v for k,v in res.items()},open('hdv_matched.json','w'),ensure_ascii=False)
