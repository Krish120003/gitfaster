import { api } from "@/trpc/server";
import { Badge } from "@/components/ui/badge";
import { BranchSelector } from "./(explorer)/_components/branch-selector";

import FolderView from "./_components/repository-file-list";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import StarButton from "./_components/star-button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
  }>;
}

// Add a helper function to transform image URLs.
function transformImgUrl(
  src: string | undefined,
  owner: string,
  repository: string,
  branch?: string
): string {
  // Your logic to change the image URL.
  if (!src) return "";

  if (src.startsWith("http")) {
    return src;
  }

  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repository}/`;

  return `${baseUrl}${branch ? `${branch}/` : ""}${src}`;
}

export default async function Page({ params }: PageProps) {
  const { owner, repository } = await params;
  const repoOverviewPromise = api.github.getRepositoryOverview({
    owner,
    repository,
  });

  const folderDataPromise = api.github.getFolderView({
    owner,
    repository,
    branch: "HEAD",
    path: "",
  });

  const readmeDataPromise = api.github.getRepositoryReadme({
    owner,
    repository,
    branch: "HEAD",
  });

  const [data, folderData, readmeData] = await Promise.all([
    repoOverviewPromise,
    folderDataPromise,
    readmeDataPromise,
  ]);

  const branch = data.defaultBranchRef?.name ?? "main";

  return (
    <div className="p-4 mx-auto md:max-w-7xl w-full flex flex-col gap-4">
      {/* Branch selector and repo name row */}

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground ">{repository}</h1>
        <div className="flex items-center justify-between">
          <div className="w-64 bg-white dark:bg-transparent rounded-md border">
            <BranchSelector />
          </div>
          <div className="">
            <StarButton owner={owner} repository={repository} />
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-4 gap-8">
        {/* File Browser and README */}
        <div className="col-span-3 flex flex-col gap-4">
          <FolderView
            hardnav={true}
            data={folderData}
            branch={data.defaultBranchRef?.name ?? "main"}
            owner={owner}
            repository={repository}
          />

          <div className="border rounded bg-background p-4 w-full">
            <div className="prose dark:prose-invert max-w-none">
              <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  img: ({ src, alt, ...props }) => (
                    <img
                      src={transformImgUrl(src, owner, repository, branch)}
                      alt={alt}
                      {...props}
                    />
                  ),
                }}
              >
                {readmeData}
              </Markdown>
            </div>
          </div>
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
