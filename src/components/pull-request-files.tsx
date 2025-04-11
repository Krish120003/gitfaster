import { useState } from "react";
import { api } from "@/trpc/react";
import type { PullRequestFile } from "@/server/api/routers/pulls";
import { cn } from "@/lib/utils";
import { FileIcon, FolderIcon } from "lucide-react";

interface PullRequestFilesProps {
  owner: string;
  repository: string;
  pullNumber: number;
}

type FileTreeNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
  file?: PullRequestFile;
};

function buildFileTree(files: PullRequestFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  files.forEach((file) => {
    const parts = file.filename.split("/");
    let currentLevel = root;

    // Build the initial tree
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join("/");
      let node = currentLevel.find((n) => n.name === part);

      if (!node) {
        node = {
          name: part,
          path,
          type: isFile ? "file" : "directory",
          children: isFile ? undefined : [],
          file: isFile ? file : undefined,
        };
        currentLevel.push(node);
      }

      if (!isFile) {
        currentLevel = node.children!;
      }
    });
  });

  // Function to flatten single-child directories
  const flattenSingleChildDirs = (node: FileTreeNode): FileTreeNode => {
    if (node.type === "file") {
      return node;
    }

    // First, recursively flatten children
    if (node.children) {
      node.children = node.children.map(flattenSingleChildDirs);

      // If this is a directory with exactly one child that's also a directory,
      // merge them together
      const onlyChild = node.children[0];
      if (
        node.children.length === 1 &&
        onlyChild &&
        onlyChild.type === "directory"
      ) {
        return {
          type: "directory",
          name: `${node.name}/${onlyChild.name}`,
          path: onlyChild.path,
          children: onlyChild.children,
        };
      }
    }

    return node;
  };

  // Sort the tree: directories first, then files, both alphabetically
  const sortTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "directory" ? -1 : 1;
    });
  };

  const sortTreeRecursive = (nodes: FileTreeNode[]): void => {
    sortTree(nodes);
    nodes.forEach((node) => {
      if (node.children) {
        sortTreeRecursive(node.children);
      }
    });
  };

  // First sort the tree
  sortTreeRecursive(root);

  // Then flatten single-child directories
  const flattened = root.map(flattenSingleChildDirs);

  // Sort again after flattening
  return sortTree(flattened);
}

function FileTreeNode({
  node,
  selectedFile,
  onSelectFile,
}: {
  node: FileTreeNode;
  selectedFile?: string;
  onSelectFile: (file: PullRequestFile) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (node.type === "file") {
    const statusColors = {
      added: "text-green-600 dark:text-green-400",
      removed: "text-red-600 dark:text-red-400",
      modified: "text-yellow-600 dark:text-yellow-400",
      renamed: "text-blue-600 dark:text-blue-400",
      copied: "text-purple-600 dark:text-purple-400",
      changed: "text-orange-600 dark:text-orange-400",
      unchanged: "text-gray-600 dark:text-gray-400",
    };

    return (
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent",
          selectedFile === node.path && "bg-accent"
        )}
        onClick={() => node.file && onSelectFile(node.file)}
      >
        <FileIcon className="h-4 w-4" />
        <span
          className={cn(
            "flex-1 truncate text-left",
            statusColors[node.file!.status]
          )}
        >
          {node.name}
        </span>
        <span className="text-xs text-muted-foreground">
          +{node.file!.additions} -{node.file!.deletions}
        </span>
      </button>
    );
  }

  return (
    <div>
      <button
        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <FolderIcon className="h-4 w-4" />
        <span className="flex-1 truncate text-left">{node.name}</span>
      </button>
      {isExpanded && node.children && (
        <div className="ml-4">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DiffView({ file }: { file: PullRequestFile }) {
  if (!file.patch) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No diff available for this file
      </div>
    );
  }

  const lines = file.patch.split("\n");

  return (
    <div className="overflow-x-auto">
      <pre className="p-4 text-sm">
        {lines.map((line, i) => {
          let bgColor = "";
          let textColor = "";

          if (line.startsWith("+")) {
            bgColor = "bg-green-100 dark:bg-green-950";
            textColor = "text-green-800 dark:text-green-200";
          } else if (line.startsWith("-")) {
            bgColor = "bg-red-100 dark:bg-red-950";
            textColor = "text-red-800 dark:text-red-200";
          }

          return (
            <div
              key={i}
              className={cn("font-mono whitespace-pre", bgColor, textColor)}
            >
              {line}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

export function PullRequestFiles({
  owner,
  repository,
  pullNumber,
}: PullRequestFilesProps) {
  const { data: files, isLoading } = api.pulls.getFiles.useQuery({
    owner,
    repository,
    number: pullNumber,
  });
  const [selectedFile, setSelectedFile] = useState<PullRequestFile>();

  if (isLoading) {
    return <div>Loading files...</div>;
  }

  if (!files) {
    return <div>No files found</div>;
  }

  const fileTree = buildFileTree(files);

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-1 rounded-lg border p-4">
        <div className="space-y-2">
          {fileTree.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              selectedFile={selectedFile?.filename}
              onSelectFile={setSelectedFile}
            />
          ))}
        </div>
      </div>
      <div className="col-span-3 rounded-lg border">
        {selectedFile ? (
          <DiffView file={selectedFile} />
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            Select a file to view its changes
          </div>
        )}
      </div>
    </div>
  );
}
