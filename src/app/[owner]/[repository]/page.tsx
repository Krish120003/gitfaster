import { api } from "@/trpc/server";
import { Badge } from "@/components/ui/badge";
import { StarIcon } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { owner, repository } = await params;

  const data = await api.github.getRepositoryOverview({
    owner,
    repository,
  });

  return (
    <div className="p-4 mx-auto md:max-w-7xl w-full">
      <div className="w-full grid grid-cols-4 gap-8">
        {/* File Browser and README */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Placeholder for file explorer */}
          <div className="w-full h-[400px] bg-red-100 rounded-lg border"></div>
        </div>

        {/* Description / Metadata */}
        <div className="col-span-1 flex flex-col gap-2">
          <section className="flex flex-col gap-2">
            <div className="">
              <h2 className="font-bold">About</h2>
              {data.description && <p>{data.description}</p>}
            </div>
            <div>
              {data.repositoryTopics.nodes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.repositoryTopics.nodes.map((topic) => (
                    <Badge key={topic.topic.name}>{topic.topic.name}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* {data.licenseInfo && (
                <div className="flex items-center gap-2 text-sm">
                  <span>
                    <strong>{data.licenseInfo.name}</strong> license
                  </span>
                </div>
              )} */}

            {/* Topics */}
          </section>

          {/* Contributors */}
          {data.mentionableUsers.nodes.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-semibold">Contributors</h3>
              <div className="flex flex-wrap gap-1">
                {data.mentionableUsers.nodes.map((user) => (
                  <img
                    key={user.login}
                    src={user.avatarUrl}
                    alt={user.login}
                    className="h-8 w-8 rounded-full"
                    title={user.login}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
