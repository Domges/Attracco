import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="admin-nav" aria-label="Back-office">
        <Link href="/admin">Prenotazioni</Link>
        <Link href="/admin/fornitori">Fornitori</Link>
      </nav>
      {children}
    </>
  );
}
