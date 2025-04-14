"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";

export function Breadcrumbs() {
  const params = useParams();
  const pathname = usePathname();
  const { owner, repository } = params;

  // Get the path segments after the repository name
  const path = pathname
    .split("/")
    .filter(Boolean)
    .slice(3) // Remove owner, repository, and tree/blob
    .filter((segment) => segment !== "tree" && segment !== "blob");

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link
        href={`/${owner}/${repository}`}
        className="hover:text-foreground transition-colors"
      >
        {repository}
      </Link>
      {path.map((segment, index) => (
        <div key={index} className="flex items-center gap-2">
          <span>/</span>
          <Link
            href={`/${owner}/${repository}/tree/${path
              .slice(0, index + 1)
              .join("/")}`}
            className="hover:text-foreground transition-colors"
          >
            {decodeURIComponent(segment)}
          </Link>
        </div>
      ))}
    </div>
  );
}
