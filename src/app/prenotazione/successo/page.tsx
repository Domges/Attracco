"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useI18n } from "@/lib/i18n";

function Success() {
  const { t } = useI18n();
  const ref = useSearchParams().get("ref") ?? "";
  return (
    <div className="card" style={{ marginTop: 32, maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>{t.successTitle}</h1>
      <p>{t.successText}</p>
      {/^ATT-[A-Z0-9]{8}$/.test(ref) && (
        <p>
          {t.reference}: <strong>{ref}</strong>
        </p>
      )}
      <Link className="btn" href="/">
        {t.backHome}
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <Success />
    </Suspense>
  );
}
