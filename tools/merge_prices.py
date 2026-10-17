"""Intègre des prix envoyés depuis l'appli (bloc ```json``` d'une issue GitHub) dans prices/dakal.json.

Usage : python tools/merge_prices.py <auteur> <fichier résumé>
Le texte de l'issue est lu dans la variable d'environnement ISSUE_BODY.
Règles : objet connu de web/data.json, prix > 0, date AAAA-MM-JJ ;
pour un même objet, le relevé le plus récent gagne (à date égale, le dernier envoyé).
"""
import json, os, re, sys, datetime

author, summary_path = sys.argv[1], sys.argv[2]
body = os.environ.get('ISSUE_BODY', '')
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open(os.path.join(root, 'web', 'data.json'), encoding='utf-8'))
items, ref = data['items'], data.get('ref', {})
store_path = os.path.join(root, 'prices', 'dakal.json')
store = json.load(open(store_path, encoding='utf-8'))
store.setdefault('prix', {})

def out(msg, code):
    open(summary_path, 'w', encoding='utf-8').write(msg)
    sys.exit(code)

m = re.search(r'```json\s*(\{.*?\})\s*```', body, re.S)
if not m:
    out("Je n'ai pas trouvé de bloc ```json``` avec les prix. Renvoie-les depuis l'appli (Paramètres → Partager mes prix).", 1)
try:
    payload = json.loads(m.group(1))
except Exception as e:
    out(f"Le bloc de prix n'est pas lisible ({e}). Renvoie-les depuis l'appli.", 1)

today = datetime.date.today().isoformat()
added, updated, older, rejected, outliers = 0, 0, 0, [], []
for e in payload.get('prix', []):
    sid = str(e.get('id', ''))
    try:
        p = float(e.get('prix'))
    except Exception:
        p = -1
    d = str(e.get('date') or today)[:10]
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', d) or d > today:
        d = today
    if sid not in items or not (0 < p < 1e10):
        rejected.append(str(e.get('nom') or sid))
        continue
    name = items[sid][0]
    cur = store['prix'].get(sid)
    if cur and cur.get('d', '') > d:
        older += 1
        continue
    r = ref.get(sid)
    if r and r[0] and (p > r[0] * 10 or p < r[0] / 10):
        outliers.append(f"{name} : {p:,.0f} (moyenne {r[0]:,.0f})".replace(',', ' '))
    store['prix'][sid] = {'p': round(p, 2), 'd': d, 'n': name, 'par': author}
    if cur: updated += 1
    else: added += 1

if not (added or updated):
    out("Aucun prix nouveau à intégrer" + (f" ({older} plus anciens que ceux déjà partagés)" if older else "") +
        (f". Ignorés (objet inconnu ou prix invalide) : {', '.join(rejected[:20])}" if rejected else "") + ".", 2)

store['maj'] = today
store['serveur'] = 'Dakal'
store['prix'] = dict(sorted(store['prix'].items(), key=lambda kv: int(kv[0])))
json.dump(store, open(store_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(store_path, 'a', encoding='utf-8').write('\n')

msg = [f"Merci @{author} ! **{added} nouveaux prix** et **{updated} mis à jour** dans `prices/dakal.json`.",
       "Tout le monde les reçoit au prochain lancement de l'appli."]
if older: msg.append(f"{older} prix ignorés car plus anciens que ceux déjà partagés.")
if rejected: msg.append(f"Ignorés (objet inconnu ou prix invalide) : {', '.join(rejected[:20])}.")
if outliers: msg.append("À vérifier, plus de 10× d'écart avec la moyenne : " + " · ".join(outliers[:15]) + ".")
out("\n\n".join(msg), 0)
