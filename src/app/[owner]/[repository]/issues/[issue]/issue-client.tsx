"use client";

import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, GitBranch, Clock } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface IssueClientProps {
  owner: string;
  repository: string;
  issueNumber: number;
}

export function IssueClient({
  owner,
  repository,
  issueNumber,
}: IssueClientProps) {
  const {
    data: issueData,
    isLoading,
    isError,
  } = api.issues.get.useQuery({
    owner,
    repository,
    number: issueNumber,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (isError || !issueData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load issue</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{issueData.title}</h1>
          <Badge variant={issueData.state === "open" ? "default" : "secondary"}>
            {issueData.state}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <img
              src={issueData.author.avatarUrl}
              alt={issueData.author.login}
              className="h-5 w-5 rounded-full"
            />
            <span>{issueData.author.login}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              opened{" "}
              {formatDistanceToNow(new Date(issueData.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{issueData.comments} comments</span>
          </div>
        </div>
      </div>

      {/* Labels */}
      {issueData.labels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {issueData.labels.map((label) => (
            <Badge
              key={label.name}
              variant="outline"
              style={{ backgroundColor: `#${label.color}20` }}
            >
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="prose dark:prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {issueData.body}
          </Markdown>
        </div>
      </div>

      {/* Comments */}
      {issueData.comments > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Comments</h2>
          {issueData.commentsData?.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={comment.author.avatarUrl}
                  alt={comment.author.login}
                  className="h-8 w-8 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="font-medium">{comment.author.login}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {comment.body}
                </Markdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
