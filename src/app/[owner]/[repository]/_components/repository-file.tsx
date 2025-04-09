"use client";
import { api } from "@/trpc/react";
import { File } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ContentViewer from "@/components/content-viewer";
import { useParams } from "next/navigation";

const skeletons = Array.from({
  length: Math.floor(Math.random() * 15) + 15,
}).map((_, i) => {
  const randomWidth = `${Math.floor(Math.random() * 40) + 20}%`; // random width between 20% and 60%
  return <Skeleton key={i} className="h-4" style={{ width: randomWidth }} />;
});

export function FileContentView() {
  const { owner, repository, branch, path } = useParams();
  const formattedPath = decodeURIComponent(
    (Array.isArray(path) ? path.join("/") : path) ?? ""
  );

  const { data: file, isLoading } = api.github.getFileContent.useQuery({
    owner: owner as string,
    repository: repository as string,
    branch: branch as string,
    path: formattedPath,
  });

  const fileName = formattedPath.split("/").pop() || "File";

  const url = `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/${path}`;

  return (
    <div className="rounded-lg border border-border bg-background flex flex-col">
      {/* Header section similar to FolderView */}
      <div className="flex border-b border-border justify-between">
        <div className="p-3 text-muted-foreground font-medium flex gap-2 items-center">
          <File className="h-5 w-5 text-muted-foreground" />
          <span>{fileName}</span>
        </div>
        <div className="p-3 text-right text-muted-foreground">
          {/* {lastCommitDate} */}
        </div>
      </div>

      {/* Content section with pre tags */}
      <div className="p-4 overflow-auto ">
        {isLoading ? (
          <div className="flex flex-col gap-2">{skeletons}</div>
        ) : file ? (
          <ContentViewer file={file} url={url} />
        ) : (
          <pre className="text-sm font-mono whitespace-pre-wrap">
            No content available
          </pre>
        )}
      </div>
    </div>
  );
}
