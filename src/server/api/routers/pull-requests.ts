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

export type PullRequestFile = {
  sha: string;
  filename: string;
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

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
  additions: number;
  deletions: number;
  changedFiles: number;
  headRef: {
    name: string;
    repository: {
      owner: {
        login: string;
      };
    };
  };
  baseRef: {
    name: string;
    repository: {
      owner: {
        login: string;
      };
    };
  };
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
          const searchTerms = search
            .split(/\s+/)
            .map((term) => {
              if (!term.includes(" ")) {
                return `*${term}*`;
              }
              return term;
            })
            .join(" ");

          const searchResponse =
            await octokit.rest.search.issuesAndPullRequests({
              q: `repo:${owner}/${repository} ${searchTerms} in:title,body is:pr`,
              sort: "created",
              order: "desc",
              per_page: 100,
            });

          // Get full PR details since search results don't include PR-specific fields
          const pullRequests = await Promise.all(
            searchResponse.data.items.map(async (searchResult) => {
              const [prResponse, commentsResponse] = await Promise.all([
                octokit.rest.pulls.get({
                  owner,
                  repo: repository,
                  pull_number: searchResult.number,
                }),
                octokit.rest.issues.listComments({
                  owner,
                  repo: repository,
                  issue_number: searchResult.number,
                }),
              ]);

              const pr = prResponse.data;
              return {
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
                commentsData: commentsResponse.data.map((comment) => ({
                  id: comment.id,
                  body: comment.body ?? "",
                  createdAt: comment.created_at,
                  author: {
                    login: comment.user?.login ?? "",
                    avatarUrl: comment.user?.avatar_url ?? "",
                  },
                })),
                additions: pr.additions ?? 0,
                deletions: pr.deletions ?? 0,
                changedFiles: pr.changed_files ?? 0,
                headRef: {
                  name: pr.head.ref,
                  repository: {
                    owner: {
                      login: pr.head.repo?.owner?.login ?? "",
                    },
                  },
                },
                baseRef: {
                  name: pr.base.ref,
                  repository: {
                    owner: {
                      login: pr.base.repo?.owner?.login ?? "",
                    },
                  },
                },
              };
            })
          );

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
          const listResponse = await octokit.rest.pulls.list({
            owner,
            repo: repository,
            state: state === "all" ? "all" : state,
            per_page: 100,
            page,
          });

          if (listResponse.data.length === 0) break;

          // Fetch detailed info for each PR
          const prsWithDetails = await Promise.all(
            listResponse.data.map(async (pr) => {
              const prResponse = await octokit.rest.pulls.get({
                owner,
                repo: repository,
                pull_number: pr.number,
              });

              const detailedPr = prResponse.data;
              return {
                id: detailedPr.id,
                number: detailedPr.number,
                title: detailedPr.title,
                state: detailedPr.state as "open" | "closed",
                labels: detailedPr.labels.map((label) => {
                  if (typeof label === "string") {
                    return { name: label, color: "#000000" };
                  }
                  return {
                    name: label.name ?? "",
                    color: label.color ?? "#000000",
                  };
                }),
                createdAt: detailedPr.created_at,
                author: {
                  login: detailedPr.user?.login ?? "",
                  avatarUrl: detailedPr.user?.avatar_url ?? "",
                },
                body: detailedPr.body ?? "",
                comments: detailedPr.comments,
                commentsData: [],
                additions: detailedPr.additions ?? 0,
                deletions: detailedPr.deletions ?? 0,
                changedFiles: detailedPr.changed_files ?? 0,
                headRef: {
                  name: detailedPr.head.ref,
                  repository: {
                    owner: {
                      login: detailedPr.head.repo?.owner?.login ?? "",
                    },
                  },
                },
                baseRef: {
                  name: detailedPr.base.ref,
                  repository: {
                    owner: {
                      login: detailedPr.base.repo?.owner?.login ?? "",
                    },
                  },
                },
              };
            })
          );

          allPRs.push(...prsWithDetails);

          if (listResponse.data.length < 100) break;
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
          additions: prResponse.data.additions,
          deletions: prResponse.data.deletions,
          changedFiles: prResponse.data.changed_files,
          headRef: {
            name: prResponse.data.head.ref,
            repository: {
              owner: {
                login: prResponse.data.head.repo.owner.login,
              },
            },
          },
          baseRef: {
            name: prResponse.data.base.ref,
            repository: {
              owner: {
                login: prResponse.data.base.repo.owner.login,
              },
            },
          },
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

  getFiles: protectedProcedure
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
      const cacheKey = `pull-request-files:${owner}:${repository}:${number}`;

      const cached = await redis.get(cacheKey);
      if (cached) {
        return cached as PullRequestFile[];
      }

      try {
        const response = await octokit.rest.pulls.listFiles({
          owner,
          repo: repository,
          pull_number: number,
          per_page: 100,
        });

        const files = response.data.map(
          (file): PullRequestFile => ({
            sha: file.sha,
            filename: file.filename,
            status: file.status as PullRequestFile["status"],
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
            patch: file.patch,
          })
        );

        await redis.set(cacheKey, files, CACHE_TTL);
        return files;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pull request files",
          cause: error,
        });
      }
    }),
});
