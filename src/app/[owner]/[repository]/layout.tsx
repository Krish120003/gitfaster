import type { Metadata } from "next";

interface RepositoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    owner: string;
    repository: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: RepositoryLayoutProps): Promise<Metadata> => {
  const awaitedParams = await params;

  return {
    title: `${awaitedParams.owner}/${awaitedParams.repository} - Gitfaster`,
    description: `View ${awaitedParams.owner}/${awaitedParams.repository} on Gitfaster`,
  };
};

export default async function RepositoryLayout({
  children,
  params,
}: RepositoryLayoutProps) {
  const awaitedParams = await params;
  const { owner, repository } = awaitedParams;

  return (
    <div className="container mx-auto px-4">
      <header className="py-4 border-b">
        <h1 className="text-2xl font-bold">
          {owner}/{repository}
        </h1>
      </header>
      <main className="py-4">{children}</main>
    </div>
  );
}
