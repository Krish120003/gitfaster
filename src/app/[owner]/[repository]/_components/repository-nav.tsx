"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code, GitPullRequest } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RepositoryNavProps {
  owner: string;
  repository: string;
}

export function RepositoryNav({ owner, repository }: RepositoryNavProps) {
  const pathname = usePathname();
  const basePath = `/${owner}/${repository}`;

  // Determine active tab based on the current path
  const isActive = (path: string) => {
    if (path === "code") {
      // Code is active only on the base path
      return pathname === basePath;
    }
    return pathname.includes(`${basePath}/${path}`);
  };

  return (
    <div className="flex items-center overflow-x-auto">
      <Link
        href={basePath}
        className={cn("border-b-2 pb-1 cursor-pointer", {
          "border-[#f78166]": isActive("code"),
          "border-transparent": !isActive("code"),
        })}
      >
        <Button
          variant="ghost"
          asChild
          className="flex items-center gap-2 px-3 py-1 hover:bg-transparent hover:text-foreground text-foreground"
        >
          <div>
            <Code className="h-4 w-4" />
            <span>Code</span>
          </div>
        </Button>
      </Link>

      <Link
        href={`${basePath}/issues`}
        className={cn("border-b-2 pb-1 cursor-pointer", {
          "border-[#f78166]": isActive("issues"),
          "border-transparent": !isActive("issues"),
        })}
      >
        <Button
          variant="ghost"
          asChild
          className="flex items-center gap-2 px-3 py-1 hover:bg-transparent hover:text-foreground text-foreground"
        >
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              className="fill-current"
            >
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
            </svg>
            <span>Issues</span>
          </div>
        </Button>
      </Link>

      <Link
        href={`${basePath}/pulls`}
        className={cn("border-b-2 pb-1 cursor-pointer", {
          "border-[#f78166]": isActive("pulls"),
          "border-transparent": !isActive("pulls"),
        })}
      >
        <Button
          variant="ghost"
          asChild
          className="flex items-center gap-2 px-3 py-1 hover:bg-transparent hover:text-foreground text-foreground"
        >
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4" />
            <span>Pull requests</span>
          </div>
        </Button>
      </Link>
    </div>
  );
}
