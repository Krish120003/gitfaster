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

  const formattedPath = Array.isArray(path) ? path.join("/") : path;

  const data = await api.github.getFileContent({
    owner,
    repository,
    branch,
    path: formattedPath ?? "",
  });

  return (
    <div>
      <code>
        <pre>{data}</pre>
      </code>
    </div>
  );
}
