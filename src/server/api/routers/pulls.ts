import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { redis } from "@/server/redis";
import { getOctokit } from "@/server/github/auth";
import type { RestEndpointMethodTypes } from "@octokit/rest";

const CACHE_TTL = 60 * 5; // 5 minutes

export type PullRequest = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
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
  reviewComments: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  headRef: {
    name: string;
    repository: {
      name: string;
      owner: {
        login: string;
      };
    };
  };
  baseRef: {
    name: string;
    repository: {
      name: string;
      owner: {
        login: string;
      };
    };
  };
  commentsData?: Array<{
    id: number;
    body: string;
    createdAt: string;
    author: {
      login: string;
      avatarUrl: string;
    };
  }>;
};

export const pullsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
        cursor: z.number().optional(),
        limit: z.number().min(1).max(100).default(10),
        state: z.enum(["open", "closed", "all"]).default("open"),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const octokit = await getOctokit(ctx);
      const { owner, repository, cursor = 1, limit, state, search } = input;

      // If search is provided, use GitHub's search API
      if (search) {
        const cacheKey = `pulls:search:${owner}:${repository}:${search}`;

        // Try to get from cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
          return { items: cached as PullRequest[], nextCursor: undefined };
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
            per_page: limit,
          });

          const pulls: PullRequest[] = response.data.items.map((pr) => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state as "open" | "closed" | "merged",
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
            reviewComments: 0, // We'll fetch review comments separately
            additions: 0, // We'll fetch these separately
            deletions: 0, // We'll fetch these separately
            changedFiles: 0, // We'll fetch these separately
            headRef: {
              name: "",
              repository: {
                name: "",
                owner: {
                  login: "",
                },
              },
            },
            baseRef: {
              name: "",
              repository: {
                name: "",
                owner: {
                  login: "",
                },
              },
            },
          }));

          await redis.set(cacheKey, pulls, CACHE_TTL);
          return { items: pulls, nextCursor: undefined };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to search pull requests",
            cause: error,
          });
        }
      }

      const cacheKey = `pulls:${owner}:${repository}:${state}:${cursor}:${limit}`;

      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return cached as { items: PullRequest[]; nextCursor?: number };
      }

      try {
        const response = await octokit.rest.pulls.list({
          owner,
          repo: repository,
          state: state === "all" ? "all" : state,
          per_page: limit,
          page: cursor,
        });

        const pulls: PullRequest[] = response.data.map((pr) => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          state: pr.state as "open" | "closed" | "merged",
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
          reviewComments: 0, // We'll fetch review comments separately
          additions: 0, // We'll fetch these separately
          deletions: 0, // We'll fetch these separately
          changedFiles: 0, // We'll fetch these separately
          headRef: {
            name: pr.head.ref,
            repository: {
              name: pr.head.repo?.name ?? "",
              owner: {
                login: pr.head.repo?.owner?.login ?? "",
              },
            },
          },
          baseRef: {
            name: pr.base.ref,
            repository: {
              name: pr.base.repo?.name ?? "",
              owner: {
                login: pr.base.repo?.owner?.login ?? "",
              },
            },
          },
        }));

        await redis.set(
          cacheKey,
          { items: pulls, nextCursor: undefined },
          CACHE_TTL
        );
        return { items: pulls, nextCursor: undefined };
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
      const octokit = await getOctokit(ctx);
      const { owner, repository, number } = input;
      const cacheKey = `pulls:${owner}:${repository}:${number}`;

      // Try to get from cache first
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
          state: prResponse.data.state as "open" | "closed" | "merged",
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
          reviewComments: prResponse.data.review_comments,
          additions: prResponse.data.additions,
          deletions: prResponse.data.deletions,
          changedFiles: prResponse.data.changed_files,
          headRef: {
            name: prResponse.data.head.ref,
            repository: {
              name: prResponse.data.head.repo?.name ?? "",
              owner: {
                login: prResponse.data.head.repo?.owner?.login ?? "",
              },
            },
          },
          baseRef: {
            name: prResponse.data.base.ref,
            repository: {
              name: prResponse.data.base.repo?.name ?? "",
              owner: {
                login: prResponse.data.base.repo?.owner?.login ?? "",
              },
            },
          },
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
