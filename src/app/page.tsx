import { api, HydrateClient } from "@/trpc/server";

import { GitBranchIcon, GitCommit, Github, X, XIcon, Zap } from "lucide-react";
import Link from "next/link";

import { SignIn, SignOut } from "./_components/sign-in-button";
import { auth } from "@/server/auth";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";
import { RepositoryListSearch } from "./_components/repository-list-search";
import Image from "next/image";

function SignedOutPage() {
  const session = null;
  return (
    <main className="h-full grow flex flex-col">
      <div className="grid md:grid-cols-3 w-full">
        <div className="max-w-96 pt-16 flex gap-2 flex-col p-4 col-span-2">
          <div className="flex gap-2">
            <span className="p-1 text-xs bg-primary-foreground border">
              Early Beta
            </span>
            <a href="https://next-hackathon-2025.vercel.app/" target="_blank">
              <span className="p-1 text-xs bg-[#f0883e]/10 text-[#ef6401] dark:text-[#f0883e] border border-[#f0883e]/20 hover:underline">
                Next.js Global Hackathon 2025
              </span>
            </a>
          </div>
          <h1 className="text-balance text-4xl">
            A really fast GitHub client.
          </h1>
          <p className="text-sm text-gray-500">
            gitfaster is a minimal, blazing fast GitHub client to make github
            not feel like legacy software.
          </p>
        </div>
        <div className="border-l p-2 flex items-center justify-center">
          <video
            src="/demo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-[650px] aspect-video"
          />
        </div>
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
    limit: 15,
  });

  return (
    <div className="h-full grow flex flex-col">
      <RepositoryListSearch initialRepos={repos.nodes} session={session} />
    </div>
  );
}

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <header className="border-b">
        <div className="flex h-12 items-center justify-between">
          <div className="flex justify-center items-center gap-2 w-32 border-r h-full">
            <GitBranchIcon className="h-4 w-4 text-[#f0883e]" />
            <span className="text-sm font-medium">gitfaster</span>
          </div>

          <div className="flex items-center w-48 border-l h-12 justify-center">
            <span className="text-muted-foreground text-xs">By</span>
            <a
              href="https://krish.gg"
              target="_blank"
              className="text-xs px-2 font-mono text-muted-foreground hover:underline hover:text-foreground"
            >
              krish.gg
            </a>
            <span className="text-muted-foreground text-xs">&</span>
            <a
              href="https://arian.gg"
              target="_blank"
              className="text-xs px-2 font-mono text-muted-foreground hover:underline hover:text-foreground"
            >
              arian.gg
            </a>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3rem)] font-mono w-screen items-stretch">
        <aside className="w-32 border-r"></aside>
        {session === null ? (
          <SignedOutPage />
        ) : (
          <SignedInPage session={session} />
        )}
        <aside className="w-32 border-l"></aside>
      </div>

      {/* <AuthButtons /> */}
    </HydrateClient>
  );
}
