#!/usr/bin/env python3
"""Derive V2/V5 from the preserved formal SVG/V4 snapshot, never from the inconsistent legacy dataset."""
from pathlib import Path
import collections,copy,hashlib,html,json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'assets/stimuli/formal'
PALETTE={'Attractions & Landmarks':'#7B2CBF','Restaurants':'#C2410C','Hotels & Travel':'#1D4ED8','Shopping':'#047857'}
LABELS={'Attractions & Landmarks':'景点与地标','Restaurants':'餐饮','Hotels & Travel':'酒店与出行','Shopping':'购物'}
def write_json(name,value): (ASSETS/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def digest(data): return hashlib.sha256(data).hexdigest()
def main():
 old=json.loads((ASSETS/'formal-task-pool-v4.json').read_text())
 places=[copy.deepcopy(p) for bucket in old['T1']['answers_by_ring'].values() for p in bucket['valid_places']]
 by_id={p['place_id']:p for p in places};assert len(by_id)==len(places)==113
 tree=ET.fromstring((ASSETS/'formal-time-color.svg').read_text())
 category=ET.fromstring((ASSETS/'formal-category-color.svg').read_text())
 time_nodes={n.get('data-place-id'):n for n in tree.iter() if n.get('data-place-id')}
 cat_nodes={n.get('data-place-id'):n for n in category.iter() if n.get('data-place-id')}
 assert time_nodes.keys()==cat_nodes.keys()==by_id.keys()
 for pid,p in by_id.items():
  node=time_nodes[pid];text=next(t for t in node if t.tag.endswith('text'))
  assert node.get('data-ring')==p['ring'] and ''.join(text.itertext())==p['name']
  style=dict(re.findall(r'([\w-]+)\s*:\s*([^;]+)',text.get('style','')))
  size=style.get('font-size') or text.get('font-size');assert size is not None,'No source font-size; use browser computed font-size'
  p['font_size']=float(size.removesuffix('px'));p['svg_text_geometry']={k:text.get(k) for k in ['x','y','transform','font-size','text-anchor','dominant-baseline']}
 expected={'0-5':("Luke's Lobster Rittenhouse",'30cpm1uq6xcQCmN6JTrB8w',1161),'5-10':('Chima Steakhouse','gjFUrbSMo1rA1jgG5IhA2A',697),'10-15':('Miles Table','lWedWkinrM5j13pyimbpbA',514),'15-20':("Ms Tootsie's RBL",'ysvzP0VvMTrGmUClKJ3img',612)}
 tops={}
 for ring,wanted in expected.items():
  members=sorted((p for p in places if p['ring']==ring),key=lambda p:(-p['review_count'],p['place_id']))
  top=members[0];assert (top['name'],top['place_id'],top['review_count'])==wanted;assert top['review_count']>members[1]['review_count'];tops[ring]=top
 top3=sorted(places,key=lambda p:(-p['font_size'],-p['review_count'],p['place_id']))[:3]
 dataset={'schemaVersion':2,'datasetId':'rittenhouse-formal-snapshot-v2','center':old['center'],'thresholds':old['thresholds'],'provenance':{'source':'preserved formal SVG and V4 participant-visible snapshot','authorizedCorrection':'User authorized formal SVG/V4 as truth source after 28/113 legacy dataset ID overlap','sourceTaskPoolVersion':old['taskPoolVersion'],'sourceTimeSvgSHA256':digest((ASSETS/'formal-time-color.svg').read_bytes()),'sourceCategorySvgSHA256':digest((ASSETS/'formal-category-color.svg').read_bytes()),'sourceV4SHA256':digest((ASSETS/'formal-task-pool-v4.json').read_bytes()),'legacyDatasetFile':'rittenhouse-fixed-dataset-v1.json','legacyDatasetPreserved':True},'pois':places}
 write_json('rittenhouse-formal-dataset-v2.json',dataset)
 for kind in ['time','category']:
  text=(ASSETS/f'formal-{kind}-color.svg').read_text()
  def patch_label(match):
   opening,body,closing=match.groups();pid=re.search(r'data-place-id="([^"]+)"',opening)[1];cat=by_id[pid]['formal_category']
   opening=opening[:-1]+f' data-category="{html.escape(cat,quote=True)}">'
   if kind=='category':
    body,n=re.subn(r'(<text\b[^>]*\bfill=")[^"]+("[^>]*>)',lambda m:m[1]+PALETTE[cat]+m[2],body);assert n==1
   return opening+body+closing
  text,n=re.subn(r'(<g\b[^>]*\bdata-place-id="[^"]+"[^>]*>)(.*?)(</g>)',patch_label,text,flags=re.S);assert n==113
  # Only visible contour boundary strokes and their soft inner-glow strokes change.
  # Existing non-scaling-stroke is preserved, so widths are screen-space pixels.
  def patch_path(match):
   tag=match[0]
   if 'stroke="#64748b"' in tag and 'mask="url(#contourLineCutMask)"' in tag:
    width='4' if 'class="contour-inner-glow"' in tag else '1.1'
    tag=re.sub(r'stroke-width="[^"]+"',f'stroke-width="{width}"',tag)
   return tag
  text=re.sub(r'<path\b[^>]*>',patch_path,text)
  (ASSETS/f'formal-{kind}-color-v2.svg').write_text(text)
  manifest=json.loads((ASSETS/('manifest-4.json' if kind=='time' else 'manifest-3.json')).read_text())
  manifest.update(frozen=False,source_status='release_candidate',stimulusVersion='rittenhouse-formal-v2',datasetId=dataset['datasetId'],source_file=f'formal-{kind}-color-v2.svg',contour_stroke_width=1.1,contour_inner_glow_stroke_width=4,category_palette=PALETTE if kind=='category' else None)
  write_json(f'manifest-{kind}-v2.json',manifest)
 pool=copy.deepcopy(old);pool.update(schemaVersion=5,taskPoolVersion='rittenhouse-formal-task-pool-v5',supersedes=old['taskPoolVersion'],datasetId=dataset['datasetId'],datasetFile='rittenhouse-formal-dataset-v2.json',stimulusVersion='rittenhouse-formal-v2')
 for task,stimulus in pool['stimuli'].items():
  kind='category' if task=='T5' else 'time';stimulus.update(file=f'formal-{kind}-color-v2.svg',manifest=f'manifest-{kind}-v2.json')
 pool['T2'].update(prompt_template='在【{ring_label}】步行时间范围内，请选择评论数量最高的地点。',answer_type='click_1_place',scoring_rule='EXACT_PLACE_ID',randomization='stable_seed_conditional_weights_10-15_2_others_3_exclude_T4',answers_by_ring={ring:{'label':old['T2']['answers_by_ring'][ring]['label'],'correct_places':[p]} for ring,p in tops.items()})
 pool['T4']={k:copy.deepcopy(old['T4'][k])for k in ['prompt_template','options','answer_type','scoring_rule','display_title']}
 pool['T4'].update(candidate_rule='exact_top3_actual_svg_font_size_DESC_review_count_DESC_place_id_ASC',candidate_count=3,candidate_pool=top3,randomization='stable_seed_uniform_top3',pairing_with_T3='same_ring_hard_constraint_T4_first',font_size_source='formal-time-color-v2.svg text style.font-size or font-size attribute; independently checked against browser computed style')
 pool['T1']['randomization']='stable_seed_uniform_ring_exclude_T2'
 pool['T3']['pairing_with_T4']='same_ring_ordinary_font_closest_name_length_top3_seeded'
 pool['T2']['conditional_ring_weights']={'10-15':2,'other_eligible_rings':3}
 pool['T3']['prompt_template']=pool['T3']['prompt_template'].replace('在图中','在地图中');pool['T4']['prompt_template']=pool['T4']['prompt_template'].replace('在图中','在地图中')
 pool['T5']['target_pool']=['Restaurants','Shopping'];pool['T5']['prompt_template']='请在地图中选择【{target_category}】类别中用户评论数量最多的地点。';pool['T5'].update(palette=PALETTE,category_labels=LABELS)
 for cat,answer in pool['T5']['answers_by_category'].items():
  candidates=sorted((p for p in places if p['formal_category']==cat),key=lambda p:(-p['review_count'],p['place_id']));assert candidates[0]['place_id']==answer['correct_place']['place_id'];assert len(candidates)==answer['count']
 pool['ui']['task_counter_template']='任务 {index} / 5';write_json('formal-task-pool-v5.json',pool)
 checksum={'stimulusVersion':'rittenhouse-formal-v2','datasetId':dataset['datasetId'],'taskPoolVersion':pool['taskPoolVersion']}
 for name in ['formal-time-color-v2.svg','formal-category-color-v2.svg','formal-task-pool-v5.json','rittenhouse-formal-dataset-v2.json','rittenhouse-fixed-dataset-v1.json','manifest-time-v2.json','manifest-category-v2.json']:checksum[name]=digest((ASSETS/name).read_bytes())
 write_json('formal-stimulus-checksums-v2.json',checksum)
 print(json.dumps({'top1':tops,'top3':top3,'datasetId':dataset['datasetId']},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
