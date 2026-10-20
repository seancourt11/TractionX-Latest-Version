/**
 * The one place booth regulation logic lives.
 *
 * Nothing here ever blocks or deletes: every issue is a warning the customer
 * can fix automatically or keep (and our team reviews it with the show).
 */

import { HEIGHTS, heightMm, mmToFt } from "./presets";
import { decks as projectDecks, fitSections, isItem, isUpper, isWall, wallBounds, wallWidthMm } from "./project";
import { upperFits, nearestFreePosition } from "./levels";
import type { BoothProject } from "./types";

export type Severity = "warning" | "note";

export type DesignIssue = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  /** Present when the issue can be corrected for the customer. */
  fixLabel?: string;
  fix?: (draft: BoothProject) => void;
};

/** Standard North American show rules, in millimetres. */
export const RULES = {
  /** Max height for an inline / corner booth. */
  inlineMaxHeightMm: 2438.4,
  /** Max height anywhere without special approval. */
  islandMaxHeightMm: 6100,
  /** Nothing over this height in the front 1.5 m of an inline booth. */
  sightLineHeightMm: 1219.2,
  sightLineDepthMm: 1524,
  /** Lowest point of a hanging sign off the floor. */
  hangMinClearanceMm: 3660,
  hangMaxTopMm: 6100,
};

const ft = (mm: number) => `${Math.round(mmToFt(mm) * 10) / 10} ft`;

/** Nearest height preset at or below a ceiling. */
function largestPresetUnder(maxMm: number) {
  const under = HEIGHTS.filter((h) => h.mm <= maxMm);
  return under.length ? under[under.length - 1] : HEIGHTS[0];
}

/** Height above which a piece near the aisle really hides what is behind it. */
const VIEW_BLOCK_HEIGHT_MM = 1600;

/**
 * How much of the aisle-facing frontage is hidden behind tall structures.
 * Purely a design-quality check — nothing here is a show rule.
 */
export function aisleBlockedFraction(project: BoothProject): number {
  const { widthMm, depthMm } = project.project;
  if (!widthMm) return 0;

  const spans: [number, number][] = [];
  for (const o of project.design.objects) {
    if (o.type === "item" && (o.kind === "hanging" || o.kind === "double_deck" || o.kind === "stair")) continue;
    if (o.heightMm < VIEW_BLOCK_HEIGHT_MM) continue;
    const b = wallBounds(o);
    // Only pieces standing in the front 45% of the booth screen the aisle.
    if (b.maxZ < depthMm * 0.55) continue;
    spans.push([Math.max(0, b.minX), Math.min(widthMm, b.maxX)]);
  }
  if (!spans.length) return 0;

  spans.sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let [start, end] = spans[0];
  for (const [s, e] of spans.slice(1)) {
    if (s > end) {
      covered += end - start;
      start = s;
      end = e;
    } else if (e > end) {
      end = e;
    }
  }
  covered += end - start;
  return Math.min(1, covered / widthMm);
}

export function validateBoothDesign(project: BoothProject): DesignIssue[] {
  const issues: DesignIssue[] = [];
  if (!project.regulations.enabled) return issues;

  const type = project.project.boothType;
  const inlineLike = type === "inline" || type === "corner";
  const hasDeck = project.design.objects.some((o) => isItem(o) && o.kind === "double_deck");
  const inlineStandards = inlineLike && !hasDeck;
  const ceiling =
    project.regulations.maximumHeightMm ??
    (inlineStandards ? RULES.inlineMaxHeightMm : RULES.islandMaxHeightMm);

  /* ---- double decks ---------------------------------------------------- */
  const decks = project.design.objects.filter(isItem).filter((o) => o.kind === "double_deck");
  if (decks.length && inlineLike) {
    issues.push({
      id: "double_deck_inline",
      severity: "warning",
      title: "Double decks are rarely allowed in this booth type",
      detail:
        "Second storeys are generally only approved for island and peninsula booths, and always need written venue and organizer approval. You can keep designing with it, and we'll take it to the show for you.",
    });
  } else if (decks.length) {
    issues.push({
      id: "double_deck_approval",
      severity: "note",
      title: "Double decks need venue approval",
      detail:
        "Every second storey needs written approval from the venue and show organizer, usually with stamped engineering drawings. We handle that submission as part of the build.",
    });
  }

  /* ---- height ceiling -------------------------------------------------- */
  // Double decks are exempt: their height is fixed by the product and the
  // deck approval note above covers the show-rule side.
  const tooTall = project.design.objects.filter(
    (o) => o.heightMm > ceiling && !(o.type === "item" && o.kind === "double_deck"),
  );
  if (tooTall.length) {
    const preset = largestPresetUnder(ceiling);
    issues.push({
      id: "height_ceiling",
      severity: "warning",
      title: `${tooTall.length} piece${tooTall.length === 1 ? "" : "s"} above the ${ft(ceiling)} height limit`,
      detail: inlineStandards
        ? `Most shows cap inline and corner booths at ${ft(ceiling)}. Anything taller needs written approval from the show.`
        : `Most halls cap booth structures at ${ft(ceiling)} without an engineering review.`,
      fixLabel: `Bring down to ${preset.label}`,
      fix: (d) => {
        for (const o of d.design.objects) {
          if (o.heightMm <= ceiling || (isItem(o) && o.kind === "double_deck")) continue;
          o.heightMm = Math.min(heightMm(preset.id), ceiling);
          if (isWall(o)) o.heightPreset = preset.id;
        }
      },
    });
  }

  /* ---- inline sight lines --------------------------------------------- */
  if (inlineStandards) {
    const frontLimit = project.project.depthMm / 2;
    const offenders = project.design.objects.filter((o) => {
      if (o.type === "item" && (o.kind === "hanging" || o.kind === "double_deck" || o.kind === "stair")) return false;
      if (o.heightMm <= RULES.sightLineHeightMm) return false;
      const b = wallBounds(o);
      return b.maxZ > project.project.depthMm - frontLimit;
    });
    if (offenders.length) {
      issues.push({
        id: "sight_lines",
        severity: "warning",
        title: "Tall pieces in the front of the booth",
        detail: "Inline and corner booth standards allow a maximum of 4 ft in the front half and 8 ft in the back half. Tall side walls must stay in the back half so your neighbours stay visible.",
        fixLabel: "Move them back",
        fix: (d) => {
          for (const o of d.design.objects) {
            if (o.type === "item" && (o.kind === "hanging" || o.kind === "double_deck" || o.kind === "stair")) continue;
            if (o.heightMm <= RULES.sightLineHeightMm) continue;
            const b = wallBounds(o);
            const backHalf = d.project.depthMm / 2;
            if (b.maxZ <= backHalf) continue;
            // Full-depth side walls cannot just translate into half their depth.
            // Shorten their run, preserving their original finish and artwork.
            if (isWall(o) && b.along && b.halfZ * 2 > backHalf) {
              o.sections = fitSections(o.sections, backHalf);
            }
            const fixed = wallBounds(o);
            if (fixed.halfZ * 2 > backHalf) {
              o.heightMm = RULES.sightLineHeightMm;
            } else {
              o.position.z = Math.max(fixed.halfZ, Math.min(o.position.z, backHalf - fixed.halfZ));
            }
          }
        },
      });
    }
  }

  /* ---- can people see into the booth? ---------------------------------- */
  const blocked = aisleBlockedFraction(project);
  if (blocked > 0.55) {
    issues.push({
      id: "aisle_sightline",
      severity: "note",
      title: `${Math.round(blocked * 100)}% of your aisle frontage is blocked`,
      detail:
        "Tall pieces sitting near the aisle stop people seeing into the booth. Keeping roughly half the frontage open, with the tall structures set back, pulls noticeably more traffic in.",
    });
  }

  /* ---- hanging signs --------------------------------------------------- */
  const signs = project.design.objects.filter(isItem).filter((o) => o.kind === "hanging");
  if (signs.length && inlineLike) {
    issues.push({
      id: "hanging_inline",
      severity: "note",
      title: "Overhead signs are rarely allowed for this booth type",
      detail:
        "Most shows reserve hanging signs for peninsula and island booths. We'll check your exhibitor manual before anything is built.",
    });
  }
  const lowSign = signs.find((o) => (o.hangHeightMm ?? 0) < RULES.hangMinClearanceMm);
  if (lowSign) {
    issues.push({
      id: "hang_low",
      severity: "warning",
      title: "Hanging sign is below the usual clearance",
      detail: `Signs normally start at ${ft(RULES.hangMinClearanceMm)} off the floor so people can walk under them.`,
      fixLabel: "Raise to the standard height",
      fix: (d) => {
        for (const o of d.design.objects) {
          if (o.type === "item" && o.kind === "hanging" && (o.hangHeightMm ?? 0) < RULES.hangMinClearanceMm)
            o.hangHeightMm = RULES.hangMinClearanceMm;
        }
      },
    });
  }
  const highSign = signs.find((o) => (o.hangHeightMm ?? 0) + o.heightMm > RULES.hangMaxTopMm);
  if (highSign) {
    issues.push({
      id: "hang_high",
      severity: "warning",
      title: "Hanging sign tops out above the show limit",
      detail: `The top of a sign is usually capped at ${ft(RULES.hangMaxTopMm)} from the floor.`,
      fixLabel: "Lower it to the limit",
      fix: (d) => {
        for (const o of d.design.objects) {
          if (o.type !== "item" || o.kind !== "hanging") continue;
          if ((o.hangHeightMm ?? 0) + o.heightMm > RULES.hangMaxTopMm)
            o.hangHeightMm = Math.max(RULES.hangMinClearanceMm, RULES.hangMaxTopMm - o.heightMm);
        }
      },
    });
  }

  /* ---- fits in the booth ---------------------------------------------- */
  const outside = project.design.objects.filter((o) => {
    const b = wallBounds(o);
    return (
      b.minX < -1 || b.minZ < -1 || b.maxX > project.project.widthMm + 1 || b.maxZ > project.project.depthMm + 1
    );
  });
  if (outside.length) {
    issues.push({
      id: "outside",
      severity: "warning",
      title: `${outside.length} piece${outside.length === 1 ? "" : "s"} hanging over the booth line`,
      detail: "Everything has to sit inside your rented footprint, including overhead signs.",
      fixLabel: "Pull everything inside",
      fix: (d) => {
        for (const o of d.design.objects) {
          // A wall longer than the booth side is trimmed, not just moved.
          if (isWall(o)) {
            const along = Math.abs(Math.sin((o.rotationDeg * Math.PI) / 180)) > 0.5;
            const room = along ? d.project.depthMm : d.project.widthMm;
            if (wallWidthMm(o) > room) o.sections = fitSections(o.sections, room);
          }
          const b = wallBounds(o);
          o.position.x = Math.min(Math.max(o.position.x, b.halfX), Math.max(b.halfX, d.project.widthMm - b.halfX));
          o.position.z = Math.min(Math.max(o.position.z, b.halfZ), Math.max(b.halfZ, d.project.depthMm - b.halfZ));
        }
      },
    });
  }

  /* ---- upper-level containment ---------------------------------------- */
  const deckList = projectDecks(project);
  const upperItems = project.design.objects.filter((o) => isUpper(o) && !(isItem(o) && o.kind === "double_deck"));
  if (upperItems.length) {
    const stray = upperItems.filter((o) => !upperFits(project,o));
    if (stray.length) {
      issues.push({
        id: "upper_containment",
        severity: "warning",
        title: `${stray.length} upper-level piece${stray.length === 1 ? "" : "s"} outside the deck`,
        detail:
          "Everything upstairs has to stand inside the deck frame, clear of the guard rails and the stair opening.",
        fixLabel: "Move inside the deck",
        fix: (d) => {
          for (const o of d.design.objects) {
            if (!isUpper(o) || (isItem(o) && o.kind === "double_deck")) continue;
            const position=nearestFreePosition(d,o);
            if(position)o.position=position;
          }
        },
      });
    }
  }

  /* ---- island back walls ---------------------------------------------- */
  if (type === "island") {
    const run = project.design.objects.filter(isWall).reduce((s, o) => s + wallWidthMm(o), 0);
    const perimeter = 2 * (project.project.widthMm + project.project.depthMm);
    if (run > perimeter * 0.5) {
      issues.push({
        id: "island_enclosed",
        severity: "note",
        title: "Island booth is looking closed in",
        detail:
          "Island booths usually have to stay open on all four sides, most shows want at least half of each side left clear.",
      });
    }
  }

  return issues;
}
