import math
def xp(L,ratio,job):
    g=job-L
    if g<0: return 0
    return math.floor(20*L*ratio/100/(g**1.1/10+1))
def sim(L,ratio,start,end):
    job=start; cur=0; crafts=0; need=20*job
    while job<end:
        cur+=xp(L,ratio,job); crafts+=1
        while cur>=20*job and job<end: cur-=20*job; job+=1
    tot=sum(20*l for l in range(start,end))
    return tot/crafts
meas={1:(100,11.765),10:(15,18.297),20:(10,24.937),30:(10,37.809),100:(10,129.413),190:(10,246.987)}
for L,(r,m) in meas.items():
    s=max(L,1); print(L, round(sim(L,r,s,s+10),3), m)
