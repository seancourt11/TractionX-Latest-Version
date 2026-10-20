import { Button } from "@/components/ui/button";
import type { CameraViewId } from "@/lib/booth-builder/cameras";
import type { CaptureShot } from "./View3D";
import { useEffect, useRef, useState } from "react";

import { submitLead } from "@/lib/leads";
import { buildRenderPrompt } from "@/lib/booth-builder/render-reference";

import { streamImage } from "@/lib/stream-image";
import { mmToFt } from "@/lib/booth-builder/presets";
import type { BoothProject } from "@/lib/booth-builder/types";

const LIMIT_KEY = "tx.boothBuilder.renders";
const EMAIL_KEY = "tx.boothBuilder.renderEmail";

function savedEmail(): string {
  try {
    return window.localStorage.getItem(EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

/** Composite the depth-tested surface artwork captured from the same camera. */
async function compositeLogo(src: string, logoLayer: string): Promise<string> {
  const load = (u: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = u;
    });
  const base = await load(src);
  const logo = await load(logoLayer);
  const c = document.createElement("canvas");
  c.width = base.naturalWidth;
  c.height = base.naturalHeight;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Could not restore your original surface logos.");
  ctx.drawImage(base, 0, 0);
  ctx.drawImage(logo, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}
export const RENDER_LIMIT = 5;

export function rendersUsed(): number {
  try {
    return Number(window.sessionStorage.getItem(LIMIT_KEY) || 0);
  } catch {
    return 0;
  }
}

export function PhotorealDialog({
  project,
  shot,
  logoLayer,
  onClose,
  onCaptureAngle,
}: {
  project: BoothProject;
  shot: string;
  logoLayer?: string;
  onClose: () => void;
  onCaptureAngle: (angle: CameraViewId) => Promise<CaptureShot>;
}) {
  const [angle, setAngle] = useState<"hero" | "aisle" | "corner">("hero");
  const [ready, setReady] = useState(false);
  const [img, setImg] = useState<string | null>(null);
  const [final, setFinal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const renderJob = useRef<Promise<string> | null>(null);

  useEffect(() => {
    if (savedEmail()) setUnlocked(true);
  }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setGateError(null);
    const p = project.project;
    const res = await submitLead({
      source: "booth-builder-photoreal-render",
      email: email.trim(),
      show: p.showName || undefined,
      footprint: `${Math.round(mmToFt(p.widthMm))}x${Math.round(mmToFt(p.depthMm))}`,
      wants3D: true,
      meta: { boothType: p.boothType, projectName: p.projectName },
    });
    setSending(false);
    if (!res.ok) {
      setGateError("Please enter a valid email address.");
      return;
    }
    try {
      window.localStorage.setItem(EMAIL_KEY, email.trim());
    } catch {
      /* ignore */
    }
    setUnlocked(true);
    setReady(true);
  }

  useEffect(() => {
    if (!unlocked || !ready) return;
    let cancelled = false;
    // Replayed effects attach to the same job, never purchase another render.
    if (!renderJob.current) renderJob.current = (async () => {
      const reference = angle === "hero" ? { dataUrl: shot, logoLayer } : await onCaptureAngle(angle);
      const hasLogo = Boolean(project.branding.logoUrl || project.branding.logoDarkUrl);
      if (hasLogo && !reference.logoLayer) throw new Error("Your logo is still loading. Close this window and capture again once it appears in 3D.");
      const blob = await (await fetch(reference.dataUrl)).blob();
      const form = new FormData();
      form.append("image", new File([blob], "booth.png", { type: "image/png" }));
      form.append("prompt", buildRenderPrompt(project));
      form.append("size", "1536x1024");
      let last = "";
      await streamImage("/api/booth-render", form, (src, isFinal) => {
        if (isFinal) last = src;
        else { setImg(src); setFinal(false); }
      });
      if (!last) throw new Error("No completed image was returned.");
      const out = reference.logoLayer ? await compositeLogo(last, reference.logoLayer) : last;
      try { window.sessionStorage.setItem(LIMIT_KEY, String(rendersUsed() + 1)); } catch { /* ignore */ }
      return out;
    })();
    void renderJob.current.then((out) => {
      if (cancelled) return;
      setImg(out);
      setFinal(true);
    }).catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "The render didn't come through.");
    });
    return () => { cancelled = true; };
    // One render per open, after the email gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, ready]);

  const name = project.project.projectName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "booth";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl rounded-2xl border border-white/15 bg-black p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-3">
          <p className="mr-auto text-sm font-semibold text-white">Photoreal concept render</p>
          {img && final && (
            <a
              href={img}
              download={`${name}-photoreal.png`}
              className="rounded-lg bg-[oklch(0.78_0.13_300)] px-3 py-1.5 text-xs font-semibold text-black"
            >
              Download
            </a>
          )}
          <button type="button" onClick={onClose} className="text-xs text-white/60 hover:text-white">
            Close
          </button>
        </div>
        <div className="relative grid aspect-[3/2] place-items-center overflow-hidden rounded-xl bg-white/[0.03]">
          {!ready ? (
            <div className="relative z-10 w-full max-w-sm space-y-3 px-6 text-center">
              <p className="text-sm font-semibold">Render angle</p>
              <div className="flex flex-wrap justify-center gap-1">
                {(["hero", "aisle", "corner"] as const).map((a) => <Button key={a} variant={angle === a ? "secondary" : "outline"} size="sm" onClick={() => setAngle(a)}>
                  {a === "hero" ? "Hero three-quarter" : a === "aisle" ? "Aisle view" : "Opposite corner"}
                </Button>)}
              </div>
              {unlocked ? <Button onClick={() => setReady(true)}>Create my render</Button> : (

            <form onSubmit={unlock} className="relative z-10 w-full max-w-sm space-y-3 px-6 text-center">
              <p className="text-base font-semibold text-white">Where should we send your render?</p>
              <p className="text-xs text-white/60">
                Enter your email to create your photoreal concept render. A Traction X designer may follow up with your
                complimentary 3D design.
              </p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-label="Email"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              {gateError && <p className="text-xs text-red-300">{gateError}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-lg bg-[oklch(0.78_0.13_300)] px-3 py-2 text-sm font-semibold text-black disabled:opacity-60"
              >
                {sending ? "Sending…" : "Create my render"}
              </button>
            </form>
              )}
            </div>
          ) : error ? (
            <p className="px-6 text-center text-sm text-white/70">{error}</p>
          ) : img ? (
            <img
              src={img}
              alt="Photoreal render of your booth"
              className={`h-full w-full object-contain transition-[filter] duration-500 ${final ? "blur-0" : "blur-2xl"}`}
            />
          ) : (
            <>
              <img src={shot} alt="" className="absolute inset-0 h-full w-full object-contain opacity-30 blur-sm" />
              <p className="relative text-sm text-white/80">Rendering your booth, about 30 to 60 seconds…</p>
            </>
          )}
        </div>
        <p className="mt-3 text-[11px] text-white/45">
          AI concept render for inspiration. Your 3D design and our designers' drawings are the final reference for
          sizes, counts and logos.
        </p>
      </div>
    </div>
  );
}
