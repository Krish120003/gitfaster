import { Octokit } from "@octokit/rest";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "@/server/db/schema";
import type { Session } from "next-auth";
import type { redis } from "@/server/redis";
import type { db } from "@/server/db";

export interface Context {
  session: Session | null;
  redis: typeof redis;
  db: typeof db;
}

const TokenSchema = z.object({
  token: z.string(),
});

export async function getOctokit(ctx: Context) {
  if (!ctx.session || !ctx.session.user || !ctx.session.user.id) {
    throw new Error("User not authenticated");
  }

  const tokenKey = `githubToken:${ctx.session.user.id}`;
  const tokenData = await ctx.redis.get(tokenKey);
  const parsedToken = TokenSchema.safeParse(tokenData);
  if (parsedToken.success) {
    return new Octokit({
      auth: parsedToken.data.token,
    });
  }

  const user = await ctx.db.query.users.findFirst({
    where: eq(users.id, ctx.session.user.id),
    with: {
      accounts: true,
    },
  });

  if (!user || user.accounts.length === 0) {
    throw new Error("User does not have a GitHub account linked");
  }

  const account = user.accounts[0];
  if (!account) {
    throw new Error("Account not found");
  }
  const accessToken = account.access_token;
  await ctx.redis.set(tokenKey, { token: accessToken }, 3600);

  return new Octokit({
    auth: accessToken,
  });
}
