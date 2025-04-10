"use client";

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
import { useLocation, Link } from "react-router-dom";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";

interface FolderViewProps {
  // Props are inferred from router
}

export function FolderView() {
  const params = useParams();
  const owner = params.owner as string;
  const repository = params.repository as string;
  const trpc = api.useUtils();

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  // Get branch and path from URL
  const type = pathParts[0]; // 'tree' or 'blob'
  const branch = pathParts[1];
  const fullPath = pathParts.slice(2).join("/");

  const { data: repoOverview } = api.github.getRepositoryOverview.useQuery(
    {
      owner,
      repository,
    },
    {
      enabled: !!owner && !!repository,
    }
  );

  const defaultBranch = repoOverview?.defaultBranchRef?.name ?? "main";
  const activeBranch = branch || defaultBranch;

  const { data: resp, isLoading } = api.github.getRepoTree.useQuery(
    {
      owner,
      repository,
      branch: activeBranch,
      recursive: true,
    },
    {
      enabled: !!owner && !!repository && !!activeBranch,
    }
  );

  const rawData = resp?.tree || [];

  const data = rawData.filter((node) => {
    if (fullPath === "") {
      return node.path.split("/").length === 1;
    }

    return (
      node.path.startsWith(fullPath) &&
      node.path.split("/").length === fullPath.split("/").length + 1
    );
  });

  const isRoot = fullPath === "";
  const parentPath = fullPath.split("/").slice(0, -1).join("/");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const nodesWithCommitInfo = data.map((node) => ({
    ...node,
    lastCommitMessage: getMockCommitMessage(node.path),
    lastCommitDate: getMockCommitDate(node.path),
  }));

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
          {/* Parent directory row */}
          {!isRoot && (
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium">
                <Link
                  to={`/tree/${activeBranch}/${parentPath}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Folder
                    className="h-5 w-5 text-muted-foreground"
                    stroke=""
                    fill="currentColor"
                  />
                  <span>..</span>
                </Link>
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
              const isFolder = node.type === "tree";
              const newPath = isFolder
                ? `/tree/${activeBranch}/${node.path}`
                : `/blob/${activeBranch}/${node.path}`;

              return (
                <TableRow key={node.path} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <Link
                      to={newPath}
                      className="flex items-center gap-2 cursor-pointer"
                      onMouseEnter={() => {
                        if (!isFolder) {
                          trpc.github.getFileContent.prefetch({
                            owner,
                            repository,
                            branch: activeBranch,
                            path: node.path,
                          });
                        }
                      }}
                    >
                      {isFolder ? (
                        <Folder
                          className="h-5 w-5 text-muted-foreground"
                          stroke=""
                          fill="currentColor"
                        />
                      ) : (
                        <File className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span>{getFileName(node.path)}</span>
                    </Link>
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
