import { api } from "@/trpc/server";
import { FileTree } from "./_components/file-tree";
import { BranchSelector } from "./_components/branch-selector";
import { Breadcrumbs } from "./_components/breadcrumbs";
import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

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

  let fileTreeInitial = null;
  try {
    fileTreeInitial = await api.github.getRepoTree({
      owner,
      repository,
      branch: "HEAD",
      recursive: false,
    });
  } catch (error) {
    if (error instanceof TRPCError) {
      if (error.code === "NOT_FOUND") {
        notFound();
      }
    }
  }

  return (
    <>
      {fileTreeInitial && (
        <div className="grid grid-cols-12 w-full h-screen">
          <div className="col-span-3 border-r border-foreground/20 overflow-y-auto flex flex-col">
            <div className="border-b border-foreground/20 flex flex-col items-stretch gap-2 p-2">
              <BranchSelector />
            </div>

            <div className="flex-grow overflow-y-auto">
              <FileTree initialData={fileTreeInitial} />
            </div>
          </div>
          <div className="col-span-9 overflow-y-auto">
            <div className="border-b border-foreground/20">
              <Breadcrumbs />
            </div>
            <div className="">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
