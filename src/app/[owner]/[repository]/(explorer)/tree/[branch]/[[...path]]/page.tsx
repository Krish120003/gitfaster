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
  const data = await api.github.getFolderView({
    owner,
    repository,
    branch,
    path: formattedPath ?? "",
  });

  return (
    <div>
      <div>
        params are:
        <code>
          <pre>{JSON.stringify(await params, null, 2)}</pre>
          <pre>{formattedPath}</pre>
        </code>
      </div>
      <ul>
        {data.map((item) => (
          <li key={item.path}>
            <a href={`/${owner}/${repository}/blob/${branch}/${item.path}`}>
              {item.path}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
