import { FileContentView } from "@/app/[owner]/[repository]/_components/repository-file";
import { api } from "@/trpc/server";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
    branch: string;
    path: string | string[] | undefined;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { owner, repository, branch, path } = await params;

  const formattedPath = (Array.isArray(path) ? path.join("/") : path) ?? "";

  return (
    <div>
      <FileContentView
        owner={owner}
        repository={repository}
        branch={branch}
        path={formattedPath}
      />
    </div>
  );
}
