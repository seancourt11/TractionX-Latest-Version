import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { editImage } from "@/lib/image-gateway.server";

const ALLOWED = new Set(["image", "prompt", "stream", "partial_images", "size", "quality"]);

export const Route = createFileRoute("/api/booth-render")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Rendering isn't available right now.", { status: 500 });
        const incoming = await request.formData();
        const image = incoming.get("image");
        const prompt = incoming.get("prompt");
        const parsedPrompt = z.string().min(1).max(24000).safeParse(prompt);
        if (!(image instanceof File) || image.size > 8_000_000 || !parsedPrompt.success)
          return new Response("Bad request", { status: 400 });
        // Forward only known fields, with a bounded prompt.
        const form = new FormData();
        for (const [k, v] of incoming.entries()) if (ALLOWED.has(k) && k !== "prompt") form.append(k, v);
        form.set("prompt", parsedPrompt.data);
        const upstream = await editImage(apiKey, form);
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
