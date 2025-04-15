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
  const [thirdPartyRepos, setThirdPartyRepos] = useState<Repository[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchingThirdParty, setSearchingThirdParty] = useState(false);
  const [allRepositories, setAllRepositories] = useState<Repository[] | null>(
    null
  );

  const searchRepositories = api.user.searchRepositories.useMutation();
  const searchThirdPartyRepositories =
    api.user.searchThirdPartyRepositories.useMutation();

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
      setThirdPartyRepos([]);
      setSearching(false);
      setSearchingThirdParty(false);
      return;
    }

    setSearching(true);
    setSearchingThirdParty(true);

    // If all repositories are loaded, use client-side filtering for user repos
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
    } else {
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
    }

    // Always use API for third-party repos
    try {
      const results = await searchThirdPartyRepositories.mutateAsync({ query });
      setThirdPartyRepos(results.slice(0, 5));
    } catch (error) {
      console.error("Error searching third-party repositories:", error);
      setThirdPartyRepos([]);
    } finally {
      setSearchingThirdParty(false);
    }
  };

  const debouncedSearch = debounce(performSearch, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    debouncedSearch(newQuery);
  };

  // Helper function to render repository list
  const renderRepositoryList = (
    repos: Repository[],
    isLoading: boolean,
    emptyMessage: string
  ) => (
    <ul>
      {repos.length > 0 ? (
        repos.map((repo) => (
          <li key={`${repo.owner.login}/${repo.name}`} className="">
            <Link
              href={`/${repo.owner.login}/${repo.name}`}
              className="text-sm font-medium p-4 border-b block hover:bg-foreground hover:text-background transition-colors"
              prefetch={true}
            >
              <div className="flex justify-between items-center gap-4">
                <div className="flex flex-col items-start">
                  <div className="flex gap-1 items-baseline">
                    <h3>
                      {repo.owner.login}/{repo.name}
                    </h3>
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
          {isLoading ? "Searching..." : emptyMessage}
        </li>
      )}
    </ul>
  );

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
          {searchQuery ? "Your repositories" : "Recently updated repositories"}
          {searching && " (loading...)"}
        </h2>
        {renderRepositoryList(
          displayedRepos,
          searching,
          searchQuery
            ? "No matching repositories found"
            : "No repositories found"
        )}
      </div>

      {searchQuery && (
        <div>
          <h2 className="text-lg font-medium p-4 border-b">
            Third-party repositories
            {searchingThirdParty && " (loading...)"}
          </h2>
          {renderRepositoryList(
            thirdPartyRepos,
            searchingThirdParty,
            "No matching third-party repositories found"
          )}
        </div>
      )}
    </div>
  );
}
