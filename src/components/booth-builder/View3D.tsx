import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { lazy, Suspense } from "react";
const IdleEffects = lazy(() => import("./IdleEffects"));
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergedDeck } from "@/lib/booth-builder/deck-geometry";

import { WALL_THICKNESS_MM, isWall, wallWidthMm } from "@/lib/booth-builder/project";
import { DECK_FLOOR_HEIGHT_MM, FINISH_HEX, FLOORING_SWATCHES, doubleDeckPreset } from "@/lib/booth-builder/presets";
import { logoForBackground, shade, surfaceColor } from "@/lib/booth-builder/brandkit";
import {
  COUNTER_TOP_HEX,
  brushedTexture,
  flooringLook,
  panelLook,
} from "@/lib/booth-builder/materials";
import { proxiedImage } from "@/lib/booth-builder/brand-image";
import { composePanel } from "@/lib/booth-builder/graphic-panel";
import { cameraView, tallestObjectM, type CameraViewId } from "@/lib/booth-builder/cameras";
import { useBuilder } from "@/lib/booth-builder/store";
import type {
  BoothObject,
  BoothProject,
  ItemObject,
  LogoPlacement,
  SurfaceGraphic,
  WallObject,
} from "@/lib/booth-builder/types";


import { FurniturePiece, ScreenAssembly } from "./furnishings";
import { CustomDeckMesh, DeckFascia, DeckGuardRails, GlbItem, GlassWallMesh, LedWallMesh, StairMesh, TextPlane } from "./structures3d";
import { deckRails, stairOpenings } from "@/lib/booth-builder/levels";
import { isUpper } from "@/lib/booth-builder/project";
import { isCustomDeck } from "@/lib/booth-builder/presets";

/**
 * 3D view. Metres are the scene unit; the project stores millimetres, so
 * everything divides by 1000 on the way in. The scene is dressed like a real
 * exhibit hall — dark walls, a ceiling light grid and a polished floor — so
 * concepts read close to our finished renderings.
 */

let pendingTextures = 0;

const EDGE_HEX: Record<string, string> = {
  white: "#f2f2f2",
  black: "#141414",
};

/** Load a remote image as a texture; falls back to nothing if it blocks us. */
function useImageTexture(url?: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    pendingTextures += 1;
    loader.load(
      proxiedImage(url) ?? url,

      (t) => {
        pendingTextures -= 1;
        if (!alive) {
          t.dispose();
          return;
        }
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 16;
        setTexture(t);
      },
      undefined,
      () => {
        pendingTextures -= 1;
        if (alive) setTexture(null);
      },
    );
    return () => {
      alive = false;
    };
  }, [url]);

  return texture;
}

/**
 * The artwork for one surface: a composed booth graphic when we have hero
 * messaging, otherwise the photograph itself, always served through our own
 * origin so the browser lets us draw it.
 */
function useSurfaceArtwork(
  graphic: SurfaceGraphic | undefined,
  background: string,
  accent: string,
  aspect: number,
): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const imageUrl = graphic?.imageUrl;
  const headline = graphic?.headline;
  const cta = graphic?.cta;
  const align = graphic?.logoPlacement === "top_left" ? "left" : "center";

  useEffect(() => {
    let alive = true;
    const hasCopy = Boolean(headline?.trim() || cta?.trim());
    if (!imageUrl && !hasCopy) {
      setUrl(undefined);
      return;
    }
    if (!hasCopy) {
      setUrl(proxiedImage(imageUrl));
      return;
    }
    void composePanel({ imageUrl, headline, cta, background, accent, aspect, align }).then((made) => {
      if (alive) setUrl(made ?? proxiedImage(imageUrl));
    });
    return () => {
      alive = false;
    };
  }, [imageUrl, headline, cta, background, accent, aspect, align]);

  return url;
}

/** Artwork plane sitting a few millimetres proud of a surface. */

function GraphicPlane({
  url,
  width,
  height,
  z,
  rotationY = 0,
}: {
  url?: string;
  width: number;
  height: number;
  z: number;
  rotationY?: number;
}) {
  const map = useImageTexture(url);
  if (!map) return null;
  return (
    <mesh position={[Math.sin(rotationY) * z, 0, Math.cos(rotationY) * z]} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={map} roughness={0.65} toneMapped={false} />
    </mesh>
  );
}

/** The mark, positioned the way a designer would place it on that surface. */
function LogoPlane({
  url,
  placement,
  surfaceWidth,
  surfaceHeight,
  scale,
  z,
  rotationY = 0,
}: {
  url: string;
  placement: LogoPlacement;
  surfaceWidth: number;
  surfaceHeight: number;
  scale: number;
  z: number;
  rotationY?: number;
}) {
  const map = useImageTexture(url);
  if (!map || !placement || placement === "none") return null;

  const w = surfaceWidth * scale;
  const source = map.image as { width?: number; height?: number } | undefined;
  const ratio = source?.width && source.height ? source.height / source.width : 0.32;
  const h = Math.min(w * ratio, surfaceHeight * 0.35);
  const margin = surfaceWidth * 0.05;

  let x = 0;
  let y = 0;
  if (placement === "top_center") y = surfaceHeight / 2 - h / 2 - surfaceHeight * 0.12;
  if (placement === "top_left") {
    y = surfaceHeight / 2 - h / 2 - surfaceHeight * 0.12;
    x = -surfaceWidth / 2 + w / 2 + margin;
  }

  return (
    <group rotation={[0, rotationY, 0]}>
      <mesh position={[x, y, z]} userData={{ exactLogo: true }}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={map} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * The visible aluminium profile around a wall run. Real modular walls show a
 * slim frame at the edges, and it is what stops a booth reading as flat boxes.
 */
function EdgeFrame({
  width,
  height,
  depth,
  color,
}: {
  width: number;
  height: number;
  depth: number;
  color: string;
}) {
  const map = useMemo(() => brushedTexture(color), [color]);
  const bar = 0.03;
  const props = { color, map, roughness: 0.34, metalness: 0.72 };
  return (
    <group>
      <mesh position={[0, height / 2 - bar / 2, 0]} castShadow>
        <boxGeometry args={[width, bar, depth + 0.004]} />
        <meshStandardMaterial {...props} />
      </mesh>
      <mesh position={[0, -height / 2 + bar / 2, 0]}>
        <boxGeometry args={[width, bar, depth + 0.004]} />
        <meshStandardMaterial {...props} />
      </mesh>
      <mesh position={[-width / 2 + bar / 2, 0, 0]}>
        <boxGeometry args={[bar, height, depth + 0.004]} />
        <meshStandardMaterial {...props} />
      </mesh>
      <mesh position={[width / 2 - bar / 2, 0, 0]}>
        <boxGeometry args={[bar, height, depth + 0.004]} />
        <meshStandardMaterial {...props} />
      </mesh>
    </group>
  );
}


function WallMesh({
  o,
  project,
  selected,
  presentation,
}: {
  o: WallObject;
  project: BoothProject;
  selected: boolean;
  presentation: boolean;
}) {
  const along = Math.abs(Math.sin((o.rotationDeg * Math.PI) / 180)) > 0.5;
  const width = wallWidthMm(o) / 1000;
  const h = o.heightMm / 1000;
  const t = WALL_THICKNESS_MM / 1000;
  const face = o.graphicType === "solid_color" ? (o.graphicColor ?? project.branding.primaryColor) : "#ededed";
  const logoUrl = logoForBackground(project, surfaceColor(o, project));
  const placement = o.graphic?.logoPlacement ?? "none";
  const artwork = useSurfaceArtwork(
    o.graphic,
    surfaceColor(o, project),
    project.branding.primaryColor,
    width / Math.max(h, 0.1),
  );
  const highlight = selected && !presentation;
  let run = -width / 2;

  const levelY = o.level === "upper" ? DECK_FLOOR_HEIGHT_MM / 1000 : 0;
  return (
    <group
      position={[o.position.x / 1000, levelY + h / 2, o.position.z / 1000]}
      rotation={[0, along ? (o.position.x > project.project.widthMm / 2 ? -Math.PI / 2 : Math.PI / 2) : 0, 0]}
    >
      {o.sections.map((s) => {
        const sw = s.widthMm / 1000;
        const cx = run + sw / 2;
        run += sw;
        const lit = s.lightbox || o.lightbox;
        const look = panelLook(face, Boolean(lit));
        return (
          <group key={s.id} position={[cx, 0, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[sw, h, t]} />
              <meshStandardMaterial
                color={face}
                map={look.map}
                bumpMap={look.map}
                bumpScale={look.bumpScale}
                roughness={look.roughness}
                metalness={look.metalness}
                emissive={lit ? face : "#000000"}
                emissiveIntensity={lit ? 0.75 : 0}
              />
            </mesh>
          </group>
        );
      })}

      <GraphicPlane url={artwork} width={width * 0.98} height={h * 0.97} z={t / 2 + 0.006} />
      <TextPlane graphic={o.graphic} surfaceWidthMm={width * 1000} surfaceHeightMm={h * 1000} z={t / 2 + 0.009} />
      {logoUrl && placement !== "none" && (
        <><LogoPlane
          url={logoUrl}
          placement={placement}
          surfaceWidth={width}
          surfaceHeight={h}
          scale={o.graphic?.logoScale ?? 0.32}
          z={t / 2 + 0.012}
        /><LogoPlane url={logoUrl} placement={placement} surfaceWidth={width} surfaceHeight={h} scale={o.graphic?.logoScale ?? 0.32} z={t / 2 + 0.012} rotationY={Math.PI} /></>
      )}

      {highlight && <SelectionBox w={width} h={h} d={t} />}
      {/* Visible extrusion profile around the wall run */}
      <EdgeFrame width={width} height={h} depth={t} color={o.edgeColor === "brand" ? project.branding.primaryColor : EDGE_HEX[o.edgeColor] ?? "#f2f2f2"} />


    </group>
  );
}

/** Storage rooms, towers and counters: branded on the faces people actually see. */
function StructureMesh({
  o,
  project,
  selected,
  presentation,
}: {
  o: ItemObject;
  project: BoothProject;
  selected: boolean;
  presentation: boolean;
}) {
  const w = o.widthMm / 1000;
  const d = o.depthMm / 1000;
  const h = o.heightMm / 1000;
  const sx = w;
  const sz = d;
  const base = (o.elevationMm ?? 0) / 1000;
  const flat = surfaceColor(o, project);
  const body = flat;
  const logoUrl = logoForBackground(project, flat);
  const placement = o.graphic?.logoPlacement ?? "none";
  const scale = o.graphic?.logoScale ?? 0.5;
  const artwork = useSurfaceArtwork(o.graphic, flat, project.branding.primaryColor, sx / Math.max(h, 0.1));

  // Counter tops are always white laminate, whatever the brand colour is.
  const faces: number[] = o.kind === "tower" ? [0, Math.PI / 2, Math.PI, -Math.PI / 2] : [0];
  const look = panelLook(body, Boolean(o.lightbox));
  const material = useMemo(() => counterMaterial(body, Boolean(o.lightbox)), [body, o.lightbox]);

  const glbKey = o.visualKey ?? "";
  const isGlbProduct = glbKey.startsWith("ws/") || glbKey.startsWith("frames/");
  return (
    <group position={[o.position.x / 1000, base + h / 2, o.position.z / 1000]} rotation={[0, o.rotationDeg * Math.PI / 180, 0]}>
      {selected && !presentation && <SelectionBox w={sx} h={h} d={sz} />}
      {isGlbProduct ? (
        <group position={[0, -h / 2, 0]}>
          <GlbItem visualKey={glbKey} w={sx} h={h} d={sz} castShadow />
        </group>
      ) : (
      <>
      <mesh castShadow receiveShadow material={o.kind === "counter" ? material : undefined} geometry={o.kind === "counter" ? counterGeometry(sx, h - 0.09, sz) : undefined} position-y={o.kind === "counter" ? 0.045 : 0} dispose={null}>
        {o.kind !== "counter" && <boxGeometry args={[sx, h, sz]} />}
        {o.kind !== "counter" && <meshStandardMaterial color={body} map={look.map} roughness={look.roughness} metalness={look.metalness} emissive={o.lightbox ? body : "#000000"} emissiveIntensity={o.lightbox ? 0.6 : 0} />}
      </mesh>
      {o.kind === "counter" && <>
        <mesh position={[0, -h / 2 + 0.045, -0.045]} geometry={counterGeometry(Math.max(0.1, sx - 0.1), 0.09, Math.max(0.1, sz - 0.09))} dispose={null}>
          <meshStandardMaterial color={FINISH_HEX.black} roughness={0.8} />
        </mesh>
        {o.toeKickLed && <mesh position={[0, -h / 2 + 0.078, sz / 2 - 0.05]}>
          <boxGeometry args={[sx - 0.1, 0.008, 0.008]} />
          <meshStandardMaterial color={COUNTER_TOP_HEX} emissive={COUNTER_TOP_HEX} emissiveIntensity={3} toneMapped={false} />
        </mesh>}
      </>}


      {o.kind === "counter" && (
        <group>
          <mesh castShadow position={[0, h / 2 + 0.014, 0]}>
            <boxGeometry args={[sx + 0.035, 0.035, sz + 0.035]} />
            <meshStandardMaterial color={COUNTER_TOP_HEX} roughness={0.22} metalness={0.04} />
          </mesh>
          {/* Slim brushed reveal under the top, as on our built counters. */}
          <mesh position={[0, h / 2 - 0.012, 0]}>
            <boxGeometry args={[sx + 0.02, 0.012, sz + 0.02]} />
            <meshStandardMaterial color="#c9ccd0" roughness={0.35} metalness={0.75} />
          </mesh>
        </group>
      )}
      </>
      )}


      {faces.map((angle, i) => {
        const half = angle === 0 || Math.abs(angle) === Math.PI ? sz / 2 : sx / 2;
        const faceWidth = angle === 0 || Math.abs(angle) === Math.PI ? sx : sz;
        // Towers only carry the mark on their two main faces.
        const showLogo = placement !== "none" && logoUrl && (o.kind !== "tower" || i % 2 === 0);
        return (
          <group key={i}>
            <GraphicPlane
              url={artwork}
              width={faceWidth * (o.kind === "counter" ? 0.99 : 0.96)}
              height={o.kind === "counter" ? h - 0.1 : h * 0.94}
              z={half + 0.006}
              rotationY={angle}
            />
            <TextPlane
              graphic={o.graphic}
              surfaceWidthMm={faceWidth * 1000}
              surfaceHeightMm={h * 1000}
              z={half + 0.009}
              rotationY={angle}
            />
            {showLogo && (
              <LogoPlane
                url={logoUrl}
                placement={placement}
                surfaceWidth={faceWidth}
                surfaceHeight={h}
                scale={scale}
                z={half + 0.012}
                rotationY={angle}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

function ScreenMesh({ o, selected, presentation }: { o: ItemObject; selected: boolean; presentation: boolean }) {
  const along = Math.abs(Math.sin((o.rotationDeg * Math.PI) / 180)) > 0.5;
  const w = o.widthMm / 1000;
  const d = o.depthMm / 1000;
  const h = o.heightMm / 1000;
  const kiosk = (o.visualKey ?? o.presetId) === "touchscreen_43";
  const base = (o.elevationMm ?? 0) / 1000;

  return (
    <group
      position={[o.position.x / 1000, base + h / 2, o.position.z / 1000]}
      rotation={[0, along ? Math.PI / 2 : 0, 0]}
    >
      <ScreenAssembly width={w} height={h} depth={d} kiosk={kiosk} />
      {!kiosk && <group position-y={-h/2}><GlbItem visualKey="furniture/televisionModern" w={w} h={h} d={d} castShadow={false} fit /></group>}
      {selected && !presentation && (
        <mesh>
          <boxGeometry args={[w + 0.05, h + 0.05, Math.max(d, 0.1) + 0.05]} />
          <meshBasicMaterial color="#d9c2f5" wireframe transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

function FurnitureMesh({ o, project, selected, presentation }: { o: ItemObject; project: BoothProject; selected: boolean; presentation: boolean }) {
  const along = Math.abs(Math.sin((o.rotationDeg * Math.PI) / 180)) > 0.5;
  const w = o.widthMm / 1000;
  const d = o.depthMm / 1000;
  const h = o.heightMm / 1000;
  const color = surfaceColor(o, project);

  return (
    <group
      position={[o.position.x / 1000, (o.elevationMm ?? 0) / 1000 + h / 2, o.position.z / 1000]}
      rotation={[0, o.rotationDeg * Math.PI / 180, 0]}
    >
      {selected && !presentation && <SelectionBox w={w} h={h} d={d} />}
      {(["stool","coffee_table"].includes(o.visualKey??o.presetId??"")) ? <group position-y={-h/2}><GlbItem visualKey={(o.visualKey??o.presetId)==="stool"?"furniture/stoolBar":"furniture/tableCoffee"} w={w} h={h} d={d} castShadow={false} fit /></group> : <FurniturePiece
        visualKey={o.visualKey ?? o.presetId ?? ""}
        w={w}
        d={d}
        h={h}
        color={color}
        accent={shade(color, -0.25)}
      />}
    </group>
  );
}

/**
 * Real beMatrix double deck models (Draco-compressed GLB, metres, Y-up,
 * origin at the centre of the deck frame, ground at y=0). The decoder is
 * served from our own origin so loading never depends on a CDN.
 */
function DeckModel({ visualKey, floorHex, castShadow }: { visualKey: string; floorHex: string; castShadow: boolean }) {
  const { scene } = useGLTF(`/models/bematrix/${visualKey}.glb`, "/draco/");
  const model = useMemo(() => mergedDeck(visualKey, scene), [visualKey, scene]);
  const preset = doubleDeckPreset(visualKey);
  const look = panelLook(floorHex, false);
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [model, floorHex, invalidate]);
  return <group dispose={null}>
    {model.parts.map((part, index) => <mesh key={index} geometry={part.geometry} material={part.material} castShadow={castShadow && index === 0} receiveShadow={castShadow} />)}
    {preset && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DECK_FLOOR_HEIGHT_MM / 1000 + 0.002, 0]} receiveShadow={castShadow}>
      <planeGeometry args={[preset.frameWidthMm / 1000, preset.frameDepthMm / 1000]} />
      <meshStandardMaterial color={floorHex} map={look.map} bumpMap={look.map} bumpScale={look.bumpScale} roughness={look.roughness} metalness={look.metalness} />
    </mesh>}
  </group>;
}

function DeckMesh({ o, project, selected, presentation, shadows }: {
  o: ItemObject; project: BoothProject; selected: boolean; presentation: boolean; shadows: boolean;
}) {
  const preset = doubleDeckPreset(o.visualKey ?? o.presetId);
  const w = (preset?.widthMm ?? o.widthMm) / 1000;
  const d = (preset?.depthMm ?? o.depthMm) / 1000;
  const h = o.heightMm / 1000;
  const rails=deckRails(project,o);
  const custom = isCustomDeck(o) || rails.length !== 4 || stairOpenings(project,o).length>0;
  return <group position={[o.position.x / 1000, 0, o.position.z / 1000]} rotation={[0, o.rotationDeg * Math.PI / 180, 0]}>
    {custom ? (
      <CustomDeckMesh o={o} project={project} floorHex={surfaceColor(o, project)} castShadow={shadows} />
    ) : (
      <Suspense fallback={<mesh position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={FINISH_HEX.white} wireframe /></mesh>}>
        <DeckModel visualKey={preset?.visualKey ?? o.visualKey ?? ""} floorHex={surfaceColor(o, project)} castShadow={shadows} />
      </Suspense>
    )}
    {!custom && <><DeckGuardRails rails={rails} y={2.75} /><DeckFascia o={o} project={project}/></>}
    {selected && !presentation && <group position-y={h / 2}><SelectionBox w={w} h={h} d={d} /></group>}
  </group>;
}

function HangingMesh({
  o,
  project,
  selected,
  presentation,
}: {
  o: ItemObject;
  project: BoothProject;
  selected: boolean;
  presentation: boolean;
}) {
  const w = o.widthMm / 1000;
  const d = o.depthMm / 1000;
  const h = o.heightMm / 1000;
  const base = (o.hangHeightMm ?? o.elevationMm ?? 3660) / 1000;
  const flat = surfaceColor(o, project);
  const color = flat;
  const logoUrl = logoForBackground(project, flat);
  const placement = o.graphic?.logoPlacement ?? "none";
  const artwork = useSurfaceArtwork(o.graphic, flat, project.branding.primaryColor, w / Math.max(h, 0.1));
  const faceDepth = o.shape === "rectangle" ? d : w;
  const sides = o.doubleSided === false ? [1] : [1, -1];

  return (
    <group position={[o.position.x / 1000, base + h / 2, o.position.z / 1000]}>
      {selected && !presentation && <SelectionBox w={w} h={h} d={d} />}
      {o.shape === "halo" ? (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[w / 2, w / 2, h, 64, 1, true]} />
            <meshStandardMaterial
              color={color}
              side={THREE.DoubleSide}
              roughness={0.5}
              emissive={o.lightbox ? color : "#000000"}
              emissiveIntensity={o.lightbox ? 0.7 : 0}
            />
          </mesh>
          {logoUrl &&
            placement !== "none" &&
            [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a) => (
              <LogoPlane
                key={a}
                url={logoUrl}
                placement="center"
                surfaceWidth={w * 0.5}
                surfaceHeight={h}
                scale={o.graphic?.logoScale ?? 0.72}
                z={w / 2 + 0.012}
                rotationY={a}
              />
            ))}
        </group>
      ) : (
        <group rotation={[0, (o.rotationDeg * Math.PI) / 180, 0]}>
          <mesh castShadow>
            <boxGeometry args={[w, h, faceDepth]} />
            <meshStandardMaterial
              color={color}
              roughness={0.5}
              emissive={o.lightbox ? color : "#000000"}
              emissiveIntensity={o.lightbox ? 0.7 : 0}
            />
          </mesh>
            {sides.map((s) => (
            <group key={s} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
              <GraphicPlane url={artwork} width={w * 0.97} height={h * 0.94} z={faceDepth / 2 + 0.006} />
              <TextPlane graphic={o.graphic} surfaceWidthMm={w * 1000} surfaceHeightMm={h * 1000} z={faceDepth / 2 + 0.009} />
              {logoUrl && placement !== "none" && (
                <LogoPlane
                  url={logoUrl}
                  placement="center"
                  surfaceWidth={w}
                  surfaceHeight={h}
                  scale={o.graphic?.logoScale ?? 0.72}
                  z={faceDepth / 2 + 0.012}
                />
              )}
            </group>
          ))}
        </group>
      )}
      {o.lightbox && <pointLight intensity={1.2} distance={7} color="#ffffff" />}
    </group>
  );
}

const counterMaterials = new Map<string, THREE.MeshStandardMaterial>();
function counterMaterial(color: string, lightbox: boolean) {
  const key = `${color}:${lightbox}`;
  const cached = counterMaterials.get(key);
  if (cached) return cached;
  const look = panelLook(color, lightbox);
  const material = new THREE.MeshStandardMaterial({ color, map: look.map, roughness: look.roughness, metalness: look.metalness, emissive: lightbox ? color : FINISH_HEX.black, emissiveIntensity: lightbox ? 0.6 : 0 });
  counterMaterials.set(key, material);
  return material;
}
const counterGeometries = new Map<string, THREE.BufferGeometry>();
function counterGeometry(w: number, h: number, d: number) {
  const key = `${w}:${h}:${d}`;
  const found = counterGeometries.get(key);
  if (found) return found;
  const geometry = new RoundedBoxGeometry(w, h, d, 1, Math.min(0.035, w / 8, d / 8));
  counterGeometries.set(key, geometry);
  return geometry;
}
function SelectionBox({ w, h, d }: { w: number; h: number; d: number }) {
  return <mesh raycast={() => {}}><boxGeometry args={[w + 0.025, h + 0.025, d + 0.025]} /><meshBasicMaterial color={selectionColor} wireframe transparent opacity={0.8} /></mesh>;
}
const selectionColor = "#f2f2f2";
type ObjectProps = { o: BoothObject; selected: boolean; presentation: boolean; project?: BoothProject; shadows?: boolean };
function sameObject(a: ObjectProps, b: ObjectProps) {
  return a.o === b.o && a.selected === b.selected && a.presentation === b.presentation && a.shadows === b.shadows
    && (a.o.type !== "item" || a.o.kind !== "double_deck" || a.project?.design === b.project?.design)
    && a.project?.branding === b.project?.branding && a.project?.project === b.project?.project;
}
/** Stairs, glass walls, LED walls and uploaded frame models. */
function SpecialMesh({ o, project, selected, presentation }: { o: ItemObject; project: BoothProject; selected: boolean; presentation: boolean }) {
  const w = o.widthMm / 1000;
  const d = o.depthMm / 1000;
  const h = o.heightMm / 1000;
  const base = (o.elevationMm ?? 0) / 1000;
  const color = surfaceColor(o, project);
  const centered = o.kind === "led_wall" || o.kind === "frame";
  return (
    <group position={[o.position.x / 1000, base + (centered ? h / 2 : 0), o.position.z / 1000]} rotation={[0, (o.rotationDeg * Math.PI) / 180, 0]}>
      {o.kind === "stair" && <StairMesh o={o} color={color} />}
      {o.kind === "glass_wall" && <GlassWallMesh o={o} />}
      {o.kind === "led_wall" && <LedWallMesh o={o} project={project} />}
      {o.kind === "frame" && (
        <group position={[0, -h / 2, 0]}>
          <GlbItem visualKey={o.visualKey ?? ""} w={w} h={h} d={d} castShadow />
        </group>
      )}
      {selected && !presentation && <group position-y={centered ? 0 : h / 2}><SelectionBox w={w} h={h} d={d} /></group>}
    </group>
  );
}

const MemoWallMesh = memo(WallMesh, sameObject);
const MemoStructureMesh = memo(StructureMesh, sameObject);
const MemoDeckMesh = memo(DeckMesh, sameObject);
const MemoScreenMesh = memo(ScreenMesh, sameObject);
const MemoFurnitureMesh = memo(FurnitureMesh, sameObject);
const MemoHangingMesh = memo(HangingMesh, sameObject);
const MemoSpecialMesh = memo(SpecialMesh, sameObject);

/** Ceiling light grid and dark hall shell behind the booth. */
function CeilingLights({ points, y }: { points: [number, number][]; y: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    points.forEach(([x, z], i) => {
      o.position.set(x, y, z);
      o.rotation.set(Math.PI / 2, 0, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [points, y]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]} key={points.length}>
      <circleGeometry args={[0.11, 10]} />
      <meshBasicMaterial color="#ffe9c4" toneMapped={false} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function Hall({ span, hideCeiling = false }: { span: number; hideCeiling?: boolean }) {
  const size = Math.max(span * 4, 44);
  const ceiling = Math.max(span * 0.9, 9);

  const lights = useMemo(() => {
    const pts: [number, number][] = [];
    const step = 2.4;
    const half = size / 2;
    for (let x = -half; x <= half; x += step) {
      for (let z = -half; z <= half; z += step) pts.push([x, z]);
    }
    return pts;
  }, [size]);

  return (
    <group>
      {/* Hall shell */}
      <group visible={!hideCeiling} userData={{ hallCeiling: true }}>
      <mesh position={[0, ceiling / 2, 0]}>
        <boxGeometry args={[size, ceiling, size]} />
        <meshStandardMaterial color="#191919" side={THREE.BackSide} roughness={0.95} />
      </mesh>

      {/* Ceiling light grid, one instanced draw instead of hundreds */}
      <CeilingLights points={lights} y={ceiling - 0.15} />
      </group>

      {/* Polished hall floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#232323" roughness={0.85} metalness={0.15} />
      </mesh>
    </group>
  );
}

function Booth({
  project,
  selectedId,
  presentation,
  shadows,
  viewLevel,
}: {
  viewLevel: "ground" | "upper";
  project: BoothProject;
  selectedId: string | null;
  presentation: boolean;
  shadows: boolean;
}) {
  const W = project.project.widthMm / 1000;
  const D = project.project.depthMm / 1000;

  const render = (o: BoothObject) => {
    const selected = o.id === selectedId;
    if (isWall(o)) return <MemoWallMesh key={o.id} o={o} project={project} selected={selected} presentation={presentation} />;
    if (o.kind === "hanging")
      return <MemoHangingMesh key={o.id} o={o} project={project} selected={selected} presentation={presentation} />;
    if (o.kind === "double_deck")
      return <MemoDeckMesh key={o.id} o={o} project={project} shadows={shadows} selected={selected} presentation={presentation} />;
    if (o.kind === "stair" || o.kind === "glass_wall" || o.kind === "led_wall" || o.kind === "frame")
      return <MemoSpecialMesh key={o.id} o={o} project={project} selected={selected} presentation={presentation} />;
    if (o.kind === "tv") return <MemoScreenMesh key={o.id} o={o} selected={selected} presentation={presentation} />;
    if (o.kind === "furniture")
      return <MemoFurnitureMesh key={o.id} o={o} project={project} selected={selected} presentation={presentation} />;
    return <MemoStructureMesh key={o.id} o={o} project={project} selected={selected} presentation={presentation} />;
  };

  const swatchId = project.design.flooring.swatchId;
  const floorHex = FLOORING_SWATCHES.find((f) => f.id === swatchId)?.hex ?? "#1a1a1a";
  const floor = flooringLook(swatchId, floorHex, Math.max(W, D));

  return (
    <group position={[-W / 2, 0, -D / 2]}>
      {/* Booth flooring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0.004, D / 2]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          color={floorHex}
          map={floor.map}
          bumpMap={floor.map}
          bumpScale={floor.bumpScale}
          roughness={floor.roughness}
          metalness={floor.metalness}
          envMapIntensity={0.9}
        />
      </mesh>

      {/* Trim edge where the booth floor meets the show floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0.002, D / 2]}>
        <planeGeometry args={[W + 0.05, D + 0.05]} />
        <meshStandardMaterial color="#0f0f10" roughness={0.8} />
      </mesh>

      {project.design.objects.map(o => <group key={o.id} visible={viewLevel !== "upper" || isUpper(o) || (o.type === "item" && ["double_deck","stair"].includes(o.kind))}>{render(o)}</group>)}
    </group>
  );
}


/** Moves the camera smoothly onto a preset angle, and spins it on request. */
function CameraRig({
  viewId,
  viewNonce,
  turntable,
  widthM,
  depthM,
  heightM,
}: {
  viewId: CameraViewId;
  viewNonce: number;
  turntable: boolean;
  widthM: number;
  depthM: number;
  heightM: number;
}) {
  const aspect = useThree((state) => state.size.width / state.size.height);
  const { camera, controls, invalidate } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: { target: THREE.Vector3; update: () => void } | null;
    invalidate: () => void;
  };
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; fov: number } | null>(null);

  useEffect(() => {
    const v = cameraView(viewId, widthM, depthM, aspect, heightM);
    camera.position.set(...v.position);
    camera.fov = v.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(...v.target);
    controls?.target.set(...v.target);
    controls?.update();
    goal.current = null;
    invalidate();
  }, [viewId, viewNonce, widthM, depthM, heightM, aspect, camera, controls, invalidate]);
  useEffect(() => { if (turntable) invalidate(); }, [turntable, invalidate]);

  useFrame((_, delta) => {
    const g = goal.current;
    const dt = Math.min(delta, 0.05);

    if (g) {
      invalidate();
      const k = 1 - Math.exp(-6 * dt);
      camera.position.lerp(g.pos, k);
      if (controls) {
        controls.target.lerp(g.target, k);
        controls.update();
      }
      if (Math.abs(camera.fov - g.fov) > 0.05) {
        camera.fov += (g.fov - camera.fov) * k;
        camera.updateProjectionMatrix();
      }
      if (camera.position.distanceTo(g.pos) < 0.02) goal.current = null;
    }

    if (turntable && !g && controls) {
      invalidate();
      const t = controls.target;
      const offset = camera.position.clone().sub(t);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.18 * dt);
      camera.position.copy(t.clone().add(offset));
      controls.update();
    }
  });

  return null;
}

export type CaptureShot = { id: CameraViewId; label: string; caption: string; dataUrl: string; logoLayer?: string };

export type CaptureRequest = {
  nonce: number;
  /** Angles to shoot. A single-entry list is used for "download image". */
  views: CameraViewId[];
  /** Pixel-ratio multiplier — 2 or 3 for print-quality stills. */
  scale: number;
  format: "png" | "jpeg";
  brandingLayer?: boolean;
  onDone: (shots: CaptureShot[], error?: string) => void;
};

/** Retain original logo pixels with depth-tested occlusion at the reference camera. */
function captureLogoLayer(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): string | undefined {
  const materials = new Map<THREE.Material, boolean>();
  const logoMaterials = new Set<THREE.Material>();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh && o.userData.exactLogo) {
      const list = Array.isArray(o.material) ? o.material : [o.material];
      list.forEach((m) => logoMaterials.add(m));
    }
  });
  if (!logoMaterials.size) return undefined;
  const background = scene.background;
  const alpha = gl.getClearAlpha();
  const clear = gl.getClearColor(new THREE.Color());
  try {
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      list.forEach((m) => {
        if (!materials.has(m)) materials.set(m, m.colorWrite);
        m.colorWrite = logoMaterials.has(m);
      });
    });
    scene.background = null;
    gl.setClearColor(0, 0);
    gl.render(scene, camera);
    return gl.domElement.toDataURL("image/png");
  } finally {
    materials.forEach((write, m) => { m.colorWrite = write; });
    scene.background = background;
    gl.setClearColor(clear, alpha);
  }
}

/** Renders sharper stills on demand, one per requested angle. */
function CaptureRig({
  request,
  widthM,
  depthM,
  heightM,
}: {
  request: CaptureRequest | null;
  widthM: number;
  depthM: number;
  heightM: number;
}) {
  const { gl, scene, camera, controls } = useThree() as unknown as {
    gl: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: { target: THREE.Vector3; update: () => void } | null;
  };

  const handled = useRef(0);
  useEffect(() => {
    if (!request || handled.current === request.nonce) return;
    handled.current = request.nonce;
    void (async () => {
      // Yield before GPU work and wait for uploaded artwork to reach the scene.
      const deadline = performance.now() + 15000;
      do { await new Promise((r) => setTimeout(r, 100)); }
      while (pendingTextures > 0 && performance.now() < deadline);
      if (pendingTextures > 0) { request.onDone([], "Your artwork is still loading. Please try again."); return; }
      const prevPos = camera.position.clone();
      const prevQuat = camera.quaternion.clone();
      const prevFov = camera.fov;
      const prevRatio = gl.getPixelRatio();
      const prevSize = gl.getSize(new THREE.Vector2());
      const ceilingVisibility = new Map<THREE.Object3D, boolean>();
      scene.traverse((o) => { if (o.userData.hallCeiling) ceilingVisibility.set(o, o.visible); });
      const shots: CaptureShot[] = [];
      let error: string | undefined;
      try {
        const cssW = gl.domElement.clientWidth || 1200;
        gl.setPixelRatio(Math.max(1, Math.min(request.scale, 4096 / cssW)));
        // Match the AI output aspect exactly so the logo pass aligns pixel-for-pixel.
        gl.setSize(1200, 800, false);
        for (const id of request.views) {
          ceilingVisibility.forEach((_, object) => { object.visible = id !== "plan"; });
          const v = cameraView(id, widthM, depthM, 1.5, heightM);
          camera.position.set(...v.position);
          camera.fov = v.fov;
          camera.aspect = 1.5;
          camera.updateProjectionMatrix();
          camera.lookAt(new THREE.Vector3(...v.target));
          gl.render(scene, camera);
          const dataUrl = request.format === "jpeg" ? gl.domElement.toDataURL("image/jpeg", 0.92) : gl.domElement.toDataURL("image/png");
          const logoLayer = request.brandingLayer ? captureLogoLayer(gl, scene, camera) : undefined;
          shots.push({ id, label: v.label, caption: v.caption, dataUrl, logoLayer });
        }
      } catch (e) { error = e instanceof Error ? e.message : "capture failed"; }
      finally {
        ceilingVisibility.forEach((visible, object) => { object.visible = visible; });
        camera.position.copy(prevPos);
        camera.quaternion.copy(prevQuat);
        camera.fov = prevFov;
        camera.aspect = prevSize.x / prevSize.y;
        camera.updateProjectionMatrix();
        gl.setPixelRatio(prevRatio);
        gl.setSize(prevSize.x, prevSize.y, false);
        controls?.update();
        gl.render(scene, camera);
      }
      request.onDone(error || shots.some((s) => s.dataUrl.length < 2000) ? [] : shots, error);
    })();
  }, [request, gl, scene, camera, controls, widthM, depthM, heightM]);

  return null;
}

const IdleContactShadows = memo(function IdleContactShadows({ revision, span }: { revision: number; span: number }) {
  return <ContactShadows key={revision} frames={1} position={[0, 0.008, 0]} opacity={0.55} scale={span * 3} blur={2.4} far={6} resolution={256} />;
});
const HallEnvironment = memo(function HallEnvironment() {
  return <Environment resolution={128}>
    <Lightformer intensity={1.9} position={[0, 8, 0]} scale={[16, 16, 1]} rotation-x={Math.PI / 2} />
    <Lightformer intensity={0.75} color="#9fb6d8" position={[-8, 3, 0]} rotation-y={Math.PI / 2} scale={[18, 3, 1]} />
    <Lightformer intensity={0.75} color="#ffd9a8" position={[8, 3, 0]} rotation-y={-Math.PI / 2} scale={[18, 3, 1]} />
    <Lightformer intensity={0.5} color="#ffffff" position={[0, 2, 10]} scale={[14, 5, 1]} />
  </Environment>;
});

function DemandUpdates({ project, selectedId, effects, level }: { project: BoothProject; selectedId: string | null; effects: boolean; level: string }) {
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [project, selectedId, effects, level, invalidate]);
  return null;
}

export type RenderQuality = "fast" | "high" | "presentation";

export default function View3D({
  presentation = false,
  viewId = "hero",
  viewNonce = 0,
  turntable = false,
  capture = null,
  quality = "fast",
}: {
  presentation?: boolean;
  viewId?: CameraViewId;
  viewNonce?: number;
  turntable?: boolean;
  capture?: CaptureRequest | null;
  quality?: RenderQuality;
}) {
  const { project, selectedId, placementLevel } = useBuilder();
  const widthM = project.project.widthMm / 1000;
  const depthM = project.project.depthMm / 1000;
  const span = Math.max(widthM, depthM);
  const heightM = tallestObjectM(project);
  const start = cameraView("hero", widthM, depthM, 1.5, heightM);

  const [idle, setIdle] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const idleTimer = useRef<number | undefined>(undefined);
  const idleTask = useRef<number | undefined>(undefined);
  const revision = useRef(0);
  const previousDesign = useRef(project.design);
  if (previousDesign.current !== project.design) { revision.current += 1; previousDesign.current = project.design; }
  const cancelIdle = useCallback(() => {
    window.clearTimeout(idleTimer.current);
    if (idleTask.current !== undefined) window.cancelIdleCallback?.(idleTask.current);
    idleTask.current = undefined;
  }, []);
  const settle = useCallback(() => {
    cancelIdle();
    idleTimer.current = window.setTimeout(() => {
      setInteracting(false);
      if (quality !== "fast") {
        idleTask.current = window.requestIdleCallback?.(() => setIdle(true), { timeout: 2000 });
        if (idleTask.current === undefined) setIdle(true);
      }
    }, 1200);
  }, [quality, cancelIdle]);
  const activity = useCallback(() => { cancelIdle(); setInteracting(true); }, [cancelIdle]);
  useEffect(() => { settle(); return cancelIdle; }, [quality, project.design, viewId, viewNonce, settle, cancelIdle]);
  const effects = idle && !interacting && !turntable && quality === "presentation";
  // Shadows stay on whenever quality allows them; toggling the renderer's
  // shadow system mid-orbit caused the visible light flashes. Only AO and
  // contact shadows wait for idle now.
  const shadowsOn = quality === "presentation";
  const dprMax = quality === "presentation" && !interacting ? 1.25 : 1;
  const shadowMap = 1024;


  return (
    <Canvas
      frameloop="demand"
      shadows={shadowsOn ? { type: THREE.PCFSoftShadowMap } : false}
      onPointerDown={activity}
      onPointerUp={settle}
      onPointerCancel={settle}
      onPointerLeave={settle}
      dpr={[1, dprMax]}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
      camera={{ position: start.position, fov: start.fov }}
    >
      <color attach="background" args={["#0b0b0c"]} />
      <fog attach="fog" args={["#0b0b0c", span * 3, span * 8]} />

      <ambientLight intensity={0.24} />
      <hemisphereLight intensity={0.38} color="#ffeed6" groundColor="#0d0d0d" />
      <directionalLight
        position={[span * 0.8, span * 1.6, span]}
        intensity={1.5}
        color="#fff3e0"
        castShadow={shadowsOn}
        shadow-mapSize-width={shadowMap}
        shadow-mapSize-height={shadowMap}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-span, span * 0.9, -span]} intensity={0.42} color="#cfe0ff" />
      {/* Soft key from the aisle so faces nearest the camera are never muddy */}
      <spotLight
        position={[0, span * 1.2, span * 1.6]}
        angle={0.7}
        penumbra={1}
        intensity={span * 1.6}
        distance={span * 6}
        color="#fff6ea"
        castShadow={false}
      />

      <HallEnvironment />


      <Hall span={span} hideCeiling={viewId === "plan"} />

      {quality === "presentation" && <IdleContactShadows revision={revision.current} span={span} />}

      {!presentation && (
        <Grid
          args={[60, 60]}
          cellSize={1}
          sectionSize={5}
          cellColor="#232323"
          sectionColor="#2f2f2f"
          fadeDistance={45}
          infiniteGrid
          position={[0, 0.006, 0]}
        />
      )}

      <Booth project={project} selectedId={selectedId} presentation={presentation} shadows={shadowsOn} viewLevel={placementLevel} />
      <DemandUpdates project={project} selectedId={selectedId} effects={effects} level={placementLevel} />

      {quality === "presentation" && !interacting && <Suspense fallback={null}><IdleEffects /></Suspense>}

      <OrbitControls makeDefault enablePan enableDamping={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.05} target={start.target} onStart={activity} onEnd={settle} />

      <CameraRig
        viewId={viewId}
        viewNonce={viewNonce}
        turntable={turntable}
        widthM={widthM}
        depthM={depthM}
        heightM={heightM}
      />
      <CaptureRig request={capture} widthM={widthM} depthM={depthM} heightM={heightM} />
    </Canvas>
  );
}
