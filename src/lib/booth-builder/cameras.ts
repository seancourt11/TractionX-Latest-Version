import type { BoothProject } from "./types";
/**
 * Camera presets for the 3D view.
 *
 * Renders only look composed if the camera is placed deliberately, so the
 * builder offers the same handful of angles our design team shoots: a hero
 * three-quarter, the view an attendee gets walking the aisle, the opposite
 * corner, an eye-level walk-in and a plan view. The concept pack uses the
 * same list so the PDF matches what the customer saw on screen.
 *
 * All numbers are metres, in world space, with the booth centred on the
 * origin and the aisle side at +Z.
 */

export type CameraViewId = "hero" | "aisle" | "corner" | "walkin" | "plan";

export type CameraView = {
  id: CameraViewId;
  label: string;
  /** Short line printed under the render in the concept pack. */
  caption: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

export const CAMERA_VIEW_IDS: CameraViewId[] = ["hero", "aisle", "corner", "walkin", "plan"];

/** Angles used for the concept pack, in page order. */
export const PACK_VIEW_IDS: CameraViewId[] = ["hero", "aisle", "corner", "walkin"];

/**
 * Builds the preset for a booth of this footprint. Widths and depths are in
 * metres; every angle is scaled off the footprint so a 10×10 and a 20×30 both
 * fill the frame.
 */
function baseCameraView(id: CameraViewId, widthM: number, depthM: number): CameraView {
  const span = Math.max(widthM, depthM);
  const centre: [number, number, number] = [0, Math.min(1.6, span * 0.22), 0];

  switch (id) {
    case "aisle":
      return {
        id,
        label: "Aisle view",
        caption: "What an attendee sees walking the aisle.",
        position: [0, 1.75, depthM / 2 + span * 1.15],
        target: [0, 1.5, 0],
        fov: 42,
      };
    case "corner":
      return {
        id,
        label: "Opposite corner",
        caption: "The approach from the other end of the aisle.",
        position: [-widthM * 0.95 - span * 0.35, span * 0.8, depthM * 0.85 + span * 0.4],
        target: centre,
        fov: 40,
      };
    case "walkin":
      return {
        id,
        label: "Walk-in (eye level)",
        caption: "Standing inside the booth, at eye height.",
        position: [widthM * 0.22, 1.65, depthM * 0.35],
        target: [-widthM * 0.1, 1.5, -depthM * 0.45],
        fov: 55,
      };
    case "plan":
      return {
        id,
        label: "Top down",
        caption: "Layout and circulation from above.",
        position: [0.001, span * 2.1, 0.001],
        target: [0, 0, 0],
        fov: 38,
      };
    case "hero":
    default:
      return {
        id: "hero",
        label: "Hero three-quarter",
        caption: "The main presentation angle.",
        position: [widthM * 0.85 + span * 0.35, span * 0.85, depthM * 0.9 + span * 0.5],
        target: centre,
        fov: 40,
      };
  }
}


export function tallestObjectM(project: BoothProject): number {
  return Math.max(0, ...project.design.objects.map((o) =>
    (o.heightMm + (o.type === "item" ? o.hangHeightMm ?? o.elevationMm ?? 0 : o.level === "upper" ? 2750 : 0)) / 1000));
}

/** Fit all eight corners in camera space, accounting for perspective depth. */
export function cameraView(id: CameraViewId, widthM: number, depthM: number, aspect = 1.5, heightM = 2.418): CameraView {
  const view = baseCameraView(id, widthM, depthM);
  if (id === "walkin") return view;
  const fov = view.fov;
  const tanV = Math.tan(fov * Math.PI / 360);
  const tanH = tanV * Math.max(aspect, 0.1);
  if (id === "plan") {
    const distance = Math.max(widthM / (2 * tanH), depthM / (2 * tanV)) * 1.101;
    return { ...view, target: [0, heightM, 0], position: [0, heightM + distance, 0.001] };
  }
  const target: [number, number, number] = [0, heightM / 2, 0];
  const dx = view.position[0];
  const dy = id === "aisle" ? 0.08 * Math.max(widthM, depthM) : Math.max(view.position[1], heightM);
  const dz = view.position[2];
  const length = Math.hypot(dx, dy, dz);
  const forward = [dx / length, dy / length, dz / length];
  const horizontal = Math.hypot(forward[0], forward[2]);
  const right = [forward[2] / horizontal, 0, -forward[0] / horizontal];
  const up = [-forward[1] * forward[0] / horizontal, horizontal, -forward[1] * forward[2] / horizontal];
  let distance = 0;
  for (const x of [-widthM / 2, widthM / 2]) for (const y of [-heightM / 2, heightM / 2]) for (const z of [-depthM / 2, depthM / 2]) {
    const projectedX = x * right[0] + z * right[2];
    const projectedY = x * up[0] + y * up[1] + z * up[2];
    const towardCamera = x * forward[0] + y * forward[1] + z * forward[2];
    distance = Math.max(distance, towardCamera + Math.max(Math.abs(projectedX) / tanH, Math.abs(projectedY) / tanV) * 1.1);
  }
  return { ...view, target, position: [forward[0] * distance, target[1] + forward[1] * distance, forward[2] * distance] };
}
