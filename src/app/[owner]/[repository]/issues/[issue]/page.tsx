import { Suspense } from "react";
import { IssueClient } from "./issue-client";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
    issue: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { owner, repository, issue } = await params;

  return (
    <div className="p-4 mx-auto md:max-w-7xl w-full">
      <Suspense fallback={<div>Loading issue...</div>}>
        <IssueClient
          owner={owner}
          repository={repository}
          issueNumber={parseInt(issue, 10)}
        />
      </Suspense>
    </div>
  );
}
