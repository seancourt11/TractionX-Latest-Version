import * as THREE from "three";
import type { SurfaceGraphic, TextFont } from "./types";

/**
 * Text graphics — company names, taglines and lines like "Mission: Ready"
 * drawn onto a canvas texture so walls, counters, hanging signs and deck
 * fascia can carry exact wording.
 */

export const TEXT_FONTS: { id: TextFont; label: string; stack: string }[] = [
  { id: "inter", label: "Arial (sans)", stack: "Arial, sans-serif" },
  { id: "montserrat", label: "Verdana (sans)", stack: "Verdana, sans-serif" },
  { id: "georgia", label: "Georgia (serif)", stack: "Georgia, serif" },
  { id: "arial_black", label: "Arial Black (bold display)", stack: "'Arial Black', Arial, sans-serif" },
  { id: "courier", label: "Courier (monospace)", stack: "'Courier New', monospace" },
];

export const fontStack = (id?: TextFont) => TEXT_FONTS.find((f) => f.id === id)?.stack ?? TEXT_FONTS[0].stack;

const cache = new Map<string, THREE.CanvasTexture>();

/**
 * Render a text graphic to a texture sized for its surface. The text sits at
 * the requested placement inside a transparent canvas, so it layers over any
 * surface colour or artwork.
 */
export function textTexture(
  graphic: SurfaceGraphic,
  surfaceWidthMm: number,
  surfaceHeightMm: number,
): THREE.CanvasTexture | null {
  const content = graphic.text?.trim();
  if (!content) return null;
  const sizeMm = graphic.textSizeMm ?? Math.min(380, surfaceHeightMm * 0.22);
  const align = graphic.textAlign ?? "center";
  const placement = graphic.textPlacement ?? "center";
  const color = graphic.textColor ?? "#ffffff";
  const font = fontStack(graphic.textFont);
  const key = [content, sizeMm, align, placement, color, font, surfaceWidthMm, surfaceHeightMm].join("|");
  const hit = cache.get(key);
  if (hit) return hit;

  const pxPerMm = 0.35;
  const w = Math.max(64, Math.round(surfaceWidthMm * pxPerMm));
  const h = Math.max(32, Math.round(surfaceHeightMm * pxPerMm));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const px = sizeMm * pxPerMm;
  ctx.font = `700 ${px}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align === "left" ? "left" : align === "right" ? "right" : "center";
  ctx.textBaseline = "middle";
  const margin = w * 0.05;
  const x = align === "left" ? margin : align === "right" ? w - margin : w / 2;
  const y = placement === "top" ? margin + px / 2 : placement === "bottom" ? h - margin - px / 2 : h / 2;
  // Shrink to fit the surface width.
  const measured = ctx.measureText(content).width;
  if (measured > w - margin * 2) {
    const fit = (w - margin * 2) / measured;
    ctx.font = `700 ${Math.max(10, Math.floor(px * fit))}px ${font}`;
  }
  ctx.fillText(content, x, y);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  cache.set(key, texture);
  return texture;
}
