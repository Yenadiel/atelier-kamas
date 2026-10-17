import json,os
from PIL import Image
fr=json.load(open('fr.json'))['entries']
items={x['data']['id']:x['data'] for x in json.load(open('items.json'))['references']['RefIds'] if x['type']['class'] in ('ItemData','WeaponData')}
D=json.load(open('/home/claude/build/data.json'))
hdv=json.load(open('hdv_matched.json'))
km=D['ref']  # KamaMaster + premières captures
ids=set(D['items'])|set(hdv)|set(km)
base='/home/claude/icons_raw/x/data/img/item/1x/'
icons={};order=[]
for sid in sorted(ids,key=int):
    ic=items[int(sid)]['iconId']
    if os.path.exists(f'{base}{ic}-64.png') and ic not in icons: icons[ic]=len(order);order.append(ic)
newItems={}
for sid in ids:
    it=items[int(sid)]
    newItems[sid]=[fr.get(str(it['nameId'])) or '#'+sid,it['level'],it['typeId'],icons.get(it['iconId'],-1)]
ref={}
for k,v in km.items(): ref[k]=[v[0],1]
for k,v in hdv.items(): ref[k]=[v['p'],2]
cat={k:v['c'] for k,v in hdv.items()}
lots={}
for name,l in [('Quisnoa',{1:1989,10:16990,100:179991,1000:1750000}),('Pépite',{1:567,10:4989,100:30000,1000:374987})]:
    k=[i for i,v in newItems.items() if v[0]==name][0]; lots[k]=l
D.update(items=newItems,ref=ref,cat=cat,lots=lots,refInfo={'date':'2026-10-10'})
S=48;COLS=32;PER=COLS*32
D['icon']={'size':S,'cols':COLS,'per':PER}
os.makedirs('/home/claude/build/ico',exist_ok=True)
for f in os.listdir('/home/claude/build/ico'): os.remove('/home/claude/build/ico/'+f)
for sh in range((len(order)+PER-1)//PER):
    chunk=order[sh*PER:(sh+1)*PER];rows=(len(chunk)+COLS-1)//COLS
    im=Image.new('RGBA',(COLS*S,rows*S),(0,0,0,0))
    for i,ic in enumerate(chunk):
        im.paste(Image.open(f'{base}{ic}-64.png').convert('RGBA').resize((S,S),Image.LANCZOS),((i%COLS)*S,(i//COLS)*S))
    im.save(f'/home/claude/build/ico/s{sh}.webp','WEBP',quality=80,method=4)
json.dump(D,open('/home/claude/build/data.json','w'),ensure_ascii=False,separators=(',',':'))
print('objets',len(newItems),'icônes',len(order),'prix',len(ref),'dont HDV',sum(1 for v in ref.values() if v[1]==2),'sprites',os.listdir('/home/claude/build/ico'))
