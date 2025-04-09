import "server-only";

import { z } from "zod";
import { Octokit } from "octokit";
import { env } from "@/env.js";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { redis, RedisCacheType } from "@/server/redis";
import path from "path";

// Instantiate Octokit
// const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
});

const TreeNodeSchema = z.object({
  path: z.string(),
  mode: z.string(),
  type: z.enum(["blob", "tree"]),
  sha: z.string(),
  url: z.string(),
});

export type TreeNode = z.infer<typeof TreeNodeSchema>;

const TreeDataSchema = z.object({
  sha: z.string(),
  url: z.string(),
  tree: TreeNodeSchema.array(),
  truncated: z.boolean(),
});

const GqlFileContentResponseSchema = z.object({
  rateLimit: z.object({
    limit: z.number(),
    remaining: z.number(),
    used: z.number(),
    resetAt: z.string(),
    cost: z.number(),
  }),
  repository: z.object({
    object: z.object({
      entries: z.array(
        z.object({
          name: z.string(),
          type: z.enum(["blob", "tree"]),
          oid: z.string(),
          object: z.object({
            text: z.string().nullish(),
          }),
        })
      ),
    }),
  }),
});

const GqlFileEntrySchema = z.object({
  name: z.string(),
  type: z.enum(["blob", "tree"]),
  oid: z.string(),
  object: z.object({
    text: z.string().nullish(),
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
  licenseInfo: RepositoryOverviewLicenseSchema,
  stargazerCount: z.number(),
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
  }),
});

async function fetchRepoTree(
  params: {
    owner: string;
    repository: string;
    branch: string;
    recursive: boolean;
  },
  redis: RedisCacheType,
  octokit: Octokit
): Promise<z.infer<typeof TreeDataSchema>> {
  const { owner, repository, branch, recursive } = params;
  const key = `tree:${owner}/${repository}/${branch}/${recursive}`;

  console.log("Fetching file tree for path:", branch);

  let fileTree;
  if (await redis.has(key)) {
    console.log("Cache Hit!");
    fileTree = TreeDataSchema.parse(await redis.get(key));
  } else {
    console.log("Query GitHub API for file tree");
    const response = await octokit.rest.git.getTree({
      owner: owner,
      repo: repository,
      tree_sha: branch,
      recursive: recursive ? "1" : undefined,
    });

    console.log("Received file tree from GitHub API");
    console.log("Response headers:", response.headers);

    fileTree = TreeDataSchema.parse(response.data);
    await redis.set(key, fileTree, 3600);
    console.log("Cached file tree");
  }

  return fileTree;
}

export const githubRouter = createTRPCRouter({
  getRepositoryOverview: publicProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
      })
    )
    .query(async ({ ctx, input: { owner, repository } }) => {
      const key = `overview:${owner}:${repository}`;
      if (await ctx.redis.has(key)) {
        console.log("Cache Hit for repo overview");
        return RepositoryOverviewResponseSchema.parse(await ctx.redis.get(key))
          .repository;
      }
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
            licenseInfo {
              name
            }
            stargazerCount
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
      const data = RepositoryOverviewResponseSchema.parse(response);
      await ctx.redis.set(key, data, 3600);
      console.log("Cached repository overview");
      return data.repository;
    }),

  getRepoTree: publicProcedure
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
      return fetchRepoTree(input, ctx.redis, octokit);
    }),

  getFolderView: publicProcedure
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
        const tree = await fetchRepoTree(
          {
            owner,
            repository,
            branch,
            recursive: true,
          },
          ctx.redis,
          octokit
        );

        console.log("Filtering for path:", dirPath);

        // filter to find all files that are direct children of the path
        const filteredTree = tree.tree.filter((node) => {
          return (
            node.path.startsWith(dirPath) &&
            node.path.split("/").length === dirPath.split("/").length + 1
          );
        });

        return filteredTree;
      }
    ),

  getFileContent: publicProcedure
    .input(
      z.object({
        owner: z.string(),
        repository: z.string(),
        branch: z.string(),
        path: z.string(),
      })
    )
    .output(z.string())
    .query(async ({ ctx, input: { owner, repository, branch, path } }) => {
      const key = `file:${owner}/${repository}/${branch}/${path}`;
      if (await ctx.redis.has(key)) {
        console.log("Cache Hit!");
      } else {
        console.log("Cache miss for file content, fetching from GitHub API");
        const fileParentDirectoryPath = path.split("/").slice(0, -1).join("/");
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
        const data = GqlFileContentResponseSchema.parse(response);
        console.log("Received file content from GitHub API", data);
        for (const item of data.repository.object.entries.filter(
          (e) => e.type === "blob"
        )) {
          const blobKey = `file:${owner}/${repository}/${branch}/${
            fileParentDirectoryPath ? fileParentDirectoryPath + "/" : ""
          }${item.name}`;
          await ctx.redis.set(blobKey, item, 3600);
        }
        console.log("Cached file content");
      }
      const storedItem = GqlFileEntrySchema.parse(await ctx.redis.get(key));
      return storedItem.object.text ?? "";
    }),

  getRepositoryReadme: publicProcedure
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
            dir: folderPath, // Fixed parameter name from 'directory' to 'dir'
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
        await ctx.redis.set(key, { content: text }, 3600); // Store as object
        return text;
      } catch (error) {
        console.error("Error fetching readme:", error);
        return "";
      }
    }),
});
