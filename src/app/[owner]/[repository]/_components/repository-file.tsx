"use client";
import { File } from "lucide-react";
import type { ReactNode } from "react";

interface FileContentViewProps {
  fileName: string;
  lastCommitDate?: string;
  children: ReactNode;
}

export function FileContentView({
  fileName,
  lastCommitDate = "3 days ago",
  children,
}: FileContentViewProps) {
  return (
    <div className="rounded-lg border border-border bg-background flex flex-col">
      {/* Header section similar to FolderView */}
      <div className="flex border-b border-border justify-between">
        <div className="p-3 text-muted-foreground font-medium flex gap-2 items-center">
          <File className="h-5 w-5 text-muted-foreground" />
          <span>{fileName}</span>
        </div>
        <div className="p-3 text-right text-muted-foreground">
          {lastCommitDate}
        </div>
      </div>

      {/* Content section with pre tags */}
      <div className="p-4 overflow-auto">
        <pre className="text-sm font-mono whitespace-pre-wrap">{children}</pre>
      </div>
    </div>
  );
}
