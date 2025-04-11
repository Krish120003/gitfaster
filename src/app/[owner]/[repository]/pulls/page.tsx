import { Suspense } from "react";
import { PullRequestsClient } from "./pull-requests-client";
import type { PullRequest } from "@/server/api/routers/pull-requests";

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
      <Suspense fallback={<div>Loading pull requests...</div>}>
        <PullRequestsClient
          owner={owner}
          repository={repository}
          initialState={resolvedSearchParams.state ?? "open"}
          initialSearch={resolvedSearchParams.search}
        />
      </Suspense>
    </div>
  );
}
