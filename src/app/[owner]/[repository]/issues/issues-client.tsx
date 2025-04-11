"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SearchBar } from "@/components/search-bar";
import { StateFilter } from "@/components/state-filter";
import { api } from "@/trpc/react";
import type { Issue } from "@/server/api/routers/issues";
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

interface IssuesClientProps {
  owner: string;
  repository: string;
  initialState: "open" | "closed" | "all";
  initialSearch?: string;
}

export function IssuesClient({
  owner,
  repository,
  initialState,
  initialSearch,
}: IssuesClientProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [cursor, setCursor] = useState(1);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const setRowRef = useCallback(
    (index: number) => (el: HTMLTableRowElement | null) => {
      rowRefs.current[index] = el;
    },
    []
  );

  const { data, isFetching } = api.issues.list.useQuery({
    owner,
    repository,
    state,
    search,
    cursor,
    limit: 25,
  });

  // Reset issues when search params change
  useEffect(() => {
    setAllIssues([]);
    setCursor(1);
  }, [state, search]);

  // Update allIssues when new data arrives
  useEffect(() => {
    if (data?.items) {
      if (cursor === 1) {
        setAllIssues(data.items);
      } else {
        setAllIssues((prev) => [...prev, ...data.items]);
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
    const targetIndex = Math.max(0, allIssues.length - 10);
    const targetRef = rowRefs.current[targetIndex];

    if (targetRef) {
      observer.observe(targetRef);
    }

    return () => observer.disconnect();
  }, [data?.nextCursor, isFetching, loadingMore, allIssues.length]);

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
        <h1 className="text-2xl font-bold">Issues</h1>
        <div className="flex items-center gap-4">
          <SearchBar
            placeholder="Search issues..."
            defaultValue={search}
            onSearch={handleSearch}
          />
          <StateFilter value={state} onChange={handleStateChange} />
        </div>
      </div>

      {allIssues.length === 0 && !isFetching ? (
        <div className="text-center text-muted-foreground">No issues found</div>
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
              {allIssues.map((issue, index) => (
                <TableRow key={issue.id} ref={setRowRef(index)}>
                  <TableCell>
                    <Link
                      href={`/${owner}/${repository}/issues/${issue.number}`}
                      className="font-medium hover:underline"
                    >
                      {issue.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={issue.state === "open" ? "default" : "secondary"}
                    >
                      {issue.state}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {issue.labels.map(
                        (label: { name: string; color: string }) => (
                          <Badge
                            key={label.name}
                            variant="outline"
                            style={{ backgroundColor: `#${label.color}` }}
                          >
                            {label.name}
                          </Badge>
                        )
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={issue.author.avatarUrl}
                        alt={issue.author.login}
                        className="h-5 w-5 rounded-full"
                      />
                      <span>{issue.author.login}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(issue.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>{issue.comments}</TableCell>
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
