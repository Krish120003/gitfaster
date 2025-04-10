"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Link, useLocation } from "react-router-dom";

// ----------- Types -----------

type TreeNode = {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
};

type TreeData = {
  sha: string;
  url: string;
  tree: TreeNode[];
  truncated: boolean;
};

interface ProcessedTreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children: Record<string, ProcessedTreeNode>;
}

interface FileTreeProps {
  className?: string;
  initialData?: TreeData;
}

// ----------- Helper to build hierarchical tree -----------

function buildTree(nodes: TreeNode[]): ProcessedTreeNode {
  const root: ProcessedTreeNode = {
    name: "root",
    type: "folder",
    path: "",
    children: {},
  };

  // Sort so folders appear before files, then alphabetical
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const node of sortedNodes) {
    const pathParts = node.path.split("/");
    let currentLevel = root;
    let currentPath = "";

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (!part) continue;

      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = i === pathParts.length - 1;

      if (!currentLevel.children[part]) {
        currentLevel.children[part] = {
          name: part,
          type: isLastPart && node.type === "blob" ? "file" : "folder",
          path: currentPath,
          children: {},
        };
      }

      currentLevel = currentLevel.children[part];
    }
  }

  return root;
}

// ----------- Recursive Tree Node Component -----------

interface TreeNodeProps {
  node: ProcessedTreeNode;
  level: number;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  selectedFile: string | null;
  setSelectedFile: (path: string) => void;
}

function TreeNode({
  node,
  level,
  expandedFolders,
  toggleFolder,
  selectedFile,
  setSelectedFile,
}: TreeNodeProps) {
  const { owner, repository } = useParams();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const urlBranch = pathParts[1]; // After tree/ or blob/
  const trpc = api.useUtils();

  // Get repository overview for default branch
  const { data: repoOverview } = api.github.getRepositoryOverview.useQuery(
    {
      owner: owner as string,
      repository: repository as string,
    },
    {
      enabled: !!owner && !!repository,
    }
  );

  const defaultBranch = repoOverview?.defaultBranchRef?.name ?? "main";
  const activeBranch = urlBranch || defaultBranch;

  const isFolder = node.type === "folder";
  const isExpanded = expandedFolders[node.path];
  const hasChildren = Object.keys(node.children).length > 0;
  const childrenArray = Object.values(node.children);

  // Use activeBranch for link path
  const linkPath = `/${isFolder ? "tree" : "blob"}/${activeBranch}/${
    node.path
  }`;
  const isSelected = location.pathname === linkPath;

  // Skip the "root" node and just render its children
  if (node.name === "root") {
    return (
      <>
        {childrenArray.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            level={0}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />
        ))}
      </>
    );
  }

  if (isFolder) {
    return (
      <div className="select-none group">
        {/* FOLDER ROW */}
        <div
          className={cn("flex items-center py-1 px-2 relative")}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Guide lines on hover */}
          {level > 0 && (
            <div
              className="absolute left-0 top-0 h-full group-hover:border-l"
              style={{ left: `${(level - 1) * 16 + 8}px` }}
            />
          )}
          {level > 0 && (
            <div
              className="absolute top-1/2 h-0 group-hover:border-t"
              style={{
                left: `${(level - 1) * 16 + 8}px`,
                width: "8px",
                transform: "translateY(-50%)",
              }}
            />
          )}

          {/* Chevron toggle */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.path);
              }}
              className="mr-1 h-4 w-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="mr-1 h-4 w-4" />
          )}

          {/* Folder link */}
          <Link
            to={linkPath}
            className="flex items-center flex-1 no-underline cursor-pointer"
          >
            <Folder className="h-4 w-4 text-[#6b9eff] mr-2" />
            <span className="text-sm">{node.name}</span>
          </Link>
        </div>

        {/* CHILDREN */}
        {isExpanded && hasChildren && (
          <div className="relative">
            {childrenArray.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                level={level + 1}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // FILE NODE
  return (
    <Link
      to={linkPath}
      className={cn("flex items-center py-1 px-2 relative no-underline group")}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onMouseEnter={() => {
        trpc.github.getFileContent.prefetch({
          owner: owner as string,
          repository: repository as string,
          branch: activeBranch,
          path: node.path,
        });
      }}
    >
      {/* Guide lines on hover */}
      {level > 0 && (
        <div
          className="absolute left-0 top-0 h-full group-hover:border-l"
          style={{ left: `${(level - 1) * 16 + 8}px` }}
        />
      )}
      {level > 0 && (
        <div
          className="absolute top-1/2 h-0 group-hover:border-t"
          style={{
            left: `${(level - 1) * 16 + 8}px`,
            width: "8px",
            transform: "translateY(-50%)",
          }}
        />
      )}

      <span className="mr-1 h-4 w-4" />
      <File className="h-4 w-4 text-gray-400 mr-2" />
      <span className="text-sm hover:underline">{node.name}</span>
    </Link>
  );
}

// ----------- Main FileTree Component -----------

export function FileTree({ className, initialData }: FileTreeProps) {
  const { owner, repository } = useParams();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const urlBranch = pathParts[1]; // After tree/ or blob/
  const trpc = api.useUtils();

  const { data: repoOverview } = api.github.getRepositoryOverview.useQuery(
    {
      owner: owner as string,
      repository: repository as string,
    },
    {
      enabled: !!owner && !!repository,
    }
  );

  const defaultBranch = repoOverview?.defaultBranchRef?.name ?? "main";
  const activeBranch = urlBranch || defaultBranch;

  const { data: newData, isLoading: l } = api.github.getRepoTree.useQuery(
    {
      owner: owner as string,
      repository: repository as string,
      branch: activeBranch,
      recursive: true,
    },
    {
      enabled: !!owner && !!repository && !!activeBranch,
    }
  );

  const isLoading = false;

  const data = newData ?? initialData;

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  const processedTree = useMemo(() => {
    if (!data || !data.tree) return null;

    return buildTree(data.tree);
  }, [data, data?.tree]);

  useEffect(() => {
    if (!processedTree || !location.pathname) return;
    const splitted = location.pathname.split("/");
    const index = splitted.findIndex(
      (part) => part === "blob" || part === "tree"
    );
    if (index === -1 || splitted.length <= index + 2) return;
    // Expand each segment in the path
    const subPath = splitted.slice(index + 2).join("/");
    if (!subPath) return;
    let currentPath = "";
    for (const segment of subPath.split("/")) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      setExpandedFolders((prev) => ({ ...prev, [currentPath]: true }));
    }
  }, [location.pathname, processedTree]);

  if (isLoading || !processedTree) {
    return <div className="text-center">Loading...</div>;
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className={cn("overflow-auto", className)}>
      <TreeNode
        node={processedTree}
        level={0}
        expandedFolders={expandedFolders}
        toggleFolder={toggleFolder}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
      />
    </div>
  );
}
