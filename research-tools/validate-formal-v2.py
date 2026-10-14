#!/usr/bin/env python3
"""Validate the constrained V2 changes against original tagged assets and V5 provenance."""
from pathlib import Path
import collections,hashlib,json,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];A=ROOT/'assets/stimuli/formal'
def load(name):return json.loads((A/name).read_text())
def svg(name):return ET.fromstring((A/name).read_text())
def labels(root):return {n.get('data-place-id'):n for n in root.iter() if n.get('data-place-id')}
def boundary(root):return [n for n in root.iter()if n.tag.endswith('path')and n.get('stroke')=='#64748b'and n.get('mask')=='url(#contourLineCutMask)']
def main():
 protected=json.loads((ROOT/'research-tools/fixtures/formal-v2-protected-sha.json').read_text())
 for name,expected in protected.items():assert hashlib.sha256((A/name).read_bytes()).hexdigest()==expected,f"Step 15D protected asset changed: {name}"
 pool=load('formal-task-pool-v5.json');data=load('rittenhouse-formal-dataset-v2.json');pois={p['place_id']:p for p in data['pois']};palette=pool['T5']['palette'];roots={}
 for kind in ['time','category']:
  old=svg(f'formal-{kind}-color.svg');new=svg(f'formal-{kind}-color-v2.svg');roots[kind]=new
  before=list(old.iter());after=list(new.iter());assert len(before)==len(after)
  parents={c:n for n in new.iter()for c in n}
  def poi_owner(n):
   while n in parents:
    if n.get('data-place-id'):return n.get('data-place-id')
    n=parents[n]
   return None
  for b,n in zip(before,after):
   assert b.tag==n.tag and b.text==n.text and b.tail==n.tail
   expected=dict(b.attrib);pid=poi_owner(n)
   if b.get('data-place-id'):expected['data-category']=pois[b.get('data-place-id')]['formal_category']
   if kind=='category'and pid and b.tag.endswith('text'):expected['fill']=palette[pois[pid]['formal_category']]
   if b in boundary(old):expected['stroke-width']='4'if b.get('class')=='contour-inner-glow'else '1.1'
   assert expected==n.attrib,(kind,n.tag,expected,n.attrib)
  nodes=labels(new);assert len(nodes)==113 and nodes.keys()==pois.keys()
  assert collections.Counter(n.get('data-ring')for n in nodes.values())=={'0-5':30,'5-10':30,'10-15':30,'15-20':23}
  assert collections.Counter(n.get('data-category')for n in nodes.values())=={'Attractions & Landmarks':8,'Restaurants':68,'Hotels & Travel':8,'Shopping':29}
  assert len(boundary(new))==8
  for n in boundary(new):assert n.get('vector-effect')=='non-scaling-stroke'
 t=labels(roots['time']);c=labels(roots['category'])
 for pid in t:
  for x,y in zip(t[pid].iter(),c[pid].iter()):
   assert x.tag==y.tag and x.text==y.text
   for key in ['x','y','width','height','transform','font-size','font-family','font-weight','letter-spacing','text-anchor','dominant-baseline']:
    assert x.get(key)==y.get(key),(pid,key)
 for x,y in zip(boundary(roots['time']),boundary(roots['category'])):assert x.attrib==y.attrib
 computed_top=sorted(pois.values(),key=lambda p:(-p['font_size'],-p['review_count'],p['place_id']))[:3]
 assert pool['T4']['candidate_count']==3 and [x['place_id']for x in pool['T4']['candidate_pool']]==[x['place_id']for x in computed_top]
 for n in t.values():
  text=next(x for x in n if x.tag.endswith('text'));assert float(text.get('font-size'))==pois[n.get('data-place-id')]['font_size']
 for key,expected in load('formal-stimulus-checksums-v2.json').items():
  if (A/key).is_file():assert hashlib.sha256((A/key).read_bytes()).hexdigest()==expected,key
 preserved=['formal-time-color.svg','formal-category-color.svg','formal-task-pool-v4.json','rittenhouse-fixed-dataset-v1.json','formal-stimulus-checksums.json','manifest-3.json','manifest-4.json']
 for name in preserved:assert subprocess.check_output(['git','show','questionnaire-v1.0.1:assets/stimuli/formal/'+name],cwd=ROOT)==(A/name).read_bytes(),name
 assert subprocess.check_output(['git','show','questionnaire-v1.0.1:assets/formal-task-generator-v4.js'],cwd=ROOT)==(ROOT/'assets/formal-task-generator-v4.js').read_bytes()
 report={'pass':True,'poiCount':113,'sharedPlaceIds':113,'ringDistribution':[30,30,30,23],'placeGeometryMismatch':0,'contourGeometryMismatch':0,'allowedChangesOnly':True,'visibleContourWidths':{'boundary':1.1,'innerGlow':4,'vectorEffect':'non-scaling-stroke'},'v1AssetsPreserved':preserved,'datasetId':data['datasetId'],'top3':[{k:p[k]for k in ['name','place_id','font_size','review_count','ring']}for p in computed_top]}
 (ROOT/'release-audit').mkdir(exist_ok=True);(ROOT/'release-audit/v2-validator.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
