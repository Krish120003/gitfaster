"use client";

import { useParams } from "next/navigation";
import { PullRequestFiles } from "@/components/pull-request-files";
import { PullRequestLayout } from "../pull-request-layout";

export default function Page() {
  const params = useParams();
  const owner = params.owner as string;
  const repository = params.repository as string;
  const pullNumber = parseInt(params.pull as string, 10);

  return (
    <PullRequestLayout
      owner={owner}
      repository={repository}
      pullNumber={pullNumber}
    >
      <PullRequestFiles
        owner={owner}
        repository={repository}
        pullNumber={pullNumber}
      />
    </PullRequestLayout>
  );
}
