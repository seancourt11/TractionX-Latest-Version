import { doubleDeckPreset } from "./presets";
import { WALL_THICKNESS_MM, isUpper, isWall, wallWidthMm } from "./project";
import type { BoothProject } from "./types";

/** Full inventory, not the shortened sales summary. */
export function renderInventory(project: BoothProject): string[] {
  return project.design.objects.map((o, i) => {
    const width = isWall(o) ? wallWidthMm(o) : o.widthMm;
    const depth = isWall(o) ? WALL_THICKNESS_MM : o.depthMm;
    const deckNote =
      !isWall(o) && o.kind === "double_deck"
        ? doubleDeckPreset(o.visualKey ?? o.presetId)
          ? `, two-storey beMatrix double deck, frame ${doubleDeckPreset(o.visualKey ?? o.presetId)?.frameWidthMm}x${doubleDeckPreset(o.visualKey ?? o.presetId)?.frameDepthMm} mm, open frame with guard rails, deck floor at 2750 mm in a ${o.finish} finish`
          : `, two-storey custom deck ${o.widthMm}x${o.depthMm} mm covering its full footprint, columns about every ${o.columnSpacingMm ?? 2976} mm, guard rails on open edges only, deck floor at 2750 mm in a ${o.finish} finish`
        : "";
    const stairNote = !isWall(o) && o.kind === "stair" ? ", straight stair run up to the 2750 mm deck floor with handrails both sides" : "";
    const glassNote = !isWall(o) && o.kind === "glass_wall" ? `, frameless glass partition${o.door ? " with a door" : ""}${o.frostedBand ? " with a frosted privacy band" : ""}` : "";
    const ledNote = !isWall(o) && o.kind === "led_wall" ? `, emissive LED video wall, ${Math.max(1, Math.ceil(o.widthMm / 500)) * Math.max(1, Math.ceil(o.heightMm / 500))} cabinets` : "";
    const upperNote = isUpper(o) ? ", on the UPPER deck level at 2750 mm" : "";
    const textNote = o.graphic?.text ? `, with the exact text "${o.graphic.text}" on its face` : "";
    const fasciaNote = !isWall(o) && o.fascia?.text ? `, fascia text "${o.fascia.text}"` : "";
    return `${i + 1}. ${o.name} (${isWall(o) ? "wall" : o.kind}, ${o.id}), count 1, size ${width}x${depth}x${o.heightMm} mm, centre x=${o.position.x}, z=${o.position.z} mm, rotation=${o.rotationDeg} deg${!isWall(o) ? `, base=${o.hangHeightMm ?? o.elevationMm ?? 0} mm` : ""}${!isWall(o)?`, finish=${o.finish}`:""}${deckNote}${stairNote}${glassNote}${ledNote}${upperNote}${textNote}${fasciaNote}.`;
  });
}

export function buildRenderPrompt(project: BoothProject): string {
  const p = project.project;
  return [
    "Photoreal architectural material/lighting edit of the input canvas, NOT a redesign. Input is the strict geometry, framing, perspective and occlusion reference. Keep every object, even partly hidden objects. No people.",
    `Footprint ${p.widthMm}x${p.depthMm} mm, ${p.boothType}. Coordinates: origin back-left, x left to right, z back to aisle. Flooring: ${project.design.flooring.swatchId ?? "bare hall floor"}.`,
    `EXACT INVENTORY: ${project.design.objects.length} objects. Each entry is one separate object; repeated names are NOT duplicates to merge.`,
    ...renderInventory(project),
    "Keep all sizes, positions, counts, storage rooms, walls, counters, tables, stools and screens exactly. Do not remove or merge objects. Do not change camera or crop. Keep colours and artwork. Render any quoted text strings in the inventory exactly as written, with no spelling changes and no extra text.",
    "Actual uploaded logos are baked into this strict input capture. The app restores original logo pixels after your edit. Preserve all quoted text graphics exactly, including fascia text. Do not draw, duplicate or replace logos. Do not shift the booth within the frame or change the camera. NO extra text anywhere.",
    "Only upgrade materials: SEG fabric weave, laminate, carpet pile, metal frames, realistic furniture and TVs. Bright convention hall lighting, soft shadows, restrained reflections. Geometry preservation takes priority over beauty.",
  ].join("\n");
}

/** Single-flight actions and a cooldown prevent double clicks or effect replay. */
export function createExportGuard() {
  let active = false;
  let lastStart = -Infinity;
  return {
    start(now: number) {
      if (active || now - lastStart < 1000) return false;
      active = true;
      lastStart = now;
      return true;
    },
    finish() { active = false; },
  };
}
