"""Reproducible display-model conversion. Local optional dependencies only."""
import sys,json,math,zipfile,io,gc,argparse
from pathlib import Path
sys.path.insert(0,str(Path('work/qa/print-runtime').resolve()))
import numpy as np
import trimesh
from scipy import ndimage as ndi
from skimage.measure import marching_cubes
import manifold3d as mf

ROOT=Path('Druckmodelle/DSS-Flex-2026');TMP=Path('work/qa/print-masters');TMP.mkdir(parents=True,exist_ok=True);ROOT.mkdir(parents=True,exist_ok=True)
COLORS={1:('Standflaeche','#38424F'),2:('Metall','#ADB7BF'),3:('Gummi-Roboter','#242B34'),4:('Schalung-Messing','#E0BE45'),5:('Leitungen','#4796C1'),6:('Steinzeugrohr','#8B5540'),7:('Erdreich','#796047'),8:('Anschlussblase','#2F8F91'),9:('Injektionsmoertel','#B3B3A7')}
KINDS=['01-Roboter-und-Schalung','02-Nur-Schalung','03-Rohrsanierung-Schnitt']
PRESETS=[('01-Mini-80-Resin',80,'resin',0.05),('02-Klein-100-Resin',100,'resin',0.05),('03-Kompakt-120-FDM',120,'fdm',0.12),('04-Kompakt-150-FDM',150,'fdm',0.16),('05-Standard-180-FDM',180,'fdm',0.16),('06-Standard-200-FDM',200,'fdm',0.2),('07-Gross-250-FDM',250,'fdm',0.2),('08-Gross-300-FDM',300,'fdm',0.2),('09-XL-400-segmentiert',400,'fdm',0.24),('10-XXL-600-segmentiert',600,'fdm',0.28)]

def voxel_master(kind,tier):
 cache=TMP/f'{kind}-{tier}.npz'
 if cache.exists():
  a=np.load(cache);labels=a['labels'];filled=ndi.binary_fill_holes(labels>0);labels[filled&(labels==0)]=2;return labels,float(a['pitch']),float(a['length'])
 meta=json.loads(Path(f'work/qa/print-source/{kind}.json').read_text());raw=np.memmap(f'work/qa/print-source/{kind}.bin',dtype='<f4',mode='r')
 length=100 if tier=='resin' else 120;pitch=.2;radius=1 if tier=='resin' else 3
 xmin,xmax,ymin,ymax,zmin,zmax=meta['bounds'];scale=(length-6)/(xmax-xmin)
 # Original Y is vertical. Print Z is vertical; reversing transverse Z preserves handedness.
 origin=np.array([xmin,zmin,-240.]);base=2.4 if tier=='resin' else 3.
 size=np.array([length,(zmax-zmin)*scale+6,(ymax+240)*scale+base+6])
 shape=np.ceil(size/pitch).astype(int)+8;labels=np.zeros(tuple(shape),dtype=np.uint8)
 def transform(verts):return np.column_stack(((verts[:,0]-xmin)*scale+3,(-verts[:,2]-zmin)*scale+3,(verts[:,1]+240)*scale+base+1))
 for j,r in enumerate(meta['records']):
  data=np.array(raw[r['offset']//4:r['offset']//4+r['count']*9]).reshape((-1,3));verts=transform(data)
  # Skip sub-resolution isolated ornament, not structural mesh surfaces.
  if np.max(np.ptp(verts,axis=0))<pitch*.7:continue
  mesh=trimesh.Trimesh(vertices=verts,faces=np.arange(len(verts)).reshape(-1,3),process=False)
  vox=mesh.voxelized(pitch,max_iter=12).fill();points=vox.points
  if r['clip']:points=points[points[:,1]>=(0-zmin)*scale+3] # retain original Z <= 0
  ids=np.rint(points/pitch).astype(np.int32)
  keep=(ids[:,0]>=math.ceil(3/pitch))&(ids[:,0]<=math.floor((length-3)/pitch))&np.all(ids>=0,axis=1)&np.all(ids<shape,axis=1)
  ids=ids[keep];labels[tuple(ids.T)]=r['material']
  if j%150==0:print(kind,tier,j,'/',len(meta['records']),flush=True)
 # Modest morphological thickening turns zero-thickness skins into printable walls.
 # Assign added cells locally; existing colors remain in their own material regions.
 occupied=labels>0
 for _ in range(radius):
  expanded=ndi.maximum_filter(labels,size=3);labels=np.where(labels==0,expanded,labels).astype(np.uint8)
 # Trim unneeded margins, retaining the allocated stand height.
 ids=np.argwhere(labels>0);lo=ids.min(axis=0);hi=ids.max(axis=0)+1
 labels=labels[max(0,lo[0]-8):hi[0]+8,max(0,lo[1]-8):hi[1]+8,:hi[2]+3].copy()
 base_n=round(base/pitch);labels[:,:,:base_n]=1
 # Each substantial disconnected island gets a permanent pedestal, rather than floating.
 cc,num=ndi.label(labels>0);counts=np.bincount(cc.ravel());base_id=int(cc[0,0,0]);pedestals=0;removed=0
 for k,sl in enumerate(ndi.find_objects(cc),1):
  if k==base_id or sl is None:continue
  local=cc[sl]==k;points=np.argwhere(local);p=points[np.argmin(points[:,2])]+np.array([s.start for s in sl])
  if counts[k]<8:region=labels[sl];region[local]=0;removed+=1;continue
  x,y,z=map(int,p);rad=max(3,round(.8/pitch));labels[max(0,x-rad):x+rad+1,max(0,y-rad):y+rad+1,:z+2]=1;pedestals+=1
 del cc;gc.collect()
 _,num=ndi.label(labels>0);assert num==1,(kind,tier,num)
 filled=ndi.binary_fill_holes(labels>0);labels[filled&(labels==0)]=2
 np.savez_compressed(cache,labels=labels,pitch=pitch,length=length)
 print('MASTER',kind,tier,labels.shape,'pedestals',pedestals,'removed sub-resolution islands',removed,flush=True)
 return labels,pitch,length

def surface(mask,pitch):
 verts,faces,_,_=marching_cubes(np.pad(mask.astype(np.uint8),1),level=.5,spacing=(pitch,)*3,allow_degenerate=False)
 mesh=trimesh.Trimesh(vertices=verts-pitch,faces=faces,process=True)
 if mesh.volume<0:mesh.invert()
 assert mesh.is_watertight and mesh.is_volume,'Surface not a closed volume'
 # Manifold simplifies coplanar voxel surfaces while retaining a closed solid.
 solid=mf.Manifold(mf.Mesh(np.asarray(mesh.vertices,np.float32),np.asarray(mesh.faces,np.uint32)))
 if solid.status()==mf.Error.NoError:
  simple=solid.simplify(pitch*.12).to_mesh();mesh=trimesh.Trimesh(np.asarray(simple.vert_properties)[:,:3],np.asarray(simple.tri_verts),process=True)
 assert mesh.is_watertight and mesh.is_volume
 return mesh

def write3mf(dest,meshes,scale,shift):
 # Standard 3MF Core: millimetres, material volumes, one assembled build object.
 out=io.StringIO();out.write('<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="de-DE" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">DSS-Flex Anschauungsmodell</metadata><resources><basematerials id="1">')
 for _,(name,color) in COLORS.items():out.write(f'<base name="{name}" displaycolor="{color}FF"/>')
 out.write('</basematerials>');objects=[]
 for i,(material,mesh) in enumerate(meshes.items(),2):
  objects.append(i);out.write(f'<object id="{i}" type="model" name="{COLORS[material][0]}" pid="1" pindex="{material-1}"><mesh><vertices>')
  v=(mesh.vertices+shift)*scale
  for x,y,z in v:out.write(f'<vertex x="{x:.5f}" y="{y:.5f}" z="{z:.5f}"/>')
  out.write('</vertices><triangles>')
  for a,b,c in mesh.faces:out.write(f'<triangle v1="{a}" v2="{b}" v3="{c}"/>')
  out.write('</triangles></mesh></object>')
 assembly=len(objects)+2;out.write(f'<object id="{assembly}" type="model" name="DSS-Flex Gesamtmodell"><components>')
 for oid in objects:out.write(f'<component objectid="{oid}"/>')
 out.write(f'</components></object></resources><build><item objectid="{assembly}"/></build></model>')
 with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
  z.writestr('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
  z.writestr('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
  z.writestr('3D/3dmodel.model',out.getvalue())

def export_master(kind,tier):
 labels,pitch,nominal=voxel_master(kind,tier)
 meshpath=TMP/f'{kind}-{tier}-solid.stl'
 if meshpath.exists():whole=trimesh.load_mesh(meshpath)
 else:whole=surface(labels>0,pitch);whole.export(meshpath)
 colored={}
 for material in np.unique(labels):
  if not material:continue
  path=TMP/f'{kind}-{tier}-solid-color{material}.stl'
  if path.exists():colored[int(material)]=trimesh.load_mesh(path)
  else:colored[int(material)]=surface(labels==material,pitch);colored[int(material)].export(path)
 shift=-whole.bounds[0];reports=[]
 for folder,target,process,layer in PRESETS:
  if process!=tier:continue
  dest=ROOT/folder;dest.mkdir(exist_ok=True);scale=target/whole.extents[0]
  m=whole.copy();m.apply_translation(shift);m.apply_scale(scale);m.export(dest/f'{kind}-einfarbig.stl')
  write3mf(dest/f'{kind}-farbig.3mf',colored,scale,shift)
  report={'variant':folder,'model':kind,'dimensions_mm':np.round(m.extents,2).tolist(),'layer_suggestion_mm':layer,'watertight':bool(m.is_watertight),'positive_volume':bool(m.is_volume),'components':len(m.split(only_watertight=False)),'volume_cm3':round(m.volume/1000,2),'triangles':len(m.faces),'voxel_pitch_mm':round(pitch*scale,4),'color_volumes':len(colored),'segments':[]}
  assert report['components']==1 and report['watertight'] and report['positive_volume']
  if target>=400:
   segdir=dest/(kind+'-Segmente');segdir.mkdir(exist_ok=True);step=max(1,int(170/(pitch*scale)));nx,ny,nz=(math.ceil(s/step) for s in labels.shape)
   for x in range(nx):
    for y in range(ny):
     for z in range(nz):
      sub=labels[x*step:(x+1)*step,y*step:(y+1)*step,z*step:(z+1)*step]
      if not np.any(sub):continue
      part=surface(sub>0,pitch);offset=-part.bounds[0];part.apply_translation(offset);part.apply_scale(scale)
      name=f'X{x+1:02}-Y{y+1:02}-Z{z+1:02}';part.export(segdir/f'{name}.stl')
      pieces={int(c):surface(sub==c,pitch) for c in np.unique(sub) if c}
      write3mf(segdir/f'{name}-farbig.3mf',pieces,scale,offset)
      report['segments'].append({'name':name,'assembly_grid':[x+1,y+1,z+1],'dimensions_mm':np.round(part.extents,2).tolist(),'origin_mm':np.round((np.array([x,y,z])*step*pitch+shift)*scale,3).tolist(),'local_shift_mm':np.round(offset*scale,3).tolist(),'watertight':bool(part.is_watertight)})
  reports.append(report);print('EXPORTED',folder,kind,len(m.faces),'triangles',len(report['segments']),'segments',flush=True)
 (TMP/f'{kind}-{tier}-report.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--kind',choices=KINDS);ap.add_argument('--tier',choices=['resin','fdm']);args=ap.parse_args()
 for kind in ([args.kind] if args.kind else KINDS):
  for tier in ([args.tier] if args.tier else ['resin','fdm']):export_master(kind,tier)
 reports=[]
 for p in TMP.glob('*-report.json'):reports+=json.loads(p.read_text())
 (ROOT/'Pruefbericht.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2),encoding='utf-8')
