import "server-only";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getOctokit } from "@/server/github/auth";
import { TRPCError } from "@trpc/server";

const UserRepositorySchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  isPrivate: z.boolean(),
  stargazerCount: z.number(),
  updatedAt: z.string(),
  defaultBranchRef: z
    .object({
      name: z.string(),
    })
    .nullable(),
  owner: z.object({
    login: z.string(),
  }),
});

// Export the Repository type for use in other files
export type Repository = z.infer<typeof UserRepositorySchema>;

const UserRepositoriesResponseSchema = z.object({
  viewer: z.object({
    repositories: z.object({
      nodes: z.array(UserRepositorySchema),
      pageInfo: z.object({
        endCursor: z.string().nullable(),
        hasNextPage: z.boolean(),
      }),
    }),
  }),
});

export const userRouter = createTRPCRouter({
  getRecentRepositories: protectedProcedure.query(async ({ ctx }) => {
    const octokit = await getOctokit(ctx);
    const userId = ctx.session.user.id;
    const key = `recent-repos:${userId}`;

    // Check cache first
    if (await ctx.redis.has(key)) {
      console.log("Cache Hit for recent repositories");
      const cachedData = await ctx.redis.get(key);
      return z.array(UserRepositorySchema).parse(cachedData);
    }

    console.log("Cache miss for recent repositories, fetching from GitHub API");
    const query = `
        query {
          viewer {
            repositories(
              first: 5,
              orderBy: {field: UPDATED_AT, direction: DESC},
              ownerAffiliations: [OWNER]
            ) {
              nodes {
                owner {
                    login
                }
                name
                description
                isPrivate
                stargazerCount
                updatedAt
                defaultBranchRef {
                  name
                }
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      `;

    try {
      const response = await octokit.graphql(query);
      console.log("GitHub API Response:", response);

      const data = UserRepositoriesResponseSchema.parse(response);
      const repositories = data.viewer.repositories.nodes;

      // Cache the result for 5 minutes
      await ctx.redis.set(key, repositories, 300);

      return repositories;
    } catch (error) {
      console.error("GitHub API Error:", error);
      if (error instanceof Error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch repositories: ${error.message}`,
          cause: error,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch repositories",
      });
    }
  }),

  listRepositories: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.number().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const octokit = await getOctokit(ctx);
      const { limit = 10, cursor } = input;
      const userId = ctx.session.user.id;
      const key = `repos-list:${userId}:${limit}:${cursor || 0}`;

      // Check cache first
      if (await ctx.redis.has(key)) {
        console.log("Cache Hit for repository list");
        const cachedData = await ctx.redis.get(key);
        return UserRepositoriesResponseSchema.parse(cachedData).viewer
          .repositories;
      }

      console.log("Cache miss for repository list, fetching from GitHub API");
      const query = `
      query($limit: Int!) {
        viewer {
          repositories(
            first: $limit,
            orderBy: {field: UPDATED_AT, direction: DESC},
            ownerAffiliations: [OWNER]
          ) {
            nodes {
              owner {
                  login
              }
              name
              description
              isPrivate
              stargazerCount
              updatedAt
              defaultBranchRef {
                name
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;

      try {
        const response = await octokit.graphql(query, {
          limit,
        });
        const data = UserRepositoriesResponseSchema.parse(response);

        // Cache the validated data
        await ctx.redis.set(key, data, 300);

        return data.viewer.repositories;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch repositories",
        });
      }
    }),

  // Add the new search repositories endpoint
  searchRepositories: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const octokit = await getOctokit(ctx);
      const userId = ctx.session.user.id;
      const key = `search-repos:${userId}:${input.query}`;

      // Check cache first
      if (await ctx.redis.has(key)) {
        console.log("Cache Hit for repository search");
        const cachedData = await ctx.redis.get(key);
        return z.array(UserRepositorySchema).parse(cachedData);
      }

      console.log("Cache miss for repository search, fetching from GitHub API");

      // First, get the authenticated user's login name
      const userResponse = await octokit.rest.users.getAuthenticated();
      const username = userResponse.data.login;

      const query = `
        query SearchRepositories($searchQuery: String!) {
          search(query: $searchQuery, type: REPOSITORY, first: 20) {
            nodes {
              ... on Repository {
                name
                description
                isPrivate
                stargazerCount
                updatedAt
                defaultBranchRef {
                  name
                }
                owner {
                  login
                }
              }
            }
          }
        }
      `;

      try {
        const response = await octokit.graphql(query, {
          searchQuery: `user:${username} ${input.query} in:name`,
        });

        const repositories = z
          .object({
            search: z.object({
              nodes: z.array(UserRepositorySchema),
            }),
          })
          .parse(response).search.nodes;

        // Cache the result for 5 minutes
        await ctx.redis.set(key, repositories, 300);

        return repositories;
      } catch (error) {
        console.error("GitHub API Error:", error);
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to search repositories: ${error.message}`,
            cause: error,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search repositories",
        });
      }
    }),
});
