import "server-only";

import { z } from "zod";
// Remove fs and path imports
// import path from "path";
// import fs from "fs/promises";
import { Octokit } from "octokit";
import { env } from "@/env.js";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

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
    .query(async ({ ctx, input: { owner, repository, branch, recursive } }) => {
      const key = `tree:${owner}/${repository}/${branch}/${recursive}`;

      console.log("Fetching file tree for path:", branch);
      console.log("Cache keys:", await ctx.redis.keys());

      let fileTree;
      if (await ctx.redis.has(key)) {
        console.log("Cache Hit!");
        fileTree = TreeDataSchema.parse(await ctx.redis.get(key));
      } else {
        // Fetch the tree from GitHub API
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
        await ctx.redis.set(key, fileTree);
        console.log("Cached file tree");
        console.log(await ctx.redis.keys());
      }

      return fileTree;
    }),
});
