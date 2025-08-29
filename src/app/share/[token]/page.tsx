import { Suspense } from "react";
import SharePageClient from "./share-page-client";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      }
    >
      <SharePageClient token={token} />
    </Suspense>
  );
}
