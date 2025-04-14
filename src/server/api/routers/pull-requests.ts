import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { redis } from "@/server/redis";
import {
  getOctokit,
  userHasAccessToRepository,
  throwIfNoAccess,
} from "@/server/github/auth";

const CACHE_TTL = 60 * 60 * 24 * 7; // 1 week, since PRs are immutable and changes are infrequent

export type PullRequest = {
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

export const pullRequestsRouter = createTRPCRouter({
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
      const hasAccess = await userHasAccessToRepository(
        ctx,
        input.owner,
        input.repository
      );
      throwIfNoAccess(hasAccess);

      const octokit = await getOctokit(ctx);
      const { owner, repository, cursor = 1, limit, state, search } = input;

      // If search is provided, use GitHub's search API
      if (search) {
        const cacheKey = `pull-requests:search:${owner}:${repository}:${search}`;

        // Try to get from cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
          const allPRs = cached as PullRequest[];
          const start = (cursor - 1) * limit;
          const end = start + limit;
          return {
            items: allPRs.slice(start, end),
            nextCursor: end < allPRs.length ? cursor + 1 : undefined,
            total: allPRs.length,
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
            q: `repo:${owner}/${repository} ${searchTerms} in:title,body is:pr`,
            sort: "created",
            order: "desc",
            per_page: 100, // Get more items per page to reduce API calls
          });

          const pullRequests: PullRequest[] = response.data.items.map((pr) => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state as "open" | "closed",
            labels: pr.labels.map((label) => {
              if (typeof label === "string") {
                return { name: label, color: "#000000" };
              }
              return {
                name: label.name ?? "",
                color: label.color ?? "#000000",
              };
            }),
            createdAt: pr.created_at,
            author: {
              login: pr.user?.login ?? "",
              avatarUrl: pr.user?.avatar_url ?? "",
            },
            body: pr.body ?? "",
            comments: pr.comments,
            commentsData: [],
          }));

          await redis.set(cacheKey, pullRequests, CACHE_TTL);

          const start = (cursor - 1) * limit;
          const end = start + limit;
          return {
            items: pullRequests.slice(start, end),
            nextCursor: end < pullRequests.length ? cursor + 1 : undefined,
            total: pullRequests.length,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to search pull requests",
            cause: error,
          });
        }
      }

      const cacheKey = `pull-requests:${owner}:${repository}:${state}`;

      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        const allPRs = cached as PullRequest[];
        const start = (cursor - 1) * limit;
        const end = start + limit;
        return {
          items: allPRs.slice(start, end),
          nextCursor: end < allPRs.length ? cursor + 1 : undefined,
          total: allPRs.length,
        };
      }

      try {
        // Fetch all PRs for the given state
        const allPRs: PullRequest[] = [];
        let page = 1;

        while (true) {
          const response = await octokit.rest.pulls.list({
            owner,
            repo: repository,
            state: state === "all" ? "all" : state,
            per_page: 100, // Get maximum items per page to reduce API calls
            page,
          });

          if (response.data.length === 0) break;

          allPRs.push(
            ...response.data.map((pr) => ({
              id: pr.id,
              number: pr.number,
              title: pr.title,
              state: pr.state as "open" | "closed",
              labels: pr.labels.map((label) => {
                if (typeof label === "string") {
                  return { name: label, color: "#000000" };
                }
                return {
                  name: label.name ?? "",
                  color: label.color ?? "#000000",
                };
              }),
              createdAt: pr.created_at,
              author: {
                login: pr.user?.login ?? "",
                avatarUrl: pr.user?.avatar_url ?? "",
              },
              body: pr.body ?? "",
              comments: 0, // We'll fetch comments separately
              commentsData: [],
            }))
          );

          if (response.data.length < 100) break;
          page++;
        }

        // Cache all PRs
        await redis.set(cacheKey, allPRs, CACHE_TTL);

        // Return paginated result
        const start = (cursor - 1) * limit;
        const end = start + limit;
        return {
          items: allPRs.slice(start, end),
          nextCursor: end < allPRs.length ? cursor + 1 : undefined,
          total: allPRs.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pull requests",
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
      const hasAccess = await userHasAccessToRepository(
        ctx,
        input.owner,
        input.repository
      );
      throwIfNoAccess(hasAccess);

      const octokit = await getOctokit(ctx);
      const { owner, repository, number } = input;
      const cacheKey = `pull-requests:${owner}:${repository}:${number}`;

      const cached = await redis.get(cacheKey);
      if (cached) {
        return cached as PullRequest;
      }

      try {
        const [prResponse, commentsResponse] = await Promise.all([
          octokit.rest.pulls.get({
            owner,
            repo: repository,
            pull_number: number,
          }),
          octokit.rest.issues.listComments({
            owner,
            repo: repository,
            issue_number: number,
          }),
        ]);

        const pr: PullRequest = {
          id: prResponse.data.id,
          number: prResponse.data.number,
          title: prResponse.data.title,
          state: prResponse.data.state as "open" | "closed",
          labels: prResponse.data.labels.map((label) => {
            if (typeof label === "string") {
              return { name: label, color: "#000000" };
            }
            return {
              name: label.name ?? "",
              color: label.color ?? "#000000",
            };
          }),
          createdAt: prResponse.data.created_at,
          author: {
            login: prResponse.data.user?.login ?? "",
            avatarUrl: prResponse.data.user?.avatar_url ?? "",
          },
          body: prResponse.data.body ?? "",
          comments: prResponse.data.comments,
          commentsData: commentsResponse.data.map((comment) => ({
            id: comment.id,
            body: comment.body ?? "",
            createdAt: comment.created_at,
            author: {
              login: comment.user?.login ?? "",
              avatarUrl: comment.user?.avatar_url ?? "",
            },
          })),
        };

        await redis.set(cacheKey, pr, CACHE_TTL);
        return pr;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pull request",
          cause: error,
        });
      }
    }),
});
