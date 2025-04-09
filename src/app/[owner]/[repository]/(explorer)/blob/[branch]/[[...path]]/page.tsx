import ContentViewer from "@/components/content-viewer";
import { api } from "@/trpc/server";
import { File } from "lucide-react";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
    branch: string;
    path: string | string[] | undefined;
  }>;
}
export default async function Page({ params }: PageProps) {
  const awaitedParams = await params;

  const formattedPath = decodeURIComponent(
    (Array.isArray(awaitedParams.path)
      ? awaitedParams.path.join("/")
      : awaitedParams.path) ?? ""
  );

  const file = await api.github.getFileContent({
    owner: awaitedParams.owner,
    repository: awaitedParams.repository,
    branch: awaitedParams.branch,
    path: formattedPath,
  });

  const url = `https://raw.githubusercontent.com/${awaitedParams.owner}/${awaitedParams.repository}/${awaitedParams.branch}/${formattedPath}`;

  return (
    <div className="rounded-lg border border-border bg-background flex flex-col">
      {/* Header section similar to FolderView */}
      <div className="flex border-b border-border justify-between">
        <div className="p-3 text-muted-foreground font-medium flex gap-2 items-center">
          <File className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">{file.name}</span>
        </div>
        <div className="p-3 text-right text-muted-foreground">
          {/* {lastCommitDate} */}
        </div>
      </div>

      {/* Content section with pre tags */}
      <div className="overflow-auto ">
        {file ? (
          <ContentViewer file={file} url={url} />
        ) : (
          <pre className="text-sm font-mono whitespace-pre-wrap">
            No content available
          </pre>
        )}
      </div>
    </div>
  );
}
