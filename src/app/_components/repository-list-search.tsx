"use client";

import { useId, useMemo } from "react";
import { api } from "@/trpc/react";
import Link from "next/link";
import type { Repository } from "@/server/api/routers/user";
import { useQueryState } from "nuqs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { Session } from "next-auth";
import { SignOut } from "./sign-in-button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

function RepositoryListItem({ repo }: { repo: Repository }) {
  return (
    <li key={`${repo.owner.login}/${repo.name}`} className="">
      <Link
        href={`/${repo.owner.login}/${repo.name}`}
        className="block p-4 text-sm font-medium transition-colors border-b hover:bg-foreground hover:text-background"
        prefetch={true}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-start">
            <div className="flex items-baseline gap-1">
              <h3>
                {repo.owner.login}/{repo.name}
              </h3>
              <span className="text-xs text-muted-foreground">
                {repo.isPrivate ? "private" : "public"}
              </span>
            </div>
            <span className="pt-2 text-xs text-muted-foreground max-w-96">
              {repo.description}
            </span>
          </div>
          <div className="flex flex-col items-end min-w-32">
            <span className="text-xs text-muted-foreground">
              {repo.stargazerCount} stars
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(repo.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function RepositoryListSearch({
  initialRepos,
  session,
}: {
  initialRepos: Repository[];
  session: Session;
}) {
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const isSearching = debouncedSearchQuery.trim().length > 0;

  const {
    data: allRepositories,
    isFetching,
    error,
  } = api.user.getAllRepositories.useQuery(undefined, {
    initialData: initialRepos,
  });

  const searchRepositoriesQuery = api.user.searchRepositories.useQuery(
    {
      query: debouncedSearchQuery,
    },
    { enabled: isFetching && isSearching }
  );
  const searchThirdPartyRepositories =
    api.user.searchThirdPartyRepositories.useQuery(
      {
        query: debouncedSearchQuery,
      },
      { enabled: isSearching }
    );

  const inputId = useId();

  const isSearchFetching =
    searchRepositoriesQuery.isFetching ||
    searchThirdPartyRepositories.isFetching;

  const filteredRepositoriesUser = useMemo(() => {
    if (!isSearching) {
      return allRepositories;
    }

    const clientQueryResults = allRepositories?.filter(
      (repo) =>
        repo.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        repo.description
          ?.toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase())
    );
    const queryResults = [
      ...clientQueryResults,
      ...(searchRepositoriesQuery.data || []),
      ...(searchThirdPartyRepositories.data || []),
    ];

    // de-duplicate results using set
    return [...new Set(queryResults)];
  }, [
    isSearching,
    allRepositories,
    debouncedSearchQuery,
    searchRepositoriesQuery.data,
    searchThirdPartyRepositories.data,
  ]);

  return (
    <div className="border-b">
      <div className="flex items-stretch justify-between w-full border-b">
        <div className="p-4 border-r">Hi, {session?.user.name}</div>
        <div className="relative flex items-center justify-center grow">
          <label
            htmlFor={inputId}
            className="flex items-center justify-center w-8 h-8 pl-4 text-muted-foreground"
          >
            <Search className="" />
          </label>
          <input
            type="text"
            placeholder="Search Repositories..."
            className="block p-4 border-0 grow outline-0 focus:ring-0 focus-visible:ring-0"
            id={inputId}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div
            className={cn(
              "absolute w-2 h-2 bg-blue-400 rounded-full right-4 animate-pulse",
              {
                hidden: !isSearchFetching,
                block: isSearchFetching,
              }
            )}
          ></div>
        </div>
        <SignOut className="border-l border-r-0" />
      </div>
      <div>
        <ul>
          {filteredRepositoriesUser?.map((repo) => (
            <RepositoryListItem
              key={repo.owner.login + repo.name}
              repo={repo}
            />
          ))}
        </ul>
        {filteredRepositoriesUser.length === 0 && (
          <div className="flex items-center justify-center w-full p-4 text-sm text-muted-foreground">
            No Repositories Found
          </div>
        )}
      </div>
    </div>
  );
}
