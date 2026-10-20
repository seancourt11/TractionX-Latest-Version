import { Button } from "@/components/ui/button";
import { useState } from "react";
import { fitDeckToBooth, setObjectLevel } from "@/lib/booth-builder/levels";
import { decks } from "@/lib/booth-builder/project";
import { ArrowLeftRight } from "lucide-react";
import { COUNTER_DEPTH_MIN_MM, COUNTER_DEPTH_MAX_MM, COUNTER_HEIGHT_MIN_MM, COUNTER_HEIGHT_MAX_MM, COUNTER_STEP_MM, doubleDeckPreset } from "@/lib/booth-builder/presets";
import {
  COUNTER_MAX_MM,
  COUNTER_MIN_MM,
  FINISH_HEX,
  GRAPHIC_TYPES,
  HANG_MAX_MM,
  HANG_MIN_MM,
  HEIGHTS,
  LOGO_TREATMENTS,
  mmToFt,
  recommendedHangingWidthMm,
} from "@/lib/booth-builder/presets";
import { isWall, mmLabel, sectionsFor, wallBounds, wallWidthMm } from "@/lib/booth-builder/project";
import { MEETING_PRESETS, CUSTOM_DECK_KEY, DECK_COLUMN_SPACING_MM, GRID_STEP_MM, LED_CABINET_MM, LED_MAX_HEIGHT_MM, LED_MAX_WIDTH_MM, isCustomDeck } from "@/lib/booth-builder/presets";
import { usableImages } from "@/lib/booth-builder/brandkit";
import { TEXT_FONTS } from "@/lib/booth-builder/text-graphic";
import { SurfaceBrandControls } from "./SurfaceBrandControls";
import { useBuilder } from "@/lib/booth-builder/store";
import type {
  BoothObject,
  EdgeColor,
  GraphicType,
  HangingShape,
  HeightPreset,
  ItemObject,
  LogoTreatment,
  TextFont,
} from "@/lib/booth-builder/types";

const FINISHES: { id: ItemObject["finish"]; label: string }[] = [
  { id: "white", label: "White" },
  { id: "black", label: "Black" },
  { id: "wood", label: "Wood" },
  { id: "brand", label: "Brand" },
];

const KIND_LABEL: Record<ItemObject["kind"], string> = {
  storage: "Storage room",
  tower: "Tower",
  counter: "Counter",
  tv: "Screen",
  furniture: "Furniture",
  hanging: "Overhead sign",
  double_deck: "Double deck",
  stair: "Deck stair",
  glass_wall: "Glass wall",
  led_wall: "LED video wall",
  frame: "Frame system",
};

/** Numeric position (from the booth's front-left corner) and snap-to-edge. */
function PositionControls({ object }: { object: BoothObject }) {
  const { project, updateWall } = useBuilder();
  const b = wallBounds(object);
  const hosts=decks(project);
  const W = project.project.widthMm;
  const D = project.project.depthMm;
  // Y is measured from the front (aisle) edge, X from the left edge.
  const fromFront = Math.round(D - object.position.z);
  const fromLeft = Math.round(object.position.x);

  const setPos = (x: number, z: number, label: string) =>
    updateWall(object.id, { position: { x: Math.round(x), z: Math.round(z) } }, label);

  const snap = (edge: "left" | "right" | "front" | "back" | "centre") => {
    const x =
      edge === "left" ? b.halfX : edge === "right" ? W - b.halfX : edge === "centre" ? W / 2 : object.position.x;
    const z =
      edge === "back" ? b.halfZ : edge === "front" ? D - b.halfZ : edge === "centre" ? D / 2 : object.position.z;
    setPos(x, z, `Snapped to ${edge}`);
  };

  const field = (label: string, value: number, apply: (v: number) => void) => (
    <label className="flex items-center gap-2 text-xs text-white/60">
      <span className="w-24">{label}</span>
      <input
        type="number"
        className="w-24 rounded-md border border-white/15 bg-transparent px-2 py-1 text-xs text-white"
        value={value}
        step={GRID_STEP_MM}
        onChange={(e) => apply(Number(e.target.value) || 0)}
      />
      <span className="text-white/35">mm · {mmLabel(value)}</span>
    </label>
  );

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Position</p>
      {field("From left", fromLeft, (v) => setPos(v, object.position.z, "Moved"))}
      {field("From front", fromFront, (v) => setPos(object.position.x, D - v, "Moved"))}
      {([{label:"X from left",value:fromLeft,apply:(v:number)=>setPos(v,object.position.z,"Moved")},{label:"Y from front",value:fromFront,apply:(v:number)=>setPos(object.position.x,D-v,"Moved")}]).map(row=>{
        const inches=Math.round(row.value/25.4);
        return <div key={row.label} className="flex items-center gap-2 text-xs"><span>{row.label}</span><input aria-label={`${row.label} feet`} type="number" min="0" className="w-12 border border-border bg-background px-1" value={Math.floor(inches/12)} onChange={e=>row.apply((Number(e.target.value)*12+inches%12)*25.4)}/>ft<input aria-label={`${row.label} inches`} type="number" min="0" max="11" className="w-12 border border-border bg-background px-1" value={inches%12} onChange={e=>row.apply((Math.floor(inches/12)*12+Number(e.target.value))*25.4)}/>in</div>;
      })}
      {hosts.length>0 && !(object.type==="item"&&["double_deck","stair","hanging"].includes(object.kind)) && <div className="flex flex-wrap gap-2">{(["ground","upper"] as const).map(l=><Button key={l} variant={object.level===l?"secondary":"outline"} size="sm" onClick={()=>updateWall(object.id,{level:l,deckId:hosts[0]?.id},"Changed level")}>{l==='ground'?'Ground':'Upper'}</Button>)}{object.level==='upper'&&<select aria-label="Host deck" value={object.deckId??hosts[0]?.id} onChange={e=>updateWall(object.id,{deckId:e.target.value},"Changed deck")} className="max-w-full border border-border bg-background text-foreground">{hosts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>}</div>}
      <div className="flex flex-wrap gap-1.5">
        {(["left", "right", "front", "back", "centre"] as const).map((edge) => (
          <Button key={edge} variant="outline" size="sm" className="text-[11px] capitalize" onClick={() => snap(edge)}>
            {edge}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Text graphic controls shared by walls, counters, signs and fascia. */
function TextGraphicControls({ object }: { object: BoothObject }) {
  const { project, updateWall } = useBuilder();
  const g = object.graphic ?? {};
  const set = (patch: Partial<NonNullable<BoothObject["graphic"]>>, label: string) =>
    updateWall(object.id, { graphic: { ...g, ...patch } }, label);
  const brandColors = [project.branding.primaryColor, project.branding.secondaryColor, "#ffffff", "#111111"];

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Text graphic</p>
      <input
        type="text"
        placeholder='Company name or "Mission: Ready"'
        value={g.text ?? ""}
        onChange={(e) => set({ text: e.target.value }, "Edited text graphic")}
        className="w-full rounded-md border border-white/15 bg-transparent px-2 py-1.5 text-xs text-white"
      />
      {g.text ? (
        <>
          <div className="flex gap-1.5">
            {TEXT_FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                title={f.label}
                onClick={() => set({ textFont: f.id }, "Changed text font")}
                className={`flex-1 rounded-md border px-1 py-1.5 text-[10px] transition ${
                  (g.textFont ?? "inter") === f.id
                    ? "border-[oklch(0.78_0.13_300)] text-white"
                    : "border-white/10 text-white/55 hover:border-white/30"
                }`}
              >
                {f.label.split(" ")[0]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={120}
              max={900}
              step={20}
              value={g.textSizeMm ?? 380}
              onChange={(e) => set({ textSizeMm: Number(e.target.value) }, "Resized text")}
              className="flex-1 accent-[oklch(0.78_0.13_300)]"
            />
            <span className="w-16 text-right text-xs text-white/60">{mmLabel(g.textSizeMm ?? 380)}</span>
          </div>
          <div className="flex gap-1.5">
            {brandColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ textColor: c }, "Changed text colour")}
                className={`h-6 flex-1 rounded-md border ${(g.textColor ?? project.branding.primaryColor) === c ? "border-white" : "border-white/15"}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => set({ textAlign: a }, "Changed text alignment")}
                className={`flex-1 rounded-md border py-1 text-[10px] capitalize transition ${
                  (g.textAlign ?? "center") === a ? "border-[oklch(0.78_0.13_300)] text-white" : "border-white/10 text-white/55"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(["top", "center", "bottom"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set({ textPlacement: p }, "Changed text placement")}
                className={`flex-1 rounded-md border py-1 text-[10px] capitalize transition ${
                  (g.textPlacement ?? "center") === p ? "border-[oklch(0.78_0.13_300)] text-white" : "border-white/10 text-white/55"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[11px] text-white/35">Add wording to show it on this surface.</p>
      )}
    </div>
  );
}


const SHAPES: { id: HangingShape; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "rectangle", label: "Rectangular" },
  { id: "halo", label: "Halo ring" },
];

/** Size, height, sides and illumination for an overhead sign. */
function HangingControls({ item }: { item: ItemObject }) {
  const { project, updateWall } = useBuilder();
  const recommended = recommendedHangingWidthMm(project.project.widthMm, project.project.depthMm);
  const oversize = item.widthMm > Math.min(project.project.widthMm, project.project.depthMm);
  const islandOnly =
    item.shape === "halo" && project.project.boothType !== "island" && project.project.boothType !== "peninsula";

  const setShape = (shape: HangingShape) =>
    updateWall(
      item.id,
      {
        shape,
        depthMm: shape === "rectangle" ? 610 : item.widthMm,
      },
      `Sign shape set to ${shape}`,
    );

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Shape</p>
        <div className="flex gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setShape(s.id)}
              className={`flex-1 rounded-lg border py-2 text-[11px] transition ${
                (item.shape ?? "square") === s.id
                  ? "border-[oklch(0.78_0.13_300)] bg-[oklch(0.78_0.13_300)]/10 text-white"
                  : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Size across</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={HANG_MIN_MM}
            max={HANG_MAX_MM}
            step={305}
            value={Math.min(Math.max(item.widthMm, HANG_MIN_MM), HANG_MAX_MM)}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateWall(
                item.id,
                { widthMm: v, depthMm: (item.shape ?? "square") === "rectangle" ? 610 : v },
                "Resized sign",
              );
            }}
            className="flex-1 accent-[oklch(0.78_0.13_300)]"
          />
          <span className="w-20 text-right text-xs text-white/60">{mmLabel(item.widthMm)}</span>
        </div>
        <p className="mt-1.5 text-[11px] text-white/35">
          For this booth we'd suggest about {mmLabel(recommended)} across.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Height off the floor</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={3050}
            max={6100}
            step={152}
            value={item.hangHeightMm ?? 3660}
            onChange={(e) =>
              updateWall(
                item.id,
                { hangHeightMm: Number(e.target.value), elevationMm: Number(e.target.value) },
                "Moved sign height",
              )
            }
            className="flex-1 accent-[oklch(0.78_0.13_300)]"
          />
          <span className="w-20 text-right text-xs text-white/60">{mmLabel(item.hangHeightMm ?? 3660)}</span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Printed sides</p>
        <div className="flex gap-2">
          {[
            { v: false, label: "Single-sided" },
            { v: true, label: "Double-sided" },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => updateWall(item.id, { doubleSided: o.v }, o.label)}
              className={`flex-1 rounded-lg border py-2 text-[11px] transition ${
                (item.doubleSided ?? true) === o.v
                  ? "border-[oklch(0.78_0.13_300)] bg-[oklch(0.78_0.13_300)]/10 text-white"
                  : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {(oversize || islandOnly) && (
        <p className="rounded-lg border border-amber-300/25 bg-amber-300/[0.06] p-3 text-[11px] leading-relaxed text-amber-100/80">
          {oversize
            ? "This sign is wider than your booth. Most shows want overhead signs to sit inside your own space, we can trim it on the design call, or keep it and we'll check the show rules for you."
            : "Halo rings usually need aisles on several sides. It still works here, we'll confirm the rigging with the show."}
        </p>
      )}
    </div>
  );
}

/** Properties for storage, towers, counters, screens, furniture and signs. */
function ItemProperties({ item }: { item: ItemObject }) {
  const { project, updateWall, duplicateSelected, deleteSelected } = useBuilder();
  const fixed = item.sizing === "fixed";
  const [setback,setSetback]=useState(0);
  const grid = item.kind === "counter" ? COUNTER_STEP_MM : item.sizing === "modular" ? 496 : 50;
  const deck = doubleDeckPreset(item.visualKey ?? item.presetId);
  const maxW = item.kind === "counter" ? COUNTER_MAX_MM : project.project.widthMm;
  const minW = item.kind === "counter" ? COUNTER_MIN_MM : 310;
  const inlineDepthLock =
    item.kind === "storage" &&
    (project.project.boothType === "inline" || project.project.boothType === "corner");

  const sizeRow = (
    label: string,
    value: number,
    min: number,
    max: number,
    apply: (v: number) => void,
  ) => (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={grid}
          value={Math.min(Math.max(value, min), max)}
          onChange={(e) => apply(Number(e.target.value))}
          className="flex-1 accent-[oklch(0.78_0.13_300)]"
        />
        <span className="w-20 text-right text-xs text-white/60">{mmLabel(value)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{KIND_LABEL[item.kind]}</p>
        <p className="mt-2 text-lg font-semibold text-white">{item.name}</p>
        <p className="mt-1 text-xs text-white/45">
          {mmLabel(deck?.frameWidthMm ?? item.widthMm)} × {mmLabel(deck?.frameDepthMm ?? item.depthMm)} · {mmLabel(item.heightMm)} tall
          {deck && <span className="mt-1 block">Deck frame {deck.frameWidthMm} x {deck.frameDepthMm} mm. Stair separate; overall footprint {deck.widthMm} x {deck.depthMm} mm.</span>}
        </p>
      </div>

      {item.kind === "hanging" ? (
        <HangingControls item={item} />
      ) : isCustomDeck(item) || item.kind === "led_wall" ? null : fixed ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[11px] leading-relaxed text-white/50">
          This is a real product at its actual size, so it can't be stretched. Swap it for a different
          size from the library if you need bigger or smaller.
        </p>
      ) : (
        <>
          {sizeRow("Width", item.widthMm, minW, maxW, (v) =>
            updateWall(item.id, { widthMm: v }, "Resized"),
          )}
          {sizeRow(
            "Depth",
            item.depthMm,
            item.kind === "counter" ? COUNTER_DEPTH_MIN_MM : 310,
            item.kind === "counter" ? COUNTER_DEPTH_MAX_MM : inlineDepthLock ? 992 : Math.round(project.project.depthMm / 2),
            (v) => updateWall(item.id, { depthMm: v }, "Resized"),
          )}
          {inlineDepthLock && (
            <p className="-mt-3 text-[11px] leading-relaxed text-white/40">
              Inline and corner booths are kept shallow so the storage room doesn't eat the whole booth.
              Need it deeper? Move it into an island layout, or we'll sort it on the design call.
            </p>
          )}
          {sizeRow("Height", item.heightMm, item.kind === "counter" ? COUNTER_HEIGHT_MIN_MM : 750, item.kind === "counter" ? COUNTER_HEIGHT_MAX_MM : 4402, (v) =>
            updateWall(item.id, { heightMm: v }, "Changed height"),
          )}
        </>
      )}

      {item.kind === "counter" && !fixed && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[{ mm: 1000, label: "Counter" }, { mm: 1070, label: "Bar" }].map((pick) => (
              <Button key={pick.mm} variant="outline" size="sm" onClick={() => updateWall(item.id, { heightMm: pick.mm }, "Changed counter height")}>
                {pick.label} {mmLabel(pick.mm)}
              </Button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={item.toeKickLed ?? false} onChange={(e) => updateWall(item.id, { toeKickLed: e.target.checked }, "Counter toe-kick LED")} />
            Toe-kick LED
          </label>
        </div>
      )}

      {item.kind === "tv" && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Mounting height</p>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={2400}
              step={50}
              value={(item.elevationMm ?? 0)-(item.level==="upper"?2750:0)}
              onChange={(e) =>
                updateWall(item.id, { elevationMm: Number(e.target.value)+(item.level==="upper"?2750:0) }, "Moved screen")
              }
              className="flex-1 accent-[oklch(0.78_0.13_300)]"
            />
            <span className="w-20 text-right text-xs text-white/60">
              {(item.elevationMm ?? 0) === 0 ? "On the floor" : mmLabel(item.elevationMm ?? 0)}
            </span>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Rotation</p>
        <div className="flex gap-2">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => updateWall(item.id, { rotationDeg: deg }, "Rotated")}
              className={`flex-1 rounded-lg border py-2 text-xs transition ${
                item.rotationDeg === deg
                  ? "border-[oklch(0.78_0.13_300)] bg-[oklch(0.78_0.13_300)]/10 text-white"
                  : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      <PositionControls object={item} />

      {item.kind === "stair" && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Stair options</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => updateWall(item.id, { mirrored: !item.mirrored }, item.mirrored ? "Stair handedness reset" : "Stair mirrored")}>
              {item.mirrored ? "Mirrored" : "Mirror left/right"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => updateWall(item.id, { landing: !(item.landing ?? true) }, "Toggled landing")}>
              {(item.landing ?? true) ? "Landing: yes" : "Landing: no"}
            </Button>
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={item.enclosed??false} onChange={e=>updateWall(item.id,{enclosed:e.target.checked},"Stair enclosure")}/>Enclosed stair</label>
          <p className="text-[11px] leading-relaxed text-white/40">
            Drag the stair against a deck edge and it snaps to it. It can sit anywhere inside the booth, including under the deck.
          </p>
        </div>
      )}

      {item.kind === "glass_wall" && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Glass options</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => updateWall(item.id, { door: !item.door }, "Toggled glass door")}>
              {item.door ? "Door: yes" : "Door: no"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => updateWall(item.id, { frostedBand: !item.frostedBand }, "Toggled frosted band")}>
              {item.frostedBand ? "Frosted band: yes" : "Frosted band: no"}
            </Button>
          </div>
        </div>
      )}

      {item.kind === "led_wall" && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">LED wall size</p>
          {(
            [
              { label: "Width", value: item.widthMm, min: 1524, max: LED_MAX_WIDTH_MM, apply: (v: number) => updateWall(item.id, { widthMm: v }, "Resized LED wall") },
              { label: "Height", value: item.heightMm, min: 1524, max: LED_MAX_HEIGHT_MM, apply: (v: number) => updateWall(item.id, { heightMm: v }, "Resized LED wall") },
            ] as const
          ).map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-14 text-xs text-white/60">{row.label}</span>
              <input
                type="range"
                step={1}
                min={1}
                max={row.label==="Width"?30:12}
                value={Math.round(row.value/304.8)}
                onChange={(e) => row.apply(Math.round(Number(e.target.value)*304.8))}
                className="flex-1 accent-[oklch(0.78_0.13_300)]"
              />
              <span className="w-16 text-right text-xs text-white/60">{Math.round(mmToFt(row.value))} ft</span>
            </div>
          ))}
          <p className="text-[11px] text-white/40">
            {Math.max(1, Math.ceil(item.widthMm / LED_CABINET_MM))} × {Math.max(1, Math.ceil(item.heightMm / LED_CABINET_MM))} cabinets (500 mm modules).
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => updateWall(item.id, { floorStanding: true, elevationMm: item.level === "upper" ? 2750 : 0 }, "Floor-standing")}>
              Floor-standing
            </Button>
            <Button variant="outline" size="sm" onClick={() => updateWall(item.id, { floorStanding: false }, "Wall-mounted")}>
              Wall-mounted
            </Button>
          </div>
          {!(item.floorStanding ?? true) && (
            <div className="flex items-center gap-2">
              <span className="w-14 text-xs text-white/60">Mount at</span>
              <input
                type="range"
                min={0}
                max={2400}
                step={50}
                value={(item.elevationMm ?? 0) % 2750}
                onChange={(e) => updateWall(item.id, { elevationMm: (item.level === "upper" ? 2750 : 0) + Number(e.target.value) }, "Moved LED wall")}
                className="flex-1 accent-[oklch(0.78_0.13_300)]"
              />
              <span className="w-16 text-right text-xs text-white/60">{mmLabel((item.elevationMm ?? 0) % 2750)}</span>
            </div>
          )}
        </div>
      )}

      {item.kind === "double_deck" && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Custom deck</p>
          {isCustomDeck(item) && (
            [
              { label: "Width", value: item.widthMm, max: project.project.widthMm, apply: (v: number) => updateWall(item.id, { widthMm: v }, "Resized deck") },
              { label: "Depth", value: item.depthMm, max: project.project.depthMm, apply: (v: number) => updateWall(item.id, { depthMm: v }, "Resized deck") },
            ] as const
          ).map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-14 text-xs text-white/60">{row.label}</span>
              <input
                type="range"
                min={1984}
                max={row.max}
                step={GRID_STEP_MM}
                value={Math.min(Math.max(row.value, 1984), row.max)}
                onChange={(e) => row.apply(Number(e.target.value))}
                className="flex-1 accent-[oklch(0.78_0.13_300)]"
              />
              <input aria-label={`Deck ${row.label.toLowerCase()} mm`} type="number" min={496} step={62} max={row.max} value={row.value} onChange={e=>row.apply(Math.min(row.max,Math.max(496,Math.round(Number(e.target.value)/62)*62)))} className="w-20 border border-border bg-background px-1 text-xs"/>
            </div>
          ))}
          {isCustomDeck(item) && <div className="flex flex-wrap gap-1">{[992,496,310,62].map(mm=><Button key={mm} variant="outline" size="sm" onClick={()=>updateWall(item.id,{widthMm:Math.round(item.widthMm/mm)*mm,depthMm:Math.round(item.depthMm/mm)*mm},`Deck grid ${mm} mm`)}>{mm} mm</Button>)}</div>}
          <div className="flex items-center gap-2">
            <span className="w-14 text-xs text-white/60">Columns</span>
            <input
              type="range"
              min={1488}
              max={3968}
              step={496}
              value={item.columnSpacingMm ?? DECK_COLUMN_SPACING_MM}
              onChange={(e) => updateWall(item.id, { columnSpacingMm: Number(e.target.value) }, "Changed column spacing")}
              className="flex-1 accent-[oklch(0.78_0.13_300)]"
            />
            <span className="w-20 text-right text-xs text-white/60">{mmLabel(item.columnSpacingMm ?? DECK_COLUMN_SPACING_MM)}</span>
          </div>
          <label className="flex items-center gap-2 text-xs">Setback mm<input aria-label="Deck setback mm" type="number" min={0} step={62} value={setback} onChange={e=>setSetback(Number(e.target.value))} className="w-20 border border-border bg-background px-2"/></label>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateWall(
                item.id,
                {
                  ...fitDeckToBooth(project,setback),
                },
                "Deck fills the booth",
              )
            }
          >
            Fill booth ({mmLabel(project.project.widthMm)} × {mmLabel(project.project.depthMm)})
          </Button>
          <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Fascia branding</p>
            <select aria-label="Fascia graphic" value={item.fascia?.imageUrl??""} onChange={e=>updateWall(item.id,{fascia:{...item.fascia,imageUrl:e.target.value||undefined}},"Fascia graphic")} className="w-full border border-border bg-background text-foreground"><option value="">Solid colour</option>{usableImages(project).map((img,i)=><option key={img.url} value={img.url}>Brand image {i+1}</option>)}</select>
            <div className="flex gap-1.5">
              {[project.branding.primaryColor, project.branding.secondaryColor, "#ededed", "#141414"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateWall(item.id, { fascia: { ...item.fascia, color: c } }, "Fascia colour")}
                  className={`h-6 flex-1 rounded-md border ${(item.fascia?.color ?? project.branding.primaryColor) === c ? "border-white" : "border-white/15"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              {(["left", "center", "right", "none"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateWall(item.id, { fascia: { ...item.fascia, logoPlacement: p } }, "Fascia logo placement")}
                  className={`flex-1 rounded-md border py-1 text-[10px] capitalize transition ${
                    (item.fascia?.logoPlacement ?? "none") === p ? "border-[oklch(0.78_0.13_300)] text-white" : "border-white/10 text-white/55"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={item.fascia?.repeatLogo ?? false}
                onChange={(e) => updateWall(item.id, { fascia: { ...item.fascia, repeatLogo: e.target.checked } }, "Fascia logo repeat")}
              />
              Repeat logo along each face
            </label>
            <select aria-label="Fascia font" value={item.fascia?.textFont??"inter"} onChange={e=>updateWall(item.id,{fascia:{...item.fascia,textFont:e.target.value as TextFont}},"Fascia font")} className="w-full border border-border bg-background text-foreground">{TEXT_FONTS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
            <label className="flex items-center gap-2 text-xs">Text size mm<input aria-label="Fascia text size mm" className="w-20 border border-border bg-background px-2" type="number" min={20} max={200} value={item.fascia?.textSizeMm??100} onChange={e=>updateWall(item.id,{fascia:{...item.fascia,textSizeMm:Number(e.target.value)}},"Fascia text size")}/></label>
            <div className="flex gap-1">{[project.branding.primaryColor,project.branding.secondaryColor].map(c=><Button key={c} variant="outline" size="icon" title="Fascia text colour" onClick={()=>updateWall(item.id,{fascia:{...item.fascia,textColor:c}},"Fascia text colour")}><span className="h-4 w-4" style={{backgroundColor:c}}/></Button>)}</div>
            <div className="flex gap-1">{(["left","center","right"] as const).map(a=><Button key={a} variant={item.fascia?.textAlign===a?"secondary":"outline"} size="sm" onClick={()=>updateWall(item.id,{fascia:{...item.fascia,textAlign:a}},"Fascia alignment")}>{a}</Button>)}</div>
            <div className="flex gap-1">{(["top","center","bottom"] as const).map(a=><Button key={a} variant={item.fascia?.textPlacement===a?"secondary":"outline"} size="sm" onClick={()=>updateWall(item.id,{fascia:{...item.fascia,textPlacement:a}},"Fascia placement")}>{a}</Button>)}</div>
            <input
              type="text"
              placeholder="Fascia text (optional)"
              value={item.fascia?.text ?? ""}
              onChange={(e) => updateWall(item.id, { fascia: { ...item.fascia, text: e.target.value } }, "Fascia text")}
              className="w-full rounded-md border border-white/15 bg-transparent px-2 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      )}


      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">
          {item.kind === "double_deck" ? "Deck floor finish (stand-in panel)" : "Finish"}
        </p>
        {item.kind === "double_deck" && (
          <p className="mb-2 text-[11px] leading-relaxed text-white/40">
            The deck frame keeps its real beMatrix finish. This sets the stand-in walking surface on top.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {(["double_deck", "furniture", "tv"].includes(item.kind) ? FINISHES.filter((f) => f.id !== "brand" && (item.kind !== "furniture" || !MEETING_PRESETS.some(p=>p.id===item.presetId) || f.id!=="wood")) : FINISHES).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => updateWall(item.id, { finish: f.id }, `Finish set to ${f.label}`)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                item.finish === f.id
                  ? "border-[oklch(0.78_0.13_300)] text-white"
                  : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              <span className="h-3 w-3 rounded-sm" style={{ background: f.id === "brand" ? project.branding.primaryColor : FINISH_HEX[f.id] }} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {item.kind !== "tv" && item.kind !== "furniture" && item.kind !== "double_deck" && (
        <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <input
            type="checkbox"
            checked={item.lightbox ?? false}
            onChange={(e) => updateWall(item.id, { lightbox: e.target.checked }, "Backlighting")}
            className="mt-0.5 h-4 w-4 accent-[oklch(0.78_0.13_300)]"
          />
          <span>
            <span className="block text-sm font-medium text-white">Backlit graphic</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-white/45">
              Lit from the inside so the artwork glows on the show floor.
            </span>
          </span>
        </label>
      )}

      {item.kind !== "tv" && item.kind !== "furniture" && item.kind !== "double_deck" && <SurfaceBrandControls object={item} />}

      {["counter", "hanging", "storage", "tower", "led_wall"].includes(item.kind) && <TextGraphicControls object={item} />}

      <div className="flex gap-2 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={duplicateSelected}
          className="flex-1 rounded-lg border border-white/15 py-2.5 text-xs text-white/80 transition hover:border-white/40"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={deleteSelected}
          className="flex-1 rounded-lg border border-red-400/30 py-2.5 text-xs text-red-300 transition hover:border-red-400/60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

const EDGE_COLORS: { id: EdgeColor; label: string; swatch: string }[] = [
  { id: "white", label: "White", swatch: "#ffffff" },
  { id: "black", label: "Black", swatch: "#111111" },
  { id: "brand", label: "Brand", swatch: "oklch(0.78 0.13 300)" },
];

/** Right panel — properties for the selected object, or the project itself. */
export function PropertiesPanel() {
  const { project, selectedId, updateWall, duplicateSelected, deleteSelected, commit } = useBuilder();
  const wall = project.design.objects.find((o) => o.id === selectedId);

  if (!wall) {
    return (
      <div className="space-y-6 p-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Project</p>
          <p className="mt-2 text-lg font-semibold text-white">{project.project.projectName}</p>
          <p className="mt-1 text-xs capitalize text-white/50">
            {Math.round(mmToFt(project.project.widthMm))} × {Math.round(mmToFt(project.project.depthMm))} ft ·{" "}
            {project.project.boothType} booth
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => commit("Swapped frontage and depth", (d) => {
          const width = d.project.widthMm;
          d.project.widthMm = d.project.depthMm;
          d.project.depthMm = width;
          d.project.boothSize = `${Math.round(mmToFt(d.project.widthMm))}x${Math.round(mmToFt(d.project.depthMm))}`;
        })}><ArrowLeftRight />Swap width/depth</Button>

        <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <input
            type="checkbox"
            checked={project.regulations.enabled}
            onChange={(e) =>
              commit(e.target.checked ? "Standard rules on" : "Flexible event mode", (d) => {
                d.regulations.enabled = e.target.checked;
                d.regulations.profile = e.target.checked ? "north_american_standard" : "flexible_event";
              })
            }
            className="mt-0.5 h-4 w-4 accent-[oklch(0.78_0.13_300)]"
          />
          <span>
            <span className="block text-sm font-medium text-white">
              {project.regulations.enabled ? "Standard trade show rules" : "Flexible event mode"}
            </span>
            <span className="mt-1 block text-[11px] leading-relaxed text-white/45">
              {project.regulations.enabled
                ? "Uses common North American display guidelines to help avoid obvious layout, height and sight-line issues. Final requirements vary by event."
                : "Traditional trade show display-layout restrictions are off. Useful for conferences, corporate events, activations and hotel events."}
            </span>
          </span>
        </label>

        <p className="text-xs leading-relaxed text-white/45">
          Select a wall on the floor plan to change its size, height, finish and position.
        </p>
      </div>
    );
  }

  if (!isWall(wall)) return <ItemProperties item={wall} />;

  const width = wallWidthMm(wall);
  const widthFt = Math.round(mmToFt(width) * 10) / 10;


  return (
    <div className="space-y-6 p-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Selected</p>
        <p className="mt-2 text-lg font-semibold text-white">{wall.name}</p>
        <p className="mt-1 text-xs text-white/45">
          {mmLabel(width)} wide · {width} mm · {wall.sections.length} module
          {wall.sections.length === 1 ? "" : "s"}
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Width</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={3}
            max={40}
            step={0.5}
            value={widthFt}
            onChange={(e) =>
              updateWall(
                wall.id,
                { sections: sectionsFor(Number(e.target.value) * 304.8) },
                "Resized wall",
              )
            }
            className="flex-1 accent-[oklch(0.78_0.13_300)]"
          />
          <span className="w-16 text-right text-xs text-white/60">{widthFt} ft</span>
        </div>
        <p className="mt-1.5 text-[11px] text-white/35">
          Snaps to modular sections so it can actually be built.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Height</p>
        <div className="grid grid-cols-2 gap-2">
          {HEIGHTS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() =>
                updateWall(
                  wall.id,
                  { heightPreset: h.id as HeightPreset, heightMm: h.mm },
                  `Set height to ${h.label}`,
                )
              }
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                wall.heightPreset === h.id
                  ? "border-[oklch(0.78_0.13_300)] bg-[oklch(0.78_0.13_300)]/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/30"
              }`}
            >
              <span className="block text-xs font-semibold text-white">{h.label}</span>
              <span className="mt-0.5 block text-[10px] text-white/40">{h.approx}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Rotation</p>
        <div className="flex gap-2">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => updateWall(wall.id, { rotationDeg: deg }, "Rotated wall")}
              className={`flex-1 rounded-lg border py-2 text-xs transition ${
                wall.rotationDeg === deg
                  ? "border-[oklch(0.78_0.13_300)] bg-[oklch(0.78_0.13_300)]/10 text-white"
                  : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      <PositionControls object={wall} />

      <TextGraphicControls object={wall} />

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Visible edge colour</p>
        <div className="flex gap-2">
          {EDGE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => updateWall(wall.id, { edgeColor: c.id }, `Edges set to ${c.label}`)}
              className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                wall.edgeColor === c.id
                  ? "border-[oklch(0.78_0.13_300)] text-white"
                  : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              <span className="h-3 w-3 rounded-sm" style={{ background: c.swatch }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Graphics</p>
        <div className="grid grid-cols-2 gap-2">
          {GRAPHIC_TYPES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() =>
                updateWall(
                  wall.id,
                  {
                    graphicType: g.id as GraphicType,
                    ...(g.id === "backlit_graphic" ? { lightbox: true } : {}),
                  },
                  `Graphic set to ${g.label}`,
                )
              }
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                wall.graphicType === g.id
                  ? "border-[oklch(0.78_0.13_300)] bg-[oklch(0.78_0.13_300)]/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/30"
              }`}
            >
              <span className="block text-xs font-semibold text-white">{g.label}</span>
              <span className="mt-0.5 block text-[10px] leading-snug text-white/40">{g.note}</span>
            </button>
          ))}
        </div>
      </div>

      {wall.graphicType === "solid_color" && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Colour</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={wall.graphicColor ?? project.branding.primaryColor}
              onChange={(e) => updateWall(wall.id, { graphicColor: e.target.value }, "Wall colour")}
              className="h-9 w-14 cursor-pointer rounded border border-white/15 bg-transparent"
            />
            <button
              type="button"
              onClick={() =>
                updateWall(wall.id, { graphicColor: project.branding.primaryColor }, "Brand colour")
              }
              className="rounded-lg border border-white/15 px-3 py-2 text-[11px] text-white/70 transition hover:border-white/40"
            >
              Use brand colour
            </button>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Logo treatment</p>
        <div className="grid grid-cols-2 gap-2">
          {LOGO_TREATMENTS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                updateWall(
                  wall.id,
                  { logo: { ...(wall.logo ?? { scale: 1 }), treatment: t.id as LogoTreatment } },
                  `Logo: ${t.label}`,
                )
              }
              className={`rounded-lg border px-3 py-2 text-xs transition ${
                (wall.logo?.treatment ?? "none") === t.id
                  ? "border-[oklch(0.78_0.13_300)] text-white"
                  : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-white/35">
          Concept graphics only, our designers produce the real artwork.
        </p>
      </div>

      <SurfaceBrandControls object={wall} />


      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Backlighting</p>
        <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <input
            type="checkbox"
            checked={wall.lightbox ?? false}
            onChange={(e) =>
              commit(e.target.checked ? "Wall backlit" : "Backlighting off", (d) => {
                const t = d.design.objects.find((o) => o.id === wall.id);
                if (t && t.type === "wall") {
                  t.lightbox = e.target.checked;
                  for (const s of t.sections) s.lightbox = e.target.checked;
                }
              })
            }
            className="mt-0.5 h-4 w-4 accent-[oklch(0.78_0.13_300)]"
          />
          <span>
            <span className="block text-sm font-medium text-white">Light the whole wall</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-white/45">
              The fabric glows evenly from inside, bright, not neon.
            </span>
          </span>
        </label>

        {wall.sections.length > 1 && (
          <div className="mt-3">
            <p className="mb-2 text-[11px] text-white/40">Or light individual sections:</p>
            <div className="flex flex-wrap gap-2">
              {wall.sections.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    commit(s.lightbox ? "Section unlit" : "Section backlit", (d) => {
                      const t = d.design.objects.find((o) => o.id === wall.id);
                      if (t && t.type === "wall") {
                        const target = t.sections.find((x) => x.id === s.id);
                        if (target) target.lightbox = !target.lightbox;
                        t.lightbox = t.sections.every((x) => x.lightbox);
                      }
                    })
                  }
                  className={`rounded-lg border px-3 py-2 text-[11px] transition ${
                    s.lightbox
                      ? "border-[oklch(0.78_0.13_300)] bg-[oklch(0.78_0.13_300)]/15 text-white"
                      : "border-white/10 text-white/55 hover:border-white/30"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>



      <div className="flex gap-2 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={duplicateSelected}
          className="flex-1 rounded-lg border border-white/15 py-2.5 text-xs text-white/80 transition hover:border-white/40"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={deleteSelected}
          className="flex-1 rounded-lg border border-red-400/30 py-2.5 text-xs text-red-300 transition hover:border-red-400/60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
