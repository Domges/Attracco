import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { documentKind, MAX_DOCUMENT_BYTES, MAX_DOCUMENTS_PER_PROVIDER, safeFilename, sniffMime } from "@/lib/providers/rules";
import { logProviderEvent, providerByToken } from "@/lib/providers/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Caricamento di un documento da parte del fornitore (multipart/form-data: kind, file).
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!rateLimit(`partner-upload:${clientIp(req)}`, 30, 3_600_000)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const provider = await providerByToken((await params).token);
  if (!provider) return Response.json({ error: "not_found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const kindId = form?.get("kind");
  const file = form?.get("file");
  if (typeof kindId !== "string" || !(file instanceof File)) return Response.json({ error: "invalid_request" }, { status: 400 });
  const kind = documentKind(provider.category, kindId);
  if (!kind) return Response.json({ error: "invalid_kind" }, { status: 400 });
  if (file.size === 0 || file.size > MAX_DOCUMENT_BYTES) return Response.json({ error: "file_too_large" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime) return Response.json({ error: "unsupported_type" }, { status: 415 });

  const [{ count }] = await db()<{ count: number }[]>`
    SELECT count(*)::int AS count FROM provider_documents WHERE provider_id = ${provider.id}`;
  if (count >= MAX_DOCUMENTS_PER_PROVIDER) return Response.json({ error: "too_many_documents" }, { status: 409 });

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const [doc] = await db().begin(async (sql) => {
    // Un nuovo caricamento sostituisce le versioni dello stesso tipo non ancora verificate.
    await sql`
      UPDATE provider_documents SET status = 'superseded'
      WHERE provider_id = ${provider.id} AND kind = ${kind.id} AND status IN ('pending', 'rejected')`;
    return sql<{ id: string }[]>`
      INSERT INTO provider_documents (provider_id, kind, filename, mime_type, size_bytes, sha256, content, uploaded_by)
      VALUES (${provider.id}, ${kind.id}, ${safeFilename(file.name)}, ${mime}, ${bytes.byteLength}, ${sha256}, ${Buffer.from(bytes)}, 'provider')
      RETURNING id`;
  });
  await logProviderEvent(provider.id, "document_uploaded", { document: doc.id, kind: kind.id, sha256 });
  return Response.json({ ok: true, id: doc.id });
}
