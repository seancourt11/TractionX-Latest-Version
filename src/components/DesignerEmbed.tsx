/**
 * Slot for the third-party 3D booth designer. The developer pastes the
 * iframe URL into DESIGNER_EMBED_URL. Until then a labelled placeholder shows.
 * Never name the outside tool in visible copy.
 */
export const DESIGNER_EMBED_URL: string = "";

export function DesignerEmbed({ starter }: { starter?: string }) {
  if (DESIGNER_EMBED_URL) {
    const src = starter ? `${DESIGNER_EMBED_URL}${DESIGNER_EMBED_URL.includes("?") ? "&" : "?"}starter=${encodeURIComponent(starter)}` : DESIGNER_EMBED_URL;
    return (
      <iframe
        src={src}
        title="3D Booth Designer"
        className="w-full h-[80vh] min-h-[640px] rounded-2xl border border-white/10 bg-black"
        allow="fullscreen; xr-spatial-tracking"
      />
    );
  }
  return (
    <div className="w-full h-[70vh] min-h-[520px] rounded-2xl border-2 border-dashed border-[oklch(0.78_0.13_300)]/50 bg-white/[0.03] flex flex-col items-center justify-center text-center px-6">
      <p className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">3D Booth Designer loads here</p>
      <p className="mt-3 text-white/60 max-w-md">
        {starter ? `Starting from: ${starter}. ` : ""}The full designer opens in this space.
      </p>
    </div>
  );
}
