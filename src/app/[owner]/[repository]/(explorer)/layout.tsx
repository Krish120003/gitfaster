"use client";
import { api } from "@/trpc/server";
import { FileTree } from "./_components/file-tree";

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 w-full h-screen">
      <div className="col-span-3 border-r border-foreground/20 overflow-y-auto">
        <FileTree />
      </div>
      <div className="col-span-9 p-4">{children}</div>
    </div>
  );
}
