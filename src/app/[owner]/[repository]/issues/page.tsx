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
    <IssuesClient
      owner={owner}
      repository={repository}
      initialState={resolvedSearchParams.state ?? "open"}
      initialSearch={resolvedSearchParams.search}
    />
  );
}
