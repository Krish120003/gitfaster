"use client";

import Link from "next/link";
import { Menu, Github, GitGraph, GitBranchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RepositoryNav } from "./repository-nav";
import ShallowLink from "@/components/shallow-link";

import { api } from "@/trpc/react";
import type { Session } from "next-auth";
import { SignOut } from "@/app/_components/sign-in-button";

interface RepositoryHeaderProps {
  owner: string;
  repository: string;
  session: Session | null;
}

export function RepositoryHeader({
  owner,
  repository,
  session,
}: RepositoryHeaderProps) {
  const { data } = api.github.getRepositoryOverview.useQuery({
    owner,
    repository,
  });

  return (
    <header className="border-b bg-background border-foreground/20">
      <div className="border-b flex justify-between h-12">
        <Link
          className="p-4 border-r bg-transparent rounded-none hover:bg-foreground hover:text-background cursor-pointer flex items-center justify-center gap-2 transition-all w-32"
          href={"/"}
        >
          <GitBranchIcon className="h-4 w-4 text-[#f0883e]" />
          <span className="text-sm font-medium">gitfaster</span>
        </Link>

        <div className="font-mono text-sm flex">
          <div className="flex items-center justify-center p-4 border-x">
            Hi, {session?.user.name}
          </div>
          <SignOut />
        </div>
      </div>
      <div className="px-4">
        <div className="flex items-center py-4 gap-2">
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
        </div>
        {/* Navigation tabs - now using the client component */}
        <RepositoryNav owner={owner} repository={repository} />
      </div>
    </header>
  );
}
