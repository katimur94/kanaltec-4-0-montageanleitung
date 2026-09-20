"""Preserve source triangles; repair individual skins and use exact solid booleans."""
import sys,json,hashlib,importlib.util,argparse,math,io
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/print-runtime').resolve()))
import numpy as np,trimesh,manifold3d as mf
from scipy.spatial import cKDTree
spec=importlib.util.spec_from_file_location('basic',Path(__file__).with_name('build-print-models.py'));basic=importlib.util.module_from_spec(spec);spec.loader.exec_module(basic)
ROOT=Path('Druckmodelle/DSS-Flex-Detail-2026');ROOT.mkdir(parents=True,exist_ok=True)
CACHE=Path('work/qa/print-detail-masters');CACHE.mkdir(parents=True,exist_ok=True)
def solid(mesh):
 return mf.Manifold(mf.Mesh64(np.asarray(mesh.vertices,np.float64),np.asarray(mesh.faces,np.uint64)))
def mesh(s):
 a=s.to_mesh64();return trimesh.Trimesh(np.asarray(a.vert_properties)[:,:3],np.asarray(a.tri_verts),process=False)
def union(items):
 s=mf.Manifold.batch_boolean(items,mf.OpType.Add);assert s.status()==mf.Error.NoError;return s
def write_stl(path,m):
 # STL has no vertex identities. Resolve coincident topological contacts below
 # printing resolution, then validate the actual float32 file after welding.
 for epsilon in [.0001,.0005,.002,.005]:
  v=m.vertices+np.random.default_rng(42).uniform(-epsilon,epsilon,m.vertices.shape)
  v-=v.min(axis=0);candidate=trimesh.Trimesh(v,m.faces,process=False)
  data=trimesh.exchange.stl.export_stl(candidate)
  checked=trimesh.load_mesh(io.BytesIO(data),file_type='stl')
  if checked.is_watertight and checked.is_volume:
   path.write_bytes(data);return epsilon
 raise RuntimeError(f'STL numeric regularization failed: {path}')
def repair(v,r):
 key=hashlib.sha256(v.tobytes()).hexdigest();path=CACHE/(key+'.stl')
 if path.exists():return solid(trimesh.load_mesh(path)),'cache'
 m=trimesh.Trimesh(v,np.arange(len(v)).reshape(-1,3),process=True)
 m.merge_vertices(digits_vertex=3);m.update_faces(m.nondegenerate_faces());m.update_faces(m.unique_faces());m.remove_unreferenced_vertices()
 if not len(m.faces):return mf.Manifold(),'empty'
 mode='original'
 # Planar graphic sheets need actual thickness; other open shells get capped.
 if np.min(np.linalg.svd(m.vertices-m.vertices.mean(axis=0),compute_uv=False))<.001:
  n=np.linalg.svd(m.vertices-m.vertices.mean(axis=0),full_matrices=False)[2][-1];a=m.vertices-n*.4;b=m.vertices+n*.4
  edges=m.edges_sorted;u,c=np.unique(edges,axis=0,return_counts=True);boundary=u[c==1];N=len(a)
  f=np.vstack((m.faces[:,::-1],m.faces+N,[[x,y,y+N] for x,y in boundary],[[x,y+N,x+N] for x,y in boundary]))
  m=trimesh.Trimesh(np.vstack((a,b)),f,process=True);mode='thin-sheet'
 m.fill_holes();m.fix_normals(multibody=True);s=solid(m)
 if s.status()!=mf.Error.NoError:
  # Cap simple boundary loops, notably the original open-ended tube geometries.
  e=m.edges;es=np.sort(e,axis=1);_,inv,c=np.unique(es,axis=0,return_inverse=True,return_counts=True);edges=e[c[inv]==1]
  adjacency={}
  for a,b in edges:adjacency.setdefault(int(a),set()).add(int(b));adjacency.setdefault(int(b),set()).add(int(a))
  if adjacency and all(len(n)==2 for n in adjacency.values()):
   seen=set();vertices=m.vertices.tolist();faces=m.faces.tolist()
   for start in adjacency:
    if start in seen:continue
    loop=[];current=start;previous=None
    while current not in seen:
     seen.add(current);loop.append(current);n=adjacency[current];following=next((v for v in n if v!=previous),start);previous,current=current,following
    centre=len(vertices);vertices.append(np.mean(m.vertices[loop],axis=0).tolist())
    for a,b in zip(loop,loop[1:]+loop[:1]):faces.append([a,b,centre])
   m=trimesh.Trimesh(vertices,faces,process=True);m.fix_normals(multibody=True);s=solid(m);mode='capped-ends'
 if s.status()!=mf.Error.NoError:
  # Local fine reconstruction only for the few still-invalid individual skins.
  pitch=max(.5,float(m.extents.max())/800)
  vox=m.voxelized(pitch,max_iter=12).fill();m=basic.surface(vox.matrix,pitch);m.apply_translation(vox.transform[:3,3])
  trimesh.smoothing.filter_taubin(m,lamb=.5,nu=.5,iterations=8);s=solid(m);mode='local-fine-skin'
 if s.status()!=mf.Error.NoError or s.is_empty():
  raise RuntimeError(f'Unrepaired source component: {r["name"]}, {key}')
 s=s.simplify(.015);m=mesh(s);assert m.is_watertight and m.is_volume
 m.export(path);return s,mode
def master(kind):
 prefix=CACHE/(kind+'-precision')
 if prefix.with_suffix('.json').exists():
  report=json.loads(prefix.with_suffix('.json').read_text());colors={}
  for c in report['materials']:
   a=np.load(CACHE/f'{kind}-precision-color{c}.npz');colors[int(c)]=solid(trimesh.Trimesh(a['v'],a['f'],process=False))
  a=np.load(CACHE/f'{kind}-precision-whole.npz');return colors,report,solid(trimesh.Trimesh(a['v'],a['f'],process=False))
 meta=json.loads(Path(f'work/qa/print-detail-source/{kind}.json').read_text());raw=np.memmap(f'work/qa/print-detail-source/{kind}.bin',dtype='<f4',mode='r')
 groups={};modes={}
 xmin,xmax,_,_,_,_=meta['bounds']
 for i,r in enumerate(meta['records']):
  (CACHE/(kind+'-progress.txt')).write_text(str(i)+' '+r['name'])
  v=np.array(raw[r['offset']//4:r['offset']//4+r['count']*9]).reshape((-1,3))
  # Print Z is the original vertical Y; preserve handedness.
  v=v[:,[0,2,1]];v[:,1]*=-1
  s,mode=repair(v,r);modes[mode]=modes.get(mode,0)+1
  # Sub-micron-at-print-scale deterministic offsets resolve exact tangencies.
  rng=np.random.default_rng(i+1307);s=s.translate(rng.uniform(-.012,.012,3))
  if r['clip']:s=s.trim_by_plane((0,1,0),0)
  s=s.trim_by_plane((1,0,0),xmin).trim_by_plane((-1,0,0),-xmax)
  if not s.is_empty():groups.setdefault(r['material'],[]).append(s)
  if i%75==0:print(kind,i,len(meta['records']),modes,flush=True)
 for c,items in list(groups.items()):
  print('UNION MATERIAL',kind,c,len(items),flush=True);groups[c]=union(items)
 print('UNION ASSEMBLY',kind,flush=True)
 total=union(list(groups.values()));tm=mesh(total);lo,hi=tm.bounds
 # Thin base and a permanent support beneath the main assembly.
 pad=(hi[0]-lo[0])*.025;baseh=(hi[0]-lo[0])*.012
 bmin=np.array([lo[0]-pad,lo[1]-pad,lo[2]-baseh-3]);bsize=np.array([hi[0]-lo[0]+2*pad,hi[1]-lo[1]+2*pad,baseh])
 base=mf.Manifold.cube(bsize).translate(bmin)
 # Join disconnected physical components by shortest local struts; retain every detail.
 components=sorted(total.decompose(),key=lambda s:s.volume(),reverse=True);joined=mesh(components[0]);struts=[]
 print('CONNECT COMPONENTS',kind,len(components),flush=True)
 p=joined.vertices[np.argmin(joined.vertices[:,2])];q=p.copy();q[2]=bmin[2]+baseh*.8
 def rod(a,b,r):
  d=b-a;L=np.linalg.norm(d)
  if L<.001:return mf.Manifold.sphere(r,16).translate(a)
  T=trimesh.geometry.align_vectors([0,0,1],d/L);T[:3,3]=a
  return mf.Manifold.cylinder(L,r,circular_segments=16).transform(T[:3,:4])
 struts.append(rod(q,p+np.array([0,0,1]),max(3,(hi[0]-lo[0])*.008)))
 tree=cKDTree(joined.vertices);reference=joined.vertices;pending=[]
 for ci,component in enumerate(components[1:]):
  cm=mesh(component);dist,idx=tree.query(cm.vertices);n=int(np.argmin(dist));a=cm.vertices[n];b=reference[idx[n]];delta=a-b;L=np.linalg.norm(delta)
  if L>.0001:delta/=L
  # Microscopic separation at formerly touching surfaces prints as one contact.
  # Avoid hundreds of visible posts through small ornamental threads.
  if L>.1 and component.volume()>2:
   radius=min(1.8,max(.2,component.volume()**(1/3)/8));struts.append(rod(b-delta*.5,a+delta*.5,radius))
  pending.append(cm.vertices)
  if ci%24==23:
   reference=np.vstack([reference]+pending);pending=[];tree=cKDTree(reference)
 groups[1]=union([base]+struts)
 whole=union(list(groups.values()));wm=mesh(whole);np.savez_compressed(CACHE/f'{kind}-precision-whole.npz',v=wm.vertices,f=wm.faces)
 # Disjoint material volumes: later visible material wins at interfaces.
 occupied=mf.Manifold();clean={}
 for c in [8,4,5,3,2,9,6,7,1]:
  if c not in groups:continue
  print('PARTITION MATERIAL',kind,c,flush=True)
  part=groups[c]-occupied
  if not part.is_empty():clean[c]=part;occupied=union([occupied,part])
 for c,s in clean.items():
  cm=mesh(s);np.savez_compressed(CACHE/f'{kind}-precision-color{c}.npz',v=cm.vertices,f=cm.faces)
 report={'materials':list(clean),'source_components':len(meta['records']),'repair_modes':modes,'connection_struts':len(struts),'method':'source surfaces and exact boolean union; no scene voxelization'}
 prefix.with_suffix('.json').write_text(json.dumps(report,indent=2));return clean,report,whole
def export(kind):
 colors,details,whole=master(kind);m=mesh(whole);shift=-m.bounds[0];reports=[]
 assert m.is_watertight and m.is_volume
 colored_meshes={c:mesh(s) for c,s in colors.items()};component_count=len(whole.decompose())
 for folder,target,tier,layer in basic.PRESETS:
  dest=ROOT/folder;dest.mkdir(exist_ok=True);scale=target/m.extents[0]
  out=m.copy();out.apply_translation(shift);out.apply_scale(scale);epsilon=write_stl(dest/f'{kind}-einfarbig.stl',out)
  basic.write3mf(dest/f'{kind}-farbig.3mf',colored_meshes,scale,shift)
  report={'variant':folder,'model':kind,'dimensions_mm':np.round(out.extents,2).tolist(),'layer_suggestion_mm':layer,'watertight':True,'positive_volume':True,'components':component_count,'triangles':len(out.faces),'color_volumes':len(colors),'segments':[],'detail_export':details,'stl_numeric_regularization_mm':epsilon}
  if target>=400:
   directory=dest/(kind+'-Segmente');directory.mkdir(exist_ok=True);step=165/scale
   dims=np.ceil(m.extents/step).astype(int)
   for x in range(dims[0]):
    for y in range(dims[1]):
     for z in range(dims[2]):
      origin=m.bounds[0]+np.array([x,y,z])*step;box=mf.Manifold.cube((step,)*3).translate(origin)
      part=whole^box
      if part.is_empty():continue
      pm=mesh(part);offset=-pm.bounds[0];pm.apply_translation(offset);pm.apply_scale(scale)
      name=f'X{x+1:02}-Y{y+1:02}-Z{z+1:02}';write_stl(directory/(name+'.stl'),pm)
      pc={c:mesh(s^box) for c,s in colors.items() if not (s^box).is_empty()};basic.write3mf(directory/(name+'-farbig.3mf'),pc,scale,offset)
      report['segments'].append({'name':name,'assembly_grid':[x+1,y+1,z+1],'dimensions_mm':np.round(pm.extents,2).tolist(),'origin_mm':np.round((origin+shift)*scale,3).tolist(),'local_shift_mm':np.round(offset*scale,3).tolist(),'watertight':bool(pm.is_watertight)})
  reports.append(report);(CACHE/f'{kind}-report.json').write_text(json.dumps(reports,indent=2));print('EXPORTED DETAIL',folder,kind,len(out.faces),flush=True)
 (CACHE/f'{kind}-report.json').write_text(json.dumps(reports,indent=2))
 allreports=[]
 for p in CACHE.glob('*-report.json'):allreports+=json.loads(p.read_text())
 (ROOT/'Pruefbericht.json').write_text(json.dumps(allreports,indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--kind',choices=basic.KINDS);args=p.parse_args()
 for kind in ([args.kind] if args.kind else basic.KINDS):export(kind)
