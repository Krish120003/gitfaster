"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { PullRequestCard } from "@/components/pull-request-card";
import { SearchBar } from "@/components/search-bar";
import { StateFilter } from "@/components/state-filter";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function PullRequestsPage() {
  const params = useParams();
  const [search, setSearch] = useState("");
  const [state, setState] = useState<"open" | "closed" | "all">("open");
  const [cursor, setCursor] = useState(1);

  const { data, isLoading, isFetching } = api.pulls.list.useQuery({
    owner: params.owner as string,
    repository: params.repository as string,
    cursor,
    limit: 10,
    state,
    search: search || undefined,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setCursor(1);
  };

  const handleStateChange = (value: "open" | "closed" | "all") => {
    setState(value);
    setCursor(1);
  };

  const handleLoadMore = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Pull Requests</h1>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchBar defaultValue={search} onSearch={handleSearch} />
          <StateFilter value={state} onChange={handleStateChange} />
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {data?.items.map((pr) => (
              <PullRequestCard key={pr.id} pullRequest={pr} />
            ))}
          </div>

          {data?.nextCursor && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {isFetching ? <LoadingSpinner /> : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
