import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Locale } from "@/data/catalog";
import { env } from "@/lib/env";
import { todayInRome } from "@/lib/pricing";
import { CONCIERGE_SYSTEM_PROMPT } from "./prompt";
import { CONCIERGE_TOOLS, runTool, type BookingProposal } from "./tools";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ConciergeEvent =
  | { type: "text"; delta: string }
  | { type: "proposal"; proposal: BookingProposal }
  | { type: "error"; code: "refused" | "unavailable" | "too_long" }
  | { type: "done" };

const MAX_TOOL_ROUNDS = 6;

let client: Anthropic | undefined;
function anthropic(): Anthropic {
  client ??= new Anthropic();
  return client;
}

// Dopo un fallback lato server a metà risposta, i blocchi del modello che ha
// declinato che precedono l'ultimo blocco `fallback` (thinking, tool_use) non
// vanno rimandati nella conversazione; i blocchi di testo sì.
function sanitizeAfterFallback(content: Anthropic.Beta.BetaContentBlock[]): Anthropic.Beta.BetaContentBlockParam[] {
  const lastFallback = content.map((b) => b.type).lastIndexOf("fallback");
  if (lastFallback === -1) return content as Anthropic.Beta.BetaContentBlockParam[];
  return content.filter((b, i) => i > lastFallback || b.type === "text") as Anthropic.Beta.BetaContentBlockParam[];
}

/**
 * Esegue un turno del concierge: chiama Claude, esegue i tool (sola lettura sul
 * catalogo) e inoltra testo e proposte di prenotazione al browser tramite `emit`.
 */
export async function runConcierge(
  history: ChatTurn[],
  locale: Locale,
  emit: (e: ConciergeEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((t) => ({ role: t.role, content: t.content }));
  // Dato variabile in coda (non nel system prompt) per non invalidare la cache.
  messages.push({ role: "system", content: `Today's date in Puglia (Europe/Rome): ${todayInRome()}. Interface language: ${locale}.` });

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = anthropic().beta.messages.stream(
      {
        model: env.conciergeModel(),
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: env.conciergeEffort() },
        system: [{ type: "text", text: CONCIERGE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        tools: CONCIERGE_TOOLS,
        messages,
      },
      { signal },
    );
    stream.on("text", (delta) => emit({ type: "text", delta }));

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
    } catch (err) {
      if (err instanceof Anthropic.APIUserAbortError) return;
      if (err instanceof Anthropic.APIError) {
        console.error("concierge api error", err.status, err.message);
        emit({ type: "error", code: "unavailable" });
        return;
      }
      // Input di un tool non interpretabile come JSON: si ripete il giro.
      console.error("concierge stream error", err);
      continue;
    }

    if (message.stop_reason === "refusal") {
      emit({ type: "error", code: "refused" });
      return;
    }
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: sanitizeAfterFallback(message.content) });
      continue;
    }

    const content = sanitizeAfterFallback(message.content);
    const toolUses = content.filter((b): b is Anthropic.Beta.BetaToolUseBlockParam => b.type === "tool_use");
    if (toolUses.length === 0) {
      if (message.stop_reason === "max_tokens") emit({ type: "error", code: "too_long" });
      emit({ type: "done" });
      return;
    }
    if (message.stop_reason === "max_tokens") {
      // Input del tool potenzialmente troncato: non lo eseguiamo.
      emit({ type: "error", code: "too_long" });
      return;
    }

    messages.push({ role: "assistant", content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = toolUses.map((tu) => {
      const outcome = runTool(tu.name, tu.input, { locale, platformFeeBps: env.platformFeeBps() });
      if (outcome.proposal) emit({ type: "proposal", proposal: outcome.proposal });
      return { type: "tool_result", tool_use_id: tu.id, content: outcome.content, is_error: outcome.isError };
    });
    messages.push({ role: "user", content: results });
  }

  emit({ type: "done" });
}
