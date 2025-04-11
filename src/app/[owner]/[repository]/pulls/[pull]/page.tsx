import { Suspense } from "react";
import { PullRequestDetailClient } from "./pull-request-detail-client";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
    pull: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { owner, repository, pull } = await params;

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div>Loading pull request...</div>}>
        <PullRequestDetailClient
          owner={owner}
          repository={repository}
          pullNumber={parseInt(pull, 10)}
        />
      </Suspense>
    </div>
  );
}
