/**
 * Canvas compositor for the internal social library.
 *
 * Runs in the browser and only reads images already in the site's asset
 * pipeline. Styling mirrors the live site: black surfaces, light purple accent,
 * Montserrat headings, the real Traction X logo and a call to action on every
 * image. LinkedIn keeps all text in the top 75% because the feed crops the
 * bottom of the image.
 */
import logoUrl from "@/assets/logo.png";

export type SocialSize = "linkedin" | "ig_square" | "ig_vertical";

export const SOCIAL_SIZES: Record<SocialSize, { w: number; h: number; label: string }> = {
  linkedin: { w: 1200, h: 627, label: "LinkedIn 1200×627" },
  ig_square: { w: 1080, h: 1080, label: "Instagram 1080×1080" },
  ig_vertical: { w: 1080, h: 1350, label: "Instagram 1080×1350" },
};

export const SOCIAL_SIZE_ORDER: SocialSize[] = ["linkedin", "ig_square", "ig_vertical"];

/** Mirrors src/styles.css tokens (background, accent, muted-foreground). */
const INK = "#000000";
const PANEL = "#0d0d0d";
const PAPER = "#fafafa";
const MUTED = "rgba(250,250,250,0.72)";
const ACCENT = "#c9a6f5";
const HEADING_FONT = "Montserrat, 'Helvetica Neue', Arial, sans-serif";
const BODY_FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";

export type VisualLayout = "hero" | "city" | "price" | "card" | "split";

export type VisualSpec = {
  layout?: VisualLayout;
  src?: string;
  splitSrc?: string;
  splitLabels?: [string, string];
  /** Small purple label above the headline. */
  kicker?: string;
  /** Big purple word (city name) or figure (price). */
  big?: string;
  /** Small label above `big`, e.g. "10×20 rental from". */
  bigLabel?: string;
  headline?: string;
  subline?: string;
  /** Short fact rows with purple markers. */
  facts?: string[];
  badges?: string[];
  /** Call to action text. */
  cta?: string;
  /** Domain printed beside the CTA. */
  domain?: string;
  /** Extra words to colour purple in the headline. */
  highlight?: string[];
  /** Legacy field, ignored (logo is always drawn). */
  wordmark?: string;
};

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(src: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

let fontsReady: Promise<unknown> | null = null;
function ensureFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load(`800 40px Montserrat`),
      document.fonts.load(`700 40px Montserrat`),
      document.fonts.load(`500 20px Inter`),
      document.fonts.load(`600 20px Inter`),
    ]).catch(() => null);
  }
  return fontsReady;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const HIGHLIGHT_RE = /^(\$[\d,.]+[KkMm+]*|\d+(x|×)\d+|\d+\+?%?|I&D)$/;

type Word = { text: string; accent: boolean };

function tokenize(text: string, highlight: string[]): Word[] {
  const hl = highlight.map((s) => s.toLowerCase());
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const bare = w.replace(/[^\p{L}\p{N}$&×+%,.x]/gu, "").replace(/[,.]$/, "");
      return { text: w, accent: HIGHLIGHT_RE.test(bare) || hl.includes(bare.toLowerCase()) };
    });
}

function wrapWords(ctx: CanvasRenderingContext2D, words: Word[], maxWidth: number, maxLines: number): Word[][] {
  const lines: Word[][] = [];
  let line: Word[] = [];
  const width = (ws: Word[]) => ctx.measureText(ws.map((w) => w.text).join(" ")).width;
  let i = 0;
  for (; i < words.length; i++) {
    const next = [...line, words[i]];
    if (!line.length || width(next) <= maxWidth) line = next;
    else {
      lines.push(line);
      line = [words[i]];
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line.length) {
    lines.push(line);
    i = words.length;
  }
  if (i < words.length && lines.length) {
    const last = lines[lines.length - 1];
    last[last.length - 1] = { ...last[last.length - 1], text: `${last[last.length - 1].text}…` };
  }
  return lines;
}

function wrapPlain(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  return wrapWords(ctx, tokenize(text, []), maxWidth, maxLines).map((l) => l.map((w) => w.text).join(" "));
}

type Box = { x: number; y: number; w: number; maxY: number };

/**
 * Lay out the text stack top-down inside `box`. With draw=false it only
 * measures, so callers can bottom-anchor the stack.
 */
function textStack(
  ctx: CanvasRenderingContext2D,
  spec: VisualSpec,
  box: Box,
  S: number,
  opts: { draw: boolean; inlineCta: boolean; big: boolean },
): number {
  let y = box.y;
  const { x, w } = box;
  const d = opts.draw;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  if (spec.kicker) {
    const ks = Math.round(S * 0.026);
    ctx.font = `700 ${ks}px ${BODY_FONT}`;
    ctx.letterSpacing = `${Math.round(ks * 0.16)}px`;
    if (d) {
      ctx.fillStyle = ACCENT;
      ctx.fillRect(x, y + ks * 0.45, ks * 1.4, Math.max(2, ks * 0.14));
      ctx.fillText(spec.kicker.toUpperCase(), x + ks * 2, y);
    }
    ctx.letterSpacing = "0px";
    y += ks * 1.9;
  }

  if (opts.big && spec.big) {
    if (spec.bigLabel) {
      const ls = Math.round(S * 0.026);
      ctx.font = `600 ${ls}px ${BODY_FONT}`;
      if (d) {
        ctx.fillStyle = MUTED;
        ctx.fillText(spec.bigLabel, x, y);
      }
      y += ls * 1.5;
    }
    let bs = Math.round(S * 0.14);
    ctx.font = `800 ${bs}px ${HEADING_FONT}`;
    while (ctx.measureText(spec.big).width > w && bs > S * 0.06) {
      bs -= 2;
      ctx.font = `800 ${bs}px ${HEADING_FONT}`;
    }
    if (d) {
      ctx.fillStyle = ACCENT;
      ctx.fillText(spec.big, x - bs * 0.04, y);
    }
    y += bs * 1.05;
  }

  if (spec.headline) {
    const hs = Math.round(S * (opts.big && spec.big ? 0.056 : 0.072));
    ctx.font = `800 ${hs}px ${HEADING_FONT}`;
    const lines = wrapWords(ctx, tokenize(spec.headline, spec.highlight ?? []), w, 3);
    for (const line of lines) {
      if (d) {
        let lx = x;
        for (const word of line) {
          ctx.fillStyle = word.accent ? ACCENT : PAPER;
          ctx.fillText(word.text, lx, y);
          lx += ctx.measureText(`${word.text} `).width;
        }
      }
      y += hs * 1.12;
    }
    y += hs * 0.25;
  }

  if (spec.subline) {
    const ss = Math.round(S * 0.03);
    ctx.font = `500 ${ss}px ${BODY_FONT}`;
    for (const line of wrapPlain(ctx, spec.subline, w, 2)) {
      if (d) {
        ctx.fillStyle = MUTED;
        ctx.fillText(line, x, y);
      }
      y += ss * 1.4;
    }
    y += ss * 0.5;
  }

  if (spec.facts?.length) {
    const fs = Math.round(S * 0.028);
    ctx.font = `600 ${fs}px ${BODY_FONT}`;
    for (const fact of spec.facts.slice(0, 3)) {
      const [line] = wrapPlain(ctx, fact, w - fs * 1.4, 1);
      if (d) {
        ctx.fillStyle = ACCENT;
        ctx.beginPath();
        ctx.arc(x + fs * 0.3, y + fs * 0.55, fs * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PAPER;
        ctx.fillText(line, x + fs * 1.1, y);
      }
      y += fs * 1.55;
    }
    y += fs * 0.4;
  }

  if (spec.badges?.length) {
    const bsz = Math.round(S * 0.022);
    ctx.font = `700 ${bsz}px ${BODY_FONT}`;
    const padX = Math.round(bsz * 0.9);
    const bh = Math.round(bsz * 2.2);
    let bx = x;
    let rows = 1;
    for (const badge of spec.badges.slice(0, 3)) {
      const text = badge.toUpperCase();
      const bw = ctx.measureText(text).width + padX * 2;
      if (bx + bw > x + w) {
        if (rows === 2) break;
        rows++;
        bx = x;
        y += bh + bsz * 0.5;
      }
      if (d) {
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = Math.max(1.5, bsz * 0.09);
        ctx.fillStyle = "rgba(201,166,245,0.14)";
        roundRect(ctx, bx, y, bw, bh, bh / 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = ACCENT;
        ctx.textBaseline = "middle";
        ctx.fillText(text, bx + padX, y + bh / 2 + 1);
        ctx.textBaseline = "top";
      }
      bx += bw + bsz * 0.5;
    }
    y += bh + bsz * 0.9;
  }

  if (opts.inlineCta && spec.cta) {
    const cs = Math.round(S * 0.03);
    ctx.font = `800 ${cs}px ${HEADING_FONT}`;
    const text = `${spec.cta}  →`;
    const bw = ctx.measureText(text).width + cs * 1.8;
    const bh = cs * 2.3;
    if (d) {
      ctx.fillStyle = ACCENT;
      roundRect(ctx, x, y, bw, bh, bh / 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.textBaseline = "middle";
      ctx.fillText(text, x + cs * 0.9, y + bh / 2 + 1);
      ctx.textBaseline = "top";
      if (spec.domain) {
        ctx.font = `600 ${Math.round(cs * 0.85)}px ${BODY_FONT}`;
        ctx.fillStyle = PAPER;
        ctx.textBaseline = "middle";
        ctx.fillText(spec.domain, x + bw + cs * 0.8, y + bh / 2 + 1);
        ctx.textBaseline = "top";
      }
    }
    y += bh;
  }

  return y - box.y;
}

function verticalFade(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, w: number, a0: number, a1: number) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(0,0,0,${a0})`);
  g.addColorStop(1, `rgba(0,0,0,${a1})`);
  ctx.fillStyle = g;
  ctx.fillRect(x, Math.min(y0, y1), w, Math.abs(y1 - y0));
}

export async function renderVisual(spec: VisualSpec, size: SocialSize): Promise<HTMLCanvasElement> {
  const { w, h } = SOCIAL_SIZES[size];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  await ensureFonts();

  const li = size === "linkedin";
  const S = Math.min(w, h);
  const pad = Math.round(S * 0.065);
  const layout: VisualLayout = spec.splitSrc ? "split" : (spec.layout ?? "hero");

  const [primary, secondary, logo] = await Promise.all([
    spec.src ? loadImage(spec.src) : Promise.resolve(null),
    spec.splitSrc ? loadImage(spec.splitSrc) : Promise.resolve(null),
    loadImage(logoUrl),
  ]);

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  // Instagram gets a purple CTA bar; LinkedIn puts the CTA inline up top.
  const footerH = li ? Math.round(h * 0.035) : Math.round(h * 0.085);
  const contentBottom = h - footerH;
  const logoH = Math.round(S * (li ? 0.095 : 0.08));
  const logoW = logo ? (logo.width / logo.height) * logoH : 0;
  const textTop = pad + logoH + Math.round(S * 0.045);
  const liLimit = h * 0.75;

  let box: Box;
  let anchorBottom = false;
  const showBig = layout === "city" || layout === "price" || layout === "card";

  if (layout === "price" || layout === "card") {
    const photoFrac = layout === "price" ? 0.48 : 0.38;
    if (li) {
      const px = w * (1 - photoFrac);
      ctx.fillStyle = PANEL;
      ctx.fillRect(0, 0, px, h);
      if (primary) drawCover(ctx, primary, px, 0, w - px, h);
      const g = ctx.createLinearGradient(px, 0, px + w * 0.12, 0);
      g.addColorStop(0, "rgba(13,13,13,1)");
      g.addColorStop(1, "rgba(13,13,13,0)");
      ctx.fillStyle = g;
      ctx.fillRect(px, 0, w * 0.12, h);
      box = { x: pad, y: textTop, w: px - pad * 1.4, maxY: liLimit };
    } else {
      const ph = Math.round(contentBottom * (layout === "price" ? (size === "ig_square" ? 0.36 : 0.44) : 0.34));
      ctx.fillStyle = PANEL;
      ctx.fillRect(0, 0, w, contentBottom);
      if (layout === "price") {
        if (primary) drawCover(ctx, primary, 0, 0, w, ph);
        verticalFade(ctx, 0, ph * 0.55, ph, w, 0, 0.0);
        const g = ctx.createLinearGradient(0, ph * 0.6, 0, ph);
        g.addColorStop(0, "rgba(13,13,13,0)");
        g.addColorStop(1, "rgba(13,13,13,1)");
        ctx.fillStyle = g;
        ctx.fillRect(0, ph * 0.6, w, ph * 0.4);
        verticalFade(ctx, 0, 0, ph * 0.35, w, 0.7, 0);
        box = { x: pad, y: ph + S * 0.01, w: w - pad * 2, maxY: contentBottom - pad };
      } else {
        const py = contentBottom - ph;
        if (primary) drawCover(ctx, primary, 0, py, w, ph);
        const g = ctx.createLinearGradient(0, py, 0, py + ph * 0.45);
        g.addColorStop(0, "rgba(13,13,13,1)");
        g.addColorStop(1, "rgba(13,13,13,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, py, w, ph * 0.45);
        box = { x: pad, y: textTop + S * 0.02, w: w - pad * 2, maxY: py };
      }
    }
  } else {
    // hero, city, split: full-bleed photography
    if (layout === "split" && primary && secondary) {
      const gap = Math.round(w * 0.008);
      const half = (w - gap) / 2;
      drawCover(ctx, primary, 0, 0, half, contentBottom);
      drawCover(ctx, secondary, half + gap, 0, half, contentBottom);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(half, 0, gap, contentBottom);
    } else if (primary) {
      drawCover(ctx, primary, 0, 0, w, contentBottom);
    } else {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0d0d0d");
      g.addColorStop(1, "#1c1426");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, contentBottom);
    }
    if (li) {
      const g = ctx.createLinearGradient(0, 0, w * 0.8, 0);
      g.addColorStop(0, "rgba(0,0,0,0.9)");
      g.addColorStop(0.55, "rgba(0,0,0,0.6)");
      g.addColorStop(1, "rgba(0,0,0,0.05)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, contentBottom);
      verticalFade(ctx, 0, 0, h * 0.3, w, 0.5, 0);
      box = { x: pad, y: textTop, w: w * 0.6, maxY: liLimit };
    } else {
      verticalFade(ctx, 0, 0, h * 0.25, w, 0.75, 0);
      const g2 = ctx.createLinearGradient(0, contentBottom, 0, contentBottom * 0.2);
      g2.addColorStop(0, "rgba(0,0,0,0.96)");
      g2.addColorStop(0.55, "rgba(0,0,0,0.82)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, contentBottom * 0.2, w, contentBottom * 0.8);
      box = { x: pad, y: 0, w: w - pad * 2, maxY: contentBottom - pad };
      anchorBottom = true;
    }
  }

  // Split labels on each half.
  if (layout === "split" && spec.splitLabels && primary && secondary) {
    const ls = Math.round(S * 0.028);
    ctx.font = `800 ${ls}px ${HEADING_FONT}`;
    ctx.textBaseline = "middle";
    const half = w / 2;
    spec.splitLabels.forEach((label, i) => {
      const text = label.toUpperCase();
      const tw = ctx.measureText(text).width + ls * 1.6;
      const bh = ls * 2;
      const cx = i === 0 ? (li ? half - tw - pad * 0.5 : half / 2 - tw / 2) : half + (li ? pad * 0.5 : half / 2 - tw / 2);
      const bx = cx;
      const by = li ? h * 0.62 : pad + logoH + S * 0.04;
      ctx.fillStyle = ACCENT;
      roundRect(ctx, bx, by, tw, bh, bh / 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillText(text, bx + ls * 0.8, by + bh / 2 + 1);
    });
    ctx.textBaseline = "top";
  }

  const stackOpts = { inlineCta: li, big: showBig };
  if (anchorBottom) {
    const hgt = textStack(ctx, spec, box, S, { ...stackOpts, draw: false });
    box = { ...box, y: Math.max(textTop, box.maxY - hgt) };
    const fadeTop = Math.max(0, box.y - S * 0.22);
    const g3 = ctx.createLinearGradient(0, fadeTop, 0, box.y + S * 0.02);
    g3.addColorStop(0, "rgba(0,0,0,0)");
    g3.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = g3;
    ctx.fillRect(0, fadeTop, w, box.y + S * 0.02 - fadeTop);
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, box.y + S * 0.02, w, contentBottom - box.y - S * 0.02);
  }
  textStack(ctx, spec, box, S, { ...stackOpts, draw: true });

  // Logo.
  if (logo) ctx.drawImage(logo, pad, pad, logoW, logoH);

  // Thin purple frame.
  const inset = Math.round(S * 0.022);
  ctx.strokeStyle = "rgba(201,166,245,0.45)";
  ctx.lineWidth = Math.max(1.5, S * 0.0025);
  roundRect(ctx, inset, inset, w - inset * 2, contentBottom - inset * 1.4, S * 0.02);
  ctx.stroke();

  // Footer bar.
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, contentBottom, w, footerH);
  if (!li && spec.cta) {
    const fs = Math.round(footerH * 0.32);
    ctx.font = `800 ${fs}px ${HEADING_FONT}`;
    ctx.fillStyle = INK;
    ctx.textBaseline = "middle";
    ctx.letterSpacing = `${Math.round(fs * 0.06)}px`;
    ctx.fillText(`${spec.cta.toUpperCase()}  →`, pad, contentBottom + footerH / 2 + 1);
    if (spec.domain) {
      ctx.font = `700 ${fs}px ${BODY_FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(spec.domain, w - pad, contentBottom + footerH / 2 + 1);
      ctx.textAlign = "left";
    }
    ctx.letterSpacing = "0px";
  }

  return canvas;
}

export async function renderDataUrl(spec: VisualSpec, size: SocialSize): Promise<string> {
  const canvas = await renderVisual(spec, size);
  return canvas.toDataURL("image/png");
}

export async function downloadVisual(spec: VisualSpec, size: SocialSize, filename: string) {
  const canvas = await renderVisual(spec, size);
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}
