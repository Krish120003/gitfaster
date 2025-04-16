"use client";

import { useParams, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { Clipboard, Check } from "lucide-react";
import Link from "next/link";
import ShallowLink from "@/components/shallow-link";

export function Breadcrumbs() {
  const params = useParams();
  const pathname = usePathname();
  const { owner, repository } = params;
  const [isCopied, setIsCopied] = useState(false);

  // Determine if we're in blob (file) view and derive branch and path
  const segments = pathname.split("/").filter(Boolean);
  const isBlobView = useMemo(() => segments[2] === "blob", [segments]);
  const branch = segments[3] || "";
  const formattedPath = segments.slice(4).join("/");

  // Fetch file content for blob view
  const fileQuery = api.github.getFileContent.useQuery(
    {
      owner: owner as string,
      repository: repository as string,
      branch,
      path: formattedPath,
    },
    {
      enabled: isBlobView,
    }
  );

  // Get the path segments after the repository name
  const path = pathname
    .split("/")
    .filter(Boolean)
    .slice(3) // Remove owner, repository, and tree/blob
    .filter((segment) => segment !== "tree" && segment !== "blob");

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/${formattedPath}`;

  const handleCopy = async () => {
    if (fileQuery.data?.text) {
      await navigator.clipboard.writeText(fileQuery.data.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-stretch gap-2 text-sm text-muted-foreground justify-between">
      <div className="flex items-center gap-2 p-4">
        <Link
          href={`/${owner}/${repository}`}
          className="hover:text-foreground transition-colors"
        >
          {repository}
        </Link>
        {path.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <span>/</span>
            <ShallowLink
              href={`/${owner}/${repository}/tree/${path
                .slice(0, index + 1)
                .join("/")}`}
              className="hover:text-foreground transition-colors"
            >
              {decodeURIComponent(segment)}
            </ShallowLink>
          </div>
        ))}
      </div>
      {/* Copy button for text files in blob view */}
      <div className="flex items-stretch">
        {isBlobView &&
          fileQuery.isSuccess &&
          fileQuery.data &&
          !fileQuery.data.isBinary && (
            <button
              onClick={handleCopy}
              className="hover:text-foreground transition-all flex items-center gap-1 border-l px-4 border-l-foreground/20 cursor-pointer"
            >
              {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
              {isCopied ? "Copied!" : "Copy"}
            </button>
          )}

        {isBlobView && (
          <a
            href={rawUrl}
            className="hover:text-foreground transition-colors flex items-center gap-1 border-l border-l-foreground/20 px-4 hover:underline"
          >
            View Raw
          </a>
        )}
      </div>
    </div>
  );
}
