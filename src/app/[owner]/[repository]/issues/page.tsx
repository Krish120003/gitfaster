import { Suspense } from "react";
import { IssuesClient } from "./issues-client";
import type { Issue } from "@/server/api/routers/issues";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
  }>;
  searchParams: Promise<{
    state?: "open" | "closed" | "all";
    search?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ owner, repository }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div>Loading issues...</div>}>
        <IssuesClient
          owner={owner}
          repository={repository}
          initialState={resolvedSearchParams.state ?? "open"}
          initialSearch={resolvedSearchParams.search}
        />
      </Suspense>
    </div>
  );
}
