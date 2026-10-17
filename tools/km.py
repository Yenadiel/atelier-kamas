import json,re,unicodedata,sys
def norm(s):
    s=s.lower().replace('œ','oe').replace('æ','ae');s=unicodedata.normalize('NFD',s);s=''.join(c for c in s if unicodedata.category(c)!='Mn')
    return re.sub(r'\s+',' ',s.replace('’',"'")).strip()
num=lambda s:int(re.sub(r'[^\d]','',s))
def parse(path):
    L=[l.rstrip('\n') for l in open(path,encoding='utf-8')]
    ing={};sale={}
    for i,l in enumerate(L):
        m=re.match(r'^(\d+)x (.+)$',l)
        if m and i+1<len(L):
            m2=re.match(r'^([\d,]+) K / unité$',L[i+1])
            if m2: ing.setdefault(m.group(2).strip(),[]).append(num(m2.group(1)))
        if l=='Vente HDV' and i+1<len(L) and re.match(r'^[\d,]+ K$',L[i+1]):
            roi=None
            for j in range(i,min(i+9,len(L)-1)):
                if L[j]=='ROI': roi=num(L[j+1]);break
            sale[L[i-3]]=(num(L[i+1]),roi)
    return len(L),ing,sale
files=sys.argv[1:]
ING={};SALE={}
for f in files:
    n,ing,sale=parse(f);print(f.split('/')[-1],'lignes',n,'ingrédients',len(ing),'ventes',len(sale))
    for k,v in ing.items(): ING.setdefault(k,[]).extend(v)
    SALE.update(sale)
D=json.load(open('/home/claude/build/data.json'))
byname={}
for k,v in D['items'].items(): byname.setdefault(norm(v[0]),k)
ref={};unk=set();outl=0
for n,ps in ING.items():
    ps=sorted(ps);k=byname.get(norm(n))
    if k: ref[k]=[ps[len(ps)//2],1]
    else: unk.add(n)
for n,(p,roi) in SALE.items():
    k=byname.get(norm(n))
    if not k: unk.add(n);continue
    if k in ref: continue
    if roi is not None and roi>1000: outl+=1;continue
    ref[k]=[p,1]
print('total prix de référence',len(ref),'(ingrédients distincts',len(ING),', ventes',len(SALE),', aberrantes écartées',outl,')')
D['ref']=ref;D['refInfo']={'src':'KamaMaster · Dakal','date':'2026-10-10'}
open('/home/claude/build/data.json','w').write(json.dumps(D,ensure_ascii=False,separators=(',',':')))
for j,nm in [(27,'Tailleur'),(16,'Bijoutier'),(11,'Forgeron'),(15,'Cordonnier'),(60,'Façonneur'),(13,'Sculpteur')]:
    s=set(str(r[4][i]) for r in D['recipes'] if r[1]==j for i in range(0,len(r[4]),2))
    print(nm,len(s&set(ref)),'/',len(s))
