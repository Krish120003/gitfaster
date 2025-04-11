import Link from "next/link";
import type { Issue } from "@/server/api/routers/issues";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

type IssueCardProps = {
  issue: Issue;
};

export function IssueCard({ issue }: IssueCardProps) {
  const params = useParams();
  const { number, title, state, labels, createdAt, author, comments } = issue;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              state === "open"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            }`}
          >
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </span>
          <Link
            href={`/${params.owner}/${params.repository}/issues/${number}`}
            className="text-lg font-semibold text-primary hover:underline"
          >
            #{number} {title}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <img
            src={author.avatarUrl}
            alt={author.login}
            className="h-6 w-6 rounded-full"
          />
          <span className="text-sm text-muted-foreground">{author.login}</span>
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Created{" "}
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
          <span>{comments} comments</span>
        </div>
      </div>
    </div>
  );
}
