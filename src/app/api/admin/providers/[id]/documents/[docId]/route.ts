import { db } from "@/lib/db";
import { logProviderEvent } from "@/lib/providers/server";

export const runtime = "nodejs";

// Download di un documento del fornitore (solo back-office, HTTP Basic Auth in src/proxy.ts).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f-]{36}$/.test(docId)) return new Response("not found", { status: 404 });
  const [doc] = await db()<{ filename: string; mime_type: string; content: Buffer }[]>`
    SELECT filename, mime_type, content FROM provider_documents WHERE id = ${docId} AND provider_id = ${id}`;
  if (!doc) return new Response("not found", { status: 404 });
  await logProviderEvent(id, "document_viewed", { document: docId });
  return new Response(new Uint8Array(doc.content), {
    headers: {
      "Content-Type": doc.mime_type,
      "Content-Disposition": `attachment; filename="${doc.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
