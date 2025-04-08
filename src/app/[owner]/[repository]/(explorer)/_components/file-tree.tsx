"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  data: TreeData;
  className?: string;
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
  const { owner, repository, branch } = useParams();
  const pathname = usePathname();

  const isFolder = node.type === "folder";
  const isExpanded = expandedFolders[node.path];
  const hasChildren = Object.keys(node.children).length > 0;
  const childrenArray = Object.values(node.children);

  // Construct link path for the node
  const linkBase = `/${owner}/${repository}/${
    isFolder ? "tree" : "blob"
  }/${branch}`;
  const linkPath = `${linkBase}/${node.path}`;
  const isSelected = pathname === linkPath;

  // Skip the "root" node and just render its children
  if (node.name === "root") {
    return (
      <>
        {childrenArray.map((child, index) => (
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
          className={cn(
            "flex items-center py-1 px-2 relative"
            // isSelected &&
            //   "bg-accent-foreground/20 border-r-2 border-r-[#0078d4]",
            // !isSelected && "hover:bg-accent-foreground/10"
          )}
          // Dynamic left padding for indentation
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
            href={linkPath}
            className="flex items-center flex-1 no-underline cursor-pointer"
            onClick={() => setSelectedFile(node.path)}
          >
            <Folder className="h-4 w-4 text-[#6b9eff] mr-2" />
            <span className="text-sm">{node.name}</span>
          </Link>
        </div>

        {/* CHILDREN */}
        {isExpanded && hasChildren && (
          <div className="relative">
            {childrenArray.map((child, index) => (
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
      href={linkPath}
      className={cn(
        "flex items-center py-1 px-2 relative no-underline group"
        // isSelected && "bg-accent-foreground/10 border-l-2 border-l-blue-500",
        // !isSelected && "hover:bg-accent-foreground/20"
      )}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onClick={() => setSelectedFile(node.path)}
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

export function FileTree({ data, className }: FileTreeProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  const processedTree = useMemo(() => buildTree(data.tree), [data.tree]);

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
