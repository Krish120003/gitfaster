import { api } from "@/trpc/server";
import { FileTree } from "./_components/file-tree";

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
      <div className="col-span-3 border-r border-foreground/20 overflow-y-auto">
        <FileTree initialData={fileTreeInitial} />
      </div>
      <div className="col-span-9 p-4">{children}</div>
    </div>
  );
}
