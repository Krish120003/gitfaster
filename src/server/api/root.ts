import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { githubRouter } from "./routers/github";
import { postRouter } from "./routers/post";
import { issuesRouter } from "./routers/issues";

import { pullRequestsRouter } from "./routers/pull-requests";
import { userRouter } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  github: githubRouter,
  post: postRouter,
  issues: issuesRouter,
  pullRequests: pullRequestsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
