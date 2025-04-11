"use client";

import { Suspense } from "react";
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
import React from "react";

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

interface PullRequestsResponse {
  items: PullRequest[];
  nextCursor: number | undefined;
  total: number;
}

export default function Page({ params, searchParams }: PageProps) {
  const resolvedParams = React.use(params);
  const resolvedSearchParams = React.use(searchParams);
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pull Requests</h1>
        <div className="flex items-center gap-4">
          <SearchBar placeholder="Search pull requests..." />
          <StateFilter
            value={resolvedSearchParams.state ?? "open"}
            onChange={(value) => {
              // Update URL with new state
              const url = new URL(window.location.href);
              url.searchParams.set("state", value);
              window.history.pushState({}, "", url.toString());
            }}
          />
        </div>
      </div>

      <Suspense fallback={<div>Loading pull requests...</div>}>
        <PullRequestsList
          owner={resolvedParams.owner}
          repository={resolvedParams.repository}
          searchParams={resolvedSearchParams}
        />
      </Suspense>
    </div>
  );
}

function PullRequestsList({
  owner,
  repository,
  searchParams,
}: {
  owner: string;
  repository: string;
  searchParams: {
    state?: "open" | "closed" | "all";
    search?: string;
  };
}) {
  const { data } = api.pullRequests.list.useQuery<PullRequestsResponse>({
    owner,
    repository,
    state: searchParams.state ?? "open",
    search: searchParams.search,
  });

  const pullRequests = data?.items ?? [];

  if (pullRequests.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No pull requests found
      </div>
    );
  }

  return (
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
          {pullRequests.map((pr) => (
            <TableRow key={pr.id}>
              <TableCell>
                <Link
                  href={`/${owner}/${repository}/pulls/${pr.number}`}
                  className="font-medium hover:underline"
                >
                  {pr.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={pr.state === "open" ? "default" : "secondary"}>
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
        </TableBody>
      </Table>
    </div>
  );
}
