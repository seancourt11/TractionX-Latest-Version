/**
 * Round 3B structures: procedural custom decks, deck stairs, glass walls,
 * LED video walls and normalised uploaded GLB models (frames, Big Sky
 * counters). Everything here is metres in the scene, millimetres in the
 * project JSON.
 */

import { Suspense, useMemo, useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { deckRails, stairOpenings, subtractRect, overlaps } from "@/lib/booth-builder/levels";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { normalizeGlb } from "@/lib/booth-builder/glb";
import { DECK_COLUMN_SPACING_MM, DECK_FLOOR_HEIGHT_MM, FINISH_HEX, LED_CABINET_MM } from "@/lib/booth-builder/presets";
import { logoForBackground, surfaceColor } from "@/lib/booth-builder/brandkit";
import { textTexture } from "@/lib/booth-builder/text-graphic";
import { isItem, wallBounds } from "@/lib/booth-builder/project";
import type { BoothProject, ItemObject, SurfaceGraphic } from "@/lib/booth-builder/types";

const ALU = { color: "#c9ccd0", roughness: 0.35, metalness: 0.75 } as const;

/** Text graphic plane, sitting proud of a surface. */
export function TextPlane({
  graphic,
  surfaceWidthMm,
  surfaceHeightMm,
  z,
  rotationY = 0,
}: {
  graphic?: SurfaceGraphic;
  surfaceWidthMm: number;
  surfaceHeightMm: number;
  z: number;
  rotationY?: number;
}) {
  const texture = useMemo(
    () => (graphic?.text ? textTexture(graphic, surfaceWidthMm, surfaceHeightMm) : null),
    [graphic, surfaceWidthMm, surfaceHeightMm],
  );
  if (!texture) return null;
  return (
    <mesh position={[Math.sin(rotationY) * z, 0, Math.cos(rotationY) * z]} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[surfaceWidthMm / 1000, surfaceHeightMm / 1000]} />
      <meshBasicMaterial map={texture ?? undefined} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/** Uploaded GLB (frame systems, Big Sky counters), normalised at load. */
export function NormalizedModel({ path, castShadow, target }: { path: string; castShadow: boolean; target?: [number,number,number] }) {
  const { scene } = useGLTF(`/models/${path}.glb`, "/draco/");
  const model = useMemo(() => {
    const model=normalizeGlb(scene,path.startsWith("frames/")?0.001:1);
    if(target) {const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());const wrapper=new THREE.Group();wrapper.add(model);wrapper.scale.set(target[0]/size.x,target[1]/size.y,target[2]/size.z);return wrapper;}
    return model;
  }, [scene,path,target?.[0],target?.[1],target?.[2]]);
  return (
    <group dispose={null}>
      <primitive object={model} castShadow={castShadow} receiveShadow />
    </group>
  );
}

/** Suspense-wrapped uploaded model with a wireframe box fallback. */
export function GlbItem({ visualKey, w, h, d, castShadow, fit }: { visualKey: string; w: number; h: number; d: number; castShadow: boolean; fit?: boolean }) {
  return (
    <Suspense fallback={<mesh position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={FINISH_HEX.white} wireframe /></mesh>}>
      <NormalizedModel path={visualKey} castShadow={castShadow} target={fit?[w,h,d]:undefined} />
    </Suspense>
  );
}

/* ------------------------------------------------------------- stair --- */

/**
 * Straight stair run up to the deck floor: 14 risers, treads, stringers and
 * handrails both sides, with an optional landing platform at the top.
 * Modelled along +Z so rotationDeg turns it; mirrored flips it left/right.
 */
export function StairMesh({ o, color }: { o: ItemObject; color: string }) {
  const w = o.widthMm / 1000;
  const deckH = DECK_FLOOR_HEIGHT_MM / 1000;
  const risers = 14;
  const rise = deckH / risers;
  const tread = 0.28;
  const run = risers * tread;
  const landing = (o.landing ?? true) ? 1.0 : 0;
  const railH = 1.0;
  const mirror = o.mirrored ? -1 : 1;

  const steps = useMemo(() => Array.from({ length: risers }, (_, i) => i), []);
  const railPosts = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);

  return (
    <group position={[0,0,-mirror*landing/2]} scale={[1,1,mirror]}>
      {o.enclosed && [-1,1].map(side=><mesh key={`enclosure-${side}`} position={[side*(w/2-0.025),deckH/2,landing/2]}><boxGeometry args={[0.05,deckH,run+landing]}/><meshStandardMaterial color={color} roughness={0.65}/></mesh>)}
      {/* Treads */}
      {steps.map((i) => (
        <mesh key={i} castShadow position={[0, rise * (i + 1) - 0.02, -run / 2 + tread * (i + 0.5)]}>
          <boxGeometry args={[w - 0.06, 0.04, tread + 0.02]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
      {/* Stringers */}
      {[-1, 1].map((s) => {
        const len = Math.hypot(run, deckH);
        const angle = Math.atan2(deckH, run);
        return (
          <mesh key={s} castShadow position={[(w / 2 - 0.03) * s, deckH / 2, 0]} rotation={[-angle, 0, 0]}>
            <boxGeometry args={[0.06, 0.25, len]} />
            <meshStandardMaterial {...ALU} />
          </mesh>
        );
      })}
      {/* Handrails: posts plus a sloped top rail on both sides */}
      {[-1, 1].map((s) => (
        <group key={`r${s}`} position={[(w / 2 - 0.02) * s, 0, 0]}>
          {railPosts.map((i) => {
            const t = i / (railPosts.length - 1);
            const z = -run / 2 + t * run;
            const y = rise + t * (deckH - rise);
            return (
              <mesh key={i} position={[0, y + railH / 2, z]}>
                <boxGeometry args={[0.04, railH, 0.04]} />
                <meshStandardMaterial {...ALU} />
              </mesh>
            );
          })}
          <mesh position={[0, deckH / 2 + rise / 2 + railH, 0]} rotation={[-Math.atan2(deckH-rise, run), 0, 0]}>
            <boxGeometry args={[0.05, 0.05, Math.hypot(run, deckH) + 0.1]} />
            <meshStandardMaterial {...ALU} />
          </mesh>
        </group>
      ))}
      {/* Landing platform at the top */}
      {landing > 0 && (
        <mesh castShadow receiveShadow position={[0, deckH - 0.03, run / 2 + landing / 2]}>
          <boxGeometry args={[w, 0.06, landing]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
        </mesh>
      )}
    </group>
  );
}

/* -------------------------------------------------------- glass wall --- */

/** Frameless glass partition with slim channels, optional door and band. */
export function GlassWallMesh({ o }: { o: ItemObject }) {
  const w = o.widthMm / 1000;
  const h = o.heightMm / 1000;
  const doorW = 0.9;
  const bandLo = 1.1;
  const bandHi = 1.7;
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#dfeef2",
        transparent: true,
        opacity: 0.18,
        roughness: 0.05,
        metalness: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  );
  const frosted = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#e8f0f2",
        transparent: true,
        opacity: 0.55,
        roughness: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  );

  const panels: { x: number; w: number }[] = [];
  if (o.door) {
    const left = (w - doorW) / 2;
    panels.push({ x: -w / 2 + left / 2, w: left });
    panels.push({ x: w / 2 - left / 2, w: left });
  } else {
    panels.push({ x: 0, w });
  }

  return (
    <group>
      {/* Floor and head channels */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[w, 0.03, 0.05]} />
        <meshStandardMaterial {...ALU} />
      </mesh>
      <mesh position={[0, h - 0.015, 0]}>
        <boxGeometry args={[w, 0.03, 0.05]} />
        <meshStandardMaterial {...ALU} />
      </mesh>
      {panels.map((p, i) => (
        <mesh key={i} position={[p.x, h / 2, 0]} material={glass}>
          <boxGeometry args={[p.w, h - 0.06, 0.012]} />
        </mesh>
      ))}
      {o.frostedBand &&
        panels.map((p, i) => (
          <mesh key={`f${i}`} position={[p.x, (bandLo + bandHi) / 2, 0.001]} material={frosted}>
            <boxGeometry args={[p.w, bandHi - bandLo, 0.014]} />
          </mesh>
        ))}
      {o.door && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, h / 2 - 0.05, 0]} material={glass}>
            <boxGeometry args={[doorW - 0.04, h - 0.14, 0.012]} />
          </mesh>
          {/* Door pull */}
          <mesh position={[doorW / 2 - 0.12, h / 2 - 0.1, 0.03]}>
            <cylinderGeometry args={[0.012, 0.012, 0.5, 10]} />
            <meshStandardMaterial {...ALU} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* --------------------------------------------------------- LED wall --- */

/** LED video wall: emissive cabinet grid, optional image, floor or mounted. */
export function LedWallMesh({ o, project }: { o: ItemObject; project: BoothProject }) {
  const w = o.widthMm / 1000;
  const h = o.heightMm / 1000;
  const cols = Math.max(1, Math.ceil(o.widthMm / LED_CABINET_MM));
  const rows = Math.max(1, Math.ceil(o.heightMm / LED_CABINET_MM));
  const imageUrl = o.graphic?.imageUrl ?? (project.branding.mode === "photo" ? project.branding.images?.find((i) => i.use)?.url : undefined);

  const texture = useLocalTexture(imageUrl);

  return (
    <group>
      {/* Cabinet grid back */}
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.09]} />
        <meshStandardMaterial color="#101012" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Emissive face */}
      <mesh position={[0, 0, 0.048]}>
        <planeGeometry args={[w - 0.02, h - 0.02]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshStandardMaterial color="#0a0a0c" emissive={project.branding.primaryColor} emissiveIntensity={0.55} roughness={0.3} />
        )}
      </mesh>
      {/* Cabinet seams */}
      {Array.from({ length: cols - 1 }, (_, i) => (
        <mesh key={`v${i}`} position={[-w / 2 + ((i + 1) * w) / cols, 0, 0.05]}>
          <boxGeometry args={[0.004, h, 0.002]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <mesh key={`h${i}`} position={[0, -h / 2 + ((i + 1) * h) / rows, 0.05]}>
          <boxGeometry args={[w, 0.004, 0.002]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      ))}
      {/* Floor-standing feet */}
      {(o.floorStanding ?? true) &&
        [-1, 1].map((s) => (
          <mesh key={s} castShadow position={[(w / 2 - 0.25) * s, -h / 2 + 0.02, 0.25]}>
            <boxGeometry args={[0.08, 0.04, 0.7]} />
            <meshStandardMaterial color="#141416" roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
    </group>
  );
}

/* ------------------------------------------------------- custom deck --- */

/**
 * Parametric deck: floor panel at deck height, perimeter beams, a brandable
 * fascia band, an instanced column grid and guard rails on open edges only.
 * Edges that abut another deck lose their rails so joined modules read as
 * one continuous deck. A stair inside the footprint opens a gap in the
 * nearest rail.
 */
export function CustomDeckMesh({
  o,
  project,
  floorHex,
  castShadow,
}: {
  o: ItemObject;
  project: BoothProject;
  floorHex: string;
  castShadow: boolean;
}) {
  const w = o.widthMm / 1000;
  const d = o.depthMm / 1000;
  const deckY = DECK_FLOOR_HEIGHT_MM / 1000;
  const spacing = (o.columnSpacingMm ?? DECK_COLUMN_SPACING_MM) / 1000;
  const fasciaH = 0.25;
  const railH = 1.1;
  const openings=useMemo(()=>stairOpenings(project,o),[project.design,o]);
  const floorPieces=useMemo(()=>subtractRect({minX:-o.widthMm/2,maxX:o.widthMm/2,minZ:-o.depthMm/2,maxZ:o.depthMm/2},openings),[o,openings]);
  const rails=useMemo(()=>deckRails(project,o),[project.design,o]);

  const columns = useMemo(() => {
    const pts: [number, number][] = [];
    const nx = Math.max(1, Math.round(w / spacing));
    const nz = Math.max(1, Math.round(d / spacing));
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= nz; j++) {
        const x=-w/2+0.062+(i*(w-0.124))/nx,z=-d/2+0.062+(j*(d-0.124))/nz;
        const column={minX:x*1000-62,maxX:x*1000+62,minZ:z*1000-62,maxZ:z*1000+62};
        const atJoin=rails.every(r=>{const px=x*1000,pz=z*1000;const horizontal=Math.abs(r.z2-r.z1)<1;return horizontal?Math.abs(pz-r.z1)>150||px<Math.min(r.x1,r.x2)-150||px>Math.max(r.x1,r.x2)+150:Math.abs(px-r.x1)>150||pz<Math.min(r.z1,r.z2)-150||pz>Math.max(r.z1,r.z2)+150;});
        const interior=i>0&&i<nx&&j>0&&j<nz;
        if(!openings.some(h=>overlaps(column,h))&&(interior||!atJoin))pts.push([x,z]);
      }
    }
    return pts;
  }, [w, d, spacing, openings, rails]);

  const fascia = o.fascia;
  const fasciaColor = fascia?.color ?? (o.finish === "brand" ? project.branding.primaryColor : FINISH_HEX[o.finish] ?? FINISH_HEX.white);
  const fasciaLogo = fascia?.logoPlacement && fascia.logoPlacement !== "none" ? logoForBackground(project, fasciaColor) : "";
  const fasciaImage=useLocalTexture(fascia?.imageUrl);
  const fasciaText: SurfaceGraphic | undefined = fascia?.text
    ? { text: fascia.text, textColor: fascia.textColor ?? "#ffffff", textPlacement: "center", textAlign: "center" }
    : undefined;

  return (
    <group>
      {/* Columns */}
      <ColumnInstances points={columns} height={deckY-0.06} castShadow={castShadow} />
      {/* Joists follow the column spacing, cut around the stair opening. */}
      {floorPieces.map((p,i)=>{const span=(p.maxX-p.minX)/1000;const n=Math.max(1,Math.ceil((p.maxZ-p.minZ)/1000/spacing));return Array.from({length:n+1},(_,j)=><mesh key={`beam-${i}-${j}`} position={[(p.minX+p.maxX)/2000,deckY-0.14,(p.minZ+j*(p.maxZ-p.minZ)/n)/1000]}><boxGeometry args={[span,0.186,0.062]}/><meshStandardMaterial {...ALU}/></mesh>);})}
      {/* Perimeter beams */}
      <mesh position={[0, deckY - 0.13, -d / 2 + 0.06]}>
        <boxGeometry args={[w, 0.25, 0.124]} />
        <meshStandardMaterial {...ALU} />
      </mesh>
      <mesh position={[0, deckY - 0.13, d / 2 - 0.06]}>
        <boxGeometry args={[w, 0.25, 0.124]} />
        <meshStandardMaterial {...ALU} />
      </mesh>
      <mesh position={[-w / 2 + 0.06, deckY - 0.13, 0]}>
        <boxGeometry args={[0.124, 0.25, d]} />
        <meshStandardMaterial {...ALU} />
      </mesh>
      <mesh position={[w / 2 - 0.06, deckY - 0.13, 0]}>
        <boxGeometry args={[0.124, 0.25, d]} />
        <meshStandardMaterial {...ALU} />
      </mesh>
      {/* Deck floor ends exactly at 2750 mm; stair openings are cut out. */}
      {floorPieces.map((p,i)=><mesh key={i} castShadow={castShadow} receiveShadow position={[(p.minX+p.maxX)/2000,deckY-0.03,(p.minZ+p.maxZ)/2000]}>
        <boxGeometry args={[(p.maxX-p.minX)/1000,0.06,(p.maxZ-p.minZ)/1000]} />
        <meshStandardMaterial color={floorHex} roughness={0.7} metalness={0.05} />
      </mesh>)}
      <DeckFascia o={o} project={project} />
      {/* Guard rails on open edges only */}
      <DeckGuardRails rails={rails} y={deckY} />
      {openings.map((r,i)=><DeckGuardRails key={i} y={deckY} rails={[
        {x1:r.minX,z1:r.minZ,x2:r.minX,z2:r.maxZ},
        {x1:r.maxX,z1:r.minZ,x2:r.maxX,z2:r.maxZ},
        {x1:r.minX,z1:r.minZ,x2:r.maxX,z2:r.minZ},
      ]} />)}
    </group>
  );
}

/** Logo on a fascia face, once or repeated along the band. */
function FasciaLogo({ url, bandHeight, faceLength, repeat }: { url: string; bandHeight: number; faceLength: number; repeat: boolean }) {
  const texture = useLocalTexture(url);
  const img = texture?.image as { width?: number; height?: number } | undefined;
  const ratio = img?.width && img.height ? img.width / img.height : 3;
  const h = bandHeight * 0.7;
  const w = h * ratio;
  const count = repeat ? Math.max(1, Math.floor(faceLength / (w * 1.8))) : 1;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = count === 1 ? 0 : -faceLength / 2 + ((i + 0.5) * faceLength) / count;
        return (
          <mesh key={i} position={[x, 0, 0]} userData={{ exactLogo: true }}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial map={texture ?? undefined} transparent toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
}

function useLocalTexture(url?:string){const [texture,setTexture]=useState<THREE.Texture|null>(null);const {invalidate}=useThree();useEffect(()=>{if(!url){setTexture(null);return;}let alive=true;const loader=new THREE.TextureLoader();loader.load(url,t=>{if(!alive){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;setTexture(t);invalidate();});return ()=>{alive=false;};},[url,invalidate]);return texture;}
function ColumnInstances({points,height,castShadow}:{points:[number,number][];height:number;castShadow:boolean}){const ref=useRef<THREE.InstancedMesh>(null);useEffect(()=>{const mesh=ref.current;if(!mesh)return;const dummy=new THREE.Object3D();points.forEach(([x,z],i)=>{dummy.position.set(x,height/2,z);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();},[points,height]);return <instancedMesh ref={ref} args={[undefined,undefined,points.length]} castShadow={castShadow}><boxGeometry args={[0.124,height,0.124]}/><meshStandardMaterial {...ALU}/></instancedMesh>;}
export function DeckGuardRails({rails,y}:{rails:ReturnType<typeof deckRails>;y:number}){return <>{rails.map((r,i)=>{const length=Math.hypot(r.x2-r.x1,r.z2-r.z1)/1000;const rotation=-Math.atan2(r.z2-r.z1,r.x2-r.x1);const posts=Math.max(1,Math.ceil(length/1.488));return <group key={i} position={[(r.x1+r.x2)/2000,y,(r.z1+r.z2)/2000]} rotation={[0,rotation,0]}>{[0.55,1.075].map(h=><mesh key={h} position={[0,h,0]}><boxGeometry args={[length,0.04,0.04]}/><meshStandardMaterial {...ALU}/></mesh>)}{Array.from({length:posts+1},(_,j)=><mesh key={j} position={[-length/2+j*length/posts,0.55,0]}><boxGeometry args={[0.04,1.1,0.04]}/><meshStandardMaterial {...ALU}/></mesh>)}</group>;})}</>;}

export function DeckFascia({o,project}:{o:ItemObject;project:BoothProject}){const w=o.widthMm/1000,d=o.depthMm/1000,fasciaH=.25,deckY=2.75;const fascia=o.fascia;const color=fascia?.color??FINISH_HEX.white;const image=useLocalTexture(fascia?.imageUrl);const logo=fascia?.logoPlacement&&fascia.logoPlacement!=="none"?logoForBackground(project,color):"";const text:SurfaceGraphic={text:fascia?.text,textColor:fascia?.textColor??project.branding.secondaryColor,textSizeMm:fascia?.textSizeMm??100,textFont:fascia?.textFont,textAlign:fascia?.textAlign??"center",textPlacement:fascia?.textPlacement??"center"};return <>{[{x:0,z:d/2-.01,rot:0,len:w},{x:0,z:-d/2+.01,rot:Math.PI,len:w},{x:-w/2+.01,z:0,rot:-Math.PI/2,len:d},{x:w/2-.01,z:0,rot:Math.PI/2,len:d}].map((f,i)=><group key={i} position={[f.x,deckY-fasciaH/2,f.z]} rotation={[0,f.rot,0]}><mesh><boxGeometry args={[f.len,fasciaH,.02]}/><meshStandardMaterial color={color} roughness={.55}/></mesh>{image&&<mesh position-z={.011}><planeGeometry args={[f.len,fasciaH]}/><meshBasicMaterial map={image} toneMapped={false}/></mesh>}{logo&&<group position={[fascia?.repeatLogo?0:fascia?.logoPlacement==="left"?-f.len/2+f.len*.12:fascia?.logoPlacement==="right"?f.len/2-f.len*.12:0,0,.012]}><FasciaLogo url={logo} bandHeight={fasciaH} faceLength={f.len} repeat={fascia?.repeatLogo??false}/></group>}<TextPlane graphic={text} surfaceWidthMm={f.len*1000} surfaceHeightMm={fasciaH*1000} z={.013}/></group>)}</>;}
