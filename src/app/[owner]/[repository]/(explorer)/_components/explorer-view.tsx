"use client";

import { useParams, usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import type { TreeNode } from "@/server/api/routers/github";
import FolderView from "@/app/[owner]/[repository]/_components/repository-file-list";
import ContentViewer from "@/components/content-viewer";
import { File, Folder } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const skeletonWidths = [
  "w-32",
  "w-64",
  "w-48",
  "w-56",
  "w-40",
  "w-72",
  "w-80",
  "w-96",
  "w-52",
  "w-60",
  "w-36",
  "w-44",
  "w-68",
  "w-84",
  "w-88",
  "w-92",
];

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

  if (isLoading && isTreeView) {
    return (
      <div className="">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Empty header to match the actual view */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {i > 5 ? (
                      <File className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Folder
                        className="h-5 w-5 text-muted-foreground"
                        stroke="none"
                        fill="currentColor"
                      />
                    )}
                    <Skeleton className="h-4 w-64 bg-foreground/20" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isLoading && isBlobView) {
    return (
      <div className="p-4 flex flex-col">
        <div className="overflow-auto">
          <div className="flex flex-col gap-1.5 font-mono text-sm">
            {skeletonWidths.map((v, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className={cn("h-4 bg-foreground/20", v)} />
              </div>
            ))}
          </div>
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
      <div className="rounded-lg bg-background flex flex-col">
        <div className="overflow-auto">
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
