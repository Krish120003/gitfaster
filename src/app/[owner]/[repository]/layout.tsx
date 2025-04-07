import type { Metadata } from "next";
import { RepositoryHeader } from "./_components/repository-header";

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
    <div className="">
      <RepositoryHeader owner={owner} repository={repository} />
      <main className="py-4">{children}</main>
    </div>
  );
}
