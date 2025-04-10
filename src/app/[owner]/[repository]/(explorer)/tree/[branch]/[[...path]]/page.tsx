import FolderView from "@/app/[owner]/[repository]/_components/repository-file-list";
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

  const formattedPath = decodeURIComponent(
    (Array.isArray(path) ? path.join("/") : path) ?? ""
  );
  const data = await api.github.getFolderView({
    owner,
    repository,
    branch,
    path: formattedPath ?? "",
  });

  return (
    <div>
      <FolderView data={data} branch={branch} />
    </div>
  );
}
