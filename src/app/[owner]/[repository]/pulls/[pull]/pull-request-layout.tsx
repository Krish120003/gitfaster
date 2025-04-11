"use client";

import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { GitPullRequest } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface PullRequestLayoutProps {
  owner: string;
  repository: string;
  pullNumber: number;
  children: React.ReactNode;
}

export function PullRequestLayout({
  owner,
  repository,
  pullNumber,
  children,
}: PullRequestLayoutProps) {
  const { data: pr } = api.pulls.get.useQuery({
    owner,
    repository,
    number: pullNumber,
  });
  const router = useRouter();
  const pathname = usePathname();
  const isFilesTab = pathname.endsWith("/files");
  const basePath = pathname.replace("/files", "");

  if (!pr) {
    return <div>Loading...</div>;
  }

  const handleTabChange = (value: string) => {
    if (value === "files") {
      router.push(`${basePath}/files`);
    } else {
      router.push(basePath);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5" />
              <h1 className="text-2xl font-bold">{pr.title}</h1>
              <Badge variant={pr.state === "open" ? "default" : "secondary"}>
                {pr.state}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <span>#{pr.number}</span>
              {" • "}
              <span>
                opened{" "}
                {formatDistanceToNow(new Date(pr.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {" • "}
              <span>by {pr.author.login}</span>
            </div>
          </div>
        </div>
        {pr.labels.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {pr.labels.map((label) => (
              <Badge
                key={label.name}
                variant="outline"
                style={{ backgroundColor: `#${label.color}` }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <Tabs
        value={isFilesTab ? "files" : "conversation"}
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="files">Files Changed</TabsTrigger>
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
}
