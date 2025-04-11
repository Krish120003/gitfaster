import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { redis } from "@/server/redis";
import { getOctokit } from "@/server/github/auth";
import type { RestEndpointMethodTypes } from "@octokit/rest";

const CACHE_TTL = 60 * 60 * 24 * 7; // 1 week, since issues are immutable and changes are infrequent

type GitHubIssue = RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
type GitHubLabel = NonNullable<GitHubIssue["labels"][number]>;
type GitHubComment =
  RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"][number];
type GitHubSearchIssue =
  RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"]["items"][number];

export type Issue = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  labels: Array<{
    name: string;
    color: string;
  }>;
  createdAt: string;
  author: {
    login: string;
    avatarUrl: string;
  };
  body: string;
  comments: number;
  commentsData: Array<{
    id: number;
    body: string;
    createdAt: string;
    author: {
      login: string;
      avatarUrl: string;
    };
  }>;
};

export const issuesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
        cursor: z.number().optional(),
        limit: z.number().min(1).max(100).default(25),
        state: z.enum(["open", "closed", "all"]).default("open"),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const octokit = await getOctokit(ctx);
      const { owner, repository, cursor = 1, limit, state, search } = input;

      // If search is provided, use GitHub's search API
      if (search) {
        const cacheKey = `issues:search:${owner}:${repository}:${search}`;

        // Try to get from cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
          const allIssues = cached as Issue[];
          const start = (cursor - 1) * limit;
          const end = start + limit;
          return {
            items: allIssues.slice(start, end),
            nextCursor: end < allIssues.length ? cursor + 1 : undefined,
            total: allIssues.length,
          };
        }

        try {
          // Split search terms and add wildcards for fuzzy matching
          const searchTerms = search
            .split(/\s+/)
            .map((term) => {
              // If term is a single word, add wildcards
              if (!term.includes(" ")) {
                return `*${term}*`;
              }
              return term;
            })
            .join(" ");

          const response = await octokit.rest.search.issuesAndPullRequests({
            q: `repo:${owner}/${repository} ${searchTerms} in:title,body is:issue`,
            sort: "created",
            order: "desc",
            per_page: 100, // Get more items per page to reduce API calls
          });

          const issues: Issue[] = response.data.items.map(
            (issue: GitHubSearchIssue) => ({
              id: issue.id,
              number: issue.number,
              title: issue.title,
              state: issue.state as "open" | "closed",
              labels: issue.labels.map((label: GitHubLabel) => {
                if (typeof label === "string") {
                  return { name: label, color: "#000000" };
                }
                return {
                  name: label.name ?? "",
                  color: label.color ?? "#000000",
                };
              }),
              createdAt: issue.created_at,
              author: {
                login: issue.user?.login ?? "",
                avatarUrl: issue.user?.avatar_url ?? "",
              },
              body: issue.body ?? "",
              comments: issue.comments,
              commentsData: [],
            })
          );

          await redis.set(cacheKey, issues, CACHE_TTL);

          const start = (cursor - 1) * limit;
          const end = start + limit;
          return {
            items: issues.slice(start, end),
            nextCursor: end < issues.length ? cursor + 1 : undefined,
            total: issues.length,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to search issues",
            cause: error,
          });
        }
      }

      const cacheKey = `issues:${owner}:${repository}:${state}`;

      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        const allIssues = cached as Issue[];
        const start = (cursor - 1) * limit;
        const end = start + limit;
        return {
          items: allIssues.slice(start, end),
          nextCursor: end < allIssues.length ? cursor + 1 : undefined,
          total: allIssues.length,
        };
      }

      try {
        // Fetch all issues for the given state
        const allIssues: Issue[] = [];
        let page = 1;

        while (true) {
          const response = await octokit.rest.issues.listForRepo({
            owner,
            repo: repository,
            state: state === "all" ? "all" : state,
            per_page: 100, // Get maximum items per page to reduce API calls
            page,
          });

          if (response.data.length === 0) break;

          allIssues.push(
            ...response.data.map((issue: GitHubIssue) => ({
              id: issue.id,
              number: issue.number,
              title: issue.title,
              state: issue.state as "open" | "closed",
              labels: issue.labels.map((label: GitHubLabel) => {
                if (typeof label === "string") {
                  return { name: label, color: "#000000" };
                }
                return {
                  name: label.name ?? "",
                  color: label.color ?? "#000000",
                };
              }),
              createdAt: issue.created_at,
              author: {
                login: issue.user?.login ?? "",
                avatarUrl: issue.user?.avatar_url ?? "",
              },
              body: issue.body ?? "",
              comments: issue.comments,
              commentsData: [],
            }))
          );

          if (response.data.length < 100) break;
          page++;
        }

        // Cache all issues
        await redis.set(cacheKey, allIssues, CACHE_TTL);

        // Return paginated result
        const start = (cursor - 1) * limit;
        const end = start + limit;
        return {
          items: allIssues.slice(start, end),
          nextCursor: end < allIssues.length ? cursor + 1 : undefined,
          total: allIssues.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch issues",
          cause: error,
        });
      }
    }),

  get: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
        number: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const octokit = await getOctokit(ctx);
      const { owner, repository, number } = input;
      const cacheKey = `issues:${owner}:${repository}:${number}`;

      const cached = await redis.get(cacheKey);
      if (cached) {
        return cached as Issue;
      }

      try {
        const [issueResponse, commentsResponse] = await Promise.all([
          octokit.rest.issues.get({
            owner,
            repo: repository,
            issue_number: number,
          }),
          octokit.rest.issues.listComments({
            owner,
            repo: repository,
            issue_number: number,
          }),
        ]);

        const issue: Issue = {
          id: issueResponse.data.id,
          number: issueResponse.data.number,
          title: issueResponse.data.title,
          state: issueResponse.data.state as "open" | "closed",
          labels: issueResponse.data.labels.map((label: GitHubLabel) => {
            if (typeof label === "string") {
              return { name: label, color: "#000000" };
            }
            return {
              name: label.name ?? "",
              color: label.color ?? "#000000",
            };
          }),
          createdAt: issueResponse.data.created_at,
          author: {
            login: issueResponse.data.user?.login ?? "",
            avatarUrl: issueResponse.data.user?.avatar_url ?? "",
          },
          body: issueResponse.data.body ?? "",
          comments: issueResponse.data.comments,
          commentsData: commentsResponse.data.map((comment: GitHubComment) => ({
            id: comment.id,
            body: comment.body ?? "",
            createdAt: comment.created_at,
            author: {
              login: comment.user?.login ?? "",
              avatarUrl: comment.user?.avatar_url ?? "",
            },
          })),
        };

        await redis.set(cacheKey, issue, CACHE_TTL);
        return issue;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch issue",
          cause: error,
        });
      }
    }),
});
