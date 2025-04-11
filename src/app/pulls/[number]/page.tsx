"use client";

import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { PullRequestDetails } from "@/components/pull-request-details";

export default function PullRequestPage() {
  const params = useParams();
  const { data: pullRequest, isLoading } = api.pulls.get.useQuery({
    owner: params.owner as string,
    repository: params.repository as string,
    number: Number(params.number),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!pullRequest) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-gray-600">Pull request not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PullRequestDetails pullRequest={pullRequest} />
    </div>
  );
}
