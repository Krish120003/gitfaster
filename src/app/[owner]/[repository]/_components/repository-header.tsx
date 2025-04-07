import Link from "next/link";
import { Menu, Github, GitGraph } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RepositoryNav } from "./repository-nav";

interface RepositoryHeaderProps {
  owner: string;
  repository: string;
}

export function RepositoryHeader({ owner, repository }: RepositoryHeaderProps) {
  return (
    <div className="border-b">
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
            >
              {repository}
            </Link>
          </div>
        </div>
        {/* Navigation tabs - now using the client component */}
        <RepositoryNav owner={owner} repository={repository} />
      </div>
    </div>
  );
}
