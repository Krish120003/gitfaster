"use client";

import Link from "next/link";
import { Menu, Github, GitGraph } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RepositoryNav } from "./repository-nav";
import ShallowLink from "@/components/shallow-link";
import { StarButton } from "@/components/star-button";
import { api } from "@/trpc/react";

interface RepositoryHeaderProps {
  owner: string;
  repository: string;
}

export function RepositoryHeader({ owner, repository }: RepositoryHeaderProps) {
  const { data } = api.github.getRepositoryOverview.useQuery({
    owner,
    repository,
  });

  return (
    <header className="border-b bg-background border-foreground/20">
      <div className="px-4">
        {/* Top bar with logo and repo name */}
        <div className="flex items-center py-4 gap-2">
          <GitGraph className="h-5 w-5" />
          <div className="flex items-center text-md">
            {owner}
            <span className="mx-1">/</span>
            <Link
              href={`/${owner}/${repository}`}
              className="hover:underline text-foreground"
              prefetch={true}
            >
              {repository}
            </Link>
          </div>
          <div className="ml-auto">
            {data && (
              <StarButton
                owner={owner}
                repository={repository}
                initialStarred={data.viewerHasStarred}
                stargazerCount={data.stargazerCount}
              />
            )}
          </div>
        </div>
        {/* Navigation tabs - now using the client component */}
        <RepositoryNav owner={owner} repository={repository} />
      </div>
    </header>
  );
}
