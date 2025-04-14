"use client";
import type { TreeNode } from "@/server/api/routers/github";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Folder, File } from "lucide-react";
import ShallowLink from "@/components/shallow-link";
import { api } from "@/trpc/react";
import Link from "next/link";

// Define props interface
interface FolderViewProps {
  data: TreeNode[];
  branch: string;
  owner: string;
  repository: string;
  hardnav?: boolean;
}

export function FolderView({
  data,
  branch,
  owner,
  repository,
  hardnav = false,
}: FolderViewProps) {
  const trpc = api.useUtils();

  // Get current path segments from window location (since usePathname is removed)
  // This might need adjustment depending on how ExplorerView manages the canonical path
  const pathSegments =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").slice(5)
      : [];
  const currentRelativePath = decodeURIComponent(pathSegments.join("/"));

  // Use props for base paths
  const basePath = `/${owner}/${repository}/`;
  const folderBasePath = `${basePath}tree/${branch}/`;
  const fileBasePath = `${basePath}blob/${branch}/`;

  // Determine parent path based on current relative path
  const isRoot = currentRelativePath === "";
  const parentPath = isRoot
    ? folderBasePath
    : folderBasePath + currentRelativePath.split("/").slice(0, -1).join("/");

  // Removed isLoading check as data is now a prop
  if (!data) {
    return <div>No data available.</div>; // Handle case where data might be null/undefined initially
  }

  // Use passed data directly
  const nodesWithCommitInfo = data.map((node) => ({
    ...node,
    // Keep mock data for now
    lastCommitMessage: getMockCommitMessage(node.path),
    lastCommitDate: getMockCommitDate(node.path),
  }));

  const LinkComponent = hardnav ? Link : ShallowLink;

  return (
    <div className="rounded-lg border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40%] text-muted-foreground">
              Name
            </TableHead>
            <TableHead className="text-muted-foreground">
              Last commit message
            </TableHead>
            <TableHead className="text-right text-muted-foreground">
              Last commit date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Parent directory row - use calculated parentPath */}
          {isRoot ? null : (
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium">
                <LinkComponent
                  className="flex items-center gap-2"
                  href={parentPath} // Link to calculated parent folder path
                >
                  <Folder
                    className="h-5 w-5 text-muted-foreground"
                    stroke=""
                    fill="currentColor"
                  />
                  <span>..</span>
                </LinkComponent>
              </TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right"></TableCell>
            </TableRow>
          )}

          {/* Sort directories first, then files */}
          {nodesWithCommitInfo
            .sort((a, b) => {
              if (a.type !== b.type) {
                return a.type === "tree" ? -1 : 1;
              }
              return a.path.localeCompare(b.path);
            })
            .map((node) => {
              const link = node.path;
              // Construct full href using base paths and node info
              const href = `${
                node.type === "tree" ? folderBasePath : fileBasePath
              }${link}`;

              return (
                <TableRow key={node.path} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <LinkComponent
                      className="flex items-center gap-2 hover:underline"
                      href={href} // Use constructed href
                      onMouseOver={
                        node.type === "blob"
                          ? () => {
                              // Use props for prefetching
                              trpc.github.getFileContent.prefetch({
                                branch: branch,
                                owner: owner,
                                repository: repository,
                                path: node.path,
                              });
                            }
                          : undefined
                      }
                    >
                      {node.type === "tree" ? (
                        <Folder
                          className="h-5 w-5 text-muted-foreground"
                          stroke="none"
                          fill="currentColor"
                        />
                      ) : (
                        <File className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span>{getFileName(node.path)}</span>
                    </LinkComponent>
                  </TableCell>
                  <TableCell>{node.lastCommitMessage}</TableCell>
                  <TableCell className="text-right">
                    {node.lastCommitDate}
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}

// Helper function to get the file name from the path
function getFileName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? "wrong";
}

// Mock data functions for demonstration
function getMockCommitMessage(path: string): string {
  const messages = {
    app: "fix: sample files as const",
    components: "fix: update text colors for themes",
    lib: "feat: scaffold pages, install shadcn",
    server: "feat: init",
    styles: "feat: update theme",
    trpc: "feat: init",
    "env.js": "feat: scaffold pages, install shadcn",
  };

  const fileName = getFileName(path);
  return messages[fileName as keyof typeof messages] || "Initial commit";
}

function getMockCommitDate(path: string): string {
  const dates = {
    app: "12 hours ago",
    components: "12 hours ago",
    lib: "20 hours ago",
    server: "yesterday",
    styles: "12 hours ago",
    trpc: "yesterday",
    "env.js": "20 hours ago",
  };

  const fileName = getFileName(path);
  return dates[fileName as keyof typeof dates] || "3 days ago";
}

export default FolderView;
