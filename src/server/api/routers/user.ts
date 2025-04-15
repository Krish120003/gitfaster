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

const UserRepositoriesResponseSchema = z.object({
  viewer: z.object({
    repositories: z.object({
      nodes: z.array(UserRepositorySchema),
    }),
  }),
});

export const userRouter = createTRPCRouter({
  getRecentRepositories: protectedProcedure.query(async ({ ctx }) => {
    const octokit = await getOctokit(ctx);

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
            }
          }
        }
      `;

    try {
      const response = await octokit.graphql(query);
      const data = UserRepositoriesResponseSchema.parse(response);
      return data.viewer.repositories.nodes;
    } catch (error) {
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
        return data.viewer.repositories;
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch repositories",
        });
      }
    }),
});
