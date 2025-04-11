import type { PullRequest } from "@/server/api/routers/pulls";
import { formatDistanceToNow } from "date-fns";

type PullRequestDetailsProps = {
  pullRequest: PullRequest;
};

export function PullRequestDetails({ pullRequest }: PullRequestDetailsProps) {
  const {
    number,
    title,
    state,
    labels,
    createdAt,
    author,
    body,
    comments,
    reviewComments,
    additions,
    deletions,
    changedFiles,
    headRef,
    baseRef,
    commentsData,
  } = pullRequest;

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                state === "open"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : state === "closed"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
              }`}
            >
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </span>
            <h1 className="text-2xl font-bold text-foreground">
              #{number} {title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <img
              src={author.avatarUrl}
              alt={author.login}
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm text-muted-foreground">
              {author.login}
            </span>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {labels.map((label) => (
            <span
              key={label.name}
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
              style={{ backgroundColor: `#${label.color}` }}
            >
              {label.name}
            </span>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Created{" "}
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            <span>{comments} comments</span>
            <span>{reviewComments} review comments</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-600 dark:text-green-400">
              +{additions}
            </span>
            <span className="text-red-600 dark:text-red-400">-{deletions}</span>
            <span>{changedFiles} files changed</span>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {headRef.repository.owner.login}:{headRef.name}
          </span>
          <span>→</span>
          <span>
            {baseRef.repository.owner.login}:{baseRef.name}
          </span>
        </div>

        <div className="prose max-w-none dark:prose-invert">
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      </div>

      {commentsData && commentsData.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Comments</h2>
          {commentsData.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                <img
                  src={comment.author.avatarUrl}
                  alt={comment.author.login}
                  className="h-6 w-6 rounded-full"
                />
                <span className="font-medium text-foreground">
                  {comment.author.login}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div
                className="prose max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: comment.body }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
