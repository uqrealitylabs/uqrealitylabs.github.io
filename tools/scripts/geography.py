import csv,io,json,math,zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

root=Path('work/world')
def extract(files,city=False):
 nodes={};ways={}
 for file in files:
  for e in ET.parse(file).getroot():
   if e.tag=='node': nodes[e.attrib['id']]=([float(e.attrib['lon']),float(e.attrib['lat'])],{t.attrib['k']:t.attrib['v'] for t in e.findall('tag')})
   elif e.tag=='way': ways[e.attrib['id']]=([n.attrib['ref'] for n in e.findall('nd')],{t.attrib['k']:t.attrib['v'] for t in e.findall('tag')})
 out={'buildings':[],'areas':[],'roads':[],'rivers':[],'trees':[],'lamps':[]}
 def num(x,default):
  try: return float(x.split()[0])
  except (ValueError,AttributeError): return default
 for refs,t in ways.values():
  if any(r not in nodes for r in refs): continue
  p=[nodes[r][0] for r in refs]
  if len(p)<2: continue
  if t.get('building') and len(p)>3:
   h=num(t.get('height'),num(t.get('building:levels'),3)*3.5)
   if h<=0:h=10.5
   out['buildings'].append({'name':t.get('name',t.get('uq:building_name','')),'height':h,'roof':t.get('roof:shape','flat'),'points':p})
  if t.get('natural')=='water' or t.get('leisure') in ['park','pitch','garden'] or t.get('landuse') in ['grass','forest','recreation_ground']:
   out['areas'].append({'name':t.get('name',''),'kind':'water' if t.get('natural')=='water' else 'green','points':p})
  if t.get('highway') in ['motorway','trunk','primary','secondary','tertiary','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link','residential','service','pedestrian','footway','path','cycleway','steps','busway','unclassified']:
   out['roads'].append({'name':t.get('name',''),'kind':t['highway'],'bridge':t.get('bridge') not in [None,'no'],'width':num(t.get('width'),2 if t['highway'] in ['footway','path','cycleway','steps'] else 10),'points':p})
  if t.get('waterway')=='river':out['rivers'].append(p)
 for p,t in nodes.values():
  if t.get('natural')=='tree':out['trees'].append({'point':p,'species':t.get('species',t.get('genus',''))})
  if t.get('highway')=='street_lamp':out['lamps'].append(p)
 if city:
  out['buildings'].sort(key=lambda b:(not bool(b['name']),-b['height']))
  out['buildings']=out['buildings'][:4500]
 for key in ['buildings','areas','roads','rivers','trees']: print(key,len(out[key]),end='; ')
 print()
 return out
for name,files in [('campus',[root/'campus.osm']),('city',[p for p in root.glob('city-*.osm') if p.stat().st_size>200])]:
 if not files:raise RuntimeError('No city source tiles')
 out=extract(files,name=='city');Path(f'public/assets/world/{name}.json').write_text(json.dumps(out,separators=(',',':')))

z=zipfile.ZipFile(root/'transit.zip')
def rows(name): return csv.DictReader(io.TextIOWrapper(z.open(name),encoding='utf-8-sig'))
routes={r['route_id']:r for r in rows('routes.txt') if r['route_short_name'] in ['M1','M2','F1','192']}
selected={}
for t in rows('trips.txt'):
 if t['route_id'] in routes:
  short=routes[t['route_id']]['route_short_name']
  if short not in selected:selected[short]=t['shape_id']
points={s:[] for s in selected.values()}
for p in rows('shapes.txt'):
 if p['shape_id'] in points:points[p['shape_id']].append((int(p['shape_pt_sequence']),[float(p['shape_pt_lon']),float(p['shape_pt_lat'])]))
out=[]
for short,sid in selected.items():
 p=[p for _,p in sorted(points[sid])];p=[q for i,q in enumerate(p) if i==0 or i==len(p)-1 or math.hypot((q[0]-p[i-1][0])*99000,(q[1]-p[i-1][1])*111320)>3]
 out.append({'name':short,'kind':'ferry' if short=='F1' else 'metro' if short.startswith('M') else 'bus','points':p})
 print(short,len(p))
Path('public/assets/world/transit.json').write_text(json.dumps({'updated':'2026-10-21','routes':out},separators=(',',':')))
