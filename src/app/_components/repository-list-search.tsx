"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import Link from "next/link";
import type { Repository } from "@/server/api/routers/user";
import debounce from "lodash.debounce";
import { Input } from "@/components/ui/input";

export function RepositoryListSearch({
  initialRepos,
}: {
  initialRepos: Repository[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedRepos, setDisplayedRepos] =
    useState<Repository[]>(initialRepos);
  const [searching, setSearching] = useState(false);
  const [allRepositories, setAllRepositories] = useState<Repository[] | null>(
    null
  );

  const searchRepositories = api.user.searchRepositories.useMutation();

  const {
    data: repoData,
    isLoading,
    error,
  } = api.user.getAllRepositories.useQuery();

  useEffect(() => {
    if (repoData) {
      setAllRepositories(repoData);
    }

    if (error) {
      console.error("Error fetching all repositories:", error);
    }
  }, [repoData, error]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setDisplayedRepos(initialRepos);
      setSearching(false);
      return;
    }

    setSearching(true);

    // If all repositories are loaded, use client-side filtering
    if (allRepositories) {
      const lowercasedQuery = query.toLowerCase();
      const filteredRepos = allRepositories.filter(
        (repo) =>
          repo.name.toLowerCase().includes(lowercasedQuery) ||
          (repo.description &&
            repo.description.toLowerCase().includes(lowercasedQuery))
      );
      setDisplayedRepos(filteredRepos.slice(0, 10));
      setSearching(false);
      return;
    }

    // Otherwise, use API-based search
    try {
      const results = await searchRepositories.mutateAsync({ query });
      setDisplayedRepos(results.slice(0, 10));
    } catch (error) {
      console.error("Error searching repositories:", error);
      setDisplayedRepos([]);
    } finally {
      setSearching(false);
    }
  };

  const debouncedSearch = debounce(performSearch, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    debouncedSearch(newQuery);
  };

  return (
    <div>
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium mb-2">Search repositories</h2>
        <Input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search repositories..."
          className="w-full"
        />
        {allRepositories && (
          <div className="text-xs text-muted-foreground mt-1">
            {allRepositories.length} repositories loaded for instant search
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium p-4 border-b">
          {searchQuery ? "Search results" : "Recently updated repositories"}
          {searching && " (loading...)"}
        </h2>
        <ul>
          {displayedRepos.length > 0 ? (
            displayedRepos.map((repo) => (
              <li key={repo.name} className="">
                <Link
                  href={`/${repo.owner.login}/${repo.name}`}
                  className="text-sm font-medium p-4 border-b block hover:bg-foreground hover:text-background transition-colors"
                  prefetch={true}
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex flex-col items-start">
                      <div className="flex gap-1 items-baseline">
                        <h3>{repo.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {repo.isPrivate ? "private" : "public"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
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
            ))
          ) : (
            <li className="p-4 text-center text-muted-foreground">
              {searching ? "Searching..." : "No repositories found"}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
