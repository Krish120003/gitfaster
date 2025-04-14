"use client";

import { useParams, usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import FolderView from "@/app/[owner]/[repository]/_components/repository-file-list";
import ContentViewer from "@/components/content-viewer";
import { File } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming you have a Skeleton component

export default function ExplorerView() {
  const params = useParams<{
    owner: string;
    repository: string;
    branch: string;
    path?: string | string[];
  }>();
  const pathname = usePathname();

  // Handle potential null or undefined params early
  const owner = params?.owner;
  const repository = params?.repository;
  const branch = params?.branch;
  // const pathArray = params?.path ?? []; // Remove usage of params.path

  // Extract the file/folder path from the full pathname
  const pathSegments = pathname?.split("/") ?? [];
  // Path starts after /[owner]/[repository]/(tree|blob)/[branch] which are the first 5 segments
  const relativePath =
    pathSegments.length > 5 ? pathSegments.slice(5).join("/") : "";
  const formattedPath = decodeURIComponent(relativePath);

  // Determine if it's a blob or tree view based on the pathname
  const isBlobView = pathname?.includes(`/blob/`);
  const isTreeView = pathname?.includes(`/tree/`);

  // Ensure required parameters are available before enabling queries
  const queryEnabled = !!owner && !!repository && !!branch;

  // Conditionally fetch data
  const folderQuery = api.github.getFolderView.useQuery(
    {
      owner: owner!,
      repository: repository!,
      branch: branch!,
      path: formattedPath,
    },
    { enabled: queryEnabled && isTreeView } // Only fetch if it's a tree view and params are ready
  );

  const fileQuery = api.github.getFileContent.useQuery(
    {
      owner: owner!,
      repository: repository!,
      branch: branch!,
      path: formattedPath,
    },
    { enabled: queryEnabled && isBlobView } // Only fetch if it's a blob view and params are ready
  );

  // Loading state - show skeleton if either query is loading and its view is active
  if (
    (isTreeView && folderQuery.isLoading) ||
    (isBlobView && fileQuery.isLoading)
  ) {
    return (
      <div className="rounded-lg border border-border bg-background flex flex-col">
        {/* Skeleton Loader */}
        <div className="p-3 border-b border-border">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Error state
  if (isTreeView && folderQuery.error) {
    return (
      <div className="text-red-500 p-4">
        Error loading folder: {folderQuery.error.message}
      </div>
    );
  }
  if (isBlobView && fileQuery.error) {
    return (
      <div className="text-red-500 p-4">
        Error loading file: {fileQuery.error.message}
      </div>
    );
  }

  // Render Tree View
  if (isTreeView && folderQuery.data && owner && repository && branch) {
    return (
      <div>
        {/* Pass required props to the refactored FolderView */}
        <FolderView
          data={folderQuery.data}
          branch={branch}
          owner={owner}
          repository={repository}
        />
      </div>
    );
  }

  // Render Blob View
  if (isBlobView && fileQuery.data && owner && repository && branch) {
    const file = fileQuery.data;
    // Construct the URL safely, ensuring no undefined parts
    const url = `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/${formattedPath}`;
    return (
      <div className="rounded-lg border border-border bg-background flex flex-col">
        {/* Header section */}
        <div className="flex border-b border-border justify-between">
          <div className="p-3 text-muted-foreground font-medium flex gap-2 items-center">
            <File className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">{file.name}</span>
          </div>
          <div className="p-3 text-right text-muted-foreground opacity-50">
            {file.isCached ? (
              <span className="text-xs text-green-500">Cached</span>
            ) : (
              <span className="text-xs text-red-500">Not Cached</span>
            )}
          </div>
        </div>

        {/* Content section */}
        <div className="overflow-auto ">
          {file ? (
            <ContentViewer file={file} url={url} />
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap p-4">
              No content available
            </pre>
          )}
        </div>
      </div>
    );
  }

  // Fallback or initial state before path/params are determined
  // Or if neither tree nor blob view is active (e.g., invalid URL)
  return (
    <div className="p-4 text-muted-foreground">
      Select a file or folder to view.
    </div>
  );
}
