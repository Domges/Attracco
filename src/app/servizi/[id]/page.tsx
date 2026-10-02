import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ServiceDetail } from "@/components/ServiceDetail";
import { getService, SERVICES } from "@/data/catalog";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const s = getService((await params).id);
  return s ? { title: `${s.title.it} — Attracco`, description: s.summary.it } : {};
}

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getService(id)) notFound();
  return (
    <Suspense>
      <ServiceDetail id={id} />
    </Suspense>
  );
}
