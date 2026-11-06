"""Récupère tous les stuffs publiés sur huzounet.fr (API publique) et liste les objets qu'ils utilisent.
Sortie : web/huz.json = {maj, stuffs, objets: {id: [nom, nb de stuffs, niveau du plus petit stuff]}}
Les objets cités dans des stuffs se revendent : l'appli les privilégie quand elle choisit les crafts."""
import json, os, sys, time, unicodedata, urllib.request, datetime
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(root, 'web', 'data.json'), encoding='utf-8'))
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD', s.lower().strip()) if unicodedata.category(c) != 'Mn')
by = {}
for i, it in D['items'].items(): by.setdefault(norm(it[0]), i)
def get(page):
    url = f'https://huzounet.fr/api/equipments?limit=100&page={page}&depth=1'
    req = urllib.request.Request(url, headers={'User-Agent': 'atelier-kamas (outil perso Dofus)'})
    for k in range(4):
        try: return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception as e: print('essai', k, e); time.sleep(5 * (k + 1))
    raise SystemExit('API Huzounet injoignable')
def names(x, out, top=True):
    """tous les champs « name » sous les emplacements d'objets du stuff"""
    if isinstance(x, dict):
        for k, v in x.items():
            if k in ('name', 'nom') and isinstance(v, str) and not top: out.append(v)
            elif isinstance(v, (dict, list)): names(v, out, False)
    elif isinstance(x, list):
        for v in x: names(v, out, False)
seen, stuffs, page = {}, 0, 1
while True:
    j = get(page)
    for doc in j.get('docs', []):
        stuffs += 1; got = []
        try: lv = int(doc.get('level') or 200)
        except Exception: lv = 200
        names({k: v for k, v in doc.items() if k not in ('title', 'name', 'slug', 'author', 'user', 'createdBy', 'updatedBy')}, got)
        for n in set(got):
            i = by.get(norm(n))
            if not i: continue
            e = seen.setdefault(i, [D['items'][i][0], 0, lv]); e[1] += 1; e[2] = min(e[2], lv)
    if page == 1: print('exemple de stuff :', json.dumps(j['docs'][0], ensure_ascii=False)[:1500])
    if not j.get('hasNextPage'): break
    page += 1; time.sleep(1)
out = {'maj': datetime.date.today().isoformat(), 'source': 'huzounet.fr/equipments', 'stuffs': stuffs, 'objets': seen}
json.dump(out, open(os.path.join(root, 'web', 'huz.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(stuffs, 'stuffs ;', len(seen), 'objets craftables connus de l’appli')
