import type { Metadata } from "next";
import { RepositoryHeader } from "./_components/repository-header";
import { auth } from "@/server/auth";
import { SignInRedirect } from "./_components/signin-redirect";

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

  // get session
  const session = await auth();

  if (!session) {
    return <SignInRedirect owner={owner} repository={repository} />;
  }

  return (
    <div className="h-full min-h-screen flex flex-col items-stretch">
      <RepositoryHeader
        owner={owner}
        repository={repository}
        session={session}
      />
      <main className="flex-1 flex items-stretch justify-stretch">
        {children}
      </main>
    </div>
  );
}
