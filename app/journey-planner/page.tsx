// app/page.tsx
import { connection } from "next/server";
import { Suspense } from "react";
import { PageInner } from "../components/PageClient";

export default async function Page() {
  await connection();
  return (
    <Suspense fallback={null}>
      <div className="mt-20">
      <PageInner />

      </div>
    </Suspense>
  );
}