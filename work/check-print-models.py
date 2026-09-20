"""Read back exported files and check topology plus the official 3MF reader."""
import sys,json,xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/print-runtime').resolve()))
import trimesh,numpy as np,lib3mf
ROOT=Path('Druckmodelle/DSS-Flex-2026');wrapper=lib3mf.get_wrapper();results=[]
for path in sorted(ROOT.rglob('*')):
 if path.suffix not in ('.stl','.3mf'):continue
 if path.suffix=='.stl':
  m=trimesh.load_mesh(path);assert m.is_watertight and m.is_volume,path
  assert np.isfinite(m.vertices).all() and m.bounds[0].min()>-.001,path
  if '-Segmente' in str(path):assert max(m.extents)<=171,path
  result={'file':path.relative_to(ROOT).as_posix(),'watertight':True,'positive_volume':True,'dimensions_mm':np.round(m.extents,3).tolist()}
 else:
  model=wrapper.CreateModel();reader=model.QueryReader('3mf');reader.SetStrictModeActive(True);reader.ReadFromFile(str(path.resolve()))
  assert reader.GetWarningCount()==0,path
  it=model.GetMeshObjects();count=0
  while it.MoveNext():
   mesh=it.GetCurrentMeshObject();assert mesh.IsManifoldAndOriented(),path;count+=1
  assert count>0,path
  result={'file':path.relative_to(ROOT).as_posix(),'official_lib3mf':'passed','warnings':0,'manifold_material_volumes':count}
 results.append(result)
 if len(results)%20==0:print('Checked',len(results),'files',flush=True)
variants=[p for p in ROOT.iterdir() if p.is_dir() and p.name[:2].isdigit()]
assert len(variants)==10,len(variants)
for p in variants:
 assert len(list(p.glob('*-einfarbig.stl')))==3,p
 assert len(list(p.glob('*-farbig.3mf')))==3,p
(ROOT/'Dateipruefung.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print('PASS:',len(results),'actual STL/3MF files in ten variants; each contains three model subjects.')
