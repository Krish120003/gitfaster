import ExplorerView from "@/app/[owner]/[repository]/(explorer)/_components/explorer-view";
import { api } from "@/trpc/server";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
    branch: string;
    path?: string[];
  }>;
}

export default async function Page({ params }: PageProps) {
  const awaitedParams = await params;

  const formattedPath = awaitedParams.path ? awaitedParams.path.join("/") : "";

  // use the server api and .prefetch the file contents so they are available instantly
  console.log("Doing a prefetch for", {
    owner: awaitedParams.owner,
    repository: awaitedParams.repository,
    branch: awaitedParams.branch,
    path: formattedPath,
  });

  void (await api.github.getFileContent.prefetch({
    owner: awaitedParams.owner,
    repository: awaitedParams.repository,
    branch: awaitedParams.branch,
    path: formattedPath,
  }));

  return <ExplorerView />;
}
