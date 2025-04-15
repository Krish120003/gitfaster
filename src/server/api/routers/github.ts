import "server-only";
import { z } from "zod";
import { Octokit } from "octokit";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { redis, RedisCacheType } from "@/server/redis";
import type { Context } from "@/app/api/trpc/[trpc]/route";
import { eq } from "drizzle-orm";
import { users } from "@/server/db/schema";
import { after } from "next/server";
import { TRPCError } from "@trpc/server";
import {
  getOctokit,
  userHasAccessToRepository,
  throwIfNoAccess,
} from "@/server/github/auth";

// Internal schemas for GitHub API validation
const InternalTreeNodeSchema = z.object({
  path: z.string(),
  mode: z.string(),
  type: z.enum(["blob", "tree"]),
  sha: z.string(),
  url: z.string(),
});

// Frontend-only schemas with minimal required data
const TreeNodeSchema = z.object({
  path: z.string(),
  type: z.enum(["blob", "tree"]),
});

const fileSchema = z.object({
  name: z.string(),
  text: z.string().nullable(),
  isBinary: z.boolean().nullish(),
  isCached: z.boolean().default(false),
});

export type FileType = z.infer<typeof fileSchema>;

export type TreeNode = z.infer<typeof TreeNodeSchema>;

// Internal schema for GitHub's tree response
const InternalTreeDataSchema = z.object({
  sha: z.string(),
  url: z.string(),
  tree: InternalTreeNodeSchema.array(),
  truncated: z.boolean(),
});

// Frontend schema for tree data
const TreeDataSchema = z.object({
  tree: TreeNodeSchema.array(),
  truncated: z.boolean(),
});

const rateLimitSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  used: z.number(),
  resetAt: z.string(),
  cost: z.number(),
});

const GqlObjectSchema = z.object({
  name: z.string(),
  type: z.enum(["blob", "tree"]),
  oid: z.string(),
  object: z.object({
    text: z.string().nullish(),
    isBinary: z.boolean().nullish(),
  }),
});

const GqlFileContentResponseSchema = z.object({
  rateLimit: rateLimitSchema,
  repository: z.object({
    object: z.object({
      oid: z.string(),
      text: z.string().nullish(),
      isBinary: z.boolean().nullish(),
    }),
  }),
});

const GqlFileContentListResponseSchema = z.object({
  rateLimit: z.object({
    limit: z.number(),
    remaining: z.number(),
    used: z.number(),
    resetAt: z.string(),
    cost: z.number(),
  }),
  repository: z.object({
    object: z.object({
      entries: z.array(GqlObjectSchema),
    }),
  }),
});

const GqlFileEntrySchema = z.object({
  name: z.string(),
  type: z.enum(["blob", "tree"]),
  oid: z.string(),
  object: z.object({
    text: z.string().nullish(),
    isBinary: z.boolean().nullish(), //will be null if encoding is not recognized
  }),
});

// New schemas for repository overview response
const RepositoryOverviewRateLimitSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  used: z.number(),
  resetAt: z.string(),
  cost: z.number(),
});
const RepositoryOverviewLicenseSchema = z
  .object({
    name: z.string(),
  })
  .nullable();
const RepositoryOverviewDefaultBranchSchema = z.object({
  name: z.string(),
  target: z.object({
    history: z.object({
      totalCount: z.number(),
    }),
  }),
});
const RepositoryOverviewLanguagesSchema = z.object({
  totalSize: z.number(),
  nodes: z.array(z.object({ name: z.string() })),
});
const RepositoryOverviewRefsSchema = z.object({
  nodes: z.array(z.object({ name: z.string() })),
});
const RepositoryOverviewMentionableUsersSchema = z.object({
  totalCount: z.number(),
  nodes: z.array(
    z.object({
      login: z.string(),
      avatarUrl: z.string(),
    })
  ),
});
const RepositoryOverviewTopicNodeSchema = z.object({
  topic: z.object({
    name: z.string(),
  }),
});
const RepositoryOverviewTopicsSchema = z.object({
  totalCount: z.number(),
  nodes: z.array(RepositoryOverviewTopicNodeSchema),
});
const RepositoryOverviewRepositorySchema = z.object({
  name: z.string(),
  isPrivate: z.boolean(),
  description: z.string().nullable(),
  homepageUrl: z.string().nullable(),
  owner: z.object({
    login: z.string(),
  }),
  licenseInfo: RepositoryOverviewLicenseSchema,
  defaultBranchRef: RepositoryOverviewDefaultBranchSchema.nullable(),
  languages: RepositoryOverviewLanguagesSchema,
  refs: RepositoryOverviewRefsSchema,
  mentionableUsers: RepositoryOverviewMentionableUsersSchema,
  repositoryTopics: RepositoryOverviewTopicsSchema,
});
const RepositoryOverviewResponseSchema = z.object({
  rateLimit: RepositoryOverviewRateLimitSchema,
  repository: RepositoryOverviewRepositorySchema,
});

const ReadmeResponseSchema = z.object({
  // Schema for GitHub API response when fetching a repository readme
  repository: z.object({
    object: z
      .object({
        text: z.string().nullish(),
      })
      .nullable(),
    isBinary: z.boolean().nullable(),
  }),
});

const TokenSchema = z.object({
  token: z.string(),
});

const hasAccessSchema = z.object({
  hasAccess: z.boolean(),
});

const GithubStarSchema = z.object({
  stargazerCount: z.number(),
  viewerHasStarred: z.boolean(),
});

async function fetchRepoTree(
  params: {
    owner: string;
    repository: string;
    branch: string;
    recursive: boolean;
  },
  redis: RedisCacheType,
  ctx: Context
): Promise<z.infer<typeof InternalTreeDataSchema>> {
  const octokit = await getOctokit(ctx);

  const { owner, repository, branch, recursive } = params;
  const key = `tree:${owner}:${repository}:${branch}:${recursive}`;

  console.log("Fetching file tree for path:", branch);

  if (await redis.has(key)) {
    console.log("Cache Hit!");
    const cachedData = await redis.get(key);
    return InternalTreeDataSchema.parse(cachedData);
  }

  console.log("Query GitHub API for file tree");
  const response = await octokit.rest.git.getTree({
    owner: owner,
    repo: repository,
    tree_sha: branch,
    recursive: recursive ? "1" : undefined,
  });

  console.log("Received file tree from GitHub API");
  console.log("Response headers:", response.headers);

  // Validate with internal schema first
  const fileTree = InternalTreeDataSchema.parse(response.data);
  await redis.set(key, fileTree, 3600);
  console.log("Cached file tree");

  return fileTree;
}

export const githubRouter = createTRPCRouter({
  getRepositoryOverview: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
      })
    )
    .query(async ({ ctx, input: { owner, repository } }) => {
      const hasAccess = await userHasAccessToRepository(ctx, owner, repository);
      throwIfNoAccess(hasAccess);

      const key = `overview:${owner}:${repository}`;
      if (await ctx.redis.has(key)) {
        console.log("Cache Hit for repo overview");
        const cachedData = await ctx.redis.get(key);
        console.log("Cached data:", cachedData);
        return RepositoryOverviewResponseSchema.parse(cachedData).repository;
      }

      const octokit = await getOctokit(ctx);

      console.log("Fetching repository overview from GitHub GraphQL API");
      const query = `
        query ($owner: String!, $repo: String!) {
          rateLimit {
            limit
            remaining
            used
            resetAt
            cost
          }
          repository(owner: $owner, name: $repo) {
            name
            isPrivate
            description
            homepageUrl
            owner {
              login
            }
            licenseInfo {
              name
            }
            stargazerCount
            viewerHasStarred
            defaultBranchRef {
              name
              target {
                ... on Commit {
                  history(first: 0) {
                    totalCount
                  }
                }
              }
            }
            languages(first: 10) {
              totalSize
              nodes {
                name
              }
            }
            refs(refPrefix: "refs/heads/", first: 100) {
              nodes {
                name
              }
            }
            mentionableUsers(first: 30) {
              totalCount
              nodes {
                login
                avatarUrl
              }
            }
            repositoryTopics(first: 10) {
              totalCount
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      `;
      const response = await octokit.graphql(query, {
        owner,
        repo: repository,
      });
      console.log("GraphQL response:", response);
      const data = RepositoryOverviewResponseSchema.parse(response);
      await ctx.redis.set(key, data, 3600);
      console.log("Cached repository overview");
      return data.repository;
    }),

  toggleStar: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
      })
    )
    .mutation(async ({ ctx, input: { owner, repository } }) => {
      const octokit = await getOctokit(ctx);

      // First check if the repository is starred
      const query = `
        query ($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            viewerHasStarred
          }
        }
      `;
      const { repository: repoData } = (await octokit.graphql(query, {
        owner,
        name: repository,
      })) as { repository: { viewerHasStarred: boolean } };

      // Toggle the star status
      if (repoData.viewerHasStarred) {
        await octokit.request("DELETE /user/starred/{owner}/{repo}", {
          owner,
          repo: repository,
        });
      } else {
        await octokit.request("PUT /user/starred/{owner}/{repo}", {
          owner,
          repo: repository,
        });
      }

      // Invalidate the cache for this repository
      const key = `overview:${owner}:${repository}`;
      await ctx.redis.delete(key);

      return {
        isStarred: !repoData.viewerHasStarred,
      };
    }),

  getRepoTree: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
        branch: z.string(),
        recursive: z.boolean().default(false),
      })
    )
    .output(TreeDataSchema)
    .query(async ({ ctx, input }) => {
      const hasAccess = await userHasAccessToRepository(
        ctx,
        input.owner,
        input.repository
      );
      if (!hasAccess) {
        throw new TRPCError({
          message: "Repository not found",
          code: "NOT_FOUND",
        });
      }

      // Get full tree data and validate against internal schema
      const fullTreeData = await fetchRepoTree(input, ctx.redis, ctx);
      const validatedTreeData = InternalTreeDataSchema.parse(fullTreeData);

      // Transform to frontend schema by picking only needed fields
      return {
        tree: validatedTreeData.tree.map((node) => ({
          path: node.path,
          type: node.type,
        })),
        truncated: validatedTreeData.truncated,
      };
    }),

  getFolderView: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
        branch: z.string(),
        path: z.string(),
      })
    )
    .output(TreeNodeSchema.array())
    .query(
      async ({ ctx, input: { owner, repository, branch, path: dirPath } }) => {
        const hasAccess = await userHasAccessToRepository(
          ctx,
          owner,
          repository
        );
        if (!hasAccess) {
          throw new TRPCError({
            message: "Repository not found",
            code: "NOT_FOUND",
          });
        }
        const tree = await fetchRepoTree(
          {
            owner,
            repository,
            branch,
            recursive: true,
          },
          ctx.redis,
          ctx
        );

        console.log("Filtering for path:", dirPath);

        // Parse with internal schema first
        const validatedTree = InternalTreeDataSchema.parse(tree);

        // Filter and transform to frontend schema
        const filteredNodes = validatedTree.tree
          .filter((node) => {
            if (dirPath === "") {
              return node.path.split("/").length === 1;
            }
            return (
              node.path.startsWith(dirPath) &&
              node.path.split("/").length === dirPath.split("/").length + 1
            );
          })
          .map((node) => ({
            path: node.path,
            type: node.type,
          }));

        return filteredNodes;
      }
    ),

  getFileContent: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
        branch: z.string(),
        path: z.string(),
      })
    )
    .output(fileSchema)
    .query(async ({ ctx, input: { owner, repository, branch, path } }) => {
      const hasAccess = await userHasAccessToRepository(ctx, owner, repository);
      if (!hasAccess) {
        throw new TRPCError({
          message: "Repository not found",
          code: "NOT_FOUND",
        });
      }
      const key = `file:${owner}:${repository}:${branch}:${path}`;
      const octokit = await getOctokit(ctx);
      const cacheHit = await ctx.redis.has(key);
      if (cacheHit) {
        console.log(`[Cache Hit] ${key}`);
      } else {
        console.log("Cache miss for file content, fetching from GitHub API");

        after(async () => {
          const fileParentDirectoryPath = path
            .split("/")
            .slice(0, -1)
            .join("/");
          const response = await octokit.graphql(
            `
            query ($owner: String!, $repo: String!, $expression: String!) {
              rateLimit {
                limit
                remaining
                used
                resetAt
                cost
              }
              repository(owner: $owner, name: $repo) {
                object(expression: $expression) {
                  ... on Tree {
                    entries {
                      name
                      type
                      oid
                      object {
                        ... on Blob {
                          text
                          isBinary
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
            {
              owner,
              repo: repository,
              expression: `${branch}:${fileParentDirectoryPath}`,
            }
          );
          const data = GqlFileContentListResponseSchema.parse(response);
          console.log("Received file content from GitHub API", data);
          for (const item of data.repository.object.entries.filter(
            (e) => e.type === "blob"
          )) {
            const blobKey = `file:${owner}:${repository}:${branch}:${
              fileParentDirectoryPath ? fileParentDirectoryPath + "/" : ""
            }${item.name}`;
            await ctx.redis.set(blobKey, item, 3600);
          }
          console.log("Cached file content");
        });

        // fetch file using GraphQL API but only for this file
        const response = await octokit.graphql(
          `
          query ($owner: String!, $repo: String!, $expression: String!) {
            rateLimit {
              limit
              remaining
              used
              resetAt
              cost
            }
            repository(owner: $owner, name: $repo) {
              object(expression: $expression) {
                ... on Blob {
                  oid
                  text
                  isBinary
                }
              }
            }
          }
        `,
          {
            owner,
            repo: repository,
            expression: `${branch}:${path}`,
          }
        );

        const data = GqlFileContentResponseSchema.parse(response);
        console.log("Received file content from GitHub API", data);
        const fileContent = data.repository.object;

        return {
          name: path.split("/").pop() ?? "",
          text: fileContent.text ?? null,
          isBinary: fileContent.isBinary,
        };
      }
      const storedItem = GqlFileEntrySchema.parse(await ctx.redis.get(key));
      return {
        name: storedItem.name,
        text: storedItem.object.text ?? null,
        isBinary: storedItem.object.isBinary,
        isCached: cacheHit,
      };
    }),

  getRepositoryReadme: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
        branch: z.string(),
        folder: z.string().optional(),
      })
    )
    .output(z.string())
    .query(async ({ ctx, input: { owner, repository, branch, folder } }) => {
      const hasAccess = await userHasAccessToRepository(ctx, owner, repository);
      if (!hasAccess) {
        throw new TRPCError({
          message: "Repository not found",
          code: "NOT_FOUND",
        });
      }
      const octokit = await getOctokit(ctx);
      const folderPath = folder
        ? folder.endsWith("/")
          ? folder
          : folder + "/"
        : "";
      const key = `readme:${owner}:${repository}:${branch}:${folderPath}`;
      if (await ctx.redis.has(key)) {
        console.log("Cache Hit for repository readme");
        const content = z
          .object({
            content: z.string(),
          })
          .parse(await ctx.redis.get(key));
        return content.content;
      }
      console.log("Cache miss for repository readme, fetching from GitHub API");

      let response;
      try {
        if (folderPath) {
          response = await octokit.rest.repos.getReadmeInDirectory({
            owner,
            repo: repository,
            ref: branch,
            dir: folderPath,
          });
        } else {
          response = await octokit.rest.repos.getReadme({
            owner,
            repo: repository,
            ref: branch,
          });
        }

        const buff = Buffer.from(response.data.content, "base64");
        const text = buff.toString("utf-8");
        await ctx.redis.set(key, { content: text }, 3600);
        return text;
      } catch (error) {
        console.error("Error fetching readme:", error);
        return "";
      }
    }),

  getStarInfo: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
      })
    )
    .query(async ({ ctx, input: { owner, repository } }) => {
      const hasAccess = await userHasAccessToRepository(ctx, owner, repository);
      if (!hasAccess) {
        throw new TRPCError({
          message: "Repository not found",
          code: "NOT_FOUND",
        });
      }

      const octokit = await getOctokit(ctx);

      // GitHub GraphQL query for stargazer count and viewerHasStarred
      const query = `
        query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            stargazerCount
            viewerHasStarred
          }
        }
      `;

      const response = await octokit.graphql(query, {
        owner,
        name: repository,
      });
      const data = z.object({ repository: GithubStarSchema }).parse(response);

      return {
        stargazerCount: data.repository.stargazerCount,
        viewerHasStarred: data.repository.viewerHasStarred,
      };
    }),

  setStar: protectedProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
        value: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input: { owner, repository, value } }) => {
      const hasAccess = await userHasAccessToRepository(ctx, owner, repository);
      if (!hasAccess) {
        throw new TRPCError({
          message: "Repository not found",
          code: "NOT_FOUND",
        });
      }

      const octokit = await getOctokit(ctx);

      // Toggle the star status
      if (!value) {
        const resp = await octokit.request(
          "DELETE /user/starred/{owner}/{repo}",
          {
            owner,
            repo: repository,
          }
        );

        if (resp.status === 204) {
          console.log("Successfully unstarred the repository");
        }
      } else {
        const resp = await octokit.request("PUT /user/starred/{owner}/{repo}", {
          owner,
          repo: repository,
        });
        if (resp.status === 204) {
          console.log("Successfully starred the repository");
        }
      }
    }),
});
