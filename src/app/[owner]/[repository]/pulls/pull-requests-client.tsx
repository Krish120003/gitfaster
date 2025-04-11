"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SearchBar } from "@/components/search-bar";
import { StateFilter } from "@/components/state-filter";
import { api } from "@/trpc/react";
import type { PullRequest } from "@/server/api/routers/pull-requests";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PullRequestsClientProps {
  owner: string;
  repository: string;
  initialState: "open" | "closed" | "all";
  initialSearch?: string;
}

export function PullRequestsClient({
  owner,
  repository,
  initialState,
  initialSearch,
}: PullRequestsClientProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [cursor, setCursor] = useState(1);
  const [allPullRequests, setAllPullRequests] = useState<PullRequest[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const setRowRef = useCallback(
    (index: number) => (el: HTMLTableRowElement | null) => {
      rowRefs.current[index] = el;
    },
    []
  );

  const { data, isFetching } = api.pullRequests.list.useQuery({
    owner,
    repository,
    state,
    search,
    cursor,
    limit: 25,
  });

  // Reset pull requests when search params change
  useEffect(() => {
    setAllPullRequests([]);
    setCursor(1);
  }, [state, search]);

  // Update allPullRequests when new data arrives
  useEffect(() => {
    if (data?.items) {
      if (cursor === 1) {
        setAllPullRequests(data.items);
      } else {
        setAllPullRequests((prev) => [...prev, ...data.items]);
      }
      setLoadingMore(false);
    }
  }, [data, cursor]);

  // Intersection Observer setup for rows
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            data?.nextCursor &&
            !isFetching &&
            !loadingMore
          ) {
            setLoadingMore(true);
            setCursor(data.nextCursor);
          }
        });
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    // Get the index to observe (10th from last if there are enough items)
    const targetIndex = Math.max(0, allPullRequests.length - 10);
    const targetRef = rowRefs.current[targetIndex];

    if (targetRef) {
      observer.observe(targetRef);
    }

    return () => observer.disconnect();
  }, [data?.nextCursor, isFetching, loadingMore, allPullRequests.length]);

  const handleSearch = (value: string) => {
    setSearch(value);
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("search", value);
    } else {
      url.searchParams.delete("search");
    }
    router.push(url.pathname + url.search);
  };

  const handleStateChange = (value: "open" | "closed" | "all") => {
    setState(value);
    const url = new URL(window.location.href);
    url.searchParams.set("state", value);
    router.push(url.pathname + url.search);
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pull Requests</h1>
        <div className="flex items-center gap-4">
          <SearchBar
            placeholder="Search pull requests..."
            defaultValue={search}
            onSearch={handleSearch}
          />
          <StateFilter value={state} onChange={handleStateChange} />
        </div>
      </div>

      {allPullRequests.length === 0 && !isFetching ? (
        <div className="text-center text-muted-foreground">
          No pull requests found
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPullRequests.map((pr, index) => (
                <TableRow key={pr.id} ref={setRowRef(index)}>
                  <TableCell>
                    <Link
                      href={`/${owner}/${repository}/pulls/${pr.number}`}
                      className="font-medium hover:underline"
                    >
                      {pr.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={pr.state === "open" ? "default" : "secondary"}
                    >
                      {pr.state}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {pr.labels.map((label) => (
                        <Badge
                          key={label.name}
                          variant="outline"
                          style={{ backgroundColor: `#${label.color}` }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={pr.author.avatarUrl}
                        alt={pr.author.login}
                        className="h-5 w-5 rounded-full"
                      />
                      <span>{pr.author.login}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(pr.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>{pr.comments}</TableCell>
                </TableRow>
              ))}
              {(isFetching || loadingMore) && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
