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
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  // Get path segments from pathname
  const pathSegments = pathname ? pathname.split("/").slice(5) : [];
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

  if (!data) {
    return <div>No data available.</div>; // Handle case where data might be null/undefined initially
  }

  const LinkComponent = hardnav ? Link : ShallowLink;

  return (
    <div className="">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* <TableHead className="w-full text-muted-foreground">Name</TableHead> */}
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
            </TableRow>
          )}

          {/* Sort directories first, then files */}
          {data
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

export default FolderView;
