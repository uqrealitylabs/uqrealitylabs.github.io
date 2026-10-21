import concurrent.futures, gzip, json, math, struct, urllib.request
from array import array
from pathlib import Path

root=Path('work/world/council');root.mkdir(exist_ok=True)
base='https://services1.arcgis.com/HrMiNYsSqqPpLTDE/arcgis/rest/services/Brisbane_buildings/SceneServer/layers/0/nodes/'
def get(path):
 p=root/path.replace('/','-')
 if p.exists():return p.read_bytes()
 b=urllib.request.urlopen(base+path,timeout=30).read()
 if b[:2]==b'\x1f\x8b':b=gzip.decompress(b)
 if len(b)>16_000_000:raise ValueError('Map tile exceeds budget')
 p.write_bytes(b);return b
def tile(item):
 node=json.loads(get(item['id']+'?f=json'));data=get(item['id']+'/geometries/0')
 n,f=struct.unpack_from('<II',data);assert 0<n<500_000
 xyz=array('f');xyz.frombytes(data[8:8+n*12]);norm=array('f');norm.frombytes(data[8+n*12:8+n*24])
 color=data[8+n*32:8+n*36];assert len(color)==n*4
 a,b,c=node['mbs'][:3]
 for i in range(0,len(xyz),3):
  lon=(a+xyz[i])/6378137*180/math.pi;lat=math.atan(math.exp((b+xyz[i+1])/6378137))*360/math.pi-90
  xyz[i],xyz[i+1],xyz[i+2]=(lon-153.01302)*2469,(c+xyz[i+2])/40,-(lat+27.4974)*2783
  norm[i+1],norm[i+2]=norm[i+2],-norm[i+1]
 return xyz,norm,color
r=json.load(open('work/world/building-root.json'))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:tiles=list(pool.map(tile,r['children']))
pos=array('f');normal=array('f');colors=bytearray()
for a,b,c in tiles:pos.extend(a);normal.extend(b);colors.extend(c)
n=len(pos)//3;assert n%3==0
buffers=[pos.tobytes(),normal.tobytes(),bytes(colors)];offset=0;views=[]
for data in buffers:views.append({'buffer':0,'byteOffset':offset,'byteLength':len(data),'target':34962});offset+=len(data)
doc={'asset':{'version':'2.0','generator':'UQRL, CC BY 4.0 Brisbane City Council source'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0}],'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1,'COLOR_0':2},'material':0}]}],'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0.04,'roughnessFactor':0.85},'doubleSided':False}],'buffers':[{'byteLength':offset}],'bufferViews':views,'accessors':[{'bufferView':0,'componentType':5126,'count':n,'type':'VEC3','min':[min(pos[i::3]) for i in range(3)],'max':[max(pos[i::3]) for i in range(3)]},{'bufferView':1,'componentType':5126,'count':n,'type':'VEC3'},{'bufferView':2,'componentType':5121,'normalized':True,'count':n,'type':'VEC4'}]}
j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((-len(j))%4);b=b''.join(buffers);b+=b'\0'*((-len(b))%4)
Path('work/world/council.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b)
print('Council vertices',n,'triangles',n//3,'bytes',len(b),flush=True)
