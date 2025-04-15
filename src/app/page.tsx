import { api, HydrateClient } from "@/trpc/server";

import { GitBranchIcon, GitCommit, Github, X, XIcon, Zap } from "lucide-react";
import Link from "next/link";

import { SignIn, SignOut } from "./_components/sign-in-button";
import { auth } from "@/server/auth";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";

function SignedOutPage() {
  const session = null;
  return (
    <main className="h-full grow flex flex-col">
      <div className="max-w-96 pt-16 flex gap-2 flex-col p-4">
        <div>
          <span className="p-1 text-xs bg-primary-foreground border">
            Early Beta
          </span>
        </div>
        <h1 className="text-balance text-4xl">A really fast GitHub client.</h1>
        <p className="text-sm text-gray-500">
          gitfaster is a minimal, blazing fast GitHub client to make github not
          feel like legacy software.
        </p>
      </div>
      <div className="w-full border-t flex ">
        {session ? <SignOut /> : <SignIn />}
      </div>
      <div
        className={cn("border-y", {
          flex: session,
        })}
      >
        <div
          className={cn("grid grid-cols-1 ", {
            "md:grid-cols-3 w-full": !session,
            "w-1/2": session,
          })}
        >
          <div
            className={cn(
              "border-r-0 border-b h-32 flex flex-col items-center justify-center",
              {
                "md:border-r md:border-b-0": !session,
              }
            )}
          >
            <h2>Predictive Prefetching</h2>
            <p className="text-sm text-muted-foreground text-center px-4">
              Gitfaster automatically prefetches files as you navigate to give
              you a fast experience.
            </p>
          </div>
          <div
            className={cn(
              "border-b h-32 flex flex-col items-center justify-center",
              {
                "md:border-b-0 md:border-r": !session,
              }
            )}
          >
            <h2>Caching</h2>
            <p className="text-sm text-muted-foreground text-center px-4">
              Slow responses from GitHub API are cached for faster access.
            </p>
          </div>
          <div className=" h-32 flex flex-col items-center justify-center">
            <h2>Thoughtfully Fast</h2>
            <p className="text-sm text-muted-foreground text-center px-4">
              Gitfaster is built with performance in mind. It is fast, and
              designed to feel fast.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

async function SignedInPage({ session }: { session: Session }) {
  const repos = await api.user.listRepositories({
    limit: 100,
  });

  return (
    <div className="h-full grow flex flex-col">
      <div className="flex justify-between w-full items-center border-b">
        <div className="p-4">Hi, {session?.user.name}</div>
        <SignOut className="border-l border-r-0" />
      </div>
      <div>
        <div>
          <ul className="">
            {repos.nodes.map((repo) => (
              <li key={repo.name} className="">
                <Link
                  href={`/${repo.owner.login}/${repo.name}`}
                  className="text-sm font-medium p-4 border-b block hover:bg-foreground hover:text-background transition-colors"
                  prefetch={true}
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex flex-col items-start">
                      <div className="flex gap-1 items-baseline">
                        <h3>{repo.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {repo.isPrivate ? "private" : "public"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {repo.description}
                      </span>
                    </div>
                    <div className="flex flex-col items-end min-w-32">
                      <span className="text-xs text-muted-foreground">
                        {repo.stargazerCount} stars
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(repo.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await auth();

  const recentRepos = session ? await api.user.getRecentRepositories() : [];

  return (
    <HydrateClient>
      <header className="border-b">
        <div className="flex h-12 items-center justify-between">
          <div className="flex justify-center items-center gap-2 w-32 border-r h-full">
            <GitBranchIcon className="h-4 w-4 text-[#f0883e]" />
            <span className="text-sm font-medium">gitfaster</span>
          </div>

          <div className="flex items-center gap-4 w-32 border-l h-12 justify-center">
            <a
              href="https://krish.gg"
              target="_blank"
              className="text-xs font-mono text-muted-foreground hover:underline hover:text-foreground flex items-center gap-1"
            >
              By <span>krish.gg</span>
            </a>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3rem)] font-mono w-screen">
        <aside className="w-32 border-r h-full" />
        {session === null ? (
          <SignedOutPage />
        ) : (
          <SignedInPage session={session} />
        )}
        <aside className="w-32 border-l h-full" />
      </div>

      {/* <AuthButtons /> */}
    </HydrateClient>
  );
}
