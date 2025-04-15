"use client";

import { useParams, usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import type { TreeNode } from "@/server/api/routers/github";
import FolderView from "@/app/[owner]/[repository]/_components/repository-file-list";
import ContentViewer from "@/components/content-viewer";
import { File } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

// Helper function to derive folder contents from the full repo tree
const deriveFolderContents = (
  repoTree: TreeNode[],
  folderPath: string
): TreeNode[] => {
  const tree: TreeNode[] = [];
  const subdirs = new Map<string, TreeNode>();
  const prefix = folderPath ? folderPath + "/" : "";
  const pathDepth = folderPath ? folderPath.split("/").length : 0;

  // Set of existing paths from the API response
  const existingPaths = new Set(repoTree.map((node) => node.path));

  for (const node of repoTree) {
    let nodePath = node.path;
    nodePath = nodePath.startsWith("/") ? nodePath.substring(1) : nodePath;

    let isInCorrectPath = false;
    let relativePath = "";
    let currentDepth = nodePath.split("/").length;

    if (!folderPath) {
      isInCorrectPath = true;
      relativePath = nodePath;
    } else if (nodePath.startsWith(prefix)) {
      isInCorrectPath = true;
      relativePath = nodePath.substring(prefix.length);
    }

    if (isInCorrectPath) {
      const relativePathParts = relativePath.split("/");

      if (currentDepth === pathDepth + 1) {
        tree.push(node);
      } else if (currentDepth > pathDepth + 1) {
        const subdirName = nodePath.split("/")[pathDepth];
        const subdirPath = nodePath
          .split("/")
          .slice(0, pathDepth + 1)
          .join("/");

        // Only add synthesized subdir if it doesn't already exist and isn't in the original tree
        if (
          subdirName &&
          !subdirs.has(subdirName) &&
          !existingPaths.has(subdirPath)
        ) {
          const subdirNode: TreeNode = {
            path: subdirPath,
            type: "tree",
          };
          subdirs.set(subdirName, subdirNode);
        }
      }
    }
  }

  tree.push(...Array.from(subdirs.values()));

  tree.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "tree" ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });

  return tree;
};

export default function ExplorerView() {
  const params = useParams<{
    owner: string;
    repository: string;
    branch: string;
    path?: string | string[];
  }>();
  const pathname = decodeURIComponent(usePathname());

  const owner = params?.owner;
  const repository = params?.repository;
  const branch = params?.branch;

  const pathSegments = pathname?.split("/") ?? [];
  const relativePath =
    pathSegments.length > 5 ? pathSegments.slice(5).join("/") : "";
  const formattedPath = decodeURIComponent(relativePath);

  const isBlobView = useMemo(() => pathSegments[3] === "blob", [pathSegments]);
  const isTreeView = useMemo(() => pathSegments[3] === "tree", [pathSegments]);

  const queryEnabled = !!owner && !!repository && !!branch;

  // --- Fetch the full repository tree ---
  const repoTreeQuery = api.github.getRepoTree.useQuery(
    {
      owner: owner!,
      repository: repository!,
      branch: branch!,
      recursive: true,
    },
    {
      enabled: queryEnabled,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // --- Conditionally fetch specific folder or file content ---
  const folderQuery = api.github.getFolderView.useQuery(
    {
      owner: owner!,
      repository: repository!,
      branch: branch!,
      path: formattedPath,
    },
    {
      enabled: queryEnabled && isTreeView && !repoTreeQuery.isSuccess,
    }
  );

  const fileQuery = api.github.getFileContent.useQuery(
    {
      owner: owner!,
      repository: repository!,
      branch: branch!,
      path: formattedPath,
    },
    {
      enabled: queryEnabled && isBlobView,
    }
  );

  // --- Derive folder data from full tree if available ---
  const derivedFolderData = useMemo(() => {
    if (isTreeView && repoTreeQuery.isSuccess && repoTreeQuery.data?.tree) {
      return deriveFolderContents(repoTreeQuery.data.tree, formattedPath);
    }
    return null;
  }, [isTreeView, repoTreeQuery.isSuccess, repoTreeQuery.data, formattedPath]);

  // --- Loading State ---
  const isLoading =
    (isTreeView && !derivedFolderData && folderQuery.isLoading) ||
    (isBlobView && fileQuery.isLoading);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background flex flex-col">
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

  // --- Error States ---
  if (isTreeView && repoTreeQuery.isError && !folderQuery.isSuccess) {
    return (
      <div className="text-red-500 p-4">
        Error loading repository tree: {repoTreeQuery.error.message}
      </div>
    );
  }
  if (isTreeView && folderQuery.error && !derivedFolderData) {
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

  // --- Render Tree View ---
  const folderDataToRender = derivedFolderData ?? folderQuery.data;

  if (isTreeView && folderDataToRender && owner && repository && branch) {
    return (
      <div>
        <FolderView
          data={folderDataToRender}
          branch={branch}
          owner={owner}
          repository={repository}
        />
      </div>
    );
  }

  // --- Render Blob View ---
  if (isBlobView && fileQuery.data && owner && repository && branch) {
    const file = fileQuery.data;
    const url = `https://raw.githubusercontent.com/${owner}/${repository}/${branch}/${formattedPath}`;
    return (
      <div className="rounded-lg border border-border bg-background flex flex-col">
        <div className="flex border-b border-border justify-between">
          <div className="p-3 text-muted-foreground font-medium flex gap-2 items-center">
            <File className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              {file.name ?? formattedPath.split("/").pop()}
            </span>
          </div>
          <div className="p-3 text-right text-muted-foreground opacity-50">
            {file.isCached ? (
              <span className="text-xs text-green-500">Cached</span>
            ) : (
              <span className="text-xs text-red-500">Not Cached</span>
            )}
          </div>
        </div>

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

  // Fallback or initial state
  return (
    <div className="p-4 text-muted-foreground">
      Select a file or folder to view.
    </div>
  );
}
