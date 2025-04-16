"use client";
import { File } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import FilenameFromParams from "./_components/filename";

export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="flex border-b border-border justify-between">
        <div className="p-3 text-muted-foreground font-medium flex gap-2 items-center">
          <File className="h-5 w-5 text-muted-foreground" />
          <FilenameFromParams />
        </div>
        <div className="p-3 text-right text-muted-foreground"></div>
      </div>
      <div className="p-4 overflow-auto">
        <div className="flex flex-col gap-1.5 font-mono text-sm">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-muted-foreground select-none w-8 text-right pr-2 text-xs tabular-nums">
                {i + 1}
              </span>
              <Skeleton
                className="h-4"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
