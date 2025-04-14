import { api } from "@/trpc/server";
import { FileTree } from "./_components/file-tree";
import { BranchSelector } from "./_components/branch-selector";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    owner: string;
    repository: string;
  }>;
}

export default async function ExplorerLayout({
  children,
  params,
}: LayoutProps) {
  const { owner, repository } = await params;

  const fileTreeInitial = await api.github.getRepoTree({
    owner,
    repository,
    branch: "HEAD",
    recursive: false,
  });

  return (
    <div className="grid grid-cols-12 w-full h-screen">
      <div className="col-span-3 border-r border-foreground/20 overflow-y-auto flex flex-col">
        <div className="border-b border-foreground/20 flex flex-col items-stretch gap-2 p-2">
          Branch
          <BranchSelector />
        </div>

        <div className="flex-grow overflow-y-auto">
          <FileTree initialData={fileTreeInitial} />
        </div>
      </div>
      <div className="col-span-9 p-4 overflow-y-auto">{children}</div>
    </div>
  );
}
