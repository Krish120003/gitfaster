import { api } from "@/trpc/server";
import { FileTree } from "./_components/file-tree";

export default async function ExplorerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ owner: string; repository: string; branch: string }>;
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
