import { z } from "zod";
import { runConcierge, type ConciergeEvent } from "@/lib/concierge/agent";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Lo storico arriva dal browser come solo testo (nessun dato salvato lato
// server): limiti stretti su lunghezza e numero di messaggi.
const Body = z.object({
  locale: z.enum(["it", "en"]),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(30)
    .refine((m) => m.length > 0 && m[0].role === "user" && m[m.length - 1].role === "user", "conversation must start and end with user"),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`chat:${ip}`, 20, 60_000) || !rateLimit(`chat-day:${ip}`, 300, 86_400_000)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: ConciergeEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          // Il client ha chiuso la connessione.
        }
      };
      try {
        await runConcierge(parsed.data.messages, parsed.data.locale, emit, req.signal);
      } catch (err) {
        console.error("concierge failure", err);
        emit({ type: "error", code: "unavailable" });
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
