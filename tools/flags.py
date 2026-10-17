"""Ajoute à web/data.json :
- vit   : objets craftables qui rendent des PV (effet 110) ou de l'énergie (effet 139)
- quest : recettes faisables seulement pendant une quête (critères Qa/Qo/Qf…) ou objets de catégories de quête
Usage : python tools/flags.py <dossier des données brutes du jeu> web/data.json
"""
import json, re, sys, os
raw, out = sys.argv[1], sys.argv[2]
J = json.load(open(os.path.join(raw, 'items.json')))['references']['RefIds']
rid = {x['rid']: x['data'] for x in J}
items = {x['data']['id']: x['data'] for x in J if x['type']['class'] in ('ItemData', 'WeaponData')}
D = json.load(open(out)); T = D['types']
Q = re.compile(r'Q[a-zA-Z]')
QT = {'Quêtes mondiales','Pandala','Astrub','Incarnam','Île de Frigost','Eliocalypse','Krosmoz','Nowel','Événements','Alignement','Bonta & Brakmar','Clef'}
vit, quest = set(), set()
for r in D['recipes']:
    d = items[r[0]]
    acts = {rid[e['rid']]['actionId'] for e in d['possibleEffects']['Array'] if e['rid'] in rid}
    if acts & {110, 139}: vit.add(r[0])
    cr = ' '.join(d.get(k) or '' for k in ('craftConditionalCriterion', 'craftFeasibleCriterion', 'craftVisibleCriterion'))
    if Q.search(cr) or T.get(str(d['typeId'])) in QT: quest.add(r[0])
D['vit'], D['quest'] = sorted(vit), sorted(quest)
json.dump(D, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(vit), 'vie/énergie ·', len(quest), 'quête')
