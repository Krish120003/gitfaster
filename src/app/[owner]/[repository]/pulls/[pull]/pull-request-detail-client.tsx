"use client";

import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Markdown } from "@/components/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { GitPullRequest, MessageSquare } from "lucide-react";

interface PullRequestDetailClientProps {
  owner: string;
  repository: string;
  pullNumber: number;
}

export function PullRequestDetailClient({
  owner,
  repository,
  pullNumber,
}: PullRequestDetailClientProps) {
  const { data: pr } = api.pulls.get.useQuery({
    owner,
    repository,
    number: pullNumber,
  });

  if (!pr) {
    return <div>Loading...</div>;
  }

  const commentsData = pr.commentsData ?? [];

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-4 gap-8">
        <div className="col-span-3 space-y-8">
          <div className="rounded-lg border p-4">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={pr.author.avatarUrl} alt={pr.author.login} />
                <AvatarFallback>{pr.author.login[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{pr.author.login}</span>
                    <span className="text-sm text-muted-foreground">
                      commented{" "}
                      {formatDistanceToNow(new Date(pr.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <Markdown content={pr.body} />
              </div>
            </div>
          </div>

          {commentsData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  {pr.comments} {pr.comments === 1 ? "Comment" : "Comments"}
                </h2>
              </div>
              <div className="space-y-4">
                {commentsData.map((comment) => (
                  <div key={comment.id} className="rounded-lg border p-4">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage
                          src={comment.author.avatarUrl}
                          alt={comment.author.login}
                        />
                        <AvatarFallback>
                          {comment.author.login[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {comment.author.login}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              commented{" "}
                              {formatDistanceToNow(
                                new Date(comment.createdAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </div>
                        <Markdown content={comment.body} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">Details</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Author</dt>
                <dd className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={pr.author.avatarUrl}
                      alt={pr.author.login}
                    />
                    <AvatarFallback>{pr.author.login[0]}</AvatarFallback>
                  </Avatar>
                  <span>{pr.author.login}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Created</dt>
                <dd>
                  {formatDistanceToNow(new Date(pr.createdAt), {
                    addSuffix: true,
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Comments</dt>
                <dd>{pr.comments}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
