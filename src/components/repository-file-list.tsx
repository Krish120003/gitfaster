import type { TreeNode } from "@/server/api/routers/github";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Folder, File } from "lucide-react";

interface FolderViewProps {
  data: TreeNode[];
}

export function FolderView({ data }: FolderViewProps) {
  // In a real implementation, you would fetch commit data
  // Here we're adding mock commit data for demonstration
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
          <TableRow className="hover:bg-muted/30">
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Folder
                  className="h-5 w-5 text-muted-foreground"
                  stroke=""
                  fill="currentColor"
                />
                <span>..</span>
              </div>
            </TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right"></TableCell>
          </TableRow>

          {/* Sort directories first, then files */}
          {nodesWithCommitInfo
            .sort((a, b) => {
              // Sort by type first (tree before blob)
              if (a.type !== b.type) {
                return a.type === "tree" ? -1 : 1;
              }
              // Then sort by path
              return a.path.localeCompare(b.path);
            })
            .map((node) => (
              <TableRow key={node.path} className="hover:bg-muted/30">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
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
                  </div>
                </TableCell>
                <TableCell>{node.lastCommitMessage}</TableCell>
                <TableCell className="text-right">
                  {node.lastCommitDate}
                </TableCell>
              </TableRow>
            ))}
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
