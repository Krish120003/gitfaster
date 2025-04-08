import "server-only";

import { z } from "zod";
import { Octokit } from "octokit";
import { env } from "@/env.js";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { redis, RedisCacheType } from "@/server/redis";
import path from "path";

// Instantiate Octokit
// const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
const octokit = new Octokit();

const TreeNodeSchema = z.object({
  path: z.string(),
  mode: z.string(),
  type: z.enum(["blob", "tree"]),
  sha: z.string(),
  url: z.string(),
});

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
    await redis.set(key, fileTree);
    console.log("Cached file tree");
  }

  return fileTree;
}

export const githubRouter = createTRPCRouter({
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
      // const response = await octokit.rest.repos.getContent({
      //     owner,
      //     repo: repository,
      //     path,
      //     ref: branch,
      // });

      const key = `file:${owner}/${repository}/${branch}/${path}`;

      let fileContent;
      if (await ctx.redis.has(key)) {
        console.log("Cache Hit!");
        fileContent = z
          .object({
            fileContent: z.string(),
          })
          .parse(await ctx.redis.get(key));
      } else {
        fileContent = z
          .object({
            fileContent: z.string(),
          })
          .parse({ fileContent: "TODO PROPERLY FETCH?" });

        await ctx.redis.set(key, fileContent);
        console.log("Cached file content");
      }
      return fileContent.fileContent;
    }),
});
