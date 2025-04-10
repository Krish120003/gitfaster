"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Outlet,
} from "react-router-dom";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import FolderView from "../_components/repository-file-list";
import ContentViewer from "@/components/content-viewer";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { File } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FileTree } from "../_(explorer)/_components/file-tree";

// Helper function to transform image URLs
function transformImgUrl(
  src: string | undefined,
  owner: string,
  repository: string,
  branch?: string
): string {
  if (!src) return "";

  if (src.startsWith("http")) {
    return src;
  }

  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repository}/`;
  return `${baseUrl}${branch ? `${branch}/` : ""}${src}`;
}

// Home component to display repository overview
function Home() {
  const { owner, repository } = useParams();
  const [branch, setBranch] = useState<string>("main");

  // Using React Query via TRPC to fetch data
  const { data, isLoading, isError } =
    api.github.getRepositoryOverview.useQuery(
      {
        owner: owner as string,
        repository: repository as string,
      },
      {
        enabled: !!owner && !!repository, // Ensure owner and repository are defined
      }
    );

  const {
    data: readme,
    isLoading: isReadmeLoading,
    isError: isReadmeError,
  } = api.github.getRepositoryReadme.useQuery(
    {
      owner: owner as string,
      repository: repository as string,
      branch: "HEAD",
    },
    {
      enabled: !!owner && !!repository, // Ensure owner and repository are defined
    }
  );

  if (isLoading || isReadmeLoading) {
    return <div>Loading repository information...</div>;
  }

  if (isError || isReadmeError || !data) {
    return <div>Failed to load repository data</div>;
  }

  const branchName = data.defaultBranchRef?.name ?? "main";

  return (
    <div className="p-4 mx-auto md:max-w-7xl w-full">
      <div className="w-full grid grid-cols-4 gap-8">
        {/* File Browser and README */}
        <div className="col-span-3 flex flex-col gap-4">
          <FolderView />

          <div className="border rounded bg-background p-4 w-full">
            <div className="prose dark:prose-invert max-w-none">
              <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  img: ({ src, alt, ...props }) => (
                    <img
                      src={transformImgUrl(
                        src,
                        owner as string,
                        repository as string,
                        branchName
                      )}
                      alt={alt}
                      {...props}
                    />
                  ),
                }}
              >
                {readme}
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
              {data.repositoryTopics?.nodes?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.repositoryTopics.nodes.map((topic: any) => (
                    <Badge key={topic.topic.name}>{topic.topic.name}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* License info (commented out) */}
            {/* {data.licenseInfo && (
              <div className="flex items-center gap-2 text-sm">
                <span>
                  <strong>{data.licenseInfo.name}</strong> license
                </span>
              </div>
            )} */}
          </section>

          {/* Contributors */}
          {data.mentionableUsers?.nodes?.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-semibold">Contributors</h3>
              <div className="flex flex-wrap gap-1">
                {data.mentionableUsers.nodes.map((user: any) => (
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

// About component (placeholder)
function About() {
  return <h1>About repository</h1>;
}

function LocationRender() {
  const location = useLocation();

  return <div>{JSON.stringify(location, null, 2)}</div>;
}

// Explorer layout component for blob and tree routes
function ExplorerLayout() {
  const { owner, repository } = useParams();
  const { data: fileTreeInitial } = api.github.getRepoTree.useQuery(
    {
      owner: owner as string,
      repository: repository as string,
      branch: "HEAD",
      recursive: false,
    },
    {
      enabled: !!owner && !!repository,
    }
  );

  return (
    <div className="grid grid-cols-12 w-full h-screen">
      <div className="col-span-3 border-r border-foreground/20 overflow-y-auto">
        {fileTreeInitial && <FileTree initialData={fileTreeInitial} />}
      </div>
      <div className="col-span-9 p-4">
        <Outlet />
      </div>
    </div>
  );
}

// Loading component for blob view
function BlobViewLoading() {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const filePath = pathParts.slice(2).join("/");
  const fileName = filePath.split("/").pop() || "";

  const skeletonWidths = [
    "30%",
    "45%",
    "28%",
    "40%",
    "35%",
    "37%",
    "32%",
    "42%",
  ];
  const skeletons = skeletonWidths.map((width, i) => (
    <Skeleton key={i} className="h-4" style={{ width }} />
  ));

  return (
    <div className="rounded-lg border border-border bg-background flex flex-col">
      <div className="flex border-b border-border justify-between">
        <div className="p-3 text-muted-foreground font-medium flex gap-2 items-center">
          <File className="h-5 w-5 text-muted-foreground" />
          <span>{fileName}</span>
        </div>
      </div>
      <div className="p-4 overflow-auto">
        <div className="flex flex-col gap-2">{skeletons}</div>
      </div>
    </div>
  );
}

function BlobView() {
  const params = useParams();
  const owner = params.owner as string;
  const repository = params.repository as string;

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const branch = pathParts[1];
  const filePath = pathParts.slice(2).join("/");

  const { data: repoOverview } = api.github.getRepositoryOverview.useQuery(
    {
      owner,
      repository,
    },
    {
      enabled: !!owner && !!repository,
    }
  );

  const defaultBranch = repoOverview?.defaultBranchRef?.name ?? "main";
  const activeBranch = branch || defaultBranch;

  const { data: fileContent, isLoading } = api.github.getFileContent.useQuery(
    {
      owner,
      repository,
      branch: activeBranch,
      path: filePath,
    },
    {
      enabled: !!owner && !!repository && !!filePath && !!activeBranch,
    }
  );

  if (isLoading) {
    return <BlobViewLoading />;
  }

  if (!fileContent) {
    return <div>File not found</div>;
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repository}/${activeBranch}/${filePath}`;

  return (
    <div className="rounded-lg border border-border bg-background flex flex-col">
      <div className="flex border-b border-border justify-between">
        <div className="p-3 text-muted-foreground font-medium flex gap-2 items-center">
          <File className="h-5 w-5 text-muted-foreground" />
          <span>{filePath.split("/").pop()}</span>
        </div>
      </div>
      <div className="p-4">
        <ContentViewer file={fileContent} url={rawUrl} />
      </div>
    </div>
  );
}

export default function App() {
  if (typeof window === "undefined") {
    return null;
  }

  const { owner, repository } = useParams();

  return (
    <Router basename={`/${owner}/${repository}`}>
      <script
        crossOrigin="anonymous"
        src="//unpkg.com/react-scan/dist/auto.global.js"
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route element={<ExplorerLayout />}>
          <Route path="/tree/*" element={<FolderView />} />
          <Route path="/blob/:branch/*" element={<BlobView />} />
        </Route>
      </Routes>
    </Router>
  );
}
